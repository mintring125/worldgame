// 매칭 게임 로직
const PAIRS = 8; // 8쌍 = 16장
const CELESTE = 1;
const SALLY = 2;

// 동물의 숲 테마 이모지
const SYMBOLS = ['🦊', '🐰', '🦝', '🐻', '🐨', '🐼', '🦁', '🐯'];

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let currentPlayer = CELESTE;
let scores = { 1: 0, 2: 0 };
let isLocked = false;
let isGameOver = false;

function initGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    currentPlayer = CELESTE;
    scores = { 1: 0, 2: 0 };
    isLocked = false;
    isGameOver = false;

    // 카드 생성 (각 심볼 2장씩)
    const cardSymbols = [...SYMBOLS, ...SYMBOLS];
    shuffleArray(cardSymbols);

    cards = cardSymbols.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        flipped: false,
        matched: false
    }));

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦉');
    closeModal();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (card.flipped || card.matched) cardEl.classList.add('flipped');
        if (card.matched) cardEl.classList.add('matched');

        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-back"></div>
                <div class="card-front">${card.symbol}</div>
            </div>
        `;

        cardEl.addEventListener('click', () => handleCardClick(index));
        board.appendChild(cardEl);
    });
}

function handleCardClick(index) {
    if (isLocked || isGameOver) return;

    const card = cards[index];
    if (card.flipped || card.matched) return;

    // 카드 뒤집기
    card.flipped = true;
    flippedCards.push(index);
    playFlipSound();
    renderBoard();

    if (flippedCards.length === 2) {
        isLocked = true;
        checkMatch();
    }
}

function checkMatch() {
    const [idx1, idx2] = flippedCards;
    const card1 = cards[idx1];
    const card2 = cards[idx2];

    if (card1.symbol === card2.symbol) {
        // 매치 성공!
        setTimeout(() => {
            card1.matched = true;
            card2.matched = true;
            scores[currentPlayer]++;
            matchedPairs++;
            playMatchSound();

            updateMessage(`${currentPlayer === CELESTE ? '부엉이' : '샐리'}가 짝을 찾았어요! 🎉`);

            flippedCards = [];
            isLocked = false;
            renderBoard();
            updateUI();

            // 게임 종료 체크
            if (matchedPairs === PAIRS) {
                setTimeout(() => endGame(), 500);
            }
        }, 500);
    } else {
        // 매치 실패
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;

            flippedCards = [];
            isLocked = false;
            renderBoard();
            updateUI();
        }, 1000);
    }
}

function updateUI() {
    document.getElementById('score1').textContent = scores[CELESTE];
    document.getElementById('score2').textContent = scores[SALLY];

    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver && flippedCards.length === 0) {
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

function playFlipSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 500;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
}

function playMatchSound() {
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
