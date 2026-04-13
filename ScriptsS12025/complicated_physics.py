#!/usr/bin/env python3
"""
physim.py — Modular physics simulation framework (single-file)

Features:
 - Simulation engine with Velocity-Verlet & Verlet integrators
 - N-body gravity (pairwise O(N^2) with softening)
 - Coulomb (electric) forces
 - Simple 2D SPH fluid (density, pressure, viscosity) — educational & not production-grade
 - Rigid-body-like constrained particle groups via distance constraints (Verlet relaxation)
 - Matplotlib animation with interactive pause / step / restart keys
 - Configurable via CLI args

Dependencies:
 - numpy
 - matplotlib
 - (optional) scipy for KDTree (not required)

Usage:
  python physim.py --sim gravity
  python physim.py --sim sph --n 400 --steps 5000
  python physim.py --sim charged --n 120
  python physim.py --sim rigid

Notes:
 - This is an educational, general-purpose framework; large N (e.g., >2000) will be slow
 - For speed: add numba or implement a Barnes-Hut tree (not included)
"""
import argparse
import math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import animation
import time
import sys

# -----------------------
# Utility / Constants
# -----------------------
EPS = 1e-5

def vec2(x, y):
    return np.array([x, y], dtype=float)

# -----------------------
# Particle data structure
# -----------------------
class Particle:
    __slots__ = ("pos", "vel", "acc", "mass", "charge", "radius", "fixed", "id")
    def __init__(self, pos, vel=None, mass=1.0, charge=0.0, radius=0.5, fixed=False, pid=0):
        self.pos = np.array(pos, dtype=float)
        self.vel = np.array(vel if vel is not None else [0.0, 0.0], dtype=float)
        self.acc = np.zeros(2, dtype=float)
        self.mass = float(mass)
        self.charge = float(charge)
        self.radius = float(radius)
        self.fixed = bool(fixed)
        self.id = pid

# -----------------------
# Integrators
# -----------------------
class Integrator:
    def step(self, particles, dt):
        raise NotImplementedError

class VelocityVerletIntegrator(Integrator):
    def step(self, particles, dt):
        # update positions
        for p in particles:
            if p.fixed:
                continue
            p.pos += p.vel * dt + 0.5 * p.acc * dt * dt
        # compute new accelerations before calling outside (we assume external code will fill p.acc)
        # update velocities using average acceleration: v += 0.5*(a_old + a_new)*dt
        # Because this integrator expects caller to compute acc at start and again; here we will let caller manage two acc steps
        # We'll just update velocities with current acc for half step to match pattern in Engine.
        for p in particles:
            if p.fixed:
                continue
            p.vel += 0.5 * p.acc * dt

class VerletIntegrator(Integrator):
    # Simple position-based Verlet, stores previous positions in p.prev_pos attribute dynamically
    def step(self, particles, dt):
        for p in particles:
            if p.fixed:
                continue
            if not hasattr(p, 'prev_pos'):
                p.prev_pos = p.pos - p.vel * dt
            new_pos = 2*p.pos - p.prev_pos + p.acc * dt * dt
            p.vel = (new_pos - p.prev_pos) / (2*dt)
            p.prev_pos = p.pos.copy()
            p.pos = new_pos

# -----------------------
# Force modules
# -----------------------
class ForceModule:
    def apply(self, particles):
        raise NotImplementedError

class GravityModule(ForceModule):
    def __init__(self, G=1.0, softening=0.1):
        self.G = float(G)
        self.softening = float(softening)

    def apply(self, particles):
        n = len(particles)
        # Reset accelerations
        for p in particles:
            p.acc[:] = 0.0
        # Pairwise force (O(n^2))
        for i in range(n):
            pi = particles[i]
            for j in range(i+1, n):
                pj = particles[j]
                r = pj.pos - pi.pos
                dist2 = r[0]*r[0] + r[1]*r[1] + self.softening*self.softening
                invd = 1.0/math.sqrt(dist2)
                # Force magnitude
                F = self.G * pi.mass * pj.mass * invd * invd * invd  # G*m1*m2 / r^2 then multiplied by 1/r for direction normalized
                fvec = r * F
                if not pi.fixed:
                    pi.acc += fvec / pi.mass
                if not pj.fixed:
                    pj.acc -= fvec / pj.mass

