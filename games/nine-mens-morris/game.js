// 나인 멘스 모리스 게임 로직
const EMPTY = 0;
const CELESTE = 1;  // 부엉이
const SALLY = 2;    // 샐리

// 24개 노드 위치 (3개의 정사각형)
// 외부 정사각형: 0-7, 중간: 8-15, 내부: 16-23
const NODE_POSITIONS = [
    // 외부 사각형 (0-7)
    { x: 40, y: 40 },   // 0: 좌상
    { x: 240, y: 40 },  // 1: 중상
    { x: 440, y: 40 },  // 2: 우상
    { x: 440, y: 240 }, // 3: 우중
    { x: 440, y: 440 }, // 4: 우하
    { x: 240, y: 440 }, // 5: 중하
    { x: 40, y: 440 },  // 6: 좌하
    { x: 40, y: 240 },  // 7: 좌중
    // 중간 사각형 (8-15)
    { x: 105, y: 105 }, // 8
    { x: 240, y: 105 }, // 9
    { x: 375, y: 105 }, // 10
    { x: 375, y: 240 }, // 11
    { x: 375, y: 375 }, // 12
    { x: 240, y: 375 }, // 13
    { x: 105, y: 375 }, // 14
    { x: 105, y: 240 }, // 15
    // 내부 사각형 (16-23)
    { x: 170, y: 170 }, // 16
    { x: 240, y: 170 }, // 17
    { x: 310, y: 170 }, // 18
    { x: 310, y: 240 }, // 19
    { x: 310, y: 310 }, // 20
    { x: 240, y: 310 }, // 21
    { x: 170, y: 310 }, // 22
    { x: 170, y: 240 }  // 23
];

