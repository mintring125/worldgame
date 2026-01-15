// 헥스 게임 로직
const BOARD_SIZE = 9;  // 9x9 보드 (작은 보드로 쉽게)
const EMPTY = 0;
const CELESTE = 1;  // 부엉이 - 위아래 연결
const SALLY = 2;    // 샐리 - 좌우 연결

let board = [];
let currentPlayer = CELESTE;
let isGameOver = false;

function initGame() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = new Array(BOARD_SIZE).fill(EMPTY);
    }

    currentPlayer = CELESTE;
    isGameOver = false;

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let row = 0; row < BOARD_SIZE; row++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'hex-row';
        rowEl.style.marginLeft = (row * 18) + 'px';  // 육각형 오프셋

        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'hex-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (board[row][col] === CELESTE) {
                cell.classList.add('celeste');
            } else if (board[row][col] === SALLY) {
                cell.classList.add('sally');
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            rowEl.appendChild(cell);
        }

        boardEl.appendChild(rowEl);
    }
}

function handleCellClick(row, col) {
    if (isGameOver) return;
    if (board[row][col] !== EMPTY) return;

    board[row][col] = currentPlayer;
    playPlaceSound();

    // 승리 체크
    if (checkWin(currentPlayer)) {
        highlightWinningPath(currentPlayer);
        setTimeout(() => endGame(currentPlayer), 500);
        return;
    }

    // 턴 전환
    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
    renderBoard();
    updateUI();
}

function checkWin(player) {
    // BFS로 연결 체크
    const visited = new Set();
    const queue = [];

    if (player === CELESTE) {
        // 위쪽 가장자리에서 시작
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[0][col] === player) {
                queue.push([0, col]);
                visited.add(`0,${col}`);
            }
        }

        // 아래쪽 가장자리 도달 체크
        while (queue.length > 0) {
            const [row, col] = queue.shift();

            if (row === BOARD_SIZE - 1) {
                return true;
            }

            for (const [nr, nc] of getNeighbors(row, col)) {
                const key = `${nr},${nc}`;
                if (!visited.has(key) && board[nr][nc] === player) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
    } else {
        // 왼쪽 가장자리에서 시작
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (board[row][0] === player) {
                queue.push([row, 0]);
                visited.add(`${row},0`);
            }
        }

        // 오른쪽 가장자리 도달 체크
        while (queue.length > 0) {
            const [row, col] = queue.shift();

            if (col === BOARD_SIZE - 1) {
                return true;
            }

            for (const [nr, nc] of getNeighbors(row, col)) {
                const key = `${nr},${nc}`;
                if (!visited.has(key) && board[nr][nc] === player) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
    }

    return false;
}

function getNeighbors(row, col) {
    // 육각형의 6개 이웃
    const directions = [
        [-1, 0],  // 위
        [-1, 1],  // 우상
        [0, -1],  // 좌
        [0, 1],   // 우
        [1, -1],  // 좌하
        [1, 0]    // 아래
    ];

    const neighbors = [];
    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            neighbors.push([nr, nc]);
        }
    }

    return neighbors;
}

function highlightWinningPath(player) {
    // 승리 경로 찾기 (BFS + 역추적)
    const visited = new Map();
    const queue = [];

    if (player === CELESTE) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[0][col] === player) {
                queue.push([0, col]);
                visited.set(`0,${col}`, null);
            }
        }

        let endCell = null;
        while (queue.length > 0 && !endCell) {
            const [row, col] = queue.shift();

            if (row === BOARD_SIZE - 1) {
                endCell = [row, col];
                break;
            }

            for (const [nr, nc] of getNeighbors(row, col)) {
                const key = `${nr},${nc}`;
                if (!visited.has(key) && board[nr][nc] === player) {
                    visited.set(key, `${row},${col}`);
                    queue.push([nr, nc]);
                }
            }
        }

        // 경로 역추적 및 하이라이트
        if (endCell) {
            let curr = `${endCell[0]},${endCell[1]}`;
            while (curr) {
                const [r, c] = curr.split(',').map(Number);
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) cell.classList.add('winning');
                curr = visited.get(curr);
            }
        }
    } else {
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (board[row][0] === player) {
                queue.push([row, 0]);
                visited.set(`${row},0`, null);
            }
        }

        let endCell = null;
        while (queue.length > 0 && !endCell) {
            const [row, col] = queue.shift();

            if (col === BOARD_SIZE - 1) {
                endCell = [row, col];
                break;
            }

            for (const [nr, nc] of getNeighbors(row, col)) {
                const key = `${nr},${nc}`;
                if (!visited.has(key) && board[nr][nc] === player) {
                    visited.set(key, `${row},${col}`);
                    queue.push([nr, nc]);
                }
            }
        }

        if (endCell) {
            let curr = `${endCell[0]},${endCell[1]}`;
            while (curr) {
                const [r, c] = curr.split(',').map(Number);
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) cell.classList.add('winning');
                curr = visited.get(curr);
            }
        }
    }
}

function endGame(winner) {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');

    if (winner === CELESTE) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else {
        winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        winnerText.textContent = '🎉 샐리 승리! 🎉';
    }

    modal.classList.add('show');
    createConfetti();
    playWinSound();

    if (typeof showVictoryVideo === 'function') {
        const winnerName = winner === CELESTE ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

function updateUI() {
    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';
        const direction = currentPlayer === CELESTE ? '위↔아래' : '왼쪽↔오른쪽';
        updateMessage(`${name}의 차례! (${direction} 연결) ${emoji}`);
    }
}

function updateMessage(msg) {
    document.getElementById('messageArea').textContent = msg;
}

function closeModal() {
    document.getElementById('gameOverModal').classList.remove('show');
}

function createConfetti() {
    const container = document.getElementById('confetti');
    container.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];

    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
        container.appendChild(confetti);
    }
}

// Sound effects
function playPlaceSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 500;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) { }
}

function playWinSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.2);
            osc.start(ctx.currentTime + i * 0.2);
            osc.stop(ctx.currentTime + i * 0.2 + 0.2);
        });
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', initGame);
