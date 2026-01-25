# Chess Game

A fully functional chess game with an AI opponent, implemented in HTML, CSS, and JavaScript.

## Features

- **Two Game Modes**
  - 2 Player (Local): Play against a friend on the same computer
  - Single Player (vs AI): Challenge the computer opponent

- **Complete Chess Rules**
  - All standard piece movements (King, Queen, Rook, Bishop, Knight, Pawn)
  - Move validation for legal chess moves
  - Special moves: Castling (kingside and queenside), En passant, Pawn promotion

- **Game State Detection**
  - Check detection (king under attack)
  - Checkmate detection (game ends)
  - Stalemate detection (draw)

- **Move History**
  - Complete move history with algebraic notation (e.g., e2-e4, Nf3)
  - Scrollable move list showing all game moves

- **Captured Pieces**
  - Display of pieces captured by each player

- **AI Opponent**
  - Minimax algorithm with alpha-beta pruning
  - Three difficulty levels: Easy, Medium, Hard
  - Position evaluation using piece-square tables

- **Interactive UI**
  - Realistic SVG piece graphics
  - Click-to-move interface
  - Highlighting of selected pieces and possible moves
  - Indication of last move and check status
  - Responsive design for different screen sizes

## How to Play

1. Open `index.html` in a web browser (double-click the file or drag it into your browser)

2. Select your preferred game mode:
   - "2 Player (Local)" for two human players
   - "1 Player (vs AI)" to play against the computer

3. Adjust the AI difficulty if playing vs AI:
   - Easy: Quick thinking but makes mistakes
   - Medium: Balanced challenge
   - Hard: Strong opponent with deeper analysis

4. Make moves by clicking on a piece, then clicking on a valid destination square
   - Valid moves are highlighted with blue dots
   - The last move is highlighted in yellow
   - Check status is shown with red highlighting on the king

5. Game Controls:
   - "New Game": Start a fresh game
   - "Undo Move": Take back the last move (or last two moves in AI mode)

6. The move history panel shows all moves in standard chess notation

## Technical Details

- **Board Representation**: 8x8 array with piece objects
- **Move Generation**: Validates all legal moves according to chess rules
- **AI Algorithm**: Minimax with alpha-beta pruning and iterative deepening
- **Position Evaluation**: Material balance + positional factors (piece-square tables, mobility)

## Files

- `index.html` - Main game interface
- `css/style.css` - Styling and layout
- `js/chess.js` - Core game logic and chess rules
- `js/ai.js` - AI opponent implementation
- `js/ui.js` - User interface and interaction handling
- `js/pieces/*.svg` - SVG graphics for chess pieces
