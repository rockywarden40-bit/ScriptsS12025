import json
import os
from datetime import datetime

DATA_FILE = "chess_games.json"

def load_games():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

def save_games(games):
    with open(DATA_FILE, "w") as f:
        json.dump(games, f, indent=4)

def ask_game_details():
    print("\nLet's log your chess game!\n")

    date = input("Date of the game (leave blank for today): ")
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    opponent = input("Opponent's name (optional): ")
    color = input("What color did you play? (White/Black): ").capitalize()
    opening = input("What was the opening played? ")
    liked_position = input("Did you like your position after the opening? (Yes/No): ").capitalize()
    result = input("What was the result? (Win/Draw/Loss): ").capitalize()
    notes = input("Any additional notes or thoughts? ")

    return {
        "date": date,
        "opponent": opponent,
        "color": color,
        "opening": opening,
        "liked_position": liked_position,
        "result": result,
        "notes": notes
    }

def view_games(games):
    if not games:
        print("\nNo games recorded yet.")
        return
    print("\nYour Chess Game History:\n")
    for i, game in enumerate(games, 1):
        print(f"Game {i}: {game['date']} vs {game.get('opponent', 'Unknown')}")
        print(f"  Color: {game['color']}")
        print(f"  Opening: {game['opening']}")
        print(f"  Liked Position: {game['liked_position']}")
        print(f"  Result: {game['result']}")
        print(f"  Notes: {game['notes']}\n")

def main():
    games = load_games()

    while True:
        print("\n--- Chess Tracker Menu ---")
        print("1. Log a new game")
        print("2. View past games")
        print("3. Exit")

        choice = input("Choose an option (1-3): ")

        if choice == "1":
            game = ask_game_details()
            games.append(game)
            save_games(games)
            print("Game saved successfully!")
        elif choice == "2":
            view_games(games)
        elif choice == "3":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
