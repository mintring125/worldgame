// 체커 게임 로직
const BOARD_SIZE = 8;
const EMPTY = 0;
const CELESTE = 1;      // 부엉이 (위에서 아래로)
const SALLY = 2;        // 샐리 (아래에서 위로)
const CELESTE_KING = 3;
const SALLY_KING = 4;

let board = [];
let currentPlayer = CELESTE;
let selectedPiece = null;
let validMoves = [];
let mustCapture = false;
let isGameOver = false;

function initGame() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                if (row < 3) {
                    board[row][col] = CELESTE;
                } else if (row > 4) {
                    board[row][col] = SALLY;
                } else {
                    board[row][col] = EMPTY;
                }
            } else {
                board[row][col] = EMPTY;
            }
        }
    }

    currentPlayer = CELESTE;
    selectedPiece = null;
    validMoves = [];
    mustCapture = false;
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
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 유효한 이동 표시
            const isValidMove = validMoves.some(m => m.row === row && m.col === col && !m.isCapture);
            const isCaptureMove = validMoves.some(m => m.row === row && m.col === col && m.isCapture);

            if (isValidMove) {
                cell.classList.add('valid-move');
            }
            if (isCaptureMove) {
                cell.classList.add('capture-hint');
            }

            // 선택된 셀 표시
            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                cell.classList.add('selected');
            }

            // 체커 말 배치
            const piece = board[row][col];
            if (piece !== EMPTY) {
                const checker = document.createElement('div');
                checker.className = 'checker';

                if (piece === CELESTE || piece === CELESTE_KING) {
                    checker.classList.add('celeste');
                } else {
                    checker.classList.add('sally');
                }

                if (piece === CELESTE_KING || piece === SALLY_KING) {
                    checker.classList.add('king');
                }

                if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                    checker.classList.add('selected');
                }

                cell.appendChild(checker);
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            boardEl.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    if (isGameOver) return;

    const piece = board[row][col];

    // 유효한 이동인지 확인
    const validMove = validMoves.find(m => m.row === row && m.col === col);
    if (validMove && selectedPiece) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col, validMove);
        return;
    }

    // 자신의 말을 선택했는지 확인
    if (isPlayerPiece(piece, currentPlayer)) {
        // 강제 잡기가 있으면 잡을 수 있는 말만 선택 가능
        if (mustCapture) {
            const captures = getCaptureMoves(row, col);
            if (captures.length === 0) {
                updateMessage('잡을 수 있는 말을 선택하세요! ⚠️');
                return;
            }
        }

        selectedPiece = { row, col };
        validMoves = getValidMoves(row, col);
        playClickSound();
        renderBoard();
    }
}

function isPlayerPiece(piece, player) {
    if (player === CELESTE) {
        return piece === CELESTE || piece === CELESTE_KING;
    } else {
        return piece === SALLY || piece === SALLY_KING;
    }
}

function getValidMoves(row, col) {
    const piece = board[row][col];
    const moves = [];

    // 잡기 이동 확인
    const captures = getCaptureMoves(row, col);
    if (captures.length > 0) {
        return captures;
    }

    // 강제 잡기가 있으면 일반 이동 불가
    if (mustCapture) {
        return [];
    }

    // 일반 이동
    const directions = getMoveDirections(piece);

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
            moves.push({ row: newRow, col: newCol, isCapture: false });
        }
    }

    return moves;
}

function getCaptureMoves(row, col) {
    const piece = board[row][col];
    const captures = [];
    const directions = getCaptureDirections(piece);

    for (const [dr, dc] of directions) {
        const midRow = row + dr;
        const midCol = col + dc;
        const newRow = row + dr * 2;
        const newCol = col + dc * 2;

        if (isValidPosition(newRow, newCol) &&
            board[newRow][newCol] === EMPTY &&
            isOpponentPiece(board[midRow][midCol], currentPlayer)) {
            captures.push({ row: newRow, col: newCol, isCapture: true, capturedRow: midRow, capturedCol: midCol });
        }
    }

    return captures;
}

function getMoveDirections(piece) {
    if (piece === CELESTE) {
        return [[1, -1], [1, 1]]; // 아래로만
    } else if (piece === SALLY) {
        return [[-1, -1], [-1, 1]]; // 위로만
    } else {
        // 킹은 모든 방향
        return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }
}

function getCaptureDirections(piece) {
    // 잡기는 모든 말이 4방향 가능 (킹이 아니어도)
    // 하지만 일반 체커 규칙에서는 일반 말도 뒤로 잡기 가능
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
}

function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isOpponentPiece(piece, player) {
    if (player === CELESTE) {
        return piece === SALLY || piece === SALLY_KING;
    } else {
        return piece === CELESTE || piece === CELESTE_KING;
    }
}

function makeMove(fromRow, fromCol, toRow, toCol, moveInfo) {
    const piece = board[fromRow][fromCol];
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = EMPTY;

    playMoveSound();

    // 잡기 처리
    if (moveInfo.isCapture) {
        board[moveInfo.capturedRow][moveInfo.capturedCol] = EMPTY;
        playCaptureSound();

        // 연속 잡기 확인
        const moreCaptives = getCaptureMoves(toRow, toCol);
        if (moreCaptives.length > 0) {
            selectedPiece = { row: toRow, col: toCol };
            validMoves = moreCaptives;
            checkKingPromotion(toRow, toCol);
            renderBoard();
            updateUI();
            updateMessage('연속 잡기! 계속 잡으세요! 🔥');
            return;
        }
    }

    // 킹 승급 확인
    checkKingPromotion(toRow, toCol);

    // 턴 종료
    selectedPiece = null;
    validMoves = [];
    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;

    // 강제 잡기 확인
    mustCapture = hasAnyCapture(currentPlayer);

    renderBoard();
    updateUI();

    // 게임 종료 확인
    if (checkGameOver()) {
        return;
    }
}

function checkKingPromotion(row, col) {
    const piece = board[row][col];

    if (piece === CELESTE && row === BOARD_SIZE - 1) {
        board[row][col] = CELESTE_KING;
        playKingSound();
    } else if (piece === SALLY && row === 0) {
        board[row][col] = SALLY_KING;
        playKingSound();
    }
}

function hasAnyCapture(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isPlayerPiece(board[row][col], player)) {
                const captures = getCaptureMoves(row, col);
                if (captures.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function checkGameOver() {
    const celesteCount = countPieces(CELESTE);
    const sallyCount = countPieces(SALLY);

    // 말이 없으면 패배
    if (celesteCount === 0) {
        endGame(SALLY);
        return true;
    }
    if (sallyCount === 0) {
        endGame(CELESTE);
        return true;
    }

    // 움직일 수 있는 수가 없으면 패배
    if (!hasAnyMoves(currentPlayer)) {
        endGame(currentPlayer === CELESTE ? SALLY : CELESTE);
        return true;
    }

    return false;
}

function hasAnyMoves(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isPlayerPiece(board[row][col], player)) {
                // 임시로 강제 잡기 해제하고 이동 가능 여부 확인
                const oldMustCapture = mustCapture;
                mustCapture = false;
                const moves = getValidMoves(row, col);
                mustCapture = oldMustCapture;

                if (moves.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function countPieces(player) {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isPlayerPiece(board[row][col], player)) {
                count++;
            }
        }
    }
    return count;
}

function updateUI() {
    const celesteCount = countPieces(CELESTE);
    const sallyCount = countPieces(SALLY);

    document.getElementById('score1').textContent = celesteCount;
    document.getElementById('score2').textContent = sallyCount;

    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';
        updateMessage(`${name}의 차례입니다! ${emoji}${mustCapture ? ' (강제 잡기!)' : ''}`);
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
    const finalScore = document.getElementById('finalScore');

    const celesteCount = countPieces(CELESTE);
    const sallyCount = countPieces(SALLY);

    if (winner === CELESTE) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else {
        winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        winnerText.textContent = '🎉 샐리 승리! 🎉';
    }

    finalScore.textContent = `부엉이 ${celesteCount} : ${sallyCount} 샐리`;

    modal.classList.add('show');
    createConfetti();
    playWinSound();

    // 승리 동영상 표시
    if (typeof showVictoryVideo === 'function') {
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

// Sound effects
function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
}

function playMoveSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 400;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) { }
}

function playCaptureSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [500, 700].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.1);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.1);
        });
    } catch (e) { }
}

function playKingSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.15);
        });
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
