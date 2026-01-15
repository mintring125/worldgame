// 오목 게임 로직
const SIZE = 13;
const EMPTY = 0;
const BLACK = 1; // 부엉이
const WHITE = 2; // 샐리

let board = [];
let currentPlayer = BLACK;
let isGameOver = false;

function initGame() {
    board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(EMPTY));
    currentPlayer = BLACK;
    isGameOver = false;
    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (board[row][col] !== EMPTY) {
                const stone = document.createElement('div');
                stone.className = `stone ${board[row][col] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(stone);
            }

            cell.addEventListener('click', () => handleClick(row, col));
            boardEl.appendChild(cell);
        }
    }
}

function handleClick(row, col) {
    if (isGameOver || board[row][col] !== EMPTY) return;

    board[row][col] = currentPlayer;
    playPlaceSound();
    renderBoard();

    const winningCells = checkWinner(row, col);
    if (winningCells) {
        highlightWinning(winningCells);
        setTimeout(() => endGame(currentPlayer), 400);
        return;
    }

    // 무승부 체크
    if (isBoardFull()) {
        setTimeout(() => endGame(0), 400);
        return;
    }

    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateUI();
}

function checkWinner(row, col) {
    const player = board[row][col];
    const directions = [
        [[0, 1], [0, -1]],   // 가로
        [[1, 0], [-1, 0]],   // 세로
        [[1, 1], [-1, -1]],  // 대각선 \
        [[1, -1], [-1, 1]]   // 대각선 /
    ];

    for (const [dir1, dir2] of directions) {
        let cells = [[row, col]];

        for (const [dr, dc] of [dir1, dir2]) {
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
                cells.push([r, c]);
                r += dr;
                c += dc;
            }
        }

        if (cells.length >= 5) {
            return cells.slice(0, 5); // 승리 돌 5개만 반환
        }
    }

    return null;
}

function highlightWinning(cells) {
    const boardEl = document.getElementById('board');
    cells.forEach(([r, c]) => {
        const idx = r * SIZE + c;
        const stone = boardEl.children[idx].querySelector('.stone');
        if (stone) stone.classList.add('winning');
    });
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== EMPTY));
}

function updateUI() {
    document.getElementById('player1').classList.toggle('active', currentPlayer === BLACK && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === WHITE && !isGameOver);

    if (!isGameOver) {
        const name = currentPlayer === BLACK ? '부엉이' : '샐리';
        const emoji = currentPlayer === BLACK ? '🦉' : '🐑';
        updateMessage(`${name}의 차례입니다! ${emoji}`);
    }
}

function updateMessage(msg) {
    document.getElementById('messageArea').textContent = msg;
}

function endGame(winner) {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');

    if (winner === BLACK) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else if (winner === WHITE) {
        winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        winnerText.textContent = '🎉 샐리 승리! 🎉';
    } else {
        winnerAvatar.innerHTML = '🤝';
        winnerText.textContent = '무승부!';
    }

    modal.classList.add('show');
    createConfetti();
    playWinSound();

    // 승리 동영상 표시 (무승부가 아닌 경우에만)
    if (winner !== 0 && typeof showVictoryVideo === 'function') {
        const winnerName = winner === BLACK ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

function closeModal() {
    document.getElementById('gameOverModal').classList.remove('show');
}

function createConfetti() {
    const container = document.getElementById('confetti');
    container.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];

    for (let i = 0; i < 35; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(confetti);
    }
}

function playPlaceSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
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
            gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.15);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.15);
        });
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', initGame);
