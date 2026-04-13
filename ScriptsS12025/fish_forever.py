import time
import os
import random

fish = ["<><", "<()>", "<=>", "<^>", "<*>", "<()"]

width = 60

while True:
    water = [" " * width for _ in range(10)]
    num_fish = random.randint(3, 6)

    for _ in range(num_fish):
        row = random.randint(0, 9)
        col = random.randint(0, width - 4)
        f = random.choice(fish)
        line = water[row]
        water[row] = line[:col] + f + line[col+len(f):]

    os.system('cls' if os.name == 'nt' else 'clear')
    print("\n".join(water))
    time.sleep(0.25)
