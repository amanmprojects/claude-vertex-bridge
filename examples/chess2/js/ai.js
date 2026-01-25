class ChessAI {
    constructor(game) {
        this.game = game;
        this.difficulty = 'medium';
        this.depthMap = {
            'easy': 2,
            'medium': 3,
            'hard': 4
        };
        this.pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        this.pieceSquareTables = {
            'pawn': [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            'knight': [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            'bishop': [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            'rook': [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [0,  0,  0,  5,  5,  0,  0,  0]
            ],
            'queen': [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-5,  0,  5,  5,  5,  5,  0, -5],
                [0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            'king': [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [20, 20,  0,  0,  0,  0, 20, 20],
                [20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getBestMove(color) {
        const depth = this.depthMap[this.difficulty];
        const [bestMove, score] = this.minimax(depth, -Infinity, Infinity, true, color);
        return bestMove;
    }

    minimax(depth, alpha, beta, maximizing, color) {
        if (depth === 0 || this.game.gameOver) {
            return [null, this.evaluateBoard(color)];
        }

        const allMoves = this.getAllMoves(color);
        
        if (maximizing) {
            let bestScore = -Infinity;
            let bestMove = null;

            for (const move of allMoves) {
                const { fromRow, fromCol, toRow, toCol } = move;
                const originalPiece = this.game.board[toRow][toCol];
                const movingPiece = this.game.board[fromRow][fromCol];
                
                this.game.board[toRow][toCol] = movingPiece;
                this.game.board[fromRow][fromCol] = null;

                const [, score] = this.minimax(depth - 1, alpha, beta, false, color);

                this.game.board[fromRow][fromCol] = movingPiece;
                this.game.board[toRow][toCol] = originalPiece;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }

            return [bestMove, bestScore];
        } else {
            const opponentColor = color === 'white' ? 'black' : 'white';
            let bestScore = Infinity;
            let bestMove = null;

            for (const move of allMoves) {
                const { fromRow, fromCol, toRow, toCol } = move;
                const originalPiece = this.game.board[toRow][toCol];
                const movingPiece = this.game.board[fromRow][fromCol];
                
                this.game.board[toRow][toCol] = movingPiece;
                this.game.board[fromRow][fromCol] = null;

                const [, score] = this.minimax(depth - 1, alpha, beta, true, color);

                this.game.board[fromRow][fromCol] = movingPiece;
                this.game.board[toRow][toCol] = originalPiece;

                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }

            return [bestMove, bestScore];
        }
    }

    getAllMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.game.getValidMoves(row, col);
                    for (const move of validMoves) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece
                        });
                    }
                }
            }
        }

        moves.sort((a, b) => {
            const scoreA = this.getMoveOrderingScore(a);
            const scoreB = this.getMoveOrderingScore(b);
            return scoreB - scoreA;
        });

        return moves;
    }

    getMoveOrderingScore(move) {
        let score = 0;
        const targetPiece = this.game.board[move.toRow][move.toCol];
        
        if (targetPiece) {
            score += this.pieceValues[targetPiece.type] * 10;
        }
        
        if (move.piece.type === 'pawn') {
            if ((move.piece.color === 'white' && move.toRow === 0) ||
                (move.piece.color === 'black' && move.toRow === 7)) {
                score += this.pieceValues['queen'];
            }
        }

        return score;
    }

    evaluateBoard(color) {
        let score = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece) {
                    const pieceValue = this.pieceValues[piece.type];
                    const positionValue = this.getPositionValue(piece, row, col);
                    
                    if (piece.color === color) {
                        score += pieceValue + positionValue;
                    } else {
                        score -= pieceValue + positionValue;
                    }
                }
            }
        }

        const myKingInCheck = this.game.isInCheck(color);
        const opponentKingInCheck = this.game.isInCheck(opponentColor);

        if (myKingInCheck) score -= 50;
        if (opponentKingInCheck) score += 50;

        if (this.game.isCheckmate(opponentColor)) score += 100000;
        if (this.game.isCheckmate(color)) score -= 100000;

        const myMobility = this.getMobilityScore(color);
        const opponentMobility = this.getMobilityScore(opponentColor);
        score += (myMobility - opponentMobility) * 5;

        return score;
    }

    getPositionValue(piece, row, col) {
        const table = this.pieceSquareTables[piece.type];
        if (!table) return 0;

        let adjustedRow = row;
        if (piece.color === 'black') {
            adjustedRow = 7 - row;
        }

        return table[adjustedRow][col];
    }

    getMobilityScore(color) {
        let mobility = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === color) {
                    mobility += this.game.getValidMoves(row, col).length;
                }
            }
        }

        return mobility;
    }
}