class CoulombModule(ForceModule):
    def __init__(self, k=1.0, softening=0.1):
        self.k = float(k)
        self.softening = float(softening)

    def apply(self, particles):
        for p in particles:
            p.acc[:] = 0.0
        n = len(particles)
        for i in range(n):
            pi = particles[i]
            for j in range(i+1, n):
                pj = particles[j]
                r = pj.pos - pi.pos
                dist2 = r[0]*r[0] + r[1]*r[1] + self.softening*self.softening
                invd = 1.0/math.sqrt(dist2)
                # Coulomb: F = k q1 q2 / r^2
                F = self.k * pi.charge * pj.charge * invd * invd * invd
                fvec = r * F
                if not pi.fixed:
                    pi.acc += fvec / pi.mass
                if not pj.fixed:
                    pj.acc -= fvec / pj.mass

# -----------------------
# Basic collision handling
# -----------------------
def simple_collisions(particles, restitution=0.8):
    # Resolve simple circle collisions (positional correction + velocity reflection)
    n = len(particles)
    for i in range(n):
        pi = particles[i]
        for j in range(i+1, n):
            pj = particles[j]
            r = pj.pos - pi.pos
            dist = np.linalg.norm(r)
            if dist == 0:
                continue
            min_dist = pi.radius + pj.radius
            if dist < min_dist:
                # positional correction: push each particle out along normal proportionally to mass (inverse mass)
                overlap = min_dist - dist + 1e-8
                direction = r / dist
                invm1 = 0.0 if pi.fixed else 1.0/pi.mass
                invm2 = 0.0 if pj.fixed else 1.0/pj.mass
                invm_sum = invm1 + invm2
                if invm_sum == 0:
                    continue
                corr1 = direction * (-overlap * (invm1 / invm_sum))
                corr2 = direction * (overlap * (invm2 / invm_sum))
                if not pi.fixed:
                    pi.pos += corr1
                if not pj.fixed:
                    pj.pos += corr2
                # velocity reflection (elastic-ish)
                rel_vel = pj.vel - pi.vel
                sep_vel = np.dot(rel_vel, direction)
                if sep_vel < 0:
                    impulse = -(1+restitution) * sep_vel / invm_sum
                    if not pi.fixed:
                        pi.vel -= direction * impulse * invm1
                    if not pj.fixed:
                        pj.vel += direction * impulse * invm2

# -----------------------
# SPH Module (2D) - simplified
# -----------------------
class SPHModule(ForceModule):
    """
    Very simple, educational SPH:
     - Poly6 kernel for density
     - Spiky kernel for pressure gradient
     - Viscosity term
    Not optimized. Use small N (<=1000).
    """
    def __init__(self, h=1.0, rest_density=1000.0, k=2000.0, mu=100.0, gravity=np.array([0.0,-9.8])):
        self.h = float(h)
        self.rest_density = float(rest_density)
        self.k = float(k)
        self.mu = float(mu)
        self.gravity = np.array(gravity, dtype=float)
        # precompute constants
        self.poly6 = 4.0/(math.pi * h**8)
        self.spiky_grad = -30.0/(math.pi * h**5)
        self.visc_lap = 40.0/(math.pi * h**5)

    def apply(self, particles):
        n = len(particles)
        # reset
        for p in particles:
            p.density = 0.0
            p.pressure = 0.0
            p.acc[:] = 0.0
        # density
        for i in range(n):
            pi = particles[i]
            for j in range(n):
                pj = particles[j]
                r = pi.pos - pj.pos
                r2 = r[0]*r[0] + r[1]*r[1]
                if r2 <= self.h*self.h:
                    # poly6
                    diff = self.h*self.h - r2
                    pi.density += pj.mass * self.poly6 * diff*diff*diff
            if pi.density <= 0:
                pi.density = self.rest_density
            pi.pressure = self.k * (pi.density - self.rest_density)

        # forces
        for i in range(n):
            pi = particles[i]
            if pi.fixed:
                continue
            pressure_force = np.zeros(2)
            viscosity_force = np.zeros(2)
            for j in range(n):
                if i==j:
                    continue
                pj = particles[j]
                r = pi.pos - pj.pos
                rlen = np.linalg.norm(r)
                if rlen <= 0 or rlen > self.h:
                    continue
                # pressure gradient (symmetrized)
                grad = self.spiky_grad * (self.h - rlen)**2 * (r / (rlen + 1e-8))
                pressure_force += -pj.mass * (pi.pressure + pj.pressure)/(2*pj.density) * grad
                # viscosity: laplacian times velocity difference
                vel_diff = pj.vel - pi.vel
                visc = self.visc_lap * (self.h - rlen)
                viscosity_force += self.mu * pj.mass * vel_diff / pj.density * visc
            # external gravity
            gforce = self.gravity * pi.density
            pi.acc += (pressure_force + viscosity_force + gforce) / pi.density

