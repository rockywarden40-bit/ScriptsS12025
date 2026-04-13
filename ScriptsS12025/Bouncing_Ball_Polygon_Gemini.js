const canvas = document.getElementById('bouncingCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const initialSpeed = 2;
const speedGainFactor = 0.5; // How much speed to add on collision
const ballRadius = 10;
const ballColor = 'red';
const triangleColor = 'blue';

// --- Ball State ---
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: initialSpeed * Math.cos(Math.PI / 4), // Initial velocity components
    dy: initialSpeed * Math.sin(Math.PI / 4)
};

// --- Triangle Vertices (Equilateral-ish for demonstration) ---
// Note: Collision detection is simplified. For a true complex shape,
// a more robust algorithm is needed.
const triangle = [
    { x: canvas.width / 2, y: 50 },          // Top vertex
    { x: 50, y: canvas.height - 50 },        // Bottom-Left vertex
    { x: canvas.width - 50, y: canvas.height - 50 } // Bottom-Right vertex
];

// Function to draw the triangle
function drawTriangle() {
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.closePath();
    ctx.strokeStyle = triangleColor;
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Function to draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.closePath();
}

// Function to check for collision with the simplified triangle bounding box
// For a true reflection off a line segment, vector math is required, but
// this approximation demonstrates the core concept of bouncing and speed gain.
function checkCollisionAndBounce() {
    let collided = false;

    // Simplified Bounding Box Check (for basic demonstration)
    const minX = Math.min(triangle[1].x, triangle[2].x);
    const maxX = Math.max(triangle[1].x, triangle[2].x);
    const minY = Math.min(triangle[0].y, triangle[1].y);
    const maxY = Math.max(triangle[0].y, triangle[1].y);

    // Check collision with Y-bounds (Top/Bottom)
    if (ball.y + ball.dy > maxY - ballRadius || ball.y + ball.dy < minY + ballRadius) {
        ball.dy = -ball.dy; // Reverse vertical direction
        collided = true;
    }
    // Check collision with X-bounds (Left/Right)
    if (ball.x + ball.dx > maxX - ballRadius || ball.x + ball.dx < minX + ballRadius) {
        ball.dx = -ball.dx; // Reverse horizontal direction
        collided = true;
    }

    // Advanced: To implement the shape gaining a side, you would need
    // to update the 'triangle' array to add a new vertex and redraw,
    // and then use complex line-segment collision and reflection physics.

    if (collided) {
        // Increase speed upon collision
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const newSpeed = currentSpeed + speedGainFactor;
        
        // Normalize the current velocity vector
        const factor = newSpeed / currentSpeed;

        // Apply the new speed while maintaining the direction
        ball.dx *= factor;
        ball.dy *= factor;

        // Reset ball to center of the shape on collision, as per the prompt
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
    }
}

// Main animation loop
function update() {
    // Clear the canvas on each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw the static shape
    drawTriangle();

    // 2. Move the ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 3. Check for collision and update speed/position
    checkCollisionAndBounce();

    // 4. Draw the ball in its new position
    drawBall();

    // Request the next frame
    requestAnimationFrame(update);
}

// Start the animation
update();