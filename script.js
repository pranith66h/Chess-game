// Chess piece Unicode symbols
const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

// Initial board position (FEN notation - piece placement)
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

let board = [];
let selectedSquare = null;
let currentTurn = 'white';
let gameOver = false;

function initBoard() {
  board = [];
  const rows = START_FEN.split('/');
  
  for (let row = 0; row < 8; row++) {
    board[row] = [];
    let col = 0;
    for (const char of rows[row]) {
      if (/\d/.test(char)) {
        const empty = parseInt(char);
        for (let i = 0; i < empty; i++) {
          board[row][col++] = null;
        }
      } else {
        board[row][col++] = char;
      }
    }
  }
}

function renderBoard() {
  const boardEl = document.getElementById('chessboard');
  boardEl.innerHTML = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        const pieceEl = document.createElement('span');
        pieceEl.className = `piece ${piece === piece.toUpperCase() ? 'white' : 'black'}`;
        pieceEl.textContent = PIECES[piece];
        square.appendChild(pieceEl);
      }

      square.addEventListener('click', () => handleSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }
}

function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const isWhite = piece === piece.toUpperCase();
  if ((isWhite && currentTurn !== 'white') || (!isWhite && currentTurn !== 'black')) {
    return [];
  }

  const moves = [];
  const pieceLower = piece.toLowerCase();

  const addMove = (r, c, capture = false) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return;
    const target = board[r][c];
    const isTargetFriendly = target && (target === target.toUpperCase()) === isWhite;
    if (!isTargetFriendly) moves.push({ row: r, col: c });
  };

  const addLine = (dr, dc) => {
    for (let r = row + dr, c = col + dc; r >= 0 && r < 8 && c >= 0 && c < 8; r += dr, c += dc) {
      const target = board[r][c];
      if (target) {
        if ((target === target.toUpperCase()) !== isWhite) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
    }
  };

  switch (pieceLower) {
    case 'r':
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => addLine(dr, dc));
      break;
    case 'b':
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLine(dr, dc));
      break;
    case 'q':
      [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLine(dr, dc));
      break;
    case 'n':
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
      break;
    case 'k':
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) addMove(row + dr, col + dc);
      break;
    case 'p':
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      if (!board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        if (row === startRow && !board[row + 2 * dir][col])
          moves.push({ row: row + 2 * dir, col });
      }
      if (board[row + dir]?.[col - 1] && (board[row + dir][col - 1] === board[row + dir][col - 1].toUpperCase()) !== isWhite)
        moves.push({ row: row + dir, col: col - 1 });
      if (board[row + dir]?.[col + 1] && (board[row + dir][col + 1] === board[row + dir][col + 1].toUpperCase()) !== isWhite)
        moves.push({ row: row + dir, col: col + 1 });
      break;
  }

  return moves;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  // Pawn promotion
  const pieceLower = piece.toLowerCase();
  if (pieceLower === 'p' && (toRow === 0 || toRow === 7)) {
    board[toRow][toCol] = piece === piece.toUpperCase() ? 'Q' : 'q';
  }

  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  updateStatus();
}

function isInCheck(color) {
  let kingPos = null;
  const king = color === 'white' ? 'K' : 'k';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';
  const origTurn = currentTurn;
  currentTurn = opponentColor;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && (p === p.toUpperCase()) !== (color === 'white')) {
        const moves = getValidMoves(r, c);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          currentTurn = origTurn;
          return true;
        }
      }
    }
  }

  currentTurn = origTurn;
  return false;
}

function getLegalMoves(row, col) {
  const moves = getValidMoves(row, col);
  const piece = board[row][col];
  const legal = [];

  for (const m of moves) {
    const captured = board[m.row][m.col];
    board[m.row][m.col] = piece;
    board[row][col] = null;
    const color = piece === piece.toUpperCase() ? 'white' : 'black';
    if (!isInCheck(color)) legal.push(m);
    board[row][col] = piece;
    board[m.row][m.col] = captured;
  }

  return legal;
}

function hasLegalMoves(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && (p === p.toUpperCase()) === (color === 'white')) {
        if (getLegalMoves(r, c).length > 0) return true;
      }
    }
  }
  return false;
}

function updateStatus() {
  const statusEl = document.querySelector('.game-status');
  const turnEl = document.querySelector('.turn-indicator');
  statusEl.className = 'game-status';

  if (gameOver) return;

  const inCheck = isInCheck(currentTurn);
  const hasMoves = hasLegalMoves(currentTurn);

  if (inCheck && !hasMoves) {
    gameOver = true;
    const winner = currentTurn === 'white' ? 'Black' : 'White';
    statusEl.textContent = `Checkmate! ${winner} wins!`;
    statusEl.classList.add('checkmate');
    turnEl.textContent = 'Game Over';
  } else if (!inCheck && !hasMoves) {
    gameOver = true;
    statusEl.textContent = 'Stalemate! Draw.';
    statusEl.classList.add('stalemate');
    turnEl.textContent = 'Game Over';
  } else {
    turnEl.textContent = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} to move`;
    if (inCheck) {
      statusEl.textContent = 'Check!';
      statusEl.classList.add('check');
    } else {
      statusEl.textContent = '';
    }
  }
}

function handleSquareClick(row, col) {
  if (gameOver) return;

  clearHighlights();

  if (selectedSquare) {
    const legalMoves = getLegalMoves(selectedSquare.row, selectedSquare.col);
    const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);

    if (isLegalMove) {
      movePiece(selectedSquare.row, selectedSquare.col, row, col);
      renderBoard();
      selectedSquare = null;
      return;
    }

    selectedSquare = null;
  }

  const piece = board[row][col];
  if (piece) {
    const isWhite = piece === piece.toUpperCase();
    if ((isWhite && currentTurn === 'white') || (!isWhite && currentTurn === 'black')) {
      selectedSquare = { row, col };
      const squares = document.querySelectorAll('.square');
      const idx = row * 8 + col;
      squares[idx].classList.add('selected');

      const legalMoves = getLegalMoves(row, col);
      for (const m of legalMoves) {
        const i = m.row * 8 + m.col;
        squares[i].classList.add('valid-move');
        if (board[m.row][m.col]) squares[i].classList.add('has-piece');
      }
    }
  }
}

function clearHighlights() {
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('selected', 'valid-move', 'has-piece');
  });
}

function newGame() {
  initBoard();
  selectedSquare = null;
  currentTurn = 'white';
  gameOver = false;
  document.querySelector('.game-status').textContent = '';
  document.querySelector('.game-status').className = 'game-status';
  updateStatus();
  renderBoard();
}

document.getElementById('newGame').addEventListener('click', newGame);

initBoard();
renderBoard();
updateStatus();
