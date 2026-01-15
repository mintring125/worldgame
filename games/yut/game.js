// 윷놀이 게임 로직
const P1 = 0, P2 = 1;
const CELESTE = P1, SALLY = P2;

// 윷판 노드 위치 (29개 노드)
const nodes = [
    { id: 0, x: 92, y: 92, isCorner: true },   // 출발/도착
    { id: 1, x: 92, y: 75 }, { id: 2, x: 92, y: 58 }, { id: 3, x: 92, y: 42 }, { id: 4, x: 92, y: 25 },
    { id: 5, x: 92, y: 8, isCorner: true },    // 우상단
    { id: 6, x: 75, y: 8 }, { id: 7, x: 58, y: 8 }, { id: 8, x: 42, y: 8 }, { id: 9, x: 25, y: 8 },
    { id: 10, x: 8, y: 8, isCorner: true },    // 좌상단
    { id: 11, x: 8, y: 25 }, { id: 12, x: 8, y: 42 }, { id: 13, x: 8, y: 58 }, { id: 14, x: 8, y: 75 },
    { id: 15, x: 8, y: 92, isCorner: true },   // 좌하단
    { id: 16, x: 25, y: 92 }, { id: 17, x: 42, y: 92 }, { id: 18, x: 58, y: 92 }, { id: 19, x: 75, y: 92 },
    // 대각선 경로 (우상단 → 중앙)
    { id: 20, x: 75, y: 25 }, { id: 21, x: 60, y: 40 }, { id: 22, x: 50, y: 50, isCenter: true },
    { id: 23, x: 40, y: 60 }, { id: 24, x: 25, y: 75 },
    // 대각선 경로 (좌상단 → 중앙)
    { id: 25, x: 25, y: 25 }, { id: 26, x: 40, y: 40 }, { id: 27, x: 60, y: 60 }, { id: 28, x: 75, y: 75 }
];

// 경로 정의
const paths = {
    0: { default: 1 }, 1: { default: 2 }, 2: { default: 3 }, 3: { default: 4 }, 4: { default: 5 },
    5: { default: 6, shortcut: 20 },  // 우상단 코너 → 지름길 가능
    6: { default: 7 }, 7: { default: 8 }, 8: { default: 9 }, 9: { default: 10 },
    10: { default: 11, shortcut: 25 }, // 좌상단 코너 → 지름길 가능
    11: { default: 12 }, 12: { default: 13 }, 13: { default: 14 }, 14: { default: 15 },
    15: { default: 16 }, 16: { default: 17 }, 17: { default: 18 }, 18: { default: 19 }, 19: { default: 999 },
    // 대각선 경로
    20: { default: 21 }, 21: { default: 22 }, 22: { default: 23 }, 23: { default: 24 }, 24: { default: 15 },
    25: { default: 26 }, 26: { default: 22 }, 27: { default: 28 }, 28: { default: 999 }
};

const yutNames = { 1: "도", 2: "개", 3: "걸", 4: "윷", 5: "모", "-1": "빽도" };
let gameState = {
    turn: P1,
    pieces: { [P1]: [], [P2]: [] },
    movesAvailable: [],
    finishedCount: { [P1]: 0, [P2]: 0 }
};

function initGame() {
    const boardEl = document.getElementById('board');

    // 노드 생성
    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `node ${node.isCorner ? 'corner' : ''} ${node.isCenter ? 'center' : ''}`;
        el.style.left = node.x + '%';
        el.style.top = node.y + '%';
        el.dataset.nodeId = node.id;
        boardEl.appendChild(el);
    });

    resetGame();

    // 윷 초기 위치
    for (let i = 0; i < 4; i++) {
        document.getElementById(`stick-${i}`).style.transform = `rotateX(0deg) rotateZ(${(Math.random() * 10) - 5}deg)`;
    }
}

function resetGame() {
    gameState = {
        turn: P1,
        pieces: {
            [P1]: Array(4).fill().map((_, i) => ({ id: i, loc: -1, finished: false })),
            [P2]: Array(4).fill().map((_, i) => ({ id: i, loc: -1, finished: false }))
        },
        movesAvailable: [],
        finishedCount: { [P1]: 0, [P2]: 0 }
    };

    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('move-history').innerText = '';
    document.getElementById('p1-score').innerText = '0/4';
    document.getElementById('p2-score').innerText = '0/4';
    updateMessage('부엉이가 먼저 시작합니다! 윷을 던져주세요 🦉');
    renderPieces();
    enableThrowBtn(true);
    updatePlayerUI();
}

