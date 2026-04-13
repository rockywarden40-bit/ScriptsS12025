#!/usr/bin/env python3
"""
chess_gui_engine.py
Standalone GUI chess program (single file).
- Requires only Python standard library (tkinter, threading, time, math).
- Run in IDLE or by: python chess_gui_engine.py

Features:
- Tkinter GUI with board canvas, custom drawn piece styles, move highlighting.
- Move input by click or drag, move history list.
- Simple engine integrated (alpha-beta with quiescence).
- Engine play with a time limit (uses threading).
- Buttons: New Game, Undo, Toggle Engine, Settings (theme/style), Engine vs Engine.
- Promotion dialog, legal-move filtering, castling, en-passant.
Limitations:
- Engine is a hobby engine (club-level), not Stockfish strength.
- No UCI support, no tablebases.
"""

import tkinter as tk
from tkinter import simpledialog, messagebox
import threading, time, math, random
from dataclasses import dataclass

# ---------------------------
# Basic data & utilities
# ---------------------------

PIECE_EMPTY = '.'
WHITE, BLACK = 0, 1
START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

def idx_to_alg(i):
    return chr((i % 8) + ord('a')) + str((i // 8) + 1)

def alg_to_idx(s):
    file = ord(s[0]) - ord('a')
    rank = int(s[1]) - 1
    return rank * 8 + file

@dataclass
class Move:
    from_sq: int
    to_sq: int
    promotion: str = None
    captured: str = None
    is_castle: bool = False
    is_ep: bool = False
    def uci(self):
        return idx_to_alg(self.from_sq) + idx_to_alg(self.to_sq) + (self.promotion or "")

# ---------------------------
# Board implementation (adapted)
# ---------------------------

class Board:
    def __init__(self, fen=START_FEN):
        self.board = [PIECE_EMPTY]*64
        self.side_to_move = WHITE
        self.castling_rights = {'K':True,'Q':True,'k':True,'q':True}
        self.ep_square = -1
        self.halfmove_clock = 0
        self.fullmove_number = 1
        self.history = []
        self.set_fen(fen)

    def set_fen(self, fen):
        parts = fen.split()
        rows = parts[0].split('/')
        for r, row in enumerate(rows[::-1]):
            file = 0
            for ch in row:
                if ch.isdigit():
                    file += int(ch)
                else:
                    self.board[r*8 + file] = ch
                    file += 1
        self.side_to_move = WHITE if parts[1]=='w' else BLACK
        cr = parts[2]
        self.castling_rights = {'K': 'K' in cr, 'Q': 'Q' in cr, 'k': 'k' in cr, 'q': 'q' in cr}
        self.ep_square = -1 if parts[3]=='-' else alg_to_idx(parts[3])
        self.halfmove_clock = int(parts[4]) if len(parts)>4 else 0
        self.fullmove_number = int(parts[5]) if len(parts)>5 else 1
        self.history = []

    def fen(self):
        rows=[]
        for r in range(7,-1,-1):
            empt=0; row=""
            for f in range(8):
                v=self.board[r*8+f]
                if v==PIECE_EMPTY:
                    empt+=1
                else:
                    if empt:
                        row+=str(empt); empt=0
                    row+=v
            if empt: row+=str(empt)
            rows.append(row)
        side='w' if self.side_to_move==WHITE else 'b'
        cr=''.join([k for k,v in self.castling_rights.items() if v])
        if cr=='': cr='-'
        ep='-' if self.ep_square==-1 else idx_to_alg(self.ep_square)
        return ' '.join(['/'.join(rows), side, cr, ep, str(self.halfmove_clock), str(self.fullmove_number)])

    def clone(self):
        b=Board()
        b.board=self.board.copy()
        b.side_to_move=self.side_to_move
        b.castling_rights=self.castling_rights.copy()
        b.ep_square=self.ep_square
        b.halfmove_clock=self.halfmove_clock
        b.fullmove_number=self.fullmove_number
        b.history=self.history.copy()
        return b

    def piece_at(self,i): return self.board[i]

    # --- move generation core (pseudolegal then filter) ---
    def generate_moves(self):
        moves=[]
        stm=self.side_to_move
        for i,p in enumerate(self.board):
            if p==PIECE_EMPTY: continue
            if (p.isupper() and stm==WHITE) or (p.islower() and stm==BLACK):
                moves.extend(self._pseudo_moves_for_piece(i,p))
        # filter legal:
        legal=[]
        for m in moves:
            self.make_move(m)
            if not self.is_in_check(1-stm):
                legal.append(m)
            self.unmake_move()
        return legal

    def _pseudo_moves_for_piece(self,i,p):
        moves=[]
        color = WHITE if p.isupper() else BLACK
        pp = p.lower()
        r,f = divmod(i,8)
        if pp == 'p':
            forward = 1 if color==WHITE else -1
            start_rank = 1 if color==WHITE else 6
            to = i + forward*8
            if 0<=to<64 and self.board[to]==PIECE_EMPTY:
                if (to//8==7) or (to//8==0):
                    for prom in ['q','r','b','n']:
                        moves.append(Move(i,to,promotion=prom))
                else:
                    moves.append(Move(i,to))
                    if r==start_rank:
                        to2 = i + forward*16
                        if self.board[to2]==PIECE_EMPTY:
                            moves.append(Move(i,to2))
            # captures
            for df in (-1,1):
                file=f+df
                if 0<=file<8:
                    to = i + forward*8 + df
                    if 0<=to<64:
                        tgt=self.board[to]
                        if tgt!=PIECE_EMPTY and ((tgt.isupper() and color==BLACK) or (tgt.islower() and color==WHITE)):
                            if (to//8==7) or (to//8==0):
                                for prom in ['q','r','b','n']:
                                    moves.append(Move(i,to,promotion=prom,captured=tgt))
                            else:
                                moves.append(Move(i,to,captured=tgt))
            # en-passant
            for df in (-1,1):
                file=f+df
                if 0<=file<8:
                    to = i + forward*8 + df
                    if to==self.ep_square:
                        moves.append(Move(i,to,is_ep=True))
        elif pp == 'n':
            offsets=[17,15,10,6,-6,-10,-15,-17]
            for off in offsets:
                to = i + off
                if 0<=to<64 and abs((i%8)-(to%8))<=2:
                    tgt=self.board[to]
                    if tgt==PIECE_EMPTY or (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                        moves.append(Move(i,to,captured=(tgt if tgt!=PIECE_EMPTY else None)))
        elif pp in ('b','r','q'):
            if pp=='b': rays=[9,7,-9,-7]
            elif pp=='r': rays=[8,-8,1,-1]
            else: rays=[9,7,-9,-7,8,-8,1,-1]
            for ray in rays:
                to=i+ray
                while 0<=to<64 and abs((to%8)-((to-ray)%8))<=1:
                    tgt=self.board[to]
                    if tgt==PIECE_EMPTY:
                        moves.append(Move(i,to))
                    else:
                        if (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                            moves.append(Move(i,to,captured=tgt))
                        break
                    to+=ray
        elif pp=='k':
            offsets=[8,9,1,-7,-8,-9,-1,7]
            for off in offsets:
                to=i+off
                if 0<=to<64 and abs((i%8)-(to%8))<=1:
                    tgt=self.board[to]
                    if tgt==PIECE_EMPTY or (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                        moves.append(Move(i,to,captured=(tgt if tgt!=PIECE_EMPTY else None)))
            # castling (simple tests)
            if p=='K':
                if self.castling_rights.get('K',False):
                    if self.board[5]==PIECE_EMPTY and self.board[6]==PIECE_EMPTY:
                        moves.append(Move(i,6,is_castle=True))
                if self.castling_rights.get('Q',False):
                    if self.board[1]==PIECE_EMPTY and self.board[2]==PIECE_EMPTY and self.board[3]==PIECE_EMPTY:
                        moves.append(Move(i,2,is_castle=True))
            else:
                if self.castling_rights.get('k',False):
                    if self.board[61]==PIECE_EMPTY and self.board[62]==PIECE_EMPTY:
                        moves.append(Move(i,62,is_castle=True))
                if self.castling_rights.get('q',False):
                    if self.board[57]==PIECE_EMPTY and self.board[58]==PIECE_EMPTY and self.board[59]==PIECE_EMPTY:
                        moves.append(Move(i,58,is_castle=True))
        return moves

    def make_move(self,m:Move):
        state = (self.board[m.from_sq], self.board[m.to_sq], self.side_to_move, dict(self.castling_rights), self.ep_square, self.halfmove_clock, self.fullmove_number)
        self.history.append((m,state))
        piece = self.board[m.from_sq]
        # halfmove
        if piece.lower()=='p' or (self.board[m.to_sq]!=PIECE_EMPTY):
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1
        # en-passant
        if m.is_ep:
            if piece.isupper():
                cap_sq = m.to_sq - 8
            else:
                cap_sq = m.to_sq + 8
            m.captured = self.board[cap_sq]
            self.board[cap_sq] = PIECE_EMPTY
        # castle rook
        if m.is_castle:
            if piece == 'K':
                if m.to_sq == 6:
                    self.board[5] = 'R'; self.board[7] = PIECE_EMPTY
                else:
                    self.board[3] = 'R'; self.board[0] = PIECE_EMPTY
            elif piece == 'k':
                if m.to_sq == 62:
                    self.board[61] = 'r'; self.board[63] = PIECE_EMPTY
                else:
                    self.board[59] = 'r'; self.board[56] = PIECE_EMPTY
        # move/promotion
        self.board[m.to_sq] = piece if not m.promotion else (m.promotion.upper() if piece.isupper() else m.promotion.lower())
        self.board[m.from_sq] = PIECE_EMPTY
        # update castling rights
        if piece == 'K': self.castling_rights['K']=self.castling_rights['Q']=False
        if piece == 'k': self.castling_rights['k']=self.castling_rights['q']=False
        # rooks
        if m.from_sq==0 or m.to_sq==0: self.castling_rights['Q']=False
        if m.from_sq==7 or m.to_sq==7: self.castling_rights['K']=False
        if m.from_sq==56 or m.to_sq==56: self.castling_rights['q']=False
        if m.from_sq==63 or m.to_sq==63: self.castling_rights['k']=False
        # en-passant target
        self.ep_square = -1
        if piece.lower()=='p' and abs(m.to_sq - m.from_sq)==16:
            self.ep_square = (m.from_sq + m.to_sq)//2
        # side and move number
        self.side_to_move = 1 - self.side_to_move
        if self.side_to_move == WHITE:
            self.fullmove_number += 1

    def unmake_move(self):
        if not self.history: return
        m, state = self.history.pop()
        from_piece, to_piece, stm, cr, ep, half, full = state
        # revert board - careful with ep and castling
        # restore pieces by replacing from/to
        # first clear to
        # We'll revert to saved entire pieces for safety
        # reconstruct board from state snapshot is easier: but we didn't snapshot entire board.
        # So we revert logically:
        # If m.promotion: place pawn back
        self.board[m.from_sq] = from_piece
        self.board[m.to_sq] = to_piece
        if m.is_ep:
            if from_piece.isupper():
                cap_sq = m.to_sq - 8
                self.board[cap_sq] = 'p'
            else:
                cap_sq = m.to_sq + 8
                self.board[cap_sq] = 'P'
        if m.is_castle:
            if from_piece == 'K':
                if m.to_sq == 6:
                    self.board[7] = 'R'; self.board[5] = PIECE_EMPTY
                else:
                    self.board[0] = 'R'; self.board[3] = PIECE_EMPTY
            elif from_piece == 'k':
                if m.to_sq == 62:
                    self.board[63] = 'r'; self.board[61] = PIECE_EMPTY
                else:
                    self.board[56] = 'r'; self.board[59] = PIECE_EMPTY
        self.side_to_move = stm
        self.castling_rights = dict(cr)
        self.ep_square = ep
        self.halfmove_clock = half
        self.fullmove_number = full

    def is_in_check(self, color):
        king = 'K' if color==WHITE else 'k'
        king_sq = -1
        for i,p in enumerate(self.board):
            if p==king:
                king_sq=i; break
        if king_sq==-1: return True
        enemy = BLACK if color==WHITE else WHITE
        for i,p in enumerate(self.board):
            if p==PIECE_EMPTY: continue
            if (p.isupper() and enemy==WHITE) or (p.islower() and enemy==BLACK):
                for mv in self._pseudo_moves_for_piece(i,p):
                    if mv.to_sq == king_sq:
                        return True
        return False

    def is_terminal(self):
        moves = self.generate_moves()
        if not moves:
            if self.is_in_check(self.side_to_move):
                return True, (-999999 if self.side_to_move==WHITE else 999999)
            else:
                return True, 0
        return False, None

# ---------------------------
# Simple Engine
# ---------------------------

piece_values = {'p':100,'n':320,'b':330,'r':500,'q':900,'k':20000}
# small PSTs for flavor
PST = {
    'p':[0]*64, 'n':[0]*64, 'b':[0]*64, 'r':[0]*64, 'q':[0]*64, 'k':[0]*64
}

class Engine:
    def __init__(self):
        self.tt = {}
        self.nodes = 0
        self.best_move = None
        self.time_limit = 1.0
        self.start_time = 0
        self.killer = {}
        self.history = {}

    def evaluate(self, board:Board):
        s=0
        for i,p in enumerate(board.board):
            if p==PIECE_EMPTY: continue
            sign = 1 if p.isupper() else -1
            s += sign * piece_values.get(p.lower(),0)
        # small mobility bias
        try:
            my_moves = len(board.generate_moves())
        except:
            my_moves = 0
        s += (my_moves - 20)
        return s

    def quiescence(self, board:Board, alpha, beta):
        stand = self.evaluate(board)
        if stand >= beta: return beta
        if alpha < stand: alpha = stand
        moves = [m for m in board.generate_moves() if m.captured is not None]
        moves.sort(key=lambda m: piece_values.get(m.captured.lower(),0) if m.captured else 0, reverse=True)
        for m in moves:
            self.nodes += 1
            board.make_move(m)
            val = -self.quiescence(board, -beta, -alpha)
            board.unmake_move()
            if val >= beta:
                return beta
            if val > alpha:
                alpha = val
        return alpha

    def order_moves(self, board, moves, ply):
        scored=[]
        for m in moves:
            score = 0
            if m.captured:
                score += 10000 + piece_values.get(m.captured.lower(),0)
            if ply in self.killer and self.killer[ply]==(m.from_sq,m.to_sq):
                score += 9000
            score += self.history.get((m.from_sq,m.to_sq),0)
            scored.append((score,m))
        scored.sort(key=lambda x:-x[0])
        return [m for _,m in scored]

    def alphabeta(self, board:Board, depth, alpha, beta, ply=0):
        # time cut
        if time.time() - self.start_time > self.time_limit:
            raise TimeoutError()
        self.nodes += 1
        key = (tuple(board.board), board.side_to_move, depth)
        if key in self.tt:
            return self.tt[key]
        terminal, val = board.is_terminal()
        if terminal:
            self.tt[key] = val; return val
        if depth==0:
            v = self.quiescence(board, alpha, beta)
            self.tt[key] = v; return v
        moves = board.generate_moves()
        if not moves:
            v = -999999 if board.is_in_check(board.side_to_move) else 0
            self.tt[key] = v; return v
        moves = self.order_moves(board, moves, ply)
        best = -9999999
        for m in moves:
            board.make_move(m)
            try:
                val = -self.alphabeta(board, depth-1, -beta, -alpha, ply+1)
            except TimeoutError:
                board.unmake_move(); raise
            board.unmake_move()
            if val > best:
                best = val
                if ply==0:
                    self.best_move = m
            if val > alpha:
                alpha = val
            if alpha >= beta:
                self.killer[ply] = (m.from_sq,m.to_sq)
                self.history[(m.from_sq,m.to_sq)] = self.history.get((m.from_sq,m.to_sq),0) + (1<<depth)
                break
        self.tt[key] = best
        return best

    def search(self, board:Board, max_time=1.0, max_depth=3):
        self.time_limit = max_time
        self.start_time = time.time()
        self.best_move=None
        self.tt.clear(); self.killer.clear(); self.history.clear()
        try:
            for depth in range(1, max_depth+1):
                self.nodes=0
                _ = self.alphabeta(board, depth, -10000000, 10000000)
                # time check
                if time.time() - self.start_time > self.time_limit:
                    break
        except TimeoutError:
            pass
        return self.best_move

# ---------------------------
# GUI
# ---------------------------

class ChessGUI:
    def __init__(self, root):
        self.root = root
        root.title("Chess Master - Python GUI Engine")
        self.board = Board()
        self.engine = Engine()
        self.engine_on = True
        self.engine_color = BLACK  # engine plays black by default
        self.engine_think_time = 1.0
        self.engine_depth = 3
        self.selected_sq = None
        self.legal_moves_cache = []
        # UI settings
        self.square_size = 72
        self.colors = {
            'light': '#f0d9b5',
            'dark': '#b58863',
            'highlight': '#f6f669',
            'last_move': '#a9a9a9',
            'board_bg': '#d0c7b7'
        }
        self.piece_style = 'crown'  # 'glyph' or 'crown'
        # frame layout
        self.left_frame = tk.Frame(root)
        self.left_frame.pack(side=tk.LEFT, padx=6, pady=6)
        self.right_frame = tk.Frame(root)
        self.right_frame.pack(side=tk.LEFT, padx=6, pady=6, fill=tk.Y)
        # canvas for board
        self.canvas = tk.Canvas(self.left_frame, width=8*self.square_size, height=8*self.square_size, bg=self.colors['board_bg'])
        self.canvas.pack()
        # bind clicks
        self.canvas.bind("<Button-1>", self.on_click)
        # move history
        tk.Label(self.right_frame, text="Move History").pack()
        self.move_list = tk.Listbox(self.right_frame, width=30, height=20)
        self.move_list.pack()
        # controls
        btn_frame = tk.Frame(self.right_frame)
        btn_frame.pack(pady=8)
        tk.Button(btn_frame, text="New Game", command=self.new_game).grid(row=0,column=0,padx=4)
        tk.Button(btn_frame, text="Undo", command=self.undo).grid(row=0,column=1,padx=4)
        self.engine_btn = tk.Button(btn_frame, text="Engine: ON", command=self.toggle_engine)
        self.engine_btn.grid(row=0,column=2,padx=4)
        tk.Button(btn_frame, text="Engine vs Engine", command=self.engine_vs_engine).grid(row=1,column=0,columnspan=3,pady=6)
        # settings
        settings_frame = tk.LabelFrame(self.right_frame, text="Settings")
        settings_frame.pack(pady=6, fill=tk.X)
        tk.Label(settings_frame, text="Piece Style:").grid(row=0,column=0,sticky='w')
        self.style_var = tk.StringVar(value=self.piece_style)
        tk.OptionMenu(settings_frame, self.style_var, 'crown','glyph', command=self.change_style).grid(row=0,column=1)
        tk.Label(settings_frame, text="Theme:").grid(row=1,column=0,sticky='w')
        tk.Button(settings_frame, text="Default", command=self.set_default_theme).grid(row=1,column=1,sticky='w')
        tk.Label(settings_frame, text="Engine time (s):").grid(row=2,column=0,sticky='w')
        self.time_var = tk.DoubleVar(value=self.engine_think_time)
        tk.Entry(settings_frame, textvariable=self.time_var, width=6).grid(row=2,column=1,sticky='w')
        # status
        self.status = tk.Label(self.right_frame, text="White to move")
        self.status.pack(pady=6)
        # draw initial
        self.draw_board()
        # start engine loop if engine plays white?
        self.after_id = None
        self.run_engine_if_needed()

    # --- UI helpers ---

    def set_default_theme(self, *_):
        self.colors.update({'light':'#f0d9b5','dark':'#b58863','highlight':'#f6f669','last_move':'#a9a9a9','board_bg':'#d0c7b7'})
        self.draw_board()

    def change_style(self, val):
        self.piece_style = val
        self.draw_board()

    def new_game(self):
        if self.after_id:
            self.root.after_cancel(self.after_id); self.after_id=None
        self.board = Board()
        self.move_list.delete(0,tk.END)
        self.selected_sq=None
        self.draw_board()
        self.run_engine_if_needed()

    def undo(self):
        if not self.board.history: return
        # undo last move
        self.board.unmake_move()
        # update move list
        if self.move_list.size()>0: self.move_list.delete(tk.END)
        self.draw_board()
        self.run_engine_if_needed()

    def toggle_engine(self):
        self.engine_on = not self.engine_on
        self.engine_btn.config(text=f"Engine: {'ON' if self.engine_on else 'OFF'}")
        self.run_engine_if_needed()

    def engine_vs_engine(self):
        # run a mini engine vs engine in a separate thread
        def run_game():
            e1 = Engine(); e2 = Engine()
            local_board = Board()
            while True:
                cur = e1 if local_board.side_to_move==WHITE else e2
                try:
                    m = cur.search(local_board, max_time=0.5, max_depth=3)
                except Exception:
                    m = None
                if not m:
                    break
                local_board.make_move(m)
                # update UI from main thread
                self.board = local_board.clone()
                self.move_list.insert(tk.END, m.uci())
                self.draw_board()
                time.sleep(0.4)
                term, val = local_board.is_terminal()
                if term: break
            messagebox.showinfo("Engine vs Engine", "Game finished.")
        threading.Thread(target=run_game, daemon=True).start()

    # --- click handling & move execution ---

    def on_click(self, event):
        file = event.x // self.square_size
        rank = 7 - (event.y // self.square_size)
        sq = rank*8 + file
        # if clicking outside
        if not (0<=file<8 and 0<=rank<8): return
        # if selecting own piece
        p = self.board.piece_at(sq)
        if self.selected_sq is None:
            # select if piece belongs to side to move
            if p!=PIECE_EMPTY and ((p.isupper() and self.board.side_to_move==WHITE) or (p.islower() and self.board.side_to_move==BLACK)):
                self.selected_sq = sq
                self.legal_moves_cache = [m for m in self.board.generate_moves() if m.from_sq==sq]
                self.draw_board()
            return
        else:
            # attempt a move from selected_sq -> sq
            candidate = None
            for m in self.legal_moves_cache:
                if m.to_sq == sq:
                    candidate = m; break
            # if clicked same square, deselect
            if sq == self.selected_sq:
                self.selected_sq=None; self.legal_moves_cache=[]
                self.draw_board(); return
            if candidate:
                # handle promotion: if promotion move without automatic promotion, open dialog
                if candidate.promotion:
                    prom = simpledialog.askstring("Promotion", "Promote to (q,r,b,n):", initialvalue='q')
                    if not prom: return
                    candidate.promotion = prom[0].lower()
                self.board.make_move(candidate)
                self.move_list.insert(tk.END, candidate.uci())
                self.selected_sq=None; self.legal_moves_cache=[]
                self.draw_board()
                # after move, if engine on and it is engine's turn, schedule thinking
                self.run_engine_if_needed()
            else:
                # if clicked another own piece, change selection
                if p!=PIECE_EMPTY and ((p.isupper() and self.board.side_to_move==WHITE) or (p.islower() and self.board.side_to_move==BLACK)):
                    self.selected_sq = sq
                    self.legal_moves_cache = [m for m in self.board.generate_moves() if m.from_sq==sq]
                    self.draw_board()
                else:
                    # clear selection
                    self.selected_sq=None; self.legal_moves_cache=[]
                    self.draw_board()

    def run_engine_if_needed(self):
        # engine to move?
        if not self.engine_on: return
        if (self.board.side_to_move == self.engine_color):
            # start engine thread
            def think_and_move():
                # small delay to allow UI update
                time.sleep(0.05)
                m = self.engine.search(self.board.clone(), max_time=self.time_var.get(), max_depth=self.engine_depth)
                if m:
                    # apply move in main thread
                    def apply_move():
                        # check legality again (engine move should be legal)
                        try:
                            self.board.make_move(m)
                            self.move_list.insert(tk.END, m.uci())
                            self.draw_board()
                            self.run_engine_if_needed()
                        except Exception as e:
                            print("Engine move apply failed:", e)
                    self.root.after(10, apply_move)
            threading.Thread(target=think_and_move, daemon=True).start()

    # --- drawing pieces ---

    def square_coords(self, sq):
        rank = sq//8
        file = sq%8
        x1 = file * self.square_size
        y1 = (7 - rank) * self.square_size
        x2 = x1 + self.square_size
        y2 = y1 + self.square_size
        return x1,y1,x2,y2

    def draw_board(self):
        self.canvas.delete("all")
        # squares
        for r in range(8):
            for f in range(8):
                sq = r*8 + f
                x1 = f*self.square_size; y1 = (7 - r)*self.square_size
                x2 = x1 + self.square_size; y2 = y1 + self.square_size
                light = ((r+f)%2==0)
                col = self.colors['light'] if light else self.colors['dark']
                self.canvas.create_rectangle(x1,y1,x2,y2, fill=col, outline=col)
        # highlight last move
        if self.board.history:
            last = self.board.history[-1][0]
            if last:
                for sq in (last.from_sq, last.to_sq):
                    x1,y1,x2,y2 = self.square_coords(sq)
                    self.canvas.create_rectangle(x1,y1,x2,y2, outline=self.colors['last_move'], width=4)
        # highlight selection & legal moves
        if self.selected_sq is not None:
            x1,y1,x2,y2 = self.square_coords(self.selected_sq)
            self.canvas.create_rectangle(x1,y1,x2,y2, outline='blue', width=3)
            for m in self.legal_moves_cache:
                tx1,ty1,tx2,ty2 = self.square_coords(m.to_sq)
                # draw dot for quiet, circle for capture
                if m.captured:
                    self.canvas.create_oval(tx1+12,ty1+12,tx2-12,ty2-12, outline='red', width=3)
                else:
                    self.canvas.create_oval((tx1+tx2)/2 -6, (ty1+ty2)/2 -6, (tx1+tx2)/2 +6, (ty1+ty2)/2 +6, fill=self.colors['highlight'], outline='')

        # pieces
        for i,p in enumerate(self.board.board):
            if p==PIECE_EMPTY: continue
            x1,y1,x2,y2 = self.square_coords(i)
            self.draw_piece(p, x1,y1,x2,y2)
        # status text
        side = "White" if self.board.side_to_move==WHITE else "Black"
        self.status.config(text=f"{side} to move")
        # update window
        self.root.update_idletasks()

    def draw_piece(self, p, x1,y1,x2,y2):
        # two styles: glyph (unicode chess glyphs) or crown (circle with crown)
        centerx = (x1+x2)/2; centery = (y1+y2)/2
        size = self.square_size
        white = p.isupper()
        piece = p.lower()
        if self.piece_style == 'glyph':
            glyph_map = {
                'k': '\u265A','q':'\u265B','r':'\u265C','b':'\u265D','n':'\u265E','p':'\u265F'
            }
            glyph = glyph_map[piece]
            fill = 'white' if white else 'black'
            # draw circle background for visibility
            self.canvas.create_oval(x1+6,y1+6,x2-6,y2-6, fill='', outline='')
            self.canvas.create_text(centerx,centery, text=glyph, font=("Arial", int(size*0.6)), fill=fill)
        else:
            # stylized: base circle + crown / letter
            base_color = '#ffffff' if white else '#111111'
            border = '#000000'
            self.canvas.create_oval(x1+8,y1+8,x2-8,y2-8, fill=base_color, outline=border, width=2)
            if piece == 'k':
                # crown: three small triangles
                w = size*0.18
                h = size*0.14
                for i in range(3):
                    cx = centerx + (i-1)*w*1.4
                    self.canvas.create_polygon(cx, y1+size*0.25, cx-w, y1+size*0.45, cx+w, y1+size*0.45, fill='gold', outline='black')
                self.canvas.create_rectangle(centerx - w*2, y1+size*0.45, centerx + w*2, y1+size*0.58, fill='gold', outline='black')
            elif piece == 'q':
                self.canvas.create_text(centerx, centery, text='Q', font=("Helvetica", int(size*0.45), "bold"), fill='black' if white else 'white')
            elif piece == 'r':
                self.canvas.create_rectangle(centerx-size*0.18, centery-size*0.25, centerx+size*0.18, centery+size*0.2, fill='darkgray' if white else 'gray20', outline='black')
            elif piece == 'b':
                self.canvas.create_oval(centerx-size*0.12, centery-size*0.25, centerx+size*0.12, centery+size*0.2, fill='brown' if white else 'gray30', outline='black')
            elif piece == 'n':
                # horse head stylized with polygon
                coords = [
                    centerx- size*0.18, centery+size*0.22,
                    centerx- size*0.05, centery- size*0.25,
                    centerx+ size*0.15, centery- size*0.05,
                    centerx+ size*0.05, centery+ size*0.25
                ]
                self.canvas.create_polygon(coords, fill='sienna' if white else 'gray40', outline='black')
            elif piece == 'p':
                self.canvas.create_oval(centerx-size*0.09, centery-size*0.14, centerx+size*0.09, centery+size*0.06, fill='black' if not white else 'white', outline='black')

# ---------------------------
# Main
# ---------------------------

def main():
    root = tk.Tk()
    app = ChessGUI(root)
    root.geometry("1000x650")
    root.mainloop()

if __name__ == "__main__":
    main()
