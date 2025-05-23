const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
let board = Array(8).fill(null).map(() => Array(8).fill(null));
let current = 'black';

function inBounds(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

const directions = [
  [0,1],[1,0],[0,-1],[-1,0],
  [1,1],[-1,-1],[1,-1],[-1,1]
];

function validMove(x, y, color) {
  if (board[y][x]) return false;
  const opponent = color === 'black' ? 'white' : 'black';
  for (let [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, hasOpponent = false;
    while (inBounds(nx, ny) && board[ny][nx] === opponent) {
      nx += dx; ny += dy; hasOpponent = true;
    }
    if (hasOpponent && inBounds(nx, ny) && board[ny][nx] === color) return true;
  }
  return false;
}

function getValidMoves(color) {
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (validMove(x, y, color)) moves.push([x, y]);
    }
  }
  return moves;
}

function flipPieces(x, y, color, boardRef) {
  const boardToUse = boardRef || board;
  const opponent = color === 'black' ? 'white' : 'black';
  for (let [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, path = [];
    while (inBounds(nx, ny) && boardToUse[ny][nx] === opponent) {
      path.push([nx, ny]);
      nx += dx; ny += dy;
    }
    if (path.length && inBounds(nx, ny) && boardToUse[ny][nx] === color) {
      for (let [fx, fy] of path) boardToUse[fy][fx] = color;
    }
  }
}

function place(x, y) {
  if (!validMove(x, y, current)) return;
  board[y][x] = current;
  flipPieces(x, y, current);
  current = current === 'black' ? 'white' : 'black';
  renderBoard();
  if (getValidMoves(current).length === 0) {
    current = current === 'black' ? 'white' : 'black';
    if (getValidMoves(current).length === 0) endGame();
  }
  if (current === 'white') setTimeout(aiMove, 300);
}

function evaluate(board) {
  let b = 0, w = 0;
  board.flat().forEach(c => { if (c === 'black') b++; else if (c === 'white') w++; });
  return w - b;
}

function cloneBoard(original) {
  return original.map(row => row.slice());
}

function simulateMove(boardState, x, y, color) {
  const newBoard = cloneBoard(boardState);
  newBoard[y][x] = color;
  flipPieces(x, y, color, newBoard);
  return newBoard;
}

function minimax(boardState, depth, maximizingPlayer) {
  const color = maximizingPlayer ? 'white' : 'black';

  if (depth === 0) return [evaluate(boardState), null];

  const moves = getValidMovesForColor(boardState, color);
  if (moves.length === 0) return [evaluate(boardState), null];

  let bestValue = maximizingPlayer ? -Infinity : Infinity;
  let bestMove = null;

  for (const [x, y] of moves) {
    const newBoard = simulateMove(boardState, x, y, color);
    const [val] = minimax(newBoard, depth - 1, !maximizingPlayer);
    if ((maximizingPlayer && val > bestValue) || (!maximizingPlayer && val < bestValue)) {
      bestValue = val;
      bestMove = [x, y];
    }
  }

  return [bestValue, bestMove];
}

function getValidMovesForColor(boardState, color) {
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!boardState[y][x] && validMove(x, y, color)) {
        moves.push([x, y]);
      }
    }
  }
  return moves;
}

function aiMove() {
  const [_, bestMove] = minimax(board, 3, true);
  if (bestMove) {
    const [x, y] = bestMove;
    place(x, y);
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement('div');
      div.classList.add('cell');
      if (cell) div.classList.add(cell);
      else if (validMove(x, y, current) && current === 'black') {
        div.style.boxShadow = 'inset 0 0 0 2px yellow';
      }
      div.addEventListener('click', () => {
        if (current === 'black') place(x, y);
      });
      boardEl.appendChild(div);
    });
  });
  statusEl.textContent = `輪到：${current === 'black' ? '黑棋（你）' : '白棋（AI）'}`;
}

function endGame() {
  let b = 0, w = 0;
  board.flat().forEach(c => { if (c === 'black') b++; else if (c === 'white') w++; });
  statusEl.textContent = `遊戲結束：黑棋 ${b} : 白棋 ${w}`;
}

board[3][3] = board[4][4] = 'white';
board[3][4] = board[4][3] = 'black';
renderBoard();
