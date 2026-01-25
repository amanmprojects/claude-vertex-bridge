class ChessAI {
    constructor(difficulty = 3) {
        this.difficulty = difficulty;
        this.pieceValues = {
            [PIECES.PAWN]: 100,
            [PIECES.KNIGHT]: 300,
            [PIECES.BISHOP]: 300,
            [PIECES.ROOK]: 500,
            [PIECES.QUEEN]: 900,
            [PIECES.KING]: 0
        };
    }

    evaluateBoard(board) {
        if (board.isCheckmate(BLACK)) return 10000;
        if (board.isCheckmate(WHITE)) return -10000;
        if (board.isStalemate(BLACK) || board.isStalemate(WHITE)) return 0;

        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board.getPiece(row, col);
                if (piece) {
                    const pieceValue = this.getPieceValue(piece, row, col, board);
                    score += piece.color === BLACK ? pieceValue : -pieceValue;
                }
            }
        }

        return score;
    }

    getPieceValue(piece, row, col, board) {
        let value = this.pieceValues[piece.type];

        if (piece.type === PIECES.PAWN) {
            value += this.getPawnPositionValue(row, col, piece.color);
        } else if (piece.type === PIECES.KNIGHT) {
            value += this.getKnightPositionValue(row, col);
        } else if (piece.type === PIECES.BISHOP) {
            value += this.getBishopPositionValue(row, col);
        } else if (piece.type === PIECES.ROOK) {
            value += this.getRookPositionValue(row, col);
        } else if (piece.type === PIECES.QUEEN) {
            value += this.getQueenPositionValue(row, col);
        } else if (piece.type === PIECES.KING) {
            value += this.getKingPositionValue(row, col, piece.color, board);
        }

        return value;
    }

    getPawnPositionValue(row, col, color) {
        const pawnTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];

        const adjustedRow = color === WHITE ? row : 7 - row;
        return pawnTable[adjustedRow][col];
    }

    getKnightPositionValue(row, col) {
        const knightTable = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];

        return knightTable[row][col];
    }

    getBishopPositionValue(row, col) {
        const bishopTable = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];

        return bishopTable[row][col];
    }

    getRookPositionValue(row, col) {
        const rookTable = [
            [0,  0,  0,  5,  5,  0,  0,  0],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];

        return rookTable[row][col];
    }

    getQueenPositionValue(row, col) {
        const queenTable = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  5,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,   0,  5,  5,  5,  5,  0, -5],
            [0,    0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ];

        return queenTable[row][col];
    }

    getKingPositionValue(row, col, color, board) {
        const kingTable = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ];

        const kingEndgameTable = [
            [-50,-40,-30,-20,-20,-30,-40,-50],
            [-30,-20,-10,  0,  0,-10,-20,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-30,  0,  0,  0,  0,-30,-30],
            [-50,-30,-30,-30,-30,-30,-30,-50]
        ];

        const isEndgame = this.isEndgame(board);
        const table = isEndgame ? kingEndgameTable : kingTable;
        const adjustedRow = color === WHITE ? row : 7 - row;

        return table[adjustedRow][col];
    }

    isEndgame(board) {
        let whiteQueens = 0, blackQueens = 0;
        let whiteMinorPieces = 0, blackMinorPieces = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board.getPiece(row, col);
                if (piece) {
                    if (piece.type === PIECES.QUEEN) {
                        if (piece.color === WHITE) whiteQueens++;
                        else blackQueens++;
                    } else if ([PIECES.KNIGHT, PIECES.BISHOP].includes(piece.type)) {
                        if (piece.color === WHITE) whiteMinorPieces++;
                        else blackMinorPieces++;
                    }
                }
            }
        }

        return whiteQueens === 0 && blackQueens === 0 &&
               whiteMinorPieces <= 2 && blackMinorPieces <= 2;
    }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || board.gameOver) {
            return this.evaluateBoard(board);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            const moves = this.getAllPossibleMoves(board, BLACK);

            if (moves.length === 0) {
                return this.evaluateBoard(board);
            }

            for (const move of moves) {
                const newBoard = this.simulateMove(board, move);
                const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);

                if (beta <= alpha) {
                    break;
                }
            }

            return maxEval;
        } else {
            let minEval = Infinity;
            const moves = this.getAllPossibleMoves(board, WHITE);

            if (moves.length === 0) {
                return this.evaluateBoard(board);
            }

            for (const move of moves) {
                const newBoard = this.simulateMove(board, move);
                const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);

                if (beta <= alpha) {
                    break;
                }
            }

            return minEval;
        }
    }

    getAllPossibleMoves(board, color) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board.getPiece(row, col);
                if (piece && piece.color === color) {
                    const legalMoves = board.getLegalMoves(row, col);
                    for (const move of legalMoves) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece.type
                        });
                    }
                }
            }
        }

        return moves;
    }

    simulateMove(board, move) {
        const newBoard = board.clone();
        newBoard.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
        return newBoard;
    }

    getBestMove(board) {
        let bestMove = null;
        let bestValue = -Infinity;
        const moves = this.getAllPossibleMoves(board, BLACK);

        if (moves.length === 0) return null;

        for (const move of moves) {
            const newBoard = this.simulateMove(board, move);
            const moveValue = this.minimax(newBoard, this.difficulty - 1, -Infinity, Infinity, false);

            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }

        return bestMove;
    }
}