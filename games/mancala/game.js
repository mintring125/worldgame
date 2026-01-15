// 만칼라 게임 로직
const PITS_PER_PLAYER = 6;
const INITIAL_STONES = 4;
const CELESTE = 1;  // 부엉이 (아래쪽)
const SALLY = 2;    // 샐리 (위쪽)

let board = {
    1: [4, 4, 4, 4, 4, 4],  // Celeste's pits (0-5, left to right)
    2: [4, 4, 4, 4, 4, 4]   // Sally's pits (0-5, right to left from Sally's view)
};
let stores = { 1: 0, 2: 0 };
let currentPlayer = CELESTE;
let isGameOver = false;
let isAnimating = false;

function initGame() {
    board = {
        1: [4, 4, 4, 4, 4, 4],
        2: [4, 4, 4, 4, 4, 4]
    };
    stores = { 1: 0, 2: 0 };
    currentPlayer = CELESTE;
    isGameOver = false;
    isAnimating = false;

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
}

function renderBoard() {
    // Update pits
    for (let player = 1; player <= 2; player++) {
        for (let pit = 0; pit < PITS_PER_PLAYER; pit++) {
            const pitEl = document.getElementById(`pit-${player}-${pit}`);
            const count = board[player][pit];
            pitEl.querySelector('.pit-count').textContent = count;

            // Disable empty pits or opponent's pits
            if (count === 0 || player !== currentPlayer || isAnimating) {
                pitEl.classList.add('disabled');
            } else {
                pitEl.classList.remove('disabled');
            }
        }
    }

    // Update stores
    document.getElementById('storeCount1').textContent = stores[1];
    document.getElementById('storeCount2').textContent = stores[2];
}

function handlePitClick(player, pit) {
    if (isGameOver || isAnimating) return;
    if (player !== currentPlayer) return;
    if (board[player][pit] === 0) return;

    playPickupSound();
    sowStones(player, pit);
}

function sowStones(startPlayer, startPit) {
    isAnimating = true;

    let stones = board[startPlayer][startPit];
    board[startPlayer][startPit] = 0;

    let currentSide = startPlayer;
    let currentPit = startPit;

    // Highlight starting pit
    const startPitEl = document.getElementById(`pit-${startPlayer}-${startPit}`);
    startPitEl.classList.add('active');
    setTimeout(() => startPitEl.classList.remove('active'), 300);

    const sowInterval = setInterval(() => {
        if (stones === 0) {
            clearInterval(sowInterval);
            handleLastStone(currentSide, currentPit);
            return;
        }

        // Move to next position
        if (currentSide === currentPlayer) {
            // Moving on current player's side
            if (currentPit < PITS_PER_PLAYER - 1) {
                currentPit++;
            } else {
                // Reached end, go to store
                stores[currentPlayer]++;
                stones--;
                playDropSound();
                renderBoard();

                if (stones === 0) {
                    clearInterval(sowInterval);
                    // Landed in own store - extra turn!
                    handleExtraTurn();
                    return;
                }

                // Move to opponent's side
                currentSide = currentPlayer === CELESTE ? SALLY : CELESTE;
                currentPit = -1; // Will be incremented to 0
            }
        } else {
            // Moving on opponent's side
            if (currentPit < PITS_PER_PLAYER - 1) {
                currentPit++;
            } else {
                // Skip opponent's store, go back to own side
                currentSide = currentPlayer;
                currentPit = -1;
            }
        }

        // Only drop stone if we're at a pit (not store)
        if (currentPit >= 0 && currentPit < PITS_PER_PLAYER) {
            board[currentSide][currentPit]++;
            stones--;
            playDropSound();

            // Highlight current pit
            const pitEl = document.getElementById(`pit-${currentSide}-${currentPit}`);
            pitEl.classList.add('active');
            setTimeout(() => pitEl.classList.remove('active'), 150);

            renderBoard();
        }
    }, 200);
}

function handleLastStone(side, pit) {
    // Check for capture
    if (side === currentPlayer && board[side][pit] === 1) {
        // Landed in empty pit on own side
        const oppositePit = PITS_PER_PLAYER - 1 - pit;
        const oppositeSide = currentPlayer === CELESTE ? SALLY : CELESTE;
        const capturedStones = board[oppositeSide][oppositePit];

        if (capturedStones > 0) {
            // Capture!
            stores[currentPlayer] += capturedStones + 1;
            board[side][pit] = 0;
            board[oppositeSide][oppositePit] = 0;
            playCaptureSound();
            updateMessage('잡았다! 상대 돌을 획득! 🎯');
            renderBoard();
        }
    }

    // End turn
    endTurn();
}

function handleExtraTurn() {
    isAnimating = false;

    if (checkGameOver()) {
        return;
    }

    updateMessage('한 번 더! 마지막 돌이 저장소에! 🎉');
    renderBoard();
}

function endTurn() {
    if (checkGameOver()) {
        return;
    }

    // Switch player
    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
    isAnimating = false;

    renderBoard();
    updateUI();
}

function checkGameOver() {
    const celesteEmpty = board[1].every(p => p === 0);
    const sallyEmpty = board[2].every(p => p === 0);

    if (celesteEmpty || sallyEmpty) {
        // Game over - collect remaining stones
        for (let pit = 0; pit < PITS_PER_PLAYER; pit++) {
            stores[1] += board[1][pit];
            stores[2] += board[2][pit];
            board[1][pit] = 0;
            board[2][pit] = 0;
        }

        renderBoard();
        endGame();
        return true;
    }

    return false;
}

function endGame() {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');
    const finalScore = document.getElementById('finalScore');

    let winner;
    if (stores[1] > stores[2]) {
        winner = CELESTE;
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🎉 부엉이 승리! 🎉';
    } else if (stores[2] > stores[1]) {
        winner = SALLY;
        winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        winnerText.textContent = '🎉 샐리 승리! 🎉';
    } else {
        winnerAvatar.innerHTML = '🤝';
        winnerText.textContent = '무승부!';
    }

    finalScore.textContent = `부엉이 ${stores[1]} : ${stores[2]} 샐리`;

    modal.classList.add('show');
    createConfetti();
    playWinSound();

    // 승리 동영상 표시 (무승부가 아닌 경우)
    if (stores[1] !== stores[2] && typeof showVictoryVideo === 'function') {
        const winnerName = winner === CELESTE ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

function updateUI() {
    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    const turnIndicator = document.querySelector('.turn-indicator');
    turnIndicator.classList.toggle('right', currentPlayer === SALLY);

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';
        updateMessage(`${name}의 차례입니다! ${emoji}`);
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
function playPickupSound() {
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

function playDropSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 300 + Math.random() * 200;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
}

function playCaptureSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [500, 700, 900].forEach((freq, i) => {
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
