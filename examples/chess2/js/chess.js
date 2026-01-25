class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.initializeBoard();
    }

    initializeBoard() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
    }

    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: pieceOrder[i], color: 'black' };
            board[1][i] = { type: 'pawn', color: 'black' };
            board[6][i] = { type: 'pawn', color: 'white' };
            board[7][i] = { type: pieceOrder[i], color: 'white' };
        }
        
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece || piece.color !== this.currentPlayer) return false;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const isValidMove = validMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (!isValidMove) return false;

        this.executeMove(fromRow, fromCol, toRow, toCol);
        
        if (this.isCheckmate(this.currentPlayer === 'white' ? 'black' : 'white')) {
            this.gameOver = true;
            return 'checkmate';
        } else if (this.isStalemate(this.currentPlayer === 'white' ? 'black' : 'white')) {
            this.gameOver = true;
            return 'stalemate';
        } else if (this.isInCheck(this.currentPlayer === 'white' ? 'black' : 'white')) {
            return 'check';
        }

        return true;
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        const moveData = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null,
            specialMove: null,
            previousState: {
                castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
                enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null
            }
        };

        if (capturedPiece) {
            this.capturedPieces[piece.color].push(capturedPiece);
        }

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        if (piece.type === 'king') {
            const rowDiff = toRow - fromRow;
            const colDiff = toCol - fromCol;
            
            if (Math.abs(colDiff) === 2) {
                moveData.specialMove = 'castling';
                if (colDiff === 2) {
                    const rook = this.board[toRow][7];
                    this.board[toRow][5] = rook;
                    this.board[toRow][7] = null;
                } else {
                    const rook = this.board[toRow][0];
                    this.board[toRow][3] = rook;
                    this.board[toRow][0] = null;
                }
            }
            this.castlingRights[piece.color] = { kingSide: false, queenSide: false };
        }

        if (piece.type === 'rook') {
            if (fromCol === 0) {
                this.castlingRights[piece.color].queenSide = false;
            } else if (fromCol === 7) {
                this.castlingRights[piece.color].kingSide = false;
            }
        }

        if (piece.type === 'pawn') {
            const rowDiff = toRow - fromRow;
            const direction = piece.color === 'white' ? -1 : 1;
            
            if (Math.abs(rowDiff) === 2) {
                this.enPassantTarget = { row: fromRow + direction, col: fromCol };
                moveData.specialMove = 'double pawn';
            } else if (this.enPassantTarget && 
                      toRow === this.enPassantTarget.row && 
                      toCol === this.enPassantTarget.col) {
                moveData.specialMove = 'en passant';
                const capturedPawn = this.board[fromRow][toCol];
                this.capturedPieces[piece.color].push(capturedPawn);
                this.board[fromRow][toCol] = null;
            } else {
                this.enPassantTarget = null;
            }

            if ((piece.color === 'white' && toRow === 0) || 
                (piece.color === 'black' && toRow === 7)) {
                this.board[toRow][toCol] = { type: 'queen', color: piece.color };
                moveData.promotion = 'queen';
            }
        } else {
            this.enPassantTarget = null;
        }

        const notation = this.getMoveNotation(moveData);
        moveData.notation = notation;
        
        this.moveHistory.push(moveData);
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        const { from, to, piece, captured, specialMove, promotion, previousState } = lastMove;

        this.board[from.row][from.col] = piece;
        this.board[to.row][to.col] = captured || null;

        if (specialMove === 'castling') {
            const castlingRow = to.row;
            if (to.col === 6) {
                const rook = this.board[castlingRow][5];
                this.board[castlingRow][7] = rook;
                this.board[castlingRow][5] = null;
            } else if (to.col === 2) {
                const rook = this.board[castlingRow][3];
                this.board[castlingRow][0] = rook;
                this.board[castlingRow][3] = null;
            }
        }

        if (specialMove === 'en passant') {
            const direction = piece.color === 'white' ? 1 : -1;
            const capturedPawn = this.capturedPieces[piece.color].pop();
            this.board[to.row + direction][to.col] = capturedPawn;
        }

        if (captured) {
            this.capturedPieces[piece.color].pop();
        }

        if (promotion) {
            this.board[from.row][from.col] = { type: 'pawn', color: piece.color };
        }

        this.castlingRights = previousState.castlingRights;
        this.enPassantTarget = previousState.enPassantTarget;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.gameOver = false;

        return true;
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        return moves.filter(move => 
            !this.wouldBeInCheck(row, col, move.row, move.col, piece.color)
        );
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        const forwardRow = row + direction;
        if (this.isOnBoard(forwardRow, col) && !this.getPiece(forwardRow, col)) {
            moves.push({ row: forwardRow, col });

            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (this.isOnBoard(forwardRow, newCol)) {
                const target = this.getPiece(forwardRow, newCol);
                if (target && target.color !== color) {
                    moves.push({ row: forwardRow, col: newCol });
                }
            }
        }

        if (this.enPassantTarget && 
            this.enPassantTarget.row === row + direction) {
            for (const dc of [-1, 1]) {
                const newCol = col + dc;
                if (newCol === this.enPassantTarget.col) {
                    const adjacentPiece = this.getPiece(row, newCol);
                    if (adjacentPiece && 
                        adjacentPiece.type === 'pawn' && 
                        adjacentPiece.color !== color) {
                        moves.push({ row: this.enPassantTarget.row, col: this.enPassantTarget.col });
                    }
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ]);
    }

    getBishopMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]);
    }

    getQueenMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]);
    }

    getSlidingMoves(row, col, color, directions) {
        const moves = [];
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isOnBoard(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }

    getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isOnBoard(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isOnBoard(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        if (!this.isInCheck(color)) {
            if (this.castlingRights[color].kingSide) {
                if (this.canCastle(row, col, true)) {
                    moves.push({ row, col: 6 });
                }
            }
            if (this.castlingRights[color].queenSide) {
                if (this.canCastle(row, col, false)) {
                    moves.push({ row, col: 2 });
                }
            }
        }

        return moves;
    }

    canCastle(row, col, kingSide) {
        const color = this.board[row][col].color;
        const rookCol = kingSide ? 7 : 0;
        const direction = kingSide ? 1 : -1;
        
        const rook = this.getPiece(row, rookCol);
        if (!rook || rook.type !== 'rook') return false;

        for (let c = col + direction; c !== rookCol; c += direction) {
            if (this.getPiece(row, c)) return false;
        }

        const passThroughCol1 = col + direction;
        const passThroughCol2 = col + 2 * direction;
        
        if (this.wouldBeInCheck(row, col, row, passThroughCol1, color)) return false;
        if (!kingSide && this.wouldBeInCheck(row, col, row, passThroughCol2, color)) return false;

        return true;
    }

    isOnBoard(row, col) {
        return row >= 0 && row <= 7 && col >= 0 && col <= 7;
    }

    isKingInCheck(color) {
        return this.isInCheck(color);
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;

        return this.isSquareAttacked(kingPos.row, kingPos.col, color);
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackingColor) {
                    const moves = this.getRawMoves(r, c);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getRawMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        switch (piece.type) {
            case 'pawn':
                return this.getPawnAttacks(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                return this.getKingMoves(row, col, piece.color);
            default:
                return [];
        }
    }

    getPawnAttacks(row, col, color) {
        const attacks = [];
        const direction = color === 'white' ? -1 : 1;

        for (const dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            
            if (this.isOnBoard(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    attacks.push({ row: newRow, col: newCol });
                }
            }
        }

        return attacks;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;

        const inCheck = this.isInCheck(color);

        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;

        return inCheck;
    }

    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return false;
                }
            }
        }
        
        return true;
    }

    isStalemate(color) {
        if (this.isInCheck(color)) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return false;
                }
            }
        }
        
        return true;
    }

    getMoveNotation(moveData) {
        const { from, to, piece, captured, specialMove } = moveData;
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        let notation = '';
        
        if (specialMove === 'castling') {
            notation = to.col === 6 ? 'O-O' : 'O-O-O';
        } else if (piece.type === 'pawn') {
            if (captured) {
                notation = files[from.col] + 'x' + files[to.col] + ranks[to.row];
            } else {
                notation = files[to.col] + ranks[to.row];
            }
            if (moveData.promotion) {
                notation += '=' + this.getPieceSymbol(moveData.promotion);
            }
        } else {
            notation += this.getPieceSymbol(piece.type);
            if (captured) {
                notation += 'x';
            }
            notation += files[to.col] + ranks[to.row];
        }

        return notation;
    }

    getPieceSymbol(type) {
        const symbols = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N',
            'pawn': ''
        };
        return symbols[type] || '';
    }

    getPieceChar(piece) {
        if (!piece) return null;
        const symbols = {
            'white': { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            'black': { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };
        return symbols[piece.color][piece.type];
    }
}
