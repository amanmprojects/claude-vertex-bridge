const WHITE = 'white';
const BLACK = 'black';

const PIECES = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king'
};

const SYMBOLS = {
    white: {
        [PIECES.PAWN]: '♙',
        [PIECES.ROOK]: '♖',
        [PIECES.KNIGHT]: '♘',
        [PIECES.BISHOP]: '♗',
        [PIECES.QUEEN]: '♕',
        [PIECES.KING]: '♔'
    },
    black: {
        [PIECES.PAWN]: '♟',
        [PIECES.ROOK]: '♜',
        [PIECES.KNIGHT]: '♞',
        [PIECES.BISHOP]: '♝',
        [PIECES.QUEEN]: '♛',
        [PIECES.KING]: '♚'
    }
};

class ChessPiece {
    constructor(color, type) {
        this.color = color;
        this.type = type;
        this.hasMoved = false;
    }

    getSymbol() {
        return SYMBOLS[this.color][this.type];
    }
}

class ChessBoard {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.currentPlayer = WHITE;
        this.gameOver = false;
        this.moveHistory = [];
        this.lastMove = null;
        this.initializeBoard();
    }

    initializeBoard() {
        const backRank = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
                         PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];

        for (let col = 0; col < 8; col++) {
            this.board[1][col] = new ChessPiece(BLACK, PIECES.PAWN);
            this.board[6][col] = new ChessPiece(WHITE, PIECES.PAWN);
            this.board[0][col] = new ChessPiece(BLACK, backRank[col]);
            this.board[7][col] = new ChessPiece(WHITE, backRank[col]);
        }
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    setPiece(row, col, piece) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        this.board[row][col] = piece;
    }

    isEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === PIECES.KING && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;

        const opponent = color === WHITE ? BLACK : WHITE;
        return this.isSquareUnderAttack(kingPos.row, kingPos.col, opponent);
    }

    isSquareUnderAttack(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === byColor) {
                    if (this.canPieceAttack(r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    canPieceAttack(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;

        switch (piece.type) {
            case PIECES.PAWN:
                const direction = piece.color === WHITE ? -1 : 1;
                return deltaRow === direction && Math.abs(deltaCol) === 1;

            case PIECES.ROOK:
                if (deltaRow === 0 || deltaCol === 0) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case PIECES.KNIGHT:
                return (Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) ||
                       (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2);

            case PIECES.BISHOP:
                if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case PIECES.QUEEN:
                if ((deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol))) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case PIECES.KING:
                return Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1;

            default:
                return false;
        }
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;
        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);

        let currentRow = fromRow + stepRow;
        let currentCol = fromCol + stepCol;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (!this.isEmpty(currentRow, currentCol)) {
                return false;
            }
            currentRow += stepRow;
            currentCol += stepCol;
        }

        return true;
    }

    getLegalMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return [];

        const legalMoves = [];

        switch (piece.type) {
            case PIECES.PAWN:
                legalMoves.push(...this.getPawnMoves(row, col, piece));
                break;
            case PIECES.ROOK:
                legalMoves.push(...this.getRookMoves(row, col, piece));
                break;
            case PIECES.KNIGHT:
                legalMoves.push(...this.getKnightMoves(row, col, piece));
                break;
            case PIECES.BISHOP:
                legalMoves.push(...this.getBishopMoves(row, col, piece));
                break;
            case PIECES.QUEEN:
                legalMoves.push(...this.getQueenMoves(row, col, piece));
                break;
            case PIECES.KING:
                legalMoves.push(...this.getKingMoves(row, col, piece));
                break;
        }

        return legalMoves.filter(move => this.isValidMove(row, col, move.row, move.col));
    }

    getPawnMoves(row, col, piece) {
        const moves = [];
        const direction = piece.color === WHITE ? -1 : 1;
        const startRow = piece.color === WHITE ? 6 : 1;

        const oneStep = { row: row + direction, col: col };
        if (this.isValidPosition(oneStep.row, oneStep.col) && this.isEmpty(oneStep.row, oneStep.col)) {
            moves.push(oneStep);

            const twoStep = { row: row + 2 * direction, col: col };
            if (row === startRow && this.isEmpty(twoStep.row, twoStep.col)) {
                moves.push(twoStep);
            }
        }

        const captures = [
            { row: row + direction, col: col - 1 },
            { row: row + direction, col: col + 1 }
        ];

        for (const capture of captures) {
            if (this.isValidPosition(capture.row, capture.col)) {
                const target = this.getPiece(capture.row, capture.col);
                if (target && target.color !== piece.color) {
                    moves.push(capture);
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col, piece) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;

                if (!this.isValidPosition(newRow, newCol)) break;

                const target = this.getPiece(newRow, newCol);
                if (target) {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    getKnightMoves(row, col, piece) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getBishopMoves(row, col, piece) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;

                if (!this.isValidPosition(newRow, newCol)) break;

                const target = this.getPiece(newRow, newCol);
                if (target) {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    getQueenMoves(row, col, piece) {
        return [...this.getRookMoves(row, col, piece), ...this.getBishopMoves(row, col, piece)];
    }

    getKingMoves(row, col, piece) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const originalPiece = this.getPiece(toRow, toCol);
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        const inCheck = this.isInCheck(piece.color);

        this.setPiece(fromRow, fromCol, piece);
        this.setPiece(toRow, toCol, originalPiece);

        return !inCheck;
    }

    makeMove(fromRow, fromCol, toRow, toCol, promotion = PIECES.QUEEN) {
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;

        const piece = this.getPiece(fromRow, fromCol);
        const captured = this.getPiece(toRow, toCol);

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.type,
            captured: captured ? captured.type : null,
            color: piece.color
        });

        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        piece.hasMoved = true;

        if (piece.type === PIECES.PAWN && (toRow === 0 || toRow === 7)) {
            this.setPiece(toRow, toCol, new ChessPiece(piece.color, promotion));
        }

        this.lastMove = { fromRow, fromCol, toRow, toCol };
        this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;

        return true;
    }

    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getLegalMoves(row, col);
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
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getLegalMoves(row, col);
                    if (moves.length > 0) return false;
                }
            }
        }

        return true;
    }

undoMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        const piece = this.getPiece(lastMove.to.row, lastMove.to.col);

        this.setPiece(lastMove.from.row, lastMove.from.col, piece);
        this.setPiece(lastMove.to.row, lastMove.to.col, null);

        if (lastMove.captured) {
            const capturedPiece = new ChessPiece(
                lastMove.color === WHITE ? BLACK : WHITE,
                lastMove.captured
            );
            this.setPiece(lastMove.to.row, lastMove.to.col, capturedPiece);
        }

        piece.hasMoved = false;
        this.lastMove = null;

        return true;
    }

    clone() {
        const newBoard = new ChessBoard();
        newBoard.board = this.board.map(row =>
            row.map(piece => {
                if (!piece) return null;
                const newPiece = new ChessPiece(piece.color, piece.type);
                newPiece.hasMoved = piece.hasMoved;
                return newPiece;
            })
        );
        newBoard.currentPlayer = this.currentPlayer;
        newBoard.gameOver = this.gameOver;
        newBoard.moveHistory = [...this.moveHistory];
        newBoard.lastMove = this.lastMove ? { ...this.lastMove } : null;
        return newBoard;
    }
}