// 도트 앤드 박스 게임 로직
const GRID_SIZE = 5; // 5x5 점 (4x4 박스)
const CELESTE = 1;
const SALLY = 2;

let horizontalLines = []; // [row][col]
let verticalLines = [];   // [row][col]
let boxes = [];           // [row][col]
let currentPlayer = CELESTE;
let scores = { 1: 0, 2: 0 };
let isGameOver = false;

function initGame() {
    // 가로선: (GRID_SIZE) 행 x (GRID_SIZE-1) 열
    horizontalLines = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(0));
    // 세로선: (GRID_SIZE-1) 행 x (GRID_SIZE) 열
    verticalLines = Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(0));
    // 박스: (GRID_SIZE-1) x (GRID_SIZE-1)
    boxes = Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(0));

    currentPlayer = CELESTE;
    scores = { 1: 0, 2: 0 };
    isGameOver = false;

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // 그리드 설정: 점-선-점-선-... 패턴
    const cols = GRID_SIZE * 2 - 1;
    board.style.gridTemplateColumns = `repeat(${cols}, auto)`;

    for (let row = 0; row < GRID_SIZE * 2 - 1; row++) {
        for (let col = 0; col < cols; col++) {
            const isRowEven = row % 2 === 0;
            const isColEven = col % 2 === 0;

            if (isRowEven && isColEven) {
                // 점
                const dot = document.createElement('div');
                dot.className = 'dot';
                board.appendChild(dot);
            } else if (isRowEven && !isColEven) {
                // 가로선
                const lineRow = Math.floor(row / 2);
                const lineCol = Math.floor(col / 2);
                const line = createLine('h', lineRow, lineCol);
                board.appendChild(line);
            } else if (!isRowEven && isColEven) {
                // 세로선
                const lineRow = Math.floor(row / 2);
                const lineCol = Math.floor(col / 2);
                const line = createLine('v', lineRow, lineCol);
                board.appendChild(line);
            } else {
                // 박스
                const boxRow = Math.floor(row / 2);
                const boxCol = Math.floor(col / 2);
                const box = document.createElement('div');
                box.className = 'box';
                if (boxes[boxRow][boxCol] === CELESTE) {
                    box.classList.add('celeste');
                    box.textContent = '🦉';
                } else if (boxes[boxRow][boxCol] === SALLY) {
                    box.classList.add('sally');
                    box.textContent = '🐑';
                }
                board.appendChild(box);
            }
        }
    }
}

function createLine(type, row, col) {
    const line = document.createElement('div');
    line.className = `line line-${type}`;

    const lines = type === 'h' ? horizontalLines : verticalLines;
    const owner = lines[row][col];

    if (owner !== 0) {
        line.classList.add('taken');
        line.classList.add(owner === CELESTE ? 'celeste' : 'sally');
    } else {
        line.addEventListener('click', () => handleLineClick(type, row, col));
    }

    return line;
}

function handleLineClick(type, row, col) {
    if (isGameOver) return;

    const lines = type === 'h' ? horizontalLines : verticalLines;
    if (lines[row][col] !== 0) return;

    lines[row][col] = currentPlayer;
    playClickSound();

    // 박스 완성 체크
    const completedBoxes = checkCompletedBoxes(type, row, col);

    if (completedBoxes > 0) {
        scores[currentPlayer] += completedBoxes;
        playScoreSound();
        // 박스를 완성하면 턴 유지
    } else {
        // 턴 교체
        currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
    }

    renderBoard();
    updateUI();

    // 게임 종료 체크
    if (isAllLinesFilled()) {
        setTimeout(() => endGame(), 300);
    }
}

function checkCompletedBoxes(type, row, col) {
    let completed = 0;

    if (type === 'h') {
        // 가로선: 위쪽 박스와 아래쪽 박스 체크
        // 위쪽 박스 (row-1, col)
        if (row > 0 && boxes[row - 1][col] === 0) {
            if (isBoxComplete(row - 1, col)) {
                boxes[row - 1][col] = currentPlayer;
                completed++;
            }
        }
        // 아래쪽 박스 (row, col)
        if (row < GRID_SIZE - 1 && boxes[row][col] === 0) {
            if (isBoxComplete(row, col)) {
                boxes[row][col] = currentPlayer;
                completed++;
            }
        }
    } else {
        // 세로선: 왼쪽 박스와 오른쪽 박스 체크
        // 왼쪽 박스 (row, col-1)
        if (col > 0 && boxes[row][col - 1] === 0) {
            if (isBoxComplete(row, col - 1)) {
                boxes[row][col - 1] = currentPlayer;
                completed++;
            }
        }
        // 오른쪽 박스 (row, col)
        if (col < GRID_SIZE - 1 && boxes[row][col] === 0) {
            if (isBoxComplete(row, col)) {
                boxes[row][col] = currentPlayer;
                completed++;
            }
        }
    }

    return completed;
}

function isBoxComplete(boxRow, boxCol) {
    // 박스의 4변 체크
    const top = horizontalLines[boxRow][boxCol];
    const bottom = horizontalLines[boxRow + 1][boxCol];
    const left = verticalLines[boxRow][boxCol];
    const right = verticalLines[boxRow][boxCol + 1];

    return top !== 0 && bottom !== 0 && left !== 0 && right !== 0;
}

function isAllLinesFilled() {
    for (let row of horizontalLines) {
        if (row.includes(0)) return false;
    }
    for (let row of verticalLines) {
        if (row.includes(0)) return false;
    }
    return true;
}

function updateUI() {
    document.getElementById('score1').textContent = scores[CELESTE];
    document.getElementById('score2').textContent = scores[SALLY];

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

function endGame() {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');
    const finalScore = document.getElementById('finalScore');

    finalScore.textContent = `부엉이 ${scores[CELESTE]} : ${scores[SALLY]} 샐리`;

    if (scores[CELESTE] > scores[SALLY]) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else if (scores[SALLY] > scores[CELESTE]) {
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
    if (scores[CELESTE] !== scores[SALLY] && typeof showVictoryVideo === 'function') {
        const winnerName = scores[CELESTE] > scores[SALLY] ? 'celeste' : 'sally';
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

function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
}

function playScoreSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [440, 554, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.1);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.1);
        });
    } catch (e) { }
}

function playWinSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784, 1047].forEach((freq, i) => {
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