function throwYut() {
    enableThrowBtn(false);

    const sticks = [], shadows = [];
    for (let i = 0; i < 4; i++) {
        sticks.push(document.getElementById(`stick-${i}`));
        shadows.push(document.getElementById(`shadow-${i}`));
    }

    // 애니메이션 시작
    sticks.forEach(el => {
        el.classList.remove('anim-jump');
        void el.offsetWidth;
        el.classList.add('anim-jump');
        el.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
        const rx = 720 + Math.random() * 360;
        const rz = 360 + Math.random() * 360;
        el.style.transform = `translateY(-120px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(1.1)`;
    });
    shadows.forEach(el => {
        el.classList.remove('anim-shadow');
        void el.offsetWidth;
        el.classList.add('anim-shadow');
    });

    playThrowSound();

    setTimeout(() => {
        let flatCount = 0;
        sticks.forEach((stick) => {
            const isFlat = Math.random() < 0.5;
            if (isFlat) flatCount++;
            stick.innerHTML = `<svg class="yut-svg"><use href="${isFlat ? '#yut-flat' : '#yut-round'}"></use></svg>`;
            const landZ = (Math.random() * 20) - 10;
            stick.style.transition = 'transform 0.15s ease-out';
            stick.style.transform = `translateY(0) rotateX(0deg) rotateZ(${landZ}deg) scale(1)`;
        });

        // 결과 계산
        let result = flatCount === 0 ? 5 : flatCount;

        gameState.movesAvailable.push(result);
        const hist = document.getElementById('move-history');
        hist.innerHTML = `<span style="color:#5d4037; font-size:2rem;">${yutNames[result]}!</span>`;

        if (result === 4 || result === 5) {
            playSpecialSound();
            updateMessage(`[${yutNames[result]}] 한 번 더 던지세요!`);
            enableThrowBtn(true, "한 번 더!");
        } else {
            updateMessage("말을 클릭하여 이동하세요!");
            highlightMovablePieces();
        }

        setTimeout(() => {
            sticks.forEach(el => el.classList.remove('anim-jump'));
            shadows.forEach(el => el.classList.remove('anim-shadow'));
        }, 200);
    }, 650);
}

function enableThrowBtn(enable, text) {
    const btn = document.getElementById('btn-throw');
    btn.disabled = !enable;
    btn.innerText = text || "윷 던지기";
}

function highlightMovablePieces() {
    const player = gameState.turn;
    document.querySelectorAll(`.piece.p${player + 1}, .waiting-piece.p${player + 1}`).forEach(p => {
        p.classList.add('selectable');
        p.onclick = (e) => handlePieceClick(e, p);
    });
}

function handlePieceClick(e, domElement) {
    e.stopPropagation();
    if (gameState.movesAvailable.length === 0) return;

    const pid = parseInt(domElement.dataset.id);
    const piece = gameState.pieces[gameState.turn].find(p => p.id === pid);
    if (piece.finished) return;

    if (gameState.movesAvailable.length > 1) {
        showMoveSelection(piece);
    } else {
        executeMove(piece, gameState.movesAvailable[0], 0);
    }
}

function showMoveSelection(piece) {
    const msg = document.getElementById('messageArea');
    msg.innerHTML = '<span style="font-size:0.9rem;">이동할 칸 수를 선택하세요:</span><br>';

    gameState.movesAvailable.forEach((move, index) => {
        const btn = document.createElement('button');
        btn.innerText = `${yutNames[move]} (${move}칸)`;
        btn.className = 'btn';
        btn.style.margin = '5px';
        btn.style.background = '#8d6e63';
        btn.style.color = 'white';
        btn.onclick = (e) => {
            e.stopPropagation();
            executeMove(piece, move, index);
        };
        msg.appendChild(btn);
    });
}

function calculateDestination(currentLoc, steps) {
    let next = currentLoc === -1 ? 0 : currentLoc;

    for (let i = 0; i < steps; i++) {
        if (next === 999) break;
        const nodeData = paths[next];
        if (!nodeData) { next = 999; break; }

        // 출발 위치일 때만 지름길 선택
        if (next === currentLoc && nodeData.shortcut) {
            next = nodeData.shortcut;
        } else {
            next = nodeData.default;
        }
    }
    return next;
}

function getVisualLoc(loc) {
    return loc;
}

