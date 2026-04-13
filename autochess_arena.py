"""
autochess_arena.py
Full-featured autonomous Stockfish self-play + human GUI.

Save: autochess_arena.py
Run: python autochess_arena.py

Features:
- Auto-downloads Stockfish (if possible) into ./engines/
- Installs python-chess if missing (attempt)
- Polished Tkinter GUI with board, highlights, logs
- Self-play: two Stockfish instances play each other using a strict opening you provide
- Saves every finished game to Desktop/ChessGames/Game_###.txt in requested "White: ... / Black: ..." format
- Toggle to Human Mode (play vs engine) at any time
- Configurable engine depth, games-per-session, max moves per game
"""

import os
import sys
import threading
import queue
import subprocess
import time
import shutil
import zipfile
import io
import math
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# ---------------------------
# Ensure python-chess is installed
# ---------------------------
try:
    import chess
    import chess.pgn
except Exception:
    print("python-chess not installed. Attempting to install it now...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-chess"])
        import chess
        import chess.pgn
    except Exception as e:
        message = (
            "Automatic installation of python-chess failed.\n"
            "Please install it manually with:\n\n    pip install python-chess\n\n"
            "Then re-run this program."
        )
        raise RuntimeError(message) from e

# ---------------------------
# Web helper to download Stockfish (best-effort)
# ---------------------------
import urllib.request
import re

def try_download_stockfish(dest_path: Path):
    """
    Best-effort attempt to download a Windows x64 Stockfish binary from stockfishchess.org download page.
    If it fails, return False and leave no partial file.
    """
    try:
        print("Fetching Stockfish download page...")
        url = "https://stockfishchess.org/download/"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        # look for zip download links that look like stockfish-x.y-win.zip or similar
        candidates = re.findall(r'href="([^"]+stockfish[^"]*win[^"]*\.zip)"', html, flags=re.IGNORECASE)
        if not candidates:
            # fallback: other patterns
            candidates = re.findall(r'href="([^"]*stockfish[^"]*\.zip)"', html, flags=re.IGNORECASE)
        if not candidates:
            print("Couldn't find a direct zip link on stockfish site.")
            return False

        # choose first absolute URL or make absolute
        link = candidates[0]
        if link.startswith("/"):
            link = "https://stockfishchess.org" + link
        if not link.lower().startswith("http"):
            link = "https://stockfishchess.org/" + link.lstrip("/")

        print("Downloading Stockfish from:", link)
        tmp = dest_path.parent / ("stockfish_dl_tmp.zip")
        with urllib.request.urlopen(link, timeout=60) as resp, open(tmp, "wb") as out:
            shutil.copyfileobj(resp, out)
        # unzip and find executable
        with zipfile.ZipFile(tmp, "r") as z:
            # look for executables in archive
            exec_names = [n for n in z.namelist() if re.search(r'stockfish.*(\.exe)?$', n, flags=re.IGNORECASE)]
            if not exec_names:
                # extract everything then look for executable file
                z.extractall(dest_path.parent)
                # search for an exe in extracted dirs
                for root, _, files in os.walk(dest_path.parent):
                    for f in files:
                        if re.search(r'stockfish.*(\.exe)?$', f, flags=re.IGNORECASE):
                            candidate = Path(root) / f
                            shutil.copy(candidate, dest_path)
                            os.chmod(dest_path, 0o755)
                            tmp.unlink(missing_ok=True)
                            return True
                tmp.unlink(missing_ok=True)
                return False
            else:
                # pick first executable, extract it
                name = exec_names[0]
                data = z.read(name)
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dest_path, "wb") as out:
                    out.write(data)
                os.chmod(dest_path, 0o755)
                tmp.unlink(missing_ok=True)
                return True
    except Exception as e:
        print("Stockfish download failed:", e)
        return False

