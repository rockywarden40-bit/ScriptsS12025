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

def ask_yes_no(question):
    while True:
        answer = input(f"{question} (y/n): ").lower()
        if answer in ['y', 'n']:
            return "Yes" if answer == 'y' else "No"
        print("Please enter 'y' or 'n'.")

def ask_game_details():
    print("\nLet's log your chess game!\n")

    date = input("Date of the game (leave blank for today): ")
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    opponent = input("Opponent's name (optional): ")
    color = input("What color did you play? (White/Black): ").capitalize()
    opening = input("What was the opening played? ")
    liked_position = ask_yes_no("Did you like your position after the opening?")
    result = input("What was the result? (Win/Draw/Loss): ").capitalize()
    time_control = input("Time control (e.g., Blitz, Rapid, Classical): ")
    rating_diff = input("Rating difference (e.g., +100, -50): ")
    blunders = ask_yes_no("Did you make any blunders?")
    tactics = ask_yes_no("Did you spot any tactics?")
    game_link = input("Paste the link to your game (optional): ")
    notes = input("Any additional notes or thoughts? ")

    return {
        "date": date,
        "opponent": opponent,
        "color": color,
        "opening": opening,
        "liked_position": liked_position,
        "result": result,
        "time_control": time_control,
        "rating_diff": rating_diff,
        "blunders": blunders,
        "tactics": tactics,
        "game_link": game_link,
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
        print(f"  Time Control: {game['time_control']}")
        print(f"  Rating Difference: {game['rating_diff']}")
        print(f"  Blunders: {game['blunders']}")
        print(f"  Tactics Spotted: {game['tactics']}")
        print(f"  Game Link: {game['game_link']}")
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
