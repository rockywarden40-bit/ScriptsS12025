export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  notation: string;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Rooks
  board[0][0] = board[0][7] = { type: 'rook', color: 'black' };
  board[7][0] = board[7][7] = { type: 'rook', color: 'white' };
  
  // Knights
  board[0][1] = board[0][6] = { type: 'knight', color: 'black' };
  board[7][1] = board[7][6] = { type: 'knight', color: 'white' };
  
  // Bishops
  board[0][2] = board[0][5] = { type: 'bishop', color: 'black' };
  board[7][2] = board[7][5] = { type: 'bishop', color: 'white' };
  
  // Queens
  board[0][3] = { type: 'queen', color: 'black' };
  board[7][3] = { type: 'queen', color: 'white' };
  
  // Kings
  board[0][4] = { type: 'king', color: 'black' };
  board[7][4] = { type: 'king', color: 'white' };
  
  return board;
}

export function isValidMove(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  currentTurn: PieceColor,
  lastMove?: Move
): boolean {
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== currentTurn) return false;
  
  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  const moves = getPossibleMoves(board, from, lastMove);
  return moves.some(move => move.row === to.row && move.col === to.col);
}

export function getPossibleMoves(board: (Piece | null)[][], from: Position, lastMove?: Move): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  
  let moves: Position[] = [];
  
  switch (piece.type) {
    case 'pawn':
      moves = getPawnMoves(board, from, piece.color, lastMove);
      break;
    case 'rook':
      moves = getRookMoves(board, from, piece.color);
      break;
    case 'knight':
      moves = getKnightMoves(board, from, piece.color);
      break;
    case 'bishop':
      moves = getBishopMoves(board, from, piece.color);
      break;
    case 'queen':
      moves = getQueenMoves(board, from, piece.color);
      break;
    case 'king':
      moves = getKingMoves(board, from, piece.color);
      break;
  }
  
  // Filter out moves that would put own king in check
  return moves.filter(to => !wouldBeInCheck(board, from, to, piece.color));
}

function getPawnMoves(board: (Piece | null)[][], from: Position, color: PieceColor, lastMove?: Move): Position[] {
  const moves: Position[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  const enPassantRow = color === 'white' ? 3 : 4;
  
  // Forward move
  const forward = from.row + direction;
  if (forward >= 0 && forward < 8 && !board[forward][from.col]) {
    moves.push({ row: forward, col: from.col });
    
    // Double forward from start
    if (from.row === startRow) {
      const doubleForward = from.row + 2 * direction;
      if (!board[doubleForward][from.col]) {
        moves.push({ row: doubleForward, col: from.col });
      }
    }
  }
  
  // Captures
  for (const colOffset of [-1, 1]) {
    const newCol = from.col + colOffset;
    if (newCol >= 0 && newCol < 8 && forward >= 0 && forward < 8) {
      const target = board[forward][newCol];
      if (target && target.color !== color) {
        moves.push({ row: forward, col: newCol });
      }
    }
  }
  
  // En passant
  if (from.row === enPassantRow && lastMove) {
    const lastPiece = lastMove.piece;
    if (lastPiece.type === 'pawn' && 
        Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
        lastMove.to.row === from.row &&
        Math.abs(lastMove.to.col - from.col) === 1) {
      moves.push({ row: forward, col: lastMove.to.col });
    }
  }
  
  return moves;
}

function getRookMoves(board: (Piece | null)[][], from: Position, color: PieceColor): Position[] {
  return getSlidingMoves(board, from, color, [
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: 1, col: 0 },
    { row: -1, col: 0 },
  ]);
}

function getBishopMoves(board: (Piece | null)[][], from: Position, color: PieceColor): Position[] {
  return getSlidingMoves(board, from, color, [
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 },
  ]);
}

function getQueenMoves(board: (Piece | null)[][], from: Position, color: PieceColor): Position[] {
  return [
    ...getRookMoves(board, from, color),
    ...getBishopMoves(board, from, color),
  ];
}

function getKnightMoves(board: (Piece | null)[][], from: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const offsets = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 }, { row: 1, col: 2 },
    { row: 2, col: -1 }, { row: 2, col: 1 },
  ];
  
  for (const offset of offsets) {
    const newRow = from.row + offset.row;
    const newCol = from.col + offset.col;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || target.color !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

function getKingMoves(board: (Piece | null)[][], from: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const offsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
  ];
  
  for (const offset of offsets) {
    const newRow = from.row + offset.row;
    const newCol = from.col + offset.col;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || target.color !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  // Castling
  const piece = board[from.row][from.col];
  if (!piece?.hasMoved && !isInCheck(board, color)) {
    const row = color === 'white' ? 7 : 0;
    
    // Kingside castling
    const kingsideRook = board[row][7];
    if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved &&
        !board[row][5] && !board[row][6]) {
      // Check if king passes through or ends in check
      if (!isSquareUnderAttack(board, { row, col: 5 }, color === 'white' ? 'black' : 'white') &&
          !isSquareUnderAttack(board, { row, col: 6 }, color === 'white' ? 'black' : 'white')) {
        moves.push({ row, col: 6 });
      }
    }
    
    // Queenside castling
    const queensideRook = board[row][0];
    if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved &&
        !board[row][1] && !board[row][2] && !board[row][3]) {
      // Check if king passes through or ends in check
      if (!isSquareUnderAttack(board, { row, col: 3 }, color === 'white' ? 'black' : 'white') &&
          !isSquareUnderAttack(board, { row, col: 2 }, color === 'white' ? 'black' : 'white')) {
        moves.push({ row, col: 2 });
      }
    }
  }
  
  return moves;
}

function getSlidingMoves(
  board: (Piece | null)[][],
  from: Position,
  color: PieceColor,
  directions: Position[]
): Position[] {
  const moves: Position[] = [];
  
  for (const dir of directions) {
    let newRow = from.row + dir.row;
    let newCol = from.col + dir.col;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      
      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      
      newRow += dir.row;
      newCol += dir.col;
    }
  }
  
  return moves;
}

function findKing(board: (Piece | null)[][], color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

function isSquareUnderAttack(board: (Piece | null)[][], pos: Position, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getPossibleMovesWithoutCheckValidation(board, { row, col });
        if (moves.some(move => move.row === pos.row && move.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getPossibleMovesWithoutCheckValidation(board: (Piece | null)[][], from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  
  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(board, from, piece.color);
    case 'rook':
      return getRookMoves(board, from, piece.color);
    case 'knight':
      return getKnightMoves(board, from, piece.color);
    case 'bishop':
      return getBishopMoves(board, from, piece.color);
    case 'queen':
      return getQueenMoves(board, from, piece.color);
    case 'king':
      return getKingMoves(board, from, piece.color);
    default:
      return [];
  }
}

function wouldBeInCheck(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  color: PieceColor
): boolean {
  // Create a temporary board with the move applied
  const tempBoard = board.map(row => [...row]);
  tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
  tempBoard[from.row][from.col] = null;
  
  const kingPos = findKing(tempBoard, color);
  if (!kingPos) return true;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(tempBoard, kingPos, opponentColor);
}

export function isInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos, opponentColor);
}

export function isCheckmate(board: (Piece | null)[][], color: PieceColor): boolean {
  if (!isInCheck(board, color)) return false;
  
  // Check if any piece can make a legal move
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        if (moves.length > 0) return false;
      }
    }
  }
  
  return true;
}

export function isStalemate(board: (Piece | null)[][], color: PieceColor): boolean {
  if (isInCheck(board, color)) return false;
  
  // Check if any piece can make a legal move
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        if (moves.length > 0) return false;
      }
    }
  }
  
  return true;
}

export function getMoveNotation(from: Position, to: Position, piece: Piece, captured?: Piece, isCastling?: boolean, isEnPassant?: boolean): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const toSquare = files[to.col] + (8 - to.row);
  
  // Castling notation
  if (isCastling) {
    return to.col === 6 ? 'O-O' : 'O-O-O';
  }
  
  let notation = '';
  
  if (piece.type !== 'pawn') {
    notation += piece.type[0].toUpperCase();
  }
  
  if (captured || isEnPassant) {
    if (piece.type === 'pawn') {
      notation += files[from.col];
    }
    notation += 'x';
  }
  
  notation += toSquare;
  
  if (isEnPassant) {
    notation += ' e.p.';
  }
  
  return notation;
}

export function isCastlingMove(from: Position, to: Position, piece: Piece): boolean {
  return piece.type === 'king' && Math.abs(to.col - from.col) === 2;
}

export function isEnPassantMove(board: (Piece | null)[][], from: Position, to: Position, piece: Piece, lastMove?: Move): boolean {
  if (piece.type !== 'pawn') return false;
  
  const direction = piece.color === 'white' ? -1 : 1;
  const forward = from.row + direction;
  
  // Moving diagonally to an empty square
  if (to.row === forward && Math.abs(to.col - from.col) === 1 && !board[to.row][to.col]) {
    if (lastMove && lastMove.piece.type === 'pawn' &&
        Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
        lastMove.to.row === from.row &&
        lastMove.to.col === to.col) {
      return true;
    }
  }
  
  return false;
}