# -----------------------
# Distance constraints (for "rigid body" groups)
# -----------------------
def enforce_distance_constraints(particles, constraints, iterations=5):
    # constraints: list of (i, j, rest_length, stiffness)
    # We implement position-level relaxation (Verlet-style)
    for _ in range(iterations):
        for (i, j, rest, k) in constraints:
            pi = particles[i]
            pj = particles[j]
            if pi.fixed and pj.fixed:
                continue
            delta = pj.pos - pi.pos
            d = np.linalg.norm(delta) + 1e-12
            diff = (d - rest) / d
            invm1 = 0.0 if pi.fixed else 1.0/pi.mass
            invm2 = 0.0 if pj.fixed else 1.0/pj.mass
            invm = invm1 + invm2
            if invm == 0:
                continue
            corr = delta * (k * diff / invm)
            if not pi.fixed:
                pi.pos += corr * invm1
            if not pj.fixed:
                pj.pos -= corr * invm2

# -----------------------
# Simulation Engine
# -----------------------
class Engine:
    def __init__(self, particles, integrator=None, force_modules=None, constraint_list=None, dt=0.01):
        self.particles = particles
        self.integrator = integrator or VelocityVerletIntegrator()
        self.force_modules = force_modules or []
        self.constraint_list = constraint_list or []
        self.dt = float(dt)
        self.time = 0.0

    def step(self):
        dt = self.dt
        # compute accelerations from modules
        # For engines that expect pre/post acceleration updates (VV), we'll do:
        # 1) apply forces to set p.acc (a_old)
        for module in self.force_modules:
            module.apply(self.particles)
        # Integrator half-step / position update
        if isinstance(self.integrator, VelocityVerletIntegrator):
            # integrator does half velocity and position — we'll use pattern:
            # v += 0.5*a_old*dt; x += v*dt; compute a_new; v += 0.5*a_new*dt
            for p in self.particles:
                if p.fixed:
                    continue
                p.vel += 0.5 * p.acc * dt
                p.pos += p.vel * dt
            # recompute accelerations
            for module in self.force_modules:
                module.apply(self.particles)
            # finish velocity
            for p in self.particles:
                if p.fixed:
                    continue
                p.vel += 0.5 * p.acc * dt
        else:
            # For Verlet integrator that uses p.prev_pos, integrator will manage positions/velocities
            self.integrator.step(self.particles, dt)
            # recompute accelerations for next step
            for module in self.force_modules:
                module.apply(self.particles)

        # collisions and constraints
        simple_collisions(self.particles)
        if self.constraint_list:
            enforce_distance_constraints(self.particles, self.constraint_list)

        self.time += dt

