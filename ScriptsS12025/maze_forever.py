import random

WIDTH = 31
HEIGHT = 21

# Make empty maze filled with walls
maze = [["#" for _ in range(WIDTH)] for _ in range(HEIGHT)]

# Starting point
stack = [(1, 1)]
maze[1][1] = " "

# Possible directions
directions = [(2,0), (-2,0), (0,2), (0,-2)]

while stack:
    x, y = stack[-1]

    # Find available neighbors
    neighbors = []
    for dx, dy in directions:
        nx, ny = x + dx, y + dy
        if 1 <= nx < WIDTH-1 and 1 <= ny < HEIGHT-1 and maze[ny][nx] == "#":
            neighbors.append((nx, ny, dx, dy))

    if neighbors:
        nx, ny, dx, dy = random.choice(neighbors)

        # Carve middle cell
        maze[y + dy//2][x + dx//2] = " "
        # Carve new cell
        maze[ny][nx] = " "
        # Push new position to stack
        stack.append((nx, ny))
    else:
        stack.pop()

# Print maze
for row in maze:
    print("".join(row))
