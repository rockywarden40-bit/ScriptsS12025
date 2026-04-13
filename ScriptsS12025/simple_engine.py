"""
simple_engine.py
Standalone chess engine in pure Python (single file).
Features:
 - 8x8 board representation
 - Move generation (pawns incl. promotions, en-passant, castling)
 - Make/undo move
 - Alpha-Beta with iterative deepening & quiescence
 - Transposition table, MVV/LVA and history move ordering
 - Simple evaluation: material + piece-square tables + mobility
 - Console play (you vs engine) and engine vs engine
Limitations:
 - Not comparable to modern top engines (Stockfish 17). Use as learning base.
"""

import time
import math
import random
import sys
from dataclasses import dataclass

# ---------------------------
# Basic board representation
# ---------------------------

# Board squares: 0..63 (rank 1..8, file a..h)
# We use 0 = a1, 7 = h1, 56 = a8, 63 = h8

PIECE_EMPTY = '.'
WHITE, BLACK = 0, 1

# piece letters: uppercase = White, lowercase = Black
# p, n, b, r, q, k
START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

piece_values = {
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
}

# piece-square tables (simple)
PST = {
    'p': [
         0,  0,  0,  0,  0,  0,  0,  0,
         5, 10, 10,-20,-20, 10, 10,  5,
         5, -5,-10,  0,  0,-10, -5,  5,
         0,  0,  0, 20, 20,  0,  0,  0,
         5,  5, 10, 25, 25, 10,  5,  5,
        10, 10, 20, 30, 30, 20, 10, 10,
        50, 50, 50, 50, 50, 50, 50, 50,
         0,  0,  0,  0,  0,  0,  0,  0
    ],
    'n': [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
    ],
    'b': [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -20,-10,-10,-10,-10,-10,-10,-20
    ],
    'r': [
         0,  0,  5, 10, 10,  5,  0,  0,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
         5, 10, 10, 10, 10, 10, 10,  5,
         0,  0,  0,  0,  0,  0,  0,  0
    ],
    'q': [
        -20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
         -5,  0,  5,  5,  5,  5,  0, -5,
          0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20
    ],
    'k': [
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
         20, 20,  0,  0,  0,  0, 20, 20,
         20, 30, 10,  0,  0, 10, 30, 20
    ]
}

# ---------------------------
# Board class & utilities
# ---------------------------

def sq(rank, file):
    return rank * 8 + file

def on_board(sq_idx):
    return 0 <= sq_idx < 64