# -----------------------
# Scenes / Initializers
# -----------------------
def make_gravity_scene(n=120, radius=20.0, central_mass=1000.0):
    rng = np.random.RandomState(1)
    particles = []
    # central heavy body at center
    center = Particle(pos=[0.0, 0.0], vel=[0.0, 0.0], mass=central_mass, radius=1.2, pid=0)
    particles.append(center)
    for i in range(1, n):
        r = rng.uniform(3.0, radius)
        theta = rng.uniform(0, 2*math.pi)
        pos = np.array([r*math.cos(theta), r*math.sin(theta)])
        # set approximate circular velocity for central mass
        vmag = math.sqrt(1.0 * central_mass / (r + 1e-8))
        vel = np.array([-vmag*math.sin(theta), vmag*math.cos(theta)]) * rng.uniform(0.6, 1.2)
        p = Particle(pos=pos, vel=vel, mass=rng.uniform(0.1, 2.0), radius=0.3, pid=i)
        particles.append(p)
    return particles

def make_charged_scene(n=120, spread=15.0):
    rng = np.random.RandomState(2)
    particles = []
    for i in range(n):
        pos = rng.uniform(-spread, spread, size=2)
        vel = rng.normal(scale=0.0, size=2)
        charge = rng.choice([-1.0, 1.0]) * rng.uniform(0.5, 4.0)
        p = Particle(pos=pos, vel=vel, mass=1.0, charge=charge, radius=0.25, pid=i)
        particles.append(p)
    return particles

def make_sph_scene(n=300, box=(20, 12)):
    rng = np.random.RandomState(3)
    particles = []
    # create a block of fluid particles in left-top
    nx = int(math.sqrt(n* (box[0]/box[1])))
    ny = int(n / nx)
    spacing = 0.35
    base_x = -box[0]/2 + 1.0
    base_y = box[1]/4
    pid=0
    for i in range(nx):
        for j in range(ny):
            if pid >= n:
                break
            pos = np.array([base_x + i*spacing, base_y + j*spacing])
            particles.append(Particle(pos=pos, vel=[0.0,0.0], mass=1.0, radius=0.2, pid=pid))
            pid += 1
        if pid >= n: break
    # Add a few static walls as fixed particles (not simulated with SPH density)
    return particles

def make_rigid_chain(n=20, center=(0,0), spacing=0.8):
    particles = []
    cx, cy = center
    for i in range(n):
        pos = np.array([cx + (i - n/2) * spacing, cy])
        p = Particle(pos=pos, vel=[0.0,0.0], mass=1.0, radius=0.25, pid=i)
        particles.append(p)
    # constraints between adjacent particles
    constraints = []
    for i in range(n-1):
        constraints.append((i, i+1, spacing, 1.0))
    # fix one end
    particles[0].fixed = True
    return particles, constraints

