import copy

# Piece values for evaluation
piece_values = {
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 1000,
    'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': -1000
}

# Initial board setup
board = [
    list("rnbqkbnr"),
    list("pppppppp"),
    list("........"),
    list("........"),
    list("........"),
    list("........"),
    list("PPPPPPPP"),
    list("RNBQKBNR")
]

def print_board(b):
    print("  a b c d e f g h")
    for i, row in enumerate(b):
        print(8 - i, " ".join(row), 8 - i)
    print("  a b c d e f g h\n")

def evaluate(b):
    score = 0
    for row in b:
        for piece in row:
            score += piece_values.get(piece, 0)
    return score

def is_in_bounds(x, y):
    return 0 <= x < 8 and 0 <= y < 8

def get_moves(b, x, y):
    piece = b[x][y]
    moves = []
    directions = []

    if piece.lower() == 'p':
        dir = -1 if piece.isupper() else 1
        start_row = 6 if piece.isupper() else 1
        if is_in_bounds(x + dir, y) and b[x + dir][y] == '.':
            moves.append((x + dir, y))
            if x == start_row and b[x + 2 * dir][y] == '.':
                moves.append((x + 2 * dir, y))
        for dy in [-1, 1]:
            if is_in_bounds(x + dir, y + dy):
                target = b[x + dir][y + dy]
                if target != '.' and target.isupper() != piece.isupper():
                    moves.append((x + dir, y + dy))

    elif piece.lower() == 'n':
        knight_moves = [(2, 1), (1, 2), (-1, 2), (-2, 1),
                        (-2, -1), (-1, -2), (1, -2), (2, -1)]
        for dx, dy in knight_moves:
            nx, ny = x + dx, y + dy
            if is_in_bounds(nx, ny):
                target = b[nx][ny]
                if target == '.' or target.isupper() != piece.isupper():
                    moves.append((nx, ny))

    elif piece.lower() == 'b':
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

    elif piece.lower() == 'r':
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    elif piece.lower() == 'q':
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1),
                      (-1, 0), (1, 0), (0, -1), (0, 1)]

    elif piece.lower() == 'k':
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1),
                      (-1, 0), (1, 0), (0, -1), (0, 1)]
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if is_in_bounds(nx, ny):
                target = b[nx][ny]
                if target == '.' or target.isupper() != piece.isupper():
                    moves.append((nx, ny))
        return moves

    # For sliding pieces
    for dx, dy in directions:
        nx, ny = x + dx, y + dy
        while is_in_bounds(nx, ny):
            target = b[nx][ny]
            if target == '.':
                moves.append((nx, ny))
            elif target.isupper() != piece.isupper():
                moves.append((nx, ny))
                break
            else:
                break
            nx += dx
            ny += dy

    return moves

def get_all_moves(b, white=True):
    moves = []
    for x in range(8):
        for y in range(8):
            piece = b[x][y]
            if piece != '.' and piece.isupper() == white:
                for nx, ny in get_moves(b, x, y):
                    moves.append(((x, y), (nx, ny)))
    return moves

def minimax(b, depth, white):
    if depth == 0:
        return evaluate(b), None

    best_score = float('-inf') if white else float('inf')
    best_move = None

    for move in get_all_moves(b, white):
        new_board = copy.deepcopy(b)
        (x1, y1), (x2, y2) = move
        new_board[x2][y2] = new_board[x1][y1]
        new_board[x1][y1] = '.'

        score, _ = minimax(new_board, depth - 1, not white)
        if white and score > best_score:
            best_score = score
            best_move = move
        elif not white and score < best_score:
            best_score = score
            best_move = move

    return best_score, best_move

def move_to_str(move):
    (x1, y1), (x2, y2) = move
    return f"{chr(y1 + ord('a'))}{8 - x1} to {chr(y2 + ord('a'))}{8 - x2}"

# Main loop
print_board(board)
while True:
    score, move = minimax(board, 2, True)
    if move is None:
        print("Game over!")
        break
    print("White plays:", move_to_str(move))
    (x1, y1), (x2, y2) = move
    board[x2][y2] = board[x1][y1]
    board[x1][y1] = '.'
    print_board(board)

    score, move = minimax(board, 2, False)
    if move is None:
        print("Game over!")
        break
    print("Black plays:", move_to_str(move))
    (x1, y1), (x2, y2) = move
    board[x2][y2] = board[x1][y1]
    board[x1][y1] = '.'
    print_board(board)
