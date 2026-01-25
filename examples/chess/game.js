class ChessGame {
    constructor() {
        this.board = new ChessBoard();
        this.ai = new ChessAI(3);
        this.selectedSquare = null;
        this.legalMoves = [];
        this.isAIThinking = false;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };

        this.initializeUI();
        this.renderBoard();
        this.attachEventListeners();
    }

    initializeUI() {
        this.chessBoardElement = document.getElementById('chessBoard');
        this.currentPlayerElement = document.getElementById('currentPlayer');
        this.gameMessageElement = document.getElementById('gameMessage');
        this.moveCountElement = document.getElementById('moveCount');
        this.playerColorElement = document.getElementById('playerColor');
        this.difficultyElement = document.getElementById('difficulty');
        this.capturedWhiteElement = document.getElementById('capturedWhite');
        this.capturedBlackElement = document.getElementById('capturedBlack');

        this.playerColorElement.textContent = 'White';
    }

    attachEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        this.difficultyElement.addEventListener('change', (e) => {
            this.ai.difficulty = parseInt(e.target.value);
        });
    }

    renderBoard() {
        this.chessBoardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board.getPiece(row, col);
                if (piece) {
                    square.textContent = piece.getSymbol();
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));

                this.chessBoardElement.appendChild(square);
            }
        }

        this.highlightLastMove();
        this.highlightCheck();
        this.updateUI();
    }

    highlightLastMove() {
        if (!this.board.lastMove) return;

        const squares = this.chessBoardElement.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            if ((row === this.board.lastMove.fromRow && col === this.board.lastMove.fromCol) ||
                (row === this.board.lastMove.toRow && col === this.board.lastMove.toCol)) {
                square.classList.add('last-move');
            }
        });
    }

    highlightCheck() {
        const squares = this.chessBoardElement.querySelectorAll('.square');
        squares.forEach(square => square.classList.remove('king-in-check'));

        if (this.board.isInCheck(this.board.currentPlayer)) {
            const kingPos = this.board.findKing(this.board.currentPlayer);
            if (kingPos) {
                const kingSquare = this.chessBoardElement.querySelector(
                    `.square[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`
                );
                if (kingSquare) {
                    kingSquare.classList.add('king-in-check');
                }
            }
        }
    }

    handleSquareClick(row, col) {
        if (this.isAIThinking || this.board.gameOver) return;

        if (this.selectedSquare === null) {
            this.selectSquare(row, col);
        } else if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
            this.deselectSquare();
        } else {
            this.attemptMove(row, col);
        }
    }

    selectSquare(row, col) {
        const piece = this.board.getPiece(row, col);

        if (piece && piece.color === this.board.currentPlayer) {
            this.selectedSquare = { row, col };
            this.legalMoves = this.board.getLegalMoves(row, col);

            this.clearHighlights();
            this.highlightSelectedSquare(row, col);
            this.highlightLegalMoves();
        }
    }

    deselectSquare() {
        this.selectedSquare = null;
        this.legalMoves = [];
        this.clearHighlights();
    }

    clearHighlights() {
        const squares = this.chessBoardElement.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('selected', 'legal-move', 'legal-capture');
        });
    }

    highlightSelectedSquare(row, col) {
        const square = this.chessBoardElement.querySelector(
            `.square[data-row="${row}"][data-col="${col}"]`
        );
        if (square) {
            square.classList.add('selected');
        }
    }

    highlightLegalMoves() {
        for (const move of this.legalMoves) {
            const square = this.chessBoardElement.querySelector(
                `.square[data-row="${move.row}"][data-col="${move.col}"]`
            );
            if (square) {
                const targetPiece = this.board.getPiece(move.row, move.col);
                if (targetPiece) {
                    square.classList.add('legal-capture');
                } else {
                    square.classList.add('legal-move');
                }
            }
        }
    }

    attemptMove(row, col) {
        const isLegalMove = this.legalMoves.some(
            move => move.row === row && move.col === col
        );

        if (isLegalMove) {
            const piece = this.board.getPiece(this.selectedSquare.row, this.selectedSquare.col);
            const capturedPiece = this.board.getPiece(row, col);

            if (capturedPiece) {
                this.capturedPieces[capturedPiece.color].push(capturedPiece.getSymbol());
                this.updateCapturedPieces();
            }

            const moveSuccessful = this.board.makeMove(
                this.selectedSquare.row,
                this.selectedSquare.col,
                row,
                col
            );

            if (moveSuccessful) {
                this.moveHistory.push({
                    from: { ...this.selectedSquare },
                    to: { row, col },
                    piece: piece.type,
                    captured: capturedPiece ? capturedPiece.type : null
                });

                this.deselectSquare();
                this.renderBoard();
                this.checkGameState();

                if (!this.board.gameOver && this.board.currentPlayer === BLACK) {
                    this.makeAIMove();
                }
            }
        } else {
            this.selectSquare(row, col);
        }
    }

    async makeAIMove() {
        this.isAIThinking = true;
        this.updateUI();

        await new Promise(resolve => setTimeout(resolve, 500));

        const bestMove = this.ai.getBestMove(this.board);

        if (bestMove) {
            const piece = this.board.getPiece(bestMove.fromRow, bestMove.fromCol);
            const capturedPiece = this.board.getPiece(bestMove.toRow, bestMove.toCol);

            if (capturedPiece) {
                this.capturedPieces[capturedPiece.color].push(capturedPiece.getSymbol());
                this.updateCapturedPieces();
            }

            this.board.makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);

            this.moveHistory.push({
                from: { row: bestMove.fromRow, col: bestMove.fromCol },
                to: { row: bestMove.toRow, col: bestMove.toCol },
                piece: piece.type,
                captured: capturedPiece ? capturedPiece.type : null
            });

            this.renderBoard();
            this.checkGameState();
        }

        this.isAIThinking = false;
        this.updateUI();
    }

    checkGameState() {
        if (this.board.isCheckmate(WHITE)) {
            this.board.gameOver = true;
            this.gameMessageElement.textContent = 'Checkmate! Black wins!';
        } else if (this.board.isCheckmate(BLACK)) {
            this.board.gameOver = true;
            this.gameMessageElement.textContent = 'Checkmate! White wins!';
        } else if (this.board.isStalemate(WHITE) || this.board.isStalemate(BLACK)) {
            this.board.gameOver = true;
            this.gameMessageElement.textContent = 'Stalemate! It\'s a draw!';
        } else if (this.board.isInCheck(WHITE)) {
            this.gameMessageElement.textContent = 'White is in check!';
        } else if (this.board.isInCheck(BLACK)) {
            this.gameMessageElement.textContent = 'Black is in check!';
        } else {
            this.gameMessageElement.textContent = '';
        }
    }

    updateUI() {
        if (!this.board.gameOver) {
            this.currentPlayerElement.textContent =
                `${this.board.currentPlayer === WHITE ? 'White' : 'Black'}'s Turn`;
        }

        this.moveCountElement.textContent = this.moveHistory.length;

        if (this.isAIThinking) {
            this.currentPlayerElement.textContent = 'AI is thinking...';
        }
    }

    updateCapturedPieces() {
        this.capturedWhiteElement.innerHTML = this.capturedPieces.white
            .map(symbol => `<span class="captured-piece">${symbol}</span>`)
            .join('');
        this.capturedBlackElement.innerHTML = this.capturedPieces.black
            .map(symbol => `<span class="captured-piece">${symbol}</span>`)
            .join('');
    }

    newGame() {
        this.board = new ChessBoard();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.isAIThinking = false;
        this.renderBoard();
        this.gameMessageElement.textContent = '';
    }

    undoMove() {
        if (this.isAIThinking || this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        this.board.undoMove();

        if (this.capturedPieces.white.length > 0 && lastMove.captured) {
            const color = lastMove.piece.color;
            if (color) {
                this.capturedPieces[color].pop();
            }
        } else if (this.capturedPieces.black.length > 0 && lastMove.captured) {
            this.capturedPieces.black.pop();
        }

        this.renderBoard();
        this.gameMessageElement.textContent = '';
    }
}

const game = new ChessGame();