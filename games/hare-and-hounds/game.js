// 토끼와 사냥개 게임 로직
const HARE = 1;     // 부엉이 - 토끼
const HOUNDS = 2;   // 샐리 - 사냥개

// 보드 노드 위치 (11개 노드)
// 보드 모양:
//     1 - 2 - 3
//    /|\ /|\ /|\
//   0 - 4 - 5 - 6 - 10
//    \|/ \|/ \|/
//     7 - 8 - 9
const NODE_POSITIONS = [
    { x: 50, y: 175 },   // 0: 왼쪽 끝 (목표)
    { x: 175, y: 40 },   // 1
    { x: 300, y: 40 },   // 2
    { x: 425, y: 40 },   // 3
    { x: 175, y: 175 },  // 4
    { x: 300, y: 175 },  // 5
    { x: 425, y: 175 },  // 6
    { x: 175, y: 310 },  // 7
    { x: 300, y: 310 },  // 8
    { x: 425, y: 310 },  // 9
    { x: 550, y: 175 }   // 10: 오른쪽 끝 (토끼 시작)
];

// 연결된 노드 (양방향)
const CONNECTIONS = [
    [0, 1], [0, 4], [0, 7],
    [1, 2], [1, 4], [1, 7],
    [2, 3], [2, 4], [2, 5], [2, 8],
    [3, 5], [3, 6], [3, 9],
    [4, 5], [4, 7], [4, 8],
    [5, 6], [5, 8], [5, 9],
    [6, 9], [6, 10],
    [7, 8],
    [8, 9],
    [9, 10]
];

// 각 노드의 인접 노드
const ADJACENCY = {};

let harePosition = 10;  // 토끼 시작: 오른쪽 끝
let houndsPositions = [3, 6, 9];  // 사냥개 시작: 오른쪽 위치들
let currentPlayer = HARE;
let selectedPiece = null;
let validMoves = [];
let isGameOver = false;
let stalledMoves = 0;  // 사냥개가 뒤로 못 가므로 교착 상태 감지용

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

    harePosition = 10;  // 토끼: 오른쪽 끝 (목표: 왼쪽 끝 노드 0)
    houndsPositions = [0, 1, 7];  // 사냥개: 왼쪽 끝과 인접 기둥에서 시작 (토끼 앞을 막고 전진)
    currentPlayer = HARE;
    selectedPiece = null;
    validMoves = [];
    isGameOver = false;
    stalledMoves = 0;

    renderBoard();
    updateUI();
    updateMessage('🐰 토끼를 클릭하고 → 빈 칸을 클릭하세요!');
    closeModal();
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // Draw connections first
    for (const [a, b] of CONNECTIONS) {
        const line = document.createElement('div');
        line.className = 'connection';

        const posA = NODE_POSITIONS[a];
        const posB = NODE_POSITIONS[b];

        const length = Math.sqrt(Math.pow(posB.x - posA.x, 2) + Math.pow(posB.y - posA.y, 2));
        const angle = Math.atan2(posB.y - posA.y, posB.x - posA.x) * 180 / Math.PI;

        line.style.left = posA.x + 'px';
        line.style.top = posA.y + 'px';
        line.style.width = length + 'px';
        line.style.transform = `rotate(${angle}deg)`;

        board.appendChild(line);
    }

    // Draw nodes
    for (let i = 0; i < NODE_POSITIONS.length; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = NODE_POSITIONS[i].x + 'px';
        node.style.top = NODE_POSITIONS[i].y + 'px';
        node.dataset.nodeId = i;

        // Check if this is a valid move
        if (validMoves.includes(i)) {
            node.classList.add('valid-move');
        }

        // Add piece if present
        if (i === harePosition) {
            const piece = document.createElement('div');
            piece.className = 'piece hare';
            piece.textContent = '🐰';
            if (selectedPiece === 'hare') {
                piece.classList.add('selected');
                node.classList.add('selected');
            }
            node.appendChild(piece);
        } else if (houndsPositions.includes(i)) {
            const piece = document.createElement('div');
            piece.className = 'piece hound';
            piece.textContent = '🐕';
            const houndIndex = houndsPositions.indexOf(i);
            if (selectedPiece === houndIndex) {
                piece.classList.add('selected');
                node.classList.add('selected');
            }
            node.appendChild(piece);
        }

        node.addEventListener('click', () => handleNodeClick(i));
        board.appendChild(node);
    }
}