function executeMove(piece, steps, moveIndex) {
    playMoveSound();
    gameState.movesAvailable.splice(moveIndex, 1);

    // 함께 이동할 말 그룹
    const playerPieces = gameState.pieces[gameState.turn];
    let movingGroup = [];

    if (piece.loc === -1) {
        movingGroup = [piece];
    } else {
        const startLoc = piece.loc;
        movingGroup = playerPieces.filter(p => !p.finished && p.loc === startLoc);
    }

    const startLoc = piece.loc;
    let endLoc = calculateDestination(startLoc, steps);

    // 상대방 잡기
    let caught = false;
    if (endLoc !== 999 && endLoc !== -1) {
        const opponent = gameState.turn === P1 ? P2 : P1;
        gameState.pieces[opponent].forEach(opp => {
            if (!opp.finished && opp.loc === endLoc) {
                opp.loc = -1;
                caught = true;
            }
        });
    }

    // 위치 업데이트
    movingGroup.forEach(p => {
        p.loc = endLoc;
        if (endLoc === 999) p.finished = true;
    });

    // UI 정리
    document.querySelectorAll('.selectable').forEach(el => {
        el.classList.remove('selectable');
        el.onclick = null;
    });

    renderPieces();
    checkWinState(caught);
}

function checkWinState(caught) {
    const finished = gameState.pieces[gameState.turn].filter(p => p.finished).length;
    document.getElementById(gameState.turn === P1 ? 'p1-score' : 'p2-score').innerText = `${finished}/4`;

    if (finished === 4) {
        endGame(gameState.turn);
        return;
    }

    if (gameState.movesAvailable.length === 0) {
        if (caught) {
            playSpecialSound();
            updateMessage("상대 말을 잡았습니다! 한 번 더!");
            enableThrowBtn(true, "잡았다! 한 번 더");
        } else {
            switchTurn();
        }
    } else {
        updateMessage("남은 윷으로 이동하세요!");
        highlightMovablePieces();
    }
}

function switchTurn() {
    gameState.turn = gameState.turn === P1 ? P2 : P1;
    gameState.movesAvailable = [];
    enableThrowBtn(true);
    const name = gameState.turn === P1 ? "부엉이" : "샐리";
    updateMessage(`${name} 차례입니다. 윷을 던져주세요!`);
    updatePlayerUI();
}

function updatePlayerUI() {
    document.getElementById('player1').classList.toggle('active', gameState.turn === P1);
    document.getElementById('player2').classList.toggle('active', gameState.turn === P2);
}

function updateMessage(msg) {
    document.getElementById('messageArea').innerText = msg;
}

function renderPieces() {
    // 기존 말 제거
    document.querySelectorAll('.piece, .waiting-piece').forEach(el => el.remove());
    document.getElementById('p1-waiting').innerHTML = '';
    document.getElementById('p2-waiting').innerHTML = '';

    [P1, P2].forEach(player => {
        const pieces = gameState.pieces[player];
        const locCount = {};

        pieces.forEach(p => {
            if (p.finished) return;

            if (p.loc === -1) {
                // 대기 중인 말
                const div = document.createElement('div');
                div.className = `waiting-piece p${player + 1}`;
                div.innerText = p.id + 1;
                div.dataset.id = p.id;
                document.getElementById(player === P1 ? 'p1-waiting' : 'p2-waiting').appendChild(div);
            } else {
                // 판 위의 말
                const node = nodes.find(n => n.id === p.loc);
                if (node) {
                    if (!locCount[p.loc]) locCount[p.loc] = 0;
                    const offset = locCount[p.loc] * -5;
                    locCount[p.loc]++;

                    const el = document.createElement('div');
                    el.className = `piece p${player + 1}`;
                    el.dataset.id = p.id;
                    el.innerText = p.id + 1;
                    el.style.left = `calc(${node.x}% + ${offset}px)`;
                    el.style.top = `calc(${node.y}% + ${offset}px)`;
                    el.style.zIndex = 20 + locCount[p.loc];
                    document.getElementById('board').appendChild(el);
                }
            }
        });
    });
}

function endGame(winner) {
    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');

    if (winner === P1) {
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
        const winnerName = winner === P1 ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
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

// 효과음
function playThrowSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0.6, 0.65, 0.7].forEach(d => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'square'; o.frequency.value = 150;
            g.gain.setValueAtTime(0.15, ctx.currentTime + d);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + d + 0.08);
            o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.1);
        });
    } catch (e) { }
}

function playMoveSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(600, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        o.start(); o.stop(ctx.currentTime + 0.1);
    } catch (e) { }
}

function playSpecialSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle'; o.frequency.value = 523.25;
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        o.start(); o.stop(ctx.currentTime + 0.8);
    } catch (e) { }
}

function playWinSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
            o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', initGame);