# -----------------------
# Visualization / Runner
# -----------------------
class Visualizer:
    def __init__(self, engine, title="Physics Simulation", xlim=(-25,25), ylim=(-25,25)):
        self.engine = engine
        self.fig, self.ax = plt.subplots(figsize=(9,6))
        self.scat = None
        self.title = title
        self.xlim = xlim
        self.ylim = ylim
        self.running = True
        # for performance: use scatter with sizes computed from particle radius
        self._init_plot()

    def _init_plot(self):
        self.ax.set_aspect('equal', 'box')
        self.ax.set_xlim(*self.xlim)
        self.ax.set_ylim(*self.ylim)
        self.ax.set_title(self.title)
        xs = [p.pos[0] for p in self.engine.particles]
        ys = [p.pos[1] for p in self.engine.particles]
        sizes = [(max(1.0, p.radius*50)) for p in self.engine.particles]
        colors = [self._color_for_particle(p) for p in self.engine.particles]
        self.scat = self.ax.scatter(xs, ys, s=sizes, c=colors, cmap='coolwarm', edgecolors='k')

        self.time_text = self.ax.text(0.02, 0.95, '', transform=self.ax.transAxes)

        # key bindings
        self.fig.canvas.mpl_connect('key_press_event', self.on_key)

    def _color_for_particle(self, p):
        # color based on charge if present, else mass
        if hasattr(p, "charge") and abs(p.charge) > 0:
            # map negative -> blue, positive -> red
            return 0.5 + 0.5 * np.sign(p.charge)  # yields either 0 or 1 scaled
        else:
            return 0.5

    def on_key(self, event):
        if event.key == ' ':
            self.running = not self.running
        elif event.key == 'r':
            # restart simulation by reinitializing positions if possible
            self.running = False
        elif event.key == 'right':
            # single step
            self.engine.step()
            self._update_plot()

    def _update_plot(self):
        xs = [p.pos[0] for p in self.engine.particles]
        ys = [p.pos[1] for p in self.engine.particles]
        self.scat.set_offsets(np.column_stack([xs, ys]))
        sizes = [(max(1.0, p.radius*50)) for p in self.engine.particles]
        self.scat.set_sizes(sizes)
        self.time_text.set_text(f"t = {self.engine.time:.3f}s  N={len(self.engine.particles)}")
        self.ax.figure.canvas.draw_idle()

    def animate(self, interval=20, max_frames=None):
        frame = 0
        def _step(_):
            nonlocal frame
            if self.running:
                self.engine.step()
                self._update_plot()
            frame += 1
            if max_frames and frame >= max_frames:
                ani.event_source.stop()
        ani = animation.FuncAnimation(self.fig, _step, interval=interval)
        plt.show()

# -----------------------
# CLI / Main
# -----------------------
def main():
    parser = argparse.ArgumentParser(description="physim.py - modular physics simulation")
    parser.add_argument("--sim", choices=["gravity","charged","sph","rigid"], default="gravity")
    parser.add_argument("--n", type=int, default=300)
    parser.add_argument("--dt", type=float, default=0.01)
    parser.add_argument("--steps", type=int, default=10000)
    args = parser.parse_args()

    sim = args.sim
    dt = args.dt
    n = args.n

    if sim == "gravity":
        particles = make_gravity_scene(n=n)
        force_modules = [GravityModule(G=10.0, softening=0.5)]
        integrator = VelocityVerletIntegrator()
        engine = Engine(particles, integrator=integrator, force_modules=force_modules, dt=dt)
        viz = Visualizer(engine, title="N-body Gravity", xlim=(-40,40), ylim=(-40,40))
        viz.animate()
    elif sim == "charged":
        particles = make_charged_scene(n=n)
        force_modules = [CoulombModule(k=8.99, softening=0.3)]
        integrator = VelocityVerletIntegrator()
        engine = Engine(particles, integrator=integrator, force_modules=force_modules, dt=dt)
        viz = Visualizer(engine, title="Coulomb Charged Particles", xlim=(-30,30), ylim=(-20,20))
        viz.animate()
    elif sim == "sph":
        particles = make_sph_scene(n=n)
        sph = SPHModule(h=1.0, rest_density=1000.0, k=2000.0, mu=30.0, gravity=np.array([0.0,-9.8]))
        # add light damping to avoid blowups
        integrator = VerletIntegrator()
        engine = Engine(particles, integrator=integrator, force_modules=[sph], dt=0.005)
        viz = Visualizer(engine, title="2D SPH (simple)", xlim=(-12,12), ylim=(-2,18))
        viz.animate()
    elif sim == "rigid":
        particles, constraints = make_rigid_chain(n=30, center=(0,4), spacing=0.8)
        # add gravity
        class GravitySimple(ForceModule):
            def apply(self, particles):
                for p in particles:
                    p.acc[:] = np.array([0.0, -9.8])
        engine = Engine(particles, integrator=VerletIntegrator(), force_modules=[GravitySimple()], constraint_list=constraints, dt=0.016)
        viz = Visualizer(engine, title="Verlet Rigid Chain (constraints)", xlim=(-10,10), ylim=(-5,10))
        viz.animate()
    else:
        print("Unknown sim:", sim)
        return

if __name__ == "__main__":
    main()