def idx_to_alg(i):
    return chr((i % 8) + ord('a')) + str((i // 8) + 1)

def alg_to_idx(algsq):
    file = ord(algsq[0]) - ord('a')
    rank = int(algsq[1]) - 1
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
        prom = ''
        if self.promotion:
            prom = self.promotion.lower()
        return idx_to_alg(self.from_sq) + idx_to_alg(self.to_sq) + prom

class Board:
    def __init__(self, fen=START_FEN):
        self.board = [PIECE_EMPTY] * 64
        self.side_to_move = WHITE
        self.castling_rights = {'K': False, 'Q': False, 'k': False, 'q': False}
        self.ep_square = -1
        self.halfmove_clock = 0
        self.fullmove_number = 1
        self.history = []
        self.set_fen(fen)

    def set_fen(self, fen):
        parts = fen.split()
        rows = parts[0].split('/')
        for r, row in enumerate(rows[::-1]):  # fen ranks from 8..1, we want 1..8
            file = 0
            for ch in row:
                if ch.isdigit():
                    file += int(ch)
                else:
                    self.board[r*8 + file] = ch
                    file += 1
        self.side_to_move = WHITE if parts[1] == 'w' else BLACK
        self.castling_rights = {'K': 'K' in parts[2], 'Q': 'Q' in parts[2],
                                'k': 'k' in parts[2], 'q': 'q' in parts[2]}
        self.ep_square = -1 if parts[3] == '-' else alg_to_idx(parts[3])
        self.halfmove_clock = int(parts[4]) if len(parts) > 4 else 0
        self.fullmove_number = int(parts[5]) if len(parts) > 5 else 1

    def fen(self):
        rows = []
        for r in range(7, -1, -1):
            empt = 0
            row = ""
            for f in range(8):
                v = self.board[r*8 + f]
                if v == PIECE_EMPTY:
                    empt += 1
                else:
                    if empt:
                        row += str(empt)
                        empt = 0
                    row += v
            if empt:
                row += str(empt)
            rows.append(row)
        side = 'w' if self.side_to_move == WHITE else 'b'
        cr = ''.join([k for k, v in self.castling_rights.items() if v])
        if cr == '':
            cr = '-'
        ep = '-' if self.ep_square == -1 else idx_to_alg(self.ep_square)
        return ' '.join([ '/'.join(rows), side, cr, ep, str(self.halfmove_clock), str(self.fullmove_number)])

    def print(self):
        print("  +-----------------+")
        for r in range(7, -1, -1):
            print(str(r+1) + " |", end=' ')
            for f in range(8):
                print(self.board[r*8 + f], end=' ')
            print("|")
        print("  +-----------------+")
        print("    a b c d e f g h")
        print("FEN:", self.fen())

    def clone(self):
        b = Board()
        b.board = self.board.copy()
        b.side_to_move = self.side_to_move
        b.castling_rights = self.castling_rights.copy()
        b.ep_square = self.ep_square
        b.halfmove_clock = self.halfmove_clock
        b.fullmove_number = self.fullmove_number
        b.history = self.history.copy()
        return b

    def piece_at(self, i):
        return self.board[i]

    # ---------------------------
    # Move generation
    # ---------------------------

    def generate_moves(self):
        moves = []
        stm = self.side_to_move
        for i, p in enumerate(self.board):
            if p == PIECE_EMPTY: continue
            if (p.isupper() and stm == WHITE) or (p.islower() and stm == BLACK):
                moves.extend(self._pseudo_moves_for_piece(i, p))
        # filter legal
        legal = []
        for m in moves:
            self.make_move(m)
            if not self.is_in_check(1 - stm):
                legal.append(m)
            self.unmake_move()
        return legal

    def _pseudo_moves_for_piece(self, i, p):
        moves = []
        color = WHITE if p.isupper() else BLACK
        pp = p.lower()
        r, f = divmod(i, 8)
        directions = []
        if pp == 'p':
            forward = 1 if color == WHITE else -1
            start_rank = 1 if color == WHITE else 6
            # one step
            to = i + forward*8
            if 0 <= to < 64 and self.board[to] == PIECE_EMPTY:
                if (to // 8 == 7) or (to // 8 == 0):
                    for prom in ['q','r','b','n']:
                        moves.append(Move(i, to, promotion=prom))
                else:
                    moves.append(Move(i, to))
                    # two-step
                    if r == start_rank:
                        to2 = i + forward*16
                        if self.board[to2] == PIECE_EMPTY:
                            m = Move(i, to2)
                            # set ep target when applying
                            moves.append(m)
            # captures
            for df in [-1, 1]:
                file = f + df
                if 0 <= file < 8:
                    to = i + forward*8 + df
                    if 0 <= to < 64:
                        tgt = self.board[to]
                        if tgt != PIECE_EMPTY and ((tgt.isupper() and color==BLACK) or (tgt.islower() and color==WHITE)):
                            if (to // 8 == 7) or (to // 8 == 0):
                                for prom in ['q','r','b','n']:
                                    moves.append(Move(i, to, promotion=prom, captured=tgt))
                            else:
                                moves.append(Move(i, to, captured=tgt))
            # en-passant captured as normal move with flag
            for df in [-1,1]:
                file = f + df
                if 0 <= file < 8:
                    to = i + forward*8 + df
                    ep_target = i + df
                    if to == self.ep_square:
                        # actual captured pawn is ep_target +/- 8?
                        cap_sq = i + df
                        cap_sq = i + df + (0 if color==WHITE else 0)  # captured pawn is on same rank as from_sq + df
                        # we will mark is_ep and resolve captured on make_move
                        moves.append(Move(i, to, is_ep=True))
        elif pp == 'n':
            knight_offsets = [17,15,10,6,-6,-10,-15,-17]
            for off in knight_offsets:
                to = i + off
                if 0 <= to < 64:
                    # ensure not wrap file boundaries
                    if abs((i%8) - (to%8)) <= 2:
                        tgt = self.board[to]
                        if tgt == PIECE_EMPTY or (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                            moves.append(Move(i,to,captured=(tgt if tgt!=PIECE_EMPTY else None)))
        elif pp in ('b','r','q'):
            if pp == 'b':
                rays = [9,7,-9,-7]
            elif pp == 'r':
                rays = [8,-8,1,-1]
            else:
                rays = [9,7,-9,-7,8,-8,1,-1]
            for ray in rays:
                to = i + ray
                while 0 <= to < 64 and abs((to%8)-( (to-ray)%8 ))<=1:
                    tgt = self.board[to]
                    if tgt == PIECE_EMPTY:
                        moves.append(Move(i,to))
                    else:
                        if (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                            moves.append(Move(i,to,captured=tgt))
                        break
                    prev = to
                    to += ray
        elif pp == 'k':
            offsets = [8,9,1,-7,-8,-9,-1,7]
            for off in offsets:
                to = i + off
                if 0 <= to < 64 and abs((i%8)-(to%8))<=1:
                    tgt = self.board[to]
                    if tgt == PIECE_EMPTY or (tgt.isupper() and p.islower()) or (tgt.islower() and p.isupper()):
                        moves.append(Move(i,to,captured=(tgt if tgt!=PIECE_EMPTY else None)))
            # castling
            if p.isupper():
                if self.castling_rights.get('K',False):
                    if self.board[5] == PIECE_EMPTY and self.board[6] == PIECE_EMPTY:
                        moves.append(Move(i, 6, is_castle=True))
                if self.castling_rights.get('Q',False):
                    if self.board[1] == PIECE_EMPTY and self.board[2] == PIECE_EMPTY and self.board[3] == PIECE_EMPTY:
                        moves.append(Move(i, 2, is_castle=True))
            else:
                if self.castling_rights.get('k',False):
                    if self.board[61] == PIECE_EMPTY and self.board[62] == PIECE_EMPTY:
                        moves.append(Move(i, 62, is_castle=True))
                if self.castling_rights.get('q',False):
                    if self.board[57] == PIECE_EMPTY and self.board[58] == PIECE_EMPTY and self.board[59] == PIECE_EMPTY:
                        moves.append(Move(i, 58, is_castle=True))
        return moves

    # ---------------------------
    # Make / Unmake move
    # ---------------------------

    def make_move(self, m: Move):
        # Push state
        state = (self.board[m.from_sq], self.board[m.to_sq], self.side_to_move,
                 dict(self.castling_rights), self.ep_square, self.halfmove_clock, self.fullmove_number)
        self.history.append((m, state))
        piece = self.board[m.from_sq]
        # Reset halfmove clock if pawn move or capture
        if piece.lower() == 'p' or (self.board[m.to_sq] != PIECE_EMPTY):
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1
        # handle en-passant capture
        if m.is_ep:
            # captured pawn is behind the destination (for white) or ahead (for black)
            if piece.isupper():
                cap_sq = m.to_sq - 8
            else:
                cap_sq = m.to_sq + 8
            captured = self.board[cap_sq]
            self.board[cap_sq] = PIECE_EMPTY
            m.captured = captured
        # handle castle rook move
        if m.is_castle:
            if piece == 'K':
                # white
                if m.to_sq == 6: # king side
                    self.board[5] = 'R'; self.board[7] = PIECE_EMPTY
                else: # queen
                    self.board[3] = 'R'; self.board[0] = PIECE_EMPTY
            elif piece == 'k':
                if m.to_sq == 62:
                    self.board[61] = 'r'; self.board[63] = PIECE_EMPTY
                else:
                    self.board[59] = 'r'; self.board[56] = PIECE_EMPTY
        # move
        self.board[m.to_sq] = piece if not m.promotion else (m.promotion.upper() if piece.isupper() else m.promotion.lower())
        self.board[m.from_sq] = PIECE_EMPTY
        # update castling rights if king or rook moved/captured
        if piece == 'K':
            self.castling_rights['K'] = self.castling_rights['Q'] = False
        if piece == 'k':
            self.castling_rights['k'] = self.castling_rights['q'] = False
        # rooks
        if m.from_sq == 0 or m.to_sq == 0:
            self.castling_rights['Q'] = False
        if m.from_sq == 7 or m.to_sq == 7:
            self.castling_rights['K'] = False
        if m.from_sq == 56 or m.to_sq == 56:
            self.castling_rights['q'] = False
        if m.from_sq == 63 or m.to_sq == 63:
            self.castling_rights['k'] = False
        # set en-passant square
        self.ep_square = -1
        if piece.lower() == 'p' and abs(m.to_sq - m.from_sq) == 16:
            self.ep_square = (m.from_sq + m.to_sq) // 2
        # update side & move number
        self.side_to_move = 1 - self.side_to_move
        if self.side_to_move == WHITE:
            self.fullmove_number += 1

    def unmake_move(self):
        if not self.history:
            return
        m, state = self.history.pop()
        (from_piece, to_piece, stm, cr, ep, half, full) = state
        # restore
        self.board = self.board.copy()
        # revert move
        self.board[m.from_sq] = from_piece
        # if promotion, put back pawn
        if m.promotion:
            self.board[m.to_sq] = to_piece
        else:
            self.board[m.to_sq] = to_piece
        # if ep, restore captured pawn
        if m.is_ep:
            if from_piece.isupper():
                cap_sq = m.to_sq - 8
                self.board[cap_sq] = 'p'
            else:
                cap_sq = m.to_sq + 8
                self.board[cap_sq] = 'P'
        # if castle, restore rook
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

    # ---------------------------
    # Checks and terminal
    # ---------------------------

    def is_in_check(self, color):
        # locate king of color (color means side to move previously)
        king = 'K' if color == WHITE else 'k'
        king_sq = -1
        for i, p in enumerate(self.board):
            if p == king:
                king_sq = i
                break
        if king_sq == -1:
            return True
        # generate all enemy pseudomoves and see if any attack king
        enemy = BLACK if color == WHITE else WHITE
        for i, p in enumerate(self.board):
            if p == PIECE_EMPTY: continue
            if (p.isupper() and enemy==WHITE) or (p.islower() and enemy==BLACK):
                for mv in self._pseudo_moves_for_piece(i, p):
                    if mv.to_sq == king_sq:
                        # pawns and special handling already included
                        return True
        return False

    def is_terminal(self):
        moves = self.generate_moves()
        if not moves:
            # checkmate or stalemate
            if self.is_in_check(self.side_to_move):
                return True, -999999 if self.side_to_move == WHITE else 999999
            else:
                return True, 0
        # fifty-move, 3fold not implemented
        return False, None

# ---------------------------
# Engine (search + eval)
# ---------------------------

class Engine:
    def __init__(self):
        self.nodes = 0
        self.start_time = 0
        self.time_limit = 1.0
        self.tt = {}  # transposition table
        self.killer = {}
        self.history = {}
        self.best_move = None

    def evaluate(self, board: Board):
        # material + pst + mobility small bonus
        score = 0
        for i, p in enumerate(board.board):
            if p == PIECE_EMPTY: continue
            sign = 1 if p.isupper() else -1
            pv = piece_values.get(p.lower(), 0)
            score += sign * pv
            # pst
            pst = PST.get(p.lower(), [0]*64)
            idx = i if p.isupper() else (63 - i)  # mirror for black
            score += sign * pst[idx]
        # mobility (simple)
        side = board.side_to_move
        my_moves = len(board.generate_moves())
        # tiny mobility effect: prefer side with more options
        score += (my_moves - 20) * (20 if side==WHITE else -20) / 100
        return int(score)

    def order_moves(self, board: Board, moves, ply):
        scored = []
        for m in moves:
            score = 0
            if m.captured:
                score += 10000 + piece_values.get(m.captured.lower(),0) - piece_values.get(board.board[m.from_sq].lower(),0)
            # killer
            if ply in self.killer and self.killer[ply] == (m.from_sq,m.to_sq):
                score += 9000
            # history heuristic
            h = self.history.get((m.from_sq,m.to_sq), 0)
            score += h
            scored.append((score, m))
        scored.sort(key=lambda x: -x[0])
        return [m for _,m in scored]

    def quiescence(self, board: Board, alpha, beta):
        stand = self.evaluate(board)
        if stand >= beta:
            return beta
        if alpha < stand:
            alpha = stand
        moves = [m for m in board.generate_moves() if m.captured is not None]
        moves = sorted(moves, key=lambda m: piece_values.get(m.captured.lower(),0), reverse=True)
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

    def alphabeta(self, board: Board, depth, alpha, beta, ply=0):
        self.nodes += 1
        key = (tuple(board.board), board.side_to_move, depth)
        if key in self.tt:
            return self.tt[key]
        terminal, val = board.is_terminal()
        if terminal:
            self.tt[key] = val
            return val
        if depth == 0:
            val = self.quiescence(board, alpha, beta)
            self.tt[key] = val
            return val
        moves = board.generate_moves()
        if not moves:
            val = -999999 if board.is_in_check(board.side_to_move) else 0
            self.tt[key] = val
            return val
        moves = self.order_moves(board, moves, ply)
        best = -9999999
        for idx, m in enumerate(moves):
            board.make_move(m)
            val = -self.alphabeta(board, depth-1, -beta, -alpha, ply+1)
            board.unmake_move()
            if val > best:
                best = val
                if ply == 0:
                    self.best_move = m
            if val > alpha:
                alpha = val
            if alpha >= beta:
                # store killers and history
                self.killer[ply] = (m.from_sq,m.to_sq)
                self.history[(m.from_sq,m.to_sq)] = self.history.get((m.from_sq,m.to_sq),0) + (1 << depth)
                break
        self.tt[key] = best
        return best

    def search(self, board: Board, max_time=1.0, max_depth=4):
        self.time_limit = max_time
        self.start_time = time.time()
        self.best_move = None
        self.tt.clear()
        self.killer.clear()
        self.history.clear()
        best_score = -999999
        for depth in range(1, max_depth+1):
            self.nodes = 0
            score = self.alphabeta(board, depth, -10000000, 10000000)
            best_score = score
            # time check
            if time.time() - self.start_time > self.time_limit:
                break
        return self.best_move, best_score

# ---------------------------
# CLI functions
# ---------------------------

def uci_input(prompt=""):
    try:
        return input(prompt)
    except EOFError:
        return ''

def human_move_from_input(board: Board):
    while True:
        s = uci_input("Your move (e.g. e2e4, resign, fen ...): ").strip()
        if s == '':
            continue
        if s == 'resign':
            return None
        if s.startswith('fen '):
            fen = s[4:].strip()
            board.set_fen(fen); return 'setfen'
        try:
            # parse uci like e2e4 or e7e8q
            from_sq = alg_to_idx(s[0:2]); to_sq = alg_to_idx(s[2:4])
            prom = None
            if len(s) > 4:
                prom = s[4]
            # find move among legal
            for m in board.generate_moves():
                if m.from_sq == from_sq and m.to_sq == to_sq and (prom is None or (m.promotion and m.promotion.lower()==prom.lower())):
                    return m
            print("Illegal move. Try again.")
        except Exception as e:
            print("Bad format.", e)

def play_vs_engine():
    b = Board()
    eng = Engine()
    print("Starting new game. Enter moves in UCI (e2e4). Type 'quit' to exit.")
    b.print()
    while True:
        if b.side_to_move == WHITE:
            mv = human_move_from_input(b)
            if mv is None:
                print("You resigned.")
                break
            if mv == 'setfen':
                b.print(); continue
            b.make_move(mv)
        else:
            print("Engine thinking...")
            m, score = eng.search(b, max_time=1.0, max_depth=4)
            if not m:
                print("Engine has no move.")
                break
            print("Engine plays:", m.uci(), "score:", score)
            b.make_move(m)
        b.print()
        t, val = b.is_terminal()
        if t:
            print("Game over. Result:", val)
            break

def engine_vs_engine():
    b = Board()
    e1 = Engine(); e2 = Engine()
    while True:
        cur = e1 if b.side_to_move == WHITE else e2
        m,score = cur.search(b, max_time=0.5, max_depth=3)
        if not m:
            print("No move. Terminal.")
            break
        print(("White" if b.side_to_move==WHITE else "Black"), "plays", m.uci(), "score", score)
        b.make_move(m)
        b.print()
        t, val = b.is_terminal()
        if t:
            print("Game over", val); break

# ---------------------------
# Entry point
# ---------------------------

if __name__ == "__main__":
    print("SimplePyEngine - single file python engine")
    print("Options: 1) play vs engine  2) engine vs engine  3) print starting FEN")
    c = input("Choose [1/2/3]: ").strip()
    if c == '1':
        play_vs_engine()
    elif c == '2':
        engine_vs_engine()
    else:
        b = Board()
        b.print()
