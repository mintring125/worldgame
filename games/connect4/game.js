// 커넥트 포 게임 로직
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const CELESTE = 1;
const SALLY = 2;

let board = [];
let currentPlayer = CELESTE;
let isGameOver = false;

function initGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    currentPlayer = CELESTE;
    isGameOver = false;
    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
    lastPlacedPiece = null;
}

// 새로 놓은 돌 위치 추적
let lastPlacedPiece = null;

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.col = col;

            if (board[row][col] !== EMPTY) {
                const disk = document.createElement('div');
                disk.className = `disk ${board[row][col] === CELESTE ? 'celeste' : 'sally'}`;

                // 새로 놓은 돌에만 애니메이션 적용
                if (lastPlacedPiece && lastPlacedPiece.row === row && lastPlacedPiece.col === col) {
                    disk.classList.add('new-piece');
                }

                cell.appendChild(disk);
            }

            cell.addEventListener('click', () => handleClick(col));
            boardEl.appendChild(cell);
        }
    }
}

function handleClick(col) {
    if (isGameOver) return;

    // 빈 행 찾기 (아래에서부터)
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) {
            row = r;
            break;
        }
    }

    if (row === -1) return; // 열이 가득 참

    board[row][col] = currentPlayer;
    lastPlacedPiece = { row, col };  // 새 돌 위치 저장
    playDropSound();

    renderBoard();

    // 승리 체크
    const winner = checkWinner(row, col);
    if (winner) {
        highlightWinningCells(winner);
        setTimeout(() => endGame(currentPlayer), 500);
        return;
    }

    // 무승부 체크
    if (isBoardFull()) {
        setTimeout(() => endGame(0), 500);
        return;
    }

    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
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
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                cells.push([r, c]);
                r += dr;
                c += dc;
            }
        }

        if (cells.length >= 4) {
            return cells;
        }
    }

    return null;
}

function highlightWinningCells(cells) {
    const boardEl = document.getElementById('board');
    cells.forEach(([row, col]) => {
        const index = row * COLS + col;
        const disk = boardEl.children[index].querySelector('.disk');
        if (disk) disk.classList.add('winning');
    });
}

function isBoardFull() {
    return board[0].every(cell => cell !== EMPTY);
}

function updateUI() {
    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';
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

    if (winner === CELESTE) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else if (winner === SALLY) {
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
        const winnerName = winner === CELESTE ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
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

function playDropSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 300;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
