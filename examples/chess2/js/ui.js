class ChessUI {
    constructor() {
        this.game = new ChessGame();
        this.ai = new ChessAI(this.game);
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.gameMode = 'local';
        this.lastMove = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.renderBoard();
        this.updateStatus();
    }

    initializeElements() {
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status');
        this.gameOverElement = document.getElementById('gameOver');
        this.gameOverMessageElement = document.getElementById('gameOverMessage');
        this.moveHistoryElement = document.getElementById('moveHistory');
        this.blackInfoElement = document.getElementById('blackInfo');
        this.whiteInfoElement = document.getElementById('whiteInfo');
        this.blackCapturedElement = document.getElementById('blackCaptured');
        this.whiteCapturedElement = document.getElementById('whiteCaptured');
    }

    setupEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('undoMove').addEventListener('click', () => this.undoMove());
        document.getElementById('playAgain').addEventListener('click', () => this.startNewGame());
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
        });
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.ai.setDifficulty(e.target.value);
        });
    }

    startNewGame() {
        this.game.initializeBoard();
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.lastMove = null;
        this.gameOverElement.style.display = 'none';
        this.gameMode = document.getElementById('gameMode').value;
        this.ai.setDifficulty(document.getElementById('difficulty').value);
        this.renderBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                if (this.lastMove) {
                    if ((row === this.lastMove.fromRow && col === this.lastMove.fromCol) ||
                        (row === this.lastMove.toRow && col === this.lastMove.toCol)) {
                        square.classList.add('last-move');
                    }
                }
                
                if (this.selectedSquare && 
                    this.selectedSquare.row === row && 
                    this.selectedSquare.col === col) {
                    square.classList.add('selected');
                }
                
                if (this.possibleMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('possible-move');
                }
                
                const piece = this.game.getPiece(row, col);
                if (piece) {
                    const pieceElement = document.createElement('img');
                    pieceElement.className = 'piece';
                    pieceElement.src = `js/pieces/${this.game.getPieceChar(piece)}.svg`;
                    pieceElement.alt = `${piece.color} ${piece.type}`;
                    square.appendChild(pieceElement);
                }
                
                if (this.game.isInCheck(piece?.color)) {
                    const kingPos = this.game.findKing(piece?.color);
                    if (kingPos && kingPos.row === row && kingPos.col === col) {
                        square.classList.add('check');
                    }
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.boardElement.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        if (this.game.gameOver) return;
        
        if (this.gameMode === 'ai' && this.game.currentPlayer === 'black') {
            return;
        }
        
        const piece = this.game.getPiece(row, col);
        
        if (this.selectedSquare) {
            const moveResult = this.tryMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            this.selectedSquare = null;
            this.possibleMoves = [];
            
            if (moveResult) {
                if (moveResult === 'checkmate' || moveResult === 'stalemate') {
                    this.handleGameEnd(moveResult);
                }
                
                this.renderBoard();
                this.updateStatus();
                this.updateMoveHistory();
                this.updateCapturedPieces();
                
                if (this.gameMode === 'ai' && !this.game.gameOver) {
                    setTimeout(() => this.makeAIMove(), 500);
                }
            } else if (piece && piece.color === this.game.currentPlayer) {
                this.selectedSquare = { row, col };
                this.possibleMoves = this.game.getValidMoves(row, col);
                this.renderBoard();
            } else {
                this.renderBoard();
            }
        } else if (piece && piece.color === this.game.currentPlayer) {
            this.selectedSquare = { row, col };
            this.possibleMoves = this.game.getValidMoves(row, col);
            this.renderBoard();
        }
    }

    tryMove(fromRow, fromCol, toRow, toCol) {
        const isValidMove = this.possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (!isValidMove) return false;
        
        const lastMoveIndex = this.game.moveHistory.length;
        const result = this.game.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (result && this.game.moveHistory.length > lastMoveIndex) {
            this.lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
        }
        
        return result;
    }

    undoMove() {
        if (this.game.gameOver) return;
        
        if (this.gameMode === 'ai') {
            this.game.undoMove();
            this.game.undoMove();
        } else {
            this.game.undoMove();
        }
        
        this.selectedSquare = null;
        this.possibleMoves = [];
        
        if (this.game.moveHistory.length > 0) {
            this.lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
        } else {
            this.lastMove = null;
        }
        
        this.renderBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
    }

    makeAIMove() {
        const bestMove = this.ai.getBestMove('black');
        
        if (bestMove) {
            const result = this.game.makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            
            if (result && this.game.moveHistory.length > 0) {
                this.lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
            }
            
            this.selectedSquare = null;
            this.possibleMoves = [];
            
            if (result === 'checkmate' || result === 'stalemate') {
                this.handleGameEnd(result);
            }
            
            this.renderBoard();
            this.updateStatus();
            this.updateMoveHistory();
            this.updateCapturedPieces();
        }
    }

    handleGameEnd(result) {
        let message = '';
        
        if (result === 'checkmate') {
            const winner = this.game.currentPlayer === 'white' ? 'Black' : 'White';
            message = `Checkmate! ${winner} wins!`;
        } else if (result === 'stalemate') {
            message = 'Stalemate! Game is a draw.';
        }
        
        this.gameOverMessageElement.textContent = message;
        this.gameOverElement.style.display = 'block';
    }

    updateStatus() {
        if (this.game.gameOver) {
            this.statusElement.textContent = 'Game Over';
        } else {
            const player = this.game.currentPlayer === 'white' ? 'White' : 'Black';
            let status = `${player}'s turn`;
            
            if (this.game.isInCheck(this.game.currentPlayer)) {
                status += ' - Check!';
            }
            
            this.statusElement.textContent = status;
        }
        
        this.blackInfoElement.classList.toggle('active', this.game.currentPlayer === 'black' && !this.game.gameOver);
        this.whiteInfoElement.classList.toggle('active', this.game.currentPlayer === 'white' && !this.game.gameOver);
    }

    updateMoveHistory() {
        this.moveHistoryElement.innerHTML = '';
        
        const moves = this.game.moveHistory;
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            const row = document.createElement('div');
            
            const numberElement = document.createElement('div');
            numberElement.className = 'move-number';
            numberElement.textContent = `${moveNumber}.`;
            row.appendChild(numberElement);
            
            const whiteElement = document.createElement('div');
            whiteElement.className = 'move';
            if (whiteMove) {
                whiteElement.textContent = whiteMove.notation;
            }
            row.appendChild(whiteElement);
            
            const blackElement = document.createElement('div');
            blackElement.className = 'move';
            if (blackMove) {
                blackElement.textContent = blackMove.notation;
            }
            row.appendChild(blackElement);
            
            this.moveHistoryElement.appendChild(row);
        }
        
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
    }

    updateCapturedPieces() {
        const whiteCaptured = this.game.capturedPieces['white'];
        const blackCaptured = this.game.capturedPieces['black'];
        
        this.whiteCapturedElement.innerHTML = '';
        this.blackCapturedElement.innerHTML = '';
        
        for (const piece of whiteCaptured) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.game.getPieceChar(piece);
            this.blackCapturedElement.appendChild(pieceElement);
        }
        
        for (const piece of blackCaptured) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.game.getPieceChar(piece);
            this.whiteCapturedElement.appendChild(pieceElement);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessUI();
});
