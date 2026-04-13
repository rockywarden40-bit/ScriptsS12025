import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import {
  createInitialBoard,
  getPossibleMoves,
  isValidMove,
  isInCheck,
  isCheckmate,
  isStalemate,
  getMoveNotation,
  isCastlingMove,
  isEnPassantMove,
  PIECE_SYMBOLS,
  type Piece,
  type Position,
  type PieceColor,
  type Move,
} from '@/lib/chess';

export function ChessBoard() {
  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameOver, setGameOver] = useState<string | null>(null);

  useEffect(() => {
    if (isCheckmate(board, currentTurn)) {
      const winner = currentTurn === 'white' ? 'Black' : 'White';
      setGameOver(`Checkmate! ${winner} wins!`);
    } else if (isStalemate(board, currentTurn)) {
      setGameOver('Stalemate! Draw.');
    }
  }, [board, currentTurn]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;

    const clickedPiece = board[row][col];

    // If a piece is already selected
    if (selectedSquare) {
      const from = selectedSquare;
      const to = { row, col };

      const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : undefined;

      // Try to move
      if (isValidMove(board, from, to, currentTurn, lastMove)) {
        const piece = board[from.row][from.col]!;
        const captured = board[to.row][to.col];
        
        // Make the move
        const newBoard = board.map(r => [...r]);
        
        // Check for special moves
        const castling = isCastlingMove(from, to, piece);
        const enPassant = isEnPassantMove(board, from, to, piece, lastMove);
        
        // Handle castling - move both king and rook
        if (castling) {
          newBoard[to.row][to.col] = { ...piece, hasMoved: true };
          newBoard[from.row][from.col] = null;
          
          // Move the rook
          if (to.col === 6) { // Kingside
            newBoard[to.row][5] = { ...newBoard[to.row][7]!, hasMoved: true };
            newBoard[to.row][7] = null;
          } else { // Queenside
            newBoard[to.row][3] = { ...newBoard[to.row][0]!, hasMoved: true };
            newBoard[to.row][0] = null;
          }
        } else if (enPassant) {
          // Handle en passant - remove the captured pawn
          newBoard[to.row][to.col] = { ...piece, hasMoved: true };
          newBoard[from.row][from.col] = null;
          newBoard[from.row][to.col] = null; // Remove the captured pawn
        } else {
          // Normal move
          newBoard[to.row][to.col] = { ...piece, hasMoved: true };
          newBoard[from.row][from.col] = null;
        }

        const move: Move = {
          from,
          to,
          piece,
          captured: captured || (enPassant ? board[from.row][to.col]! : undefined),
          notation: getMoveNotation(from, to, piece, captured || (enPassant ? board[from.row][to.col]! : undefined), castling, enPassant),
          isCastling: castling,
          isEnPassant: enPassant,
        };

        setBoard(newBoard);
        setMoveHistory([...moveHistory, move]);
        setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // If clicking on own piece, select it instead
      if (clickedPiece && clickedPiece.color === currentTurn) {
        setSelectedSquare({ row, col });
        setValidMoves(getPossibleMoves(board, { row, col }, moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : undefined));
        return;
      }

      // Deselect
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // Select a piece
    if (clickedPiece && clickedPiece.color === currentTurn) {
      setSelectedSquare({ row, col });
      setValidMoves(getPossibleMoves(board, { row, col }, moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : undefined));
    }
  };

  const handleNewGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('white');
    setMoveHistory([]);
    setGameOver(null);
  };

  const isSquareSelected = (row: number, col: number) =>
    selectedSquare?.row === row && selectedSquare?.col === col;

  const isValidMoveSquare = (row: number, col: number) =>
    validMoves.some(move => move.row === row && move.col === col);

  const isLightSquare = (row: number, col: number) => (row + col) % 2 === 0;

  const inCheck = isInCheck(board, currentTurn);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-6xl mx-auto p-4">
      {/* Chess Board */}
      <div className="flex flex-col gap-4">
        <Card className="p-6">
          <div className="grid grid-cols-8 gap-0 w-full aspect-square max-w-[600px] mx-auto border-4 border-primary rounded-lg overflow-hidden shadow-2xl">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = isLightSquare(rowIndex, colIndex);
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isValid = isValidMoveSquare(rowIndex, colIndex);
                const isKingInCheck = piece?.type === 'king' && piece.color === currentTurn && inCheck;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    className={`
                      relative aspect-square flex items-center justify-center text-4xl sm:text-5xl md:text-6xl
                      transition-all duration-200 cursor-pointer hover:brightness-110
                      ${isLight ? 'bg-[hsl(var(--chess-light))]' : 'bg-[hsl(var(--chess-dark))]'}
                      ${isSelected ? 'ring-4 ring-[hsl(var(--chess-selected))] ring-inset brightness-110' : ''}
                      ${isKingInCheck ? 'bg-[hsl(var(--chess-check))] animate-pulse' : ''}
                    `}
                  >
                    {piece && (
                      <span className={`select-none ${piece.color === 'white' ? 'drop-shadow-lg' : ''}`}>
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}
                    {isValid && (
                      <div className={`
                        absolute w-3 h-3 rounded-full bg-[hsl(var(--chess-valid-move))]
                        ${piece ? 'ring-4 ring-[hsl(var(--chess-valid-move))] ring-inset w-full h-full opacity-30' : 'opacity-60'}
                      `} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Turn Indicator & Controls */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${currentTurn === 'white' ? 'bg-white border-2 border-foreground' : 'bg-foreground'}`} />
              <span className="font-semibold text-lg">
                {gameOver ? gameOver : `${currentTurn === 'white' ? 'White' : 'Black'}'s Turn`}
                {inCheck && !gameOver && ' - Check!'}
              </span>
            </div>
            <Button onClick={handleNewGame} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
          </div>
        </Card>
      </div>

      {/* Move History */}
      <Card className="p-6 w-full lg:w-80 max-h-[600px] flex flex-col">
        <h2 className="text-xl font-bold mb-4">Move History</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {moveHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No moves yet</p>
          ) : (
            moveHistory.map((move, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  index % 2 === 0 ? 'bg-muted' : 'bg-background'
                }`}
              >
                <span className="font-mono font-semibold mr-2">
                  {Math.floor(index / 2) + 1}.
                  {index % 2 === 0 ? '' : '..'}
                </span>
                <span className="font-mono">{move.notation}</span>
                <span className="ml-2 text-muted-foreground">
                  {PIECE_SYMBOLS[move.piece.color][move.piece.type]}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