# ---------------------------
# Engine wrapper (UCI) using subprocess
# ---------------------------
class StockfishProcess:
    def __init__(self, path, name="Stockfish", threads=1, hash_mb=16):
        self.path = str(path)
        self.name = name
        self.threads = threads
        self.hash_mb = hash_mb
        self.proc = None
        self._stdout_queue = queue.Queue()
        self._reader_thread = None

    def start(self):
        # start subprocess in UCI mode
        try:
            self.proc = subprocess.Popen(
                [self.path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=1,
                universal_newlines=True
            )
        except Exception as e:
            raise RuntimeError(f"Failed to start engine at {self.path}: {e}")
        # reader thread
        self._reader_thread = threading.Thread(target=self._reader_loop, daemon=True)
        self._reader_thread.start()
        self._send("uci")
        # wait for 'uciok'
        self._wait_for("uciok", timeout=5)
        # set options
        self._send(f"setoption name Threads value {self.threads}")
        self._send(f"setoption name Hash value {self.hash_mb}")
        self._send("isready")
        self._wait_for("readyok", timeout=5)

    def _reader_loop(self):
        while True:
            if self.proc is None:
                break
            line = self.proc.stdout.readline()
            if line == "":
                break
            self._stdout_queue.put(line.rstrip("\n"))

    def _send(self, text):
        # print("->", text)
        if not self.proc or self.proc.stdin.closed:
            return
        self.proc.stdin.write(text + "\n")
        self.proc.stdin.flush()

    def _wait_for(self, token, timeout=10):
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                line = self._stdout_queue.get(timeout=0.1)
            except queue.Empty:
                continue
            # print("<-", line)
            if token in line:
                return True
        raise TimeoutError(f"Timeout waiting for '{token}' from engine")

    def set_position(self, moves=None, fen=None):
        if fen:
            cmd = f"position fen {fen}"
        else:
            cmd = "position startpos"
        if moves:
            cmd += " moves " + " ".join(moves)
        self._send(cmd)

    def go_depth(self, depth):
        # returns bestmove string
        self._send(f"go depth {depth}")
        bestmove = None
        while True:
            try:
                line = self._stdout_queue.get(timeout=30)
            except queue.Empty:
                raise TimeoutError("Engine did not respond in time")
            # print("ENGINE:", line)
            if line.startswith("bestmove"):
                parts = line.split()
                if len(parts) >= 2:
                    bestmove = parts[1]
                break
        return bestmove

    def go_movetime(self, ms):
        self._send(f"go movetime {ms}")
        bestmove = None
        while True:
            try:
                line = self._stdout_queue.get(timeout=30)
            except queue.Empty:
                raise TimeoutError("Engine did not respond in time")
            if line.startswith("bestmove"):
                parts = line.split()
                if len(parts) >= 2:
                    bestmove = parts[1]
                break
        return bestmove

    def stop(self):
        try:
            if self.proc:
                self._send("quit")
                # give some time to exit
                self.proc.kill()
        except Exception:
            pass
        self.proc = None

# ---------------------------
# Self-play manager
# ---------------------------
class SelfPlayManager:
    def __init__(self, engine_path, gui_callback=None):
        """
        engine_path: path to stockfish binary
        gui_callback: function to call with status updates (text)
        """
        self.engine_path = Path(engine_path)
        self.gui_callback = gui_callback or (lambda s: print(s))
        self._stop_flag = threading.Event()
        self._thread = None

    def start_selfplay(self, opening_moves, games, depth, max_moves_per_game=300, save_folder=None):
        if self._thread and self._thread.is_alive():
            raise RuntimeError("Already running")
        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._worker, args=(opening_moves, games, depth, max_moves_per_game, save_folder), daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_flag.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _worker(self, opening_moves, games, depth, max_moves_per_game, save_folder):
        # ensure save folder exists
        save_folder = Path(save_folder or (Path.home() / "Desktop" / "ChessGames"))
        save_folder.mkdir(parents=True, exist_ok=True)

        # start two engine instances
        e1 = StockfishProcess(self.engine_path, name="SF-A")
        e2 = StockfishProcess(self.engine_path, name="SF-B")
        try:
            self.gui_callback(f"Starting engine instances...")
            e1.start()
            e2.start()
        except Exception as ex:
            self.gui_callback(f"Failed to start Stockfish: {ex}")
            return

        game_count = 0
        # For each game
        for g in range(games):
            if self._stop_flag.is_set():
                break
            game_count += 1
            board = chess.Board()
            moves_applied = []
            # apply opening moves exactly (user demanded strict following)
            for mv in opening_moves:
                try:
                    # accept SAN or UCI input
                    try:
                        move = board.parse_san(mv)
                    except Exception:
                        move = chess.Move.from_uci(mv)
                        if not move in board.legal_moves:
                            raise ValueError(f"Opening move illegal: {mv}")
                    board.push(move)
                    moves_applied.append(move.uci())
                except Exception as e:
                    self.gui_callback(f"Opening move '{mv}' invalid/legal? Skipping remainder of opening. Error: {e}")
                    break

            # main loop: alternate engines (white=e1, black=e2)
            engine_white = e1
            engine_black = e2
            # set initial positions
            # use engine.set_position with UCI moves (uci format) not SAN
            # ensure we give them the moves in uci
            turn = board.turn  # True if white to move
            moves_list_for_engine = moves_applied.copy()

            move_number = 0
            result = None
            while not board.is_game_over() and move_number < max_moves_per_game and (not self._stop_flag.is_set()):
                # engine for side to move
                engine = engine_white if turn else engine_black
                # give engine the position
                engine.set_position(moves=moves_list_for_engine)
                # get best move
                try:
                    best = engine.go_depth(depth)
                except Exception as e:
                    self.gui_callback(f"Engine error during search: {e}")
                    best = None
                if not best or best == "(none)":
                    # likely mate/stalemate
                    break
                # apply move to board
                try:
                    move = chess.Move.from_uci(best)
                    if move not in board.legal_moves:
                        # try to parse SAN fallback (rare)
                        try:
                            move = board.parse_san(best)
                        except Exception:
                            self.gui_callback(f"Engine suggested illegal move {best}; aborting game.")
                            break
                    board.push(move)
                    moves_applied.append(move.uci())
                    moves_list_for_engine.append(move.uci())
                except Exception as e:
                    self.gui_callback(f"Failed to apply move {best}: {e}")
                    break

                turn = board.turn
                move_number += 1

            # game finished or stopped
            if board.is_checkmate():
                res = "1-0" if board.result() == "1-0" else "0-1"
            else:
                res = board.result()  # '1-0', '0-1', or '1/2-1/2'

            # Save to file in requested format
            name = f"Game_{game_count:03d}.txt"
            path = save_folder / name
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(f"Date: {datetime.now().isoformat()}\n")
                    f.write(f"Opening (user-specified): {' '.join(opening_moves) if opening_moves else '(none)'}\n\n")
                    # Convert moves to SAN lists and write with White: and Black: headings as requested
                    # We'll produce a move list per side in SAN for readability
                    board_for_pgn = chess.Board()
                    white_moves = []
                    black_moves = []
                    for uci in moves_applied:
                        m = chess.Move.from_uci(uci)
                        try:
                            san = board_for_pgn.san(m)
                        except Exception:
                            san = uci
                        board_for_pgn.push(m)
                        if len(white_moves) == len(black_moves):
                            white_moves.append(san)
                        else:
                            black_moves.append(san)
                    f.write("White: " + " ".join(white_moves) + "\n")
                    f.write("Black: " + " ".join(black_moves) + "\n")
                    f.write("\nResult: " + res + "\n")
                self.gui_callback(f"Saved game {game_count} -> {path.name}  Result: {res}")
            except Exception as e:
                self.gui_callback(f"Failed to save game {game_count}: {e}")

            # small pause between games
            time.sleep(0.2)

        # cleanup
        try:
            e1.stop()
            e2.stop()
        except Exception:
            pass
        self.gui_callback(f"Self-play session finished. Games saved to {save_folder}")

# ---------------------------
# Tkinter GUI (polished)
# ---------------------------
class ChessGUI:
    def __init__(self, root):
        self.root = root
        root.title("AutoChess Arena — Self-play & Human Mode")
        root.geometry("1100x720")
        self.style = ttk.Style(root)
        # simple theme tuning
        try:
            self.style.theme_use("clam")
        except Exception:
            pass

        # Paths
        self.app_dir = Path.cwd()
        self.engines_dir = self.app_dir / "engines"
        self.engines_dir.mkdir(exist_ok=True)
        # default stockfish path
        self.stockfish_path = self.engines_dir / ("stockfish.exe" if os.name == "nt" else "stockfish")
        # save folder: Desktop/ChessGames
        self.save_folder = Path.home() / "Desktop" / "ChessGames"
        self.save_folder.mkdir(parents=True, exist_ok=True)

        # GUI state
        self.opening_text = tk.StringVar(value="")  # user opening (space-separated SAN or UCI)
        self.games_count = tk.IntVar(value=100)
        self.engine_depth = tk.IntVar(value=4)
        self.max_moves = tk.IntVar(value=250)
        self.running = False
        self.manager = None

        # Top frame: controls
        top = ttk.Frame(root, padding=8)
        top.pack(side=tk.TOP, fill=tk.X)

        ttk.Label(top, text="Opening (space-separated SAN or UCI)").pack(side=tk.LEFT, padx=4)
        ttk.Entry(top, textvariable=self.opening_text, width=40).pack(side=tk.LEFT, padx=4)
        ttk.Label(top, text="Games").pack(side=tk.LEFT, padx=(12,4))
        ttk.Spinbox(top, from_=1, to=10000, textvariable=self.games_count, width=6).pack(side=tk.LEFT)
        ttk.Label(top, text="Depth").pack(side=tk.LEFT, padx=(12,4))
        ttk.Spinbox(top, from_=1, to=40, textvariable=self.engine_depth, width=4).pack(side=tk.LEFT)
        ttk.Label(top, text="MaxMoves").pack(side=tk.LEFT, padx=(12,4))
        ttk.Spinbox(top, from_=20, to=2000, textvariable=self.max_moves, width=5).pack(side=tk.LEFT)

        ttk.Button(top, text="Locate Stockfish", command=self.locate_stockfish).pack(side=tk.RIGHT, padx=6)
        ttk.Button(top, text="Open Save Folder", command=self.open_save_folder).pack(side=tk.RIGHT, padx=6)

        # Middle: board + move list + logs
        middle = ttk.Frame(root, padding=8)
        middle.pack(fill=tk.BOTH, expand=True)

        # Left: board canvas
        board_frame = ttk.Frame(middle)
        board_frame.pack(side=tk.LEFT, padx=8, fill=tk.Y)
        self.board_canvas = tk.Canvas(board_frame, width=480, height=480, bg="#1E1E2E", highlightthickness=0)
        self.board_canvas.pack()
        self._init_board_graphics()

        # Right: moves and controls
        right = ttk.Frame(middle)
        right.pack(side=tk.LEFT, padx=8, fill=tk.BOTH, expand=True)

        # Move list
        moves_label = ttk.Label(right, text="Moves")
        moves_label.pack(anchor="nw")
        self.moves_text = tk.Text(right, height=12, state="disabled", wrap="word")
        self.moves_text.pack(fill=tk.X, padx=4, pady=4)

        # Log area
        log_label = ttk.Label(right, text="Log")
        log_label.pack(anchor="nw")
        self.log_text = tk.Text(right, height=12, state="disabled", wrap="word")
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=4, pady=4)

        # Bottom controls
        bottom = ttk.Frame(root, padding=8)
        bottom.pack(side=tk.BOTTOM, fill=tk.X)

        self.start_btn = ttk.Button(bottom, text="Start Self-Play", command=self.start_selfplay)
        self.start_btn.pack(side=tk.LEFT, padx=6)
        self.stop_btn = ttk.Button(bottom, text="Stop", command=self.stop_selfplay, state="disabled")
        self.stop_btn.pack(side=tk.LEFT, padx=6)
        self.human_btn = ttk.Button(bottom, text="Switch to Human Mode", command=self.switch_to_human)
        self.human_btn.pack(side=tk.LEFT, padx=6)
        ttk.Button(bottom, text="Save Current Game Now", command=self.save_current_game).pack(side=tk.RIGHT, padx=6)

        # Status bar
        self.status_var = tk.StringVar(value="Ready")
        status = ttk.Label(root, textvariable=self.status_var, anchor="w")
        status.pack(side=tk.BOTTOM, fill=tk.X)

        # internal chess board state for human play
        self.gui_board = chess.Board()
        self.selected_sq = None
        self._draw_board_position(self.gui_board)

        # manager
        self.manager = SelfPlayManager(self.stockfish_path, gui_callback=self._append_log)

        # Try auto-download stockfish if missing (non-blocking prompt)
        if not self.stockfish_path.exists():
            res = messagebox.askyesno("Stockfish not found", "Stockfish binary not found. Attempt automatic download? (recommended)")
            if res:
                self.status_var.set("Downloading Stockfish — please wait...")
                root.update()
                ok = try_download_stockfish(self.stockfish_path)
                if ok:
                    self._append_log("Stockfish downloaded successfully.")
                    self.status_var.set("Stockfish ready.")
                else:
                    self._append_log("Auto-download failed. Please download stockfish from stockfishchess.org/download and place the executable at:\n" + str(self.stockfish_path))
                    self.status_var.set("Stockfish missing. Please locate binary.")
            else:
                self._append_log("Please locate Stockfish manually (Locate Stockfish button).")

        # Bind clicks for human mode
        self.board_canvas.bind("<Button-1>", self._on_board_click)

    # ---------------------------
    # GUI helpers
    # ---------------------------
    def locate_stockfish(self):
        p = filedialog.askopenfilename(title="Select Stockfish executable", filetypes=[("Executables", "*.exe" if os.name=='nt' else "*")])
        if p:
            dest = self.stockfish_path
            try:
                shutil.copy(p, dest)
                os.chmod(dest, 0o755)
                self._append_log(f"Stockfish copied to {dest}")
                self.status_var.set("Stockfish ready.")
                # restart manager with new path
                self.manager = SelfPlayManager(dest, gui_callback=self._append_log)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to copy engine: {e}")

    def open_save_folder(self):
        folder = str(self.save_folder)
        if os.name == "nt":
            os.startfile(folder)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", folder])
        else:
            subprocess.Popen(["xdg-open", folder])

    def _append_log(self, text):
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"[{ts}] {text}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")
        self.status_var.set(text)

    # ---------------------------
    # Self-play controls
    # ---------------------------
    def start_selfplay(self):
        if self.running:
            return
        # verify engine present
        if not self.stockfish_path.exists():
            messagebox.showerror("Engine missing", "Stockfish not found. Use Locate Stockfish or put stockfish executable in ./engines/stockfish.exe")
            return
        opening = self.opening_text.get().strip()
        opening_moves = opening.split() if opening else []
        games = max(1, int(self.games_count.get()))
        depth = max(1, int(self.engine_depth.get()))
        max_moves = max(20, int(self.max_moves.get()))
        self._append_log(f"Starting self-play: {games} games, depth {depth}, opening: {' '.join(opening_moves) if opening_moves else '(none)'}")
        self.running = True
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.human_btn.configure(state="disabled")
        # make sure manager uses correct engine path
        self.manager.engine_path = self.stockfish_path
        try:
            self.manager.start_selfplay(opening_moves, games, depth, max_moves, save_folder=self.save_folder)
            # run a watcher thread to re-enable buttons when done
            threading.Thread(target=self._watch_selfplay_thread, daemon=True).start()
        except Exception as e:
            self._append_log(f"Failed to start self-play: {e}")
            self.running = False
            self.start_btn.configure(state="normal")
            self.stop_btn.configure(state="disabled")
            self.human_btn.configure(state="normal")

    def _watch_selfplay_thread(self):
        # Poll manager thread
        while True:
            time.sleep(1.0)
            if not self.manager._thread or not self.manager._thread.is_alive():
                break
        self._append_log("Self-play session terminated.")
        self.running = False
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.human_btn.configure(state="normal")

    def stop_selfplay(self):
        if not self.running:
            return
        self.manager.stop()
        self._append_log("Stop requested. Waiting for engines to terminate...")
        # the watch thread will re-enable UI

    # ---------------------------
    # Human Mode
    # ---------------------------
    def switch_to_human(self):
        # Open a small window for human mode controls
        HumanWindow(self, self.stockfish_path)

    def save_current_game(self):
        # Snapshot current board moves to a file
        try:
            # Build SAN move lists
            board = self.gui_board
            # If no moves, just save empty game
            moves_applied = []
            temp = chess.Board()
            for move in list(board.move_stack):
                try:
                    san = temp.san(move)
                except Exception:
                    san = move.uci()
                temp.push(move)
                moves_applied.append(move.uci())
            # split into white/black SAN lists
            temp2 = chess.Board()
            white_moves = []
            black_moves = []
            for uci in moves_applied:
                m = chess.Move.from_uci(uci)
                try:
                    san = temp2.san(m)
                except:
                    san = uci
                temp2.push(m)
                if len(white_moves) == len(black_moves):
                    white_moves.append(san)
                else:
                    black_moves.append(san)
            # prompt for filename
            fname = filedialog.asksaveasfilename(defaultextension=".txt", initialfile="manual_game.txt", filetypes=[("Text files","*.txt")])
            if not fname:
                return
            with open(fname, "w", encoding="utf-8") as f:
                f.write(f"Date: {datetime.now().isoformat()}\n")
                f.write("Opening (manual): (none)\n\n")
                f.write("White: " + " ".join(white_moves) + "\n")
                f.write("Black: " + " ".join(black_moves) + "\n")
                f.write("\nResult: " + board.result() + "\n")
            self._append_log(f"Saved manual game to {fname}")
        except Exception as e:
            messagebox.showerror("Error saving", str(e))

    # ---------------------------
    # Board drawing & interaction (simplified polished visuals)
    # ---------------------------
    def _init_board_graphics(self):
        # compute square size
        self.board_size = 480
        self.square_size = self.board_size // 8
        self.board_canvas.delete("all")
        # create background rounded rectangle effect
        pad = 6
        self.board_canvas.create_rectangle(pad, pad, self.board_size-pad, self.board_size-pad, fill="#111217", outline="")
        # generate squares and keep ids
        self.square_ids = {}
        light = "#f0d9b5"
        dark = "#b58863"
        for r in range(8):
            for c in range(8):
                x1 = c * self.square_size
                y1 = r * self.square_size
                x2 = x1 + self.square_size
                y2 = y1 + self.square_size
                color = light if (r + c) % 2 == 0 else dark
                sid = self.board_canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline="")
                self.square_ids[(r,c)] = sid
        # piece image placeholders (we will draw text pieces for portability)
        self.piece_text_ids = []

    def _draw_board_position(self, board: chess.Board):
        # clear previous piece texts
        for t in self.piece_text_ids:
            try:
                self.board_canvas.delete(t)
            except Exception:
                pass
        self.piece_text_ids = []
        # draw pieces (use unicode chess glyphs)
        glyphs = {
            'P': '\u2659','N':'\u2658','B':'\u2657','R':'\u2656','Q':'\u2655','K':'\u2654',
            'p':'\u265F','n':'\u265E','b':'\u265D','r':'\u265C','q':'\u265B','k':'\u265A'
        }
        for sq in chess.SQUARES:
            piece = board.piece_at(sq)
            if piece:
                # convert square index to canvas coords
                r = 7 - (sq // 8)
                c = sq % 8
                x = c * self.square_size + self.square_size/2
                y = r * self.square_size + self.square_size/2
                txt = glyphs.get(piece.symbol(), piece.symbol())
                tid = self.board_canvas.create_text(x, y, text=txt, font=("Segoe UI Symbol", int(self.square_size/1.8)), tags=("piece",))
                self.piece_text_ids.append(tid)

    def _on_board_click(self, event):
        # translate click to square
        c = int(event.x // self.square_size)
        r = int(event.y // self.square_size)
        if not (0 <= r < 8 and 0 <= c < 8):
            return
        # convert to chess square index
        sq = (7 - r) * 8 + c
        if self.selected_sq is None:
            # try select piece
            piece = self.gui_board.piece_at(sq)
            if piece and ((piece.color and True) or True):
                self.selected_sq = sq
                # highlight selected square
                self._highlight_square(sq, "#7bd389")
        else:
            # attempt to move selected -> sq
            mv = chess.Move(self.selected_sq, sq)
            if mv in self.gui_board.legal_moves:
                self.gui_board.push(mv)
                self._draw_board_position(self.gui_board)
                self._append_move_list_from_board(self.gui_board)
            else:
                # maybe promotion or SAN entry; ignore if illegal
                pass
            # clear selection
            self.selected_sq = None
            # redraw board to remove highlight
            self._draw_board_position(self.gui_board)

    def _highlight_square(self, sq, color="#7bd389"):
        # convert square to r,c
        r = 7 - (sq // 8)
        c = sq % 8
        sid = self.square_ids.get((r,c))
        if sid:
            self.board_canvas.itemconfigure(sid, outline=color, width=4)
            self.root.after(400, lambda: self.board_canvas.itemconfigure(sid, outline="", width=0))

    def _append_move_list_from_board(self, board):
        # generate SAN lists
        temp = chess.Board()
        white_moves = []
        black_moves = []
        for mv in board.move_stack:
            try:
                san = temp.san(mv)
            except Exception:
                san = mv.uci()
            temp.push(mv)
            if len(white_moves) == len(black_moves):
                white_moves.append(san)
            else:
                black_moves.append(san)
        self.moves_text.configure(state="normal")
        self.moves_text.delete("1.0", "end")
        self.moves_text.insert("end", "White: " + " ".join(white_moves) + "\n")
        self.moves_text.insert("end", "Black: " + " ".join(black_moves) + "\n")
        self.moves_text.configure(state="disabled")

# ---------------------------
# Human Mode window
# ---------------------------
class HumanWindow:
    def __init__(self, parent_gui: ChessGUI, engine_path):
        self.parent = parent_gui
        self.engine_path = engine_path
        self.win = tk.Toplevel(parent_gui.root)
        self.win.title("Human vs Engine")
        self.win.geometry("900x640")
        self.board = chess.Board()
        self.engine = StockfishProcess(engine_path, name="SF-Human", threads=2, hash_mb=64)
        try:
            self.engine.start()
        except Exception as e:
            messagebox.showerror("Engine error", f"Failed to start engine: {e}")
            self.win.destroy()
            return
        self.player_color = tk.StringVar(value="white")
        self.depth = tk.IntVar(value=8)

        top = ttk.Frame(self.win, padding=6)
        top.pack(fill=tk.X)
        ttk.Label(top, text="You play as:").pack(side=tk.LEFT)
        ttk.Radiobutton(top, text="White", variable=self.player_color, value="white").pack(side=tk.LEFT)
        ttk.Radiobutton(top, text="Black", variable=self.player_color, value="black").pack(side=tk.LEFT)
        ttk.Label(top, text="Engine depth").pack(side=tk.LEFT, padx=(12,4))
        ttk.Spinbox(top, from_=1, to=40, textvariable=self.depth, width=4).pack(side=tk.LEFT)

        mid = ttk.Frame(self.win, padding=6)
        mid.pack(fill=tk.BOTH, expand=True)

        self.canvas = tk.Canvas(mid, width=480, height=480, bg="#111111", highlightthickness=0)
        self.canvas.pack(side=tk.LEFT, padx=6)
        self._init_canvas_graphics()

        right = ttk.Frame(mid)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.moves_text = tk.Text(right, height=10, state="disabled")
        self.moves_text.pack(fill=tk.X, padx=6, pady=6)
        self.log_text = tk.Text(right, height=12, state="disabled")
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        bottom = ttk.Frame(self.win, padding=6)
        bottom.pack(fill=tk.X)
        ttk.Button(bottom, text="New Game", command=self.new_game).pack(side=tk.LEFT)
        ttk.Button(bottom, text="Undo", command=self.undo).pack(side=tk.LEFT)
        ttk.Button(bottom, text="Engine Move", command=self.engine_move).pack(side=tk.LEFT)
        ttk.Button(bottom, text="Save Game", command=self.save_game).pack(side=tk.RIGHT)

        self.canvas.bind("<Button-1>", self._onclick)
        self.selected = None
        self._draw_board()

        # If human plays black, engine should move first as white
        if self.player_color.get() == "black":
            self.engine_move()

    def _init_canvas_graphics(self):
        self.square_size = 480 // 8
        self.square_ids = {}
        light = "#f0d9b5"
        dark = "#b58863"
        for r in range(8):
            for c in range(8):
                x1 = c*self.square_size
                y1 = r*self.square_size
                x2 = x1 + self.square_size
                y2 = y1 + self.square_size
                color = light if (r+c)%2==0 else dark
                sid = self.canvas.create_rectangle(x1,y1,x2,y2, fill=color, outline="")
                self.square_ids[(r,c)] = sid
        self.piece_texts = []

    def _draw_board(self):
        for t in self.piece_texts:
            try: self.canvas.delete(t)
            except: pass
        self.piece_texts = []
        glyphs = {
            'P': '\u2659','N':'\u2658','B':'\u2657','R':'\u2656','Q':'\u2655','K':'\u2654',
            'p':'\u265F','n':'\u265E','b':'\u265D','r':'\u265C','q':'\u265B','k':'\u265A'
        }
        for sq in chess.SQUARES:
            piece = self.board.piece_at(sq)
            if piece:
                r = 7 - (sq//8)
                c = sq % 8
                x = c*self.square_size + self.square_size/2
                y = r*self.square_size + self.square_size/2
                txt = glyphs.get(piece.symbol(), piece.symbol())
                tid = self.canvas.create_text(x,y, text=txt, font=("Segoe UI Symbol", int(self.square_size/1.8)))
                self.piece_texts.append(tid)
        self._update_moves_text()

    def _onclick(self, event):
        c = int(event.x // self.square_size)
        r = int(event.y // self.square_size)
        if not (0<=r<8 and 0<=c<8): return
        sq = (7-r)*8 + c
        if self.selected is None:
            if self.board.piece_at(sq) and ((self.player_color.get()=="white" and self.board.piece_at(sq).color) or (self.player_color.get()=="black" and not self.board.piece_at(sq).color)):
                self.selected = sq
                # highlight
                sid = self.square_ids[(r,c)]
                self.canvas.itemconfigure(sid, outline="#66ccff", width=3)
                self.win.after(300, lambda: self.canvas.itemconfigure(sid, outline="", width=0))
        else:
            mv = chess.Move(self.selected, sq)
            if mv in self.board.legal_moves:
                self.board.push(mv)
                self._draw_board()
                # if engine is to move next, make engine move
                if ((self.board.turn and self.player_color.get()=="black") or (not self.board.turn and self.player_color.get()=="white")):
                    threading.Thread(target=self.engine_move, daemon=True).start()
            else:
                # illegal move
                pass
            self.selected = None

    def _update_moves_text(self):
        temp = chess.Board()
        white_moves = []
        black_moves = []
        for mv in self.board.move_stack:
            try:
                san = temp.san(mv)
            except:
                san = mv.uci()
            temp.push(mv)
            if len(white_moves) == len(black_moves):
                white_moves.append(san)
            else:
                black_moves.append(san)
        self.moves_text.configure(state="normal")
        self.moves_text.delete("1.0","end")
        self.moves_text.insert("end","White: " + " ".join(white_moves) + "\n")
        self.moves_text.insert("end","Black: " + " ".join(black_moves) + "\n")
        self.moves_text.configure(state="disabled")

    def new_game(self):
        self.board.reset()
        self._draw_board()
        self._log("New game started")
        if self.player_color.get()=="black":
            self.engine_move()

    def undo(self):
        if self.board.move_stack:
            self.board.pop()
            self._draw_board()

    def engine_move(self):
        # engine plays a single move at configured depth
        try:
            self.engine.set_position(moves=[m.uci() for m in self.board.move_stack])
            best = self.engine.go_depth(self.depth.get())
            if not best or best == "(none)":
                self._log("Engine returned no move.")
                return
            mv = chess.Move.from_uci(best)
            if mv in self.board.legal_moves:
                self.board.push(mv)
                self._draw_board()
                self._log(f"Engine played {best}")
            else:
                self._log(f"Engine suggested illegal move: {best}")
        except Exception as e:
            self._log(f"Engine error: {e}")

    def save_game(self):
        fname = filedialog.asksaveasfilename(defaultextension=".txt", initialfile="human_game.txt")
        if not fname:
            return
        temp = chess.Board()
        white_moves = []
        black_moves = []
        for mv in self.board.move_stack:
            try:
                san = temp.san(mv)
            except:
                san = mv.uci()
            temp.push(mv)
            if len(white_moves) == len(black_moves):
                white_moves.append(san)
            else:
                black_moves.append(san)
        with open(fname, "w", encoding="utf-8") as f:
            f.write(f"Date: {datetime.now().isoformat()}\n")
            f.write("Opening (manual): (none)\n\n")
            f.write("White: " + " ".join(white_moves) + "\n")
            f.write("Black: " + " ".join(black_moves) + "\n")
            f.write("\nResult: " + self.board.result() + "\n")
        self._log(f"Saved game to {fname}")

    def _log(self, text):
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"[{ts}] {text}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

# ---------------------------
# Run Application
# ---------------------------
def main():
    root = tk.Tk()
    app = ChessGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