function handleNodeClick(nodeId) {
    if (isGameOver) return;

    // Check if clicking on a valid move
    if (validMoves.includes(nodeId) && selectedPiece !== null) {
        makeMove(nodeId);
        return;
    }

    // Select piece
    if (currentPlayer === HARE && nodeId === harePosition) {
        selectedPiece = 'hare';
        validMoves = getHareMoves();
        playClickSound();
    } else if (currentPlayer === HOUNDS && houndsPositions.includes(nodeId)) {
        selectedPiece = houndsPositions.indexOf(nodeId);
        validMoves = getHoundMoves(nodeId);
        playClickSound();
    } else {
        selectedPiece = null;
        validMoves = [];
    }

    renderBoard();
}

function getHareMoves() {
    const moves = [];
    for (const adjacent of ADJACENCY[harePosition]) {
        if (!houndsPositions.includes(adjacent)) {
            moves.push(adjacent);
        }
    }
    return moves;
}

function getHoundMoves(fromNode) {
    const moves = [];
    for (const adjacent of ADJACENCY[fromNode]) {
        // 사냥개는 토끼가 있는 오른쪽(x가 커지는 쪽)이나 위아래로만 갈 수 있음 (후퇴 금지)
        if (!houndsPositions.includes(adjacent) &&
            adjacent !== harePosition &&
            NODE_POSITIONS[adjacent].x >= NODE_POSITIONS[fromNode].x) {
            moves.push(adjacent);
        }
    }
    return moves;
}

function makeMove(toNode) {
    playMoveSound();

    if (currentPlayer === HARE) {
        harePosition = toNode;

        // 토끼 승리 조건: 왼쪽 끝(노드 0)에 도달
        if (harePosition === 0) {
            endGame(HARE);
            return;
        }
    } else {
        const fromNode = houndsPositions[selectedPiece];
        houndsPositions[selectedPiece] = toNode;
    }

    // 턴 종료
    selectedPiece = null;
    validMoves = [];
    currentPlayer = currentPlayer === HARE ? HOUNDS : HARE;

    // 게임 종료 조건 확인
    if (currentPlayer === HARE && !canHareMove()) {
        endGame(HOUNDS);
        return;
    }

    // 사냥개가 움직일 수 없으면 (교착 상태) 토끼 승리
    if (currentPlayer === HOUNDS && !canHoundsMove()) {
        endGame(HARE);
        return;
    }

    renderBoard();
    updateUI();
}

function canHareMove() {
    return getHareMoves().length > 0;
}

function canHoundsMove() {
    for (const pos of houndsPositions) {
        if (getHoundMoves(pos).length > 0) {
            return true;
        }
    }
    return false;
}

function endGame(winner) {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');

    if (winner === HARE) {
        winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        winnerText.textContent = '🐰 토끼(부엉이) 승리! 🐰';
    } else {
        winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        winnerText.textContent = '🐕 사냥개(샐리) 승리! 🐕';
    }

    modal.classList.add('show');
    createConfetti();
    playWinSound();

    // 승리 동영상 표시
    if (typeof showVictoryVideo === 'function') {
        const winnerName = winner === HARE ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

function updateUI() {
    document.getElementById('player1').classList.toggle('active', currentPlayer === HARE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === HOUNDS && !isGameOver);

    if (!isGameOver) {
        if (currentPlayer === HARE) {
            if (selectedPiece === 'hare') {
                updateMessage('✨ 초록색 칸을 클릭해서 이동하세요!');
            } else {
                updateMessage('🐰 토끼를 클릭하고 → 빈 칸을 클릭하세요!');
            }
        } else {
            if (selectedPiece !== null) {
                updateMessage('✨ 초록색 칸을 클릭해서 이동하세요!');
            } else {
                updateMessage('🐕 사냥개를 클릭하고 → 빈 칸을 클릭하세요!');
            }
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
