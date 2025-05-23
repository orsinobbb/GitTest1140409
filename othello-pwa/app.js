

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const difficultyEl = document.createElement('select');
difficultyEl.innerHTML = `
  <option value="2">難度：簡單</option>
  <option value="4" selected>難度：中等</option>
  <option value="6">難度：困難</option>
  <option value="99">難度：進階AI</option>
`;
document.body.insertBefore(difficultyEl, boardEl);
let aiDifficulty = parseInt(difficultyEl.value);
difficultyEl.onchange = () => {
  aiDifficulty = parseInt(difficultyEl.value);
};

let board = Array(8).fill(null).map(() => Array(8).fill(null));
let current = 'black';

const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
const bad_diagonals = [[1, 1], [1, 6], [6, 1], [6, 6]];
const edge_exclude_corner = (x, y) =>
  ((x === 0 || x === 7) && y > 1 && y < 6) ||
  ((y === 0 || y === 7) && x > 1 && x < 6);
const near_edges = [[0, 1], [1, 0], [1, 7], [0, 6], [6, 0], [7, 1], [6, 7], [7, 6]];
function inBounds(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

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
function alphabeta(boardState, depth, alpha, beta, maximizingPlayer) {
  const color = maximizingPlayer ? 'white' : 'black';
  if (depth === 0) return [evaluate(boardState), null];

  const moves = getValidMovesForColor(boardState, color);
  if (moves.length === 0) return [evaluate(boardState), null];

  let bestMove = null;

  for (const [x, y] of moves) {
    const newBoard = simulateMove(boardState, x, y, color);
    const [val] = alphabeta(newBoard, depth - 1, alpha, beta, !maximizingPlayer);

    if (maximizingPlayer) {
      if (val > alpha) {
        alpha = val;
        bestMove = [x, y];
      }
      if (alpha >= beta) break;
    } else {
      if (val < beta) {
        beta = val;
        bestMove = [x, y];
      }
      if (alpha >= beta) break;
    }
  }

  return [maximizingPlayer ? alpha : beta, bestMove];
}

function selectAdvancedMove(moves) {
  for (let [x, y] of moves) {
    if (corners.some(([cx, cy]) => cx === x && cy === y)) return [x, y];
  }
  for (let [x, y] of moves) {
    if (edge_exclude_corner(x, y)) return [x, y];
  }
  const filtered = moves.filter(([x, y]) =>
    !bad_diagonals.some(([bx, by]) => bx === x && by === y) &&
    !near_edges.some(([ex, ey]) => ex === x && ey === y)
  );
  return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : moves[0];
}

function aiMove() {
  const moves = getValidMoves('white');
  if (moves.length === 0) return;

  if (aiDifficulty === 99) {
    const [x, y] = selectAdvancedMove(moves);
    place(x, y);
  } else {
    const [_, bestMove] = alphabeta(board, aiDifficulty, -Infinity, Infinity, true);
    if (bestMove) place(...bestMove);
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