// 연결된 노드
const CONNECTIONS = [
    // 외부 사각형
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    // 중간 사각형
    [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
    // 내부 사각형
    [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
    // 연결선 (사각형 간)
    [1, 9], [9, 17],
    [3, 11], [11, 19],
    [5, 13], [13, 21],
    [7, 15], [15, 23]
];

// 밀(mill) - 3개 연결 조합
const MILLS = [
    // 외부
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    // 중간
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    // 내부
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    // 수직/수평 연결
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
];

// 인접 노드
const ADJACENCY = {};

let board = [];
let currentPlayer = CELESTE;
let phase = 'placing';  // 'placing', 'moving', 'removing'
let piecesToPlace = { 1: 9, 2: 9 };
let piecesOnBoard = { 1: 0, 2: 0 };
let selectedNode = null;
let validMoves = [];
let isGameOver = false;
let previousMills = { 1: [], 2: [] };

function buildAdjacency() {
    for (let i = 0; i < NODE_POSITIONS.length; i++) {
        ADJACENCY[i] = [];
    }
    for (const [a, b] of CONNECTIONS) {
        ADJACENCY[a].push(b);
        ADJACENCY[b].push(a);
    }
}

function initGame() {
    buildAdjacency();

    board = new Array(24).fill(EMPTY);
    currentPlayer = CELESTE;
    phase = 'placing';
    piecesToPlace = { 1: 9, 2: 9 };
    piecesOnBoard = { 1: 0, 2: 0 };
    selectedNode = null;
    validMoves = [];
    isGameOver = false;
    previousMills = { 1: [], 2: [] };

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 말을 놓습니다! 🦉');
    closeModal();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    // Draw lines
    drawBoardLines(boardEl);

    // Draw nodes
    for (let i = 0; i < NODE_POSITIONS.length; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = NODE_POSITIONS[i].x + 'px';
        node.style.top = NODE_POSITIONS[i].y + 'px';
        node.dataset.nodeId = i;

        // Highlight valid moves
        if (validMoves.includes(i)) {
            if (phase === 'removing') {
                node.classList.add('can-remove');
            } else {
                node.classList.add('valid-move');
            }
        }

        // Selected node
        if (selectedNode === i) {
            node.classList.add('selected');
        }

        // Add piece if present
        if (board[i] !== EMPTY) {
            const piece = document.createElement('div');
            piece.className = 'piece';
            piece.classList.add(board[i] === CELESTE ? 'celeste' : 'sally');
            if (selectedNode === i) {
                piece.classList.add('selected');
            }
            node.appendChild(piece);
        }

        node.addEventListener('click', () => handleNodeClick(i));
        boardEl.appendChild(node);
    }
}

function drawBoardLines(boardEl) {
    // 3개의 사각형 그리기
    const squares = [
        { x: 40, y: 40, size: 400 },
        { x: 105, y: 105, size: 270 },
        { x: 170, y: 170, size: 140 }
    ];

    squares.forEach(sq => {
        // 상단
        createLine(boardEl, sq.x, sq.y, sq.size, true);
        // 하단
        createLine(boardEl, sq.x, sq.y + sq.size, sq.size, true);
        // 좌측
        createLine(boardEl, sq.x, sq.y, sq.size, false);
        // 우측
        createLine(boardEl, sq.x + sq.size, sq.y, sq.size, false);
    });

    // 연결선
    createLine(boardEl, 240, 40, 130, false);   // 상단 연결 (40 to 170)
    createLine(boardEl, 240, 310, 130, false);  // 하단 연결 (310 to 440)
    createLine(boardEl, 40, 240, 130, true);    // 좌측 연결 (40 to 170)
    createLine(boardEl, 310, 240, 130, true);   // 우측 연결 (310 to 440)
}

function createLine(parent, x, y, length, horizontal) {
    const line = document.createElement('div');
    line.className = 'board-line ' + (horizontal ? 'horizontal' : 'vertical');
    line.style.left = x + 'px';
    line.style.top = y + 'px';
    if (horizontal) {
        line.style.width = length + 'px';
    } else {
        line.style.height = length + 'px';
    }
    parent.appendChild(line);
}

function handleNodeClick(nodeId) {
    if (isGameOver) return;

    if (phase === 'placing') {
        handlePlacing(nodeId);
    } else if (phase === 'moving') {
        handleMoving(nodeId);
    } else if (phase === 'removing') {
        handleRemoving(nodeId);
    }
}

function handlePlacing(nodeId) {
    if (board[nodeId] !== EMPTY) return;

    // 말 놓기
    board[nodeId] = currentPlayer;
    piecesToPlace[currentPlayer]--;
    piecesOnBoard[currentPlayer]++;
    playPlaceSound();

    // 밀 체크
    if (checkNewMill(nodeId)) {
        phase = 'removing';
        validMoves = getRemovablePieces();
        renderBoard();
        updateMessage('밀 성공! 상대 말을 제거하세요! 🎯');
        return;
    }

    endTurn();
}

function handleMoving(nodeId) {
    // 자기 말 선택
    if (board[nodeId] === currentPlayer) {
        selectedNode = nodeId;
        validMoves = getValidMoves(nodeId);
        playClickSound();
        renderBoard();
        return;
    }

    // 이동
    if (selectedNode !== null && validMoves.includes(nodeId)) {
        board[nodeId] = currentPlayer;
        board[selectedNode] = EMPTY;
        playMoveSound();

        // 밀 체크
        if (checkNewMill(nodeId)) {
            selectedNode = null;
            validMoves = [];
            phase = 'removing';
            validMoves = getRemovablePieces();
            renderBoard();
            updateMessage('밀 성공! 상대 말을 제거하세요! 🎯');
            return;
        }

        selectedNode = null;
        validMoves = [];
        endTurn();
    }
}

function handleRemoving(nodeId) {
    if (!validMoves.includes(nodeId)) return;

    const opponent = currentPlayer === CELESTE ? SALLY : CELESTE;
    board[nodeId] = EMPTY;
    piecesOnBoard[opponent]--;
    playRemoveSound();

    phase = checkPhase();
    validMoves = [];

    endTurn();
}

function getValidMoves(fromNode) {
    const moves = [];

    // 말이 3개 이하면 어디든 이동 가능 (비행)
    if (piecesOnBoard[currentPlayer] <= 3) {
        for (let i = 0; i < 24; i++) {
            if (board[i] === EMPTY) {
                moves.push(i);
            }
        }
    } else {
        // 인접한 빈 칸만
        for (const adj of ADJACENCY[fromNode]) {
            if (board[adj] === EMPTY) {
                moves.push(adj);
            }
        }
    }

    return moves;
}

function getRemovablePieces() {
    const opponent = currentPlayer === CELESTE ? SALLY : CELESTE;
    const pieces = [];
    const nonMillPieces = [];

    for (let i = 0; i < 24; i++) {
        if (board[i] === opponent) {
            if (!isInMill(i)) {
                nonMillPieces.push(i);
            }
            pieces.push(i);
        }
    }

    // 밀에 없는 말 우선, 없으면 모두 제거 가능
    return nonMillPieces.length > 0 ? nonMillPieces : pieces;
}

function checkNewMill(nodeId) {
    const player = board[nodeId];

    for (const mill of MILLS) {
        if (mill.includes(nodeId)) {
            if (mill.every(n => board[n] === player)) {
                // 새로운 밀인지 확인
                const millKey = mill.join('-');
                if (!previousMills[player].includes(millKey)) {
                    previousMills[player].push(millKey);
                    return true;
                }
            }
        }
    }

    return false;
}

function isInMill(nodeId) {
    const player = board[nodeId];

    for (const mill of MILLS) {
        if (mill.includes(nodeId)) {
            if (mill.every(n => board[n] === player)) {
                return true;
            }
        }
    }

    return false;
}

function checkPhase() {
    // 배치 완료 후 이동 단계로
    if (piecesToPlace[1] === 0 && piecesToPlace[2] === 0) {
        return 'moving';
    }
    return 'placing';
}

function endTurn() {
    // 게임 종료 조건 체크
    const opponent = currentPlayer === CELESTE ? SALLY : CELESTE;

    // 상대 말 2개 이하면 승리
    if (piecesToPlace[opponent] === 0 && piecesOnBoard[opponent] < 3) {
        endGame(currentPlayer);
        return;
    }

    // 상대가 움직일 수 없으면 승리 (이동 단계에서만)
    if (phase === 'moving' && !canPlayerMove(opponent)) {
        endGame(currentPlayer);
        return;
    }

    currentPlayer = opponent;
    phase = checkPhase();
    selectedNode = null;
    validMoves = [];

    renderBoard();
    updateUI();
}

function canPlayerMove(player) {
    for (let i = 0; i < 24; i++) {
        if (board[i] === player) {
            if (piecesOnBoard[player] <= 3) return true; // 비행 가능
            for (const adj of ADJACENCY[i]) {
                if (board[adj] === EMPTY) return true;
            }
        }
    }
    return false;
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
    document.getElementById('pieces1').textContent = piecesToPlace[1] + piecesOnBoard[1];
    document.getElementById('pieces2').textContent = piecesToPlace[2] + piecesOnBoard[2];

    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';

        if (phase === 'placing') {
            updateMessage(`${name}가 말을 놓습니다! (남은: ${piecesToPlace[currentPlayer]}) ${emoji}`);
        } else if (phase === 'moving') {
            updateMessage(`${name}가 말을 이동합니다! ${emoji}`);
        }
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

function playMoveSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 400;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
}

function playRemoveSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [600, 400].forEach((freq, i) => {
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
