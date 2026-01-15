// 동물의 숲 오델로 게임 로직
// 플레이어 1: 부엉이 (Celeste) - 빨간색
// 플레이어 2: 샐리 (Sally) - 분홍색

const EMPTY = 0;
const CELESTE = 1;  // 부엉이
const SALLY = 2;    // 샐리

let board = [];
let currentPlayer = CELESTE;
let showHints = true;
let isGameOver = false;

// 방향: 상, 하, 좌, 우, 대각선 4방향
const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

// 게임 초기화
function initGame() {
    board = Array(8).fill(null).map(() => Array(8).fill(EMPTY));

    // 초기 배치
    board[3][3] = SALLY;
    board[3][4] = CELESTE;
    board[4][3] = CELESTE;
    board[4][4] = SALLY;

    currentPlayer = CELESTE;
    isGameOver = false;
    lastPlacedPiece = null;
    lastFlippedDisks = [];

    renderBoard();
    updateUI();
    updateMessage(`부엉이의 차례입니다! 🦉`);
    closeModal();
}

// 보드 렌더링
let lastPlacedPiece = null;
let lastFlippedDisks = [];

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    const validMoves = getValidMoves(currentPlayer);

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 유효한 수 표시
            if (showHints && !isGameOver) {
                const isValid = validMoves.some(move => move.row === row && move.col === col);
                if (isValid) {
                    cell.classList.add('valid-move');
                }
            }

            // 돌 배치
            if (board[row][col] !== EMPTY) {
                const disk = document.createElement('div');
                disk.className = `disk ${board[row][col] === CELESTE ? 'celeste' : 'sally'}`;

                // 새로 놓은 돌에만 애니메이션
                if (lastPlacedPiece && lastPlacedPiece.row === row && lastPlacedPiece.col === col) {
                    disk.classList.add('new-piece');
                }

                // 뒤집힌 돌에 flip 클래스 적용
                if (lastFlippedDisks.some(d => d.row === row && d.col === col)) {
                    disk.classList.add('flip');
                }

                cell.appendChild(disk);
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }
}

// 셀 클릭 처리
function handleCellClick(row, col) {
    if (isGameOver) return;
    if (board[row][col] !== EMPTY) return;

    const flippedDisks = getFlippedDisks(row, col, currentPlayer);
    if (flippedDisks.length === 0) return;

    // 돌 놓기
    board[row][col] = currentPlayer;
    lastPlacedPiece = { row, col };  // 새 돌 위치 저장
    lastFlippedDisks = flippedDisks;  // 뒤집힌 돌 저장
    playPlaceSound();  // 효과음 재생

    // 돌 뒤집기 with 애니메이션
    flipDisks(flippedDisks);

    // 플레이어 교체
    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;

    // 다음 플레이어가 둘 수 있는지 확인
    const nextValidMoves = getValidMoves(currentPlayer);

    if (nextValidMoves.length === 0) {
        // 다음 플레이어가 둘 곳이 없으면 다시 교체
        currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
        const currentValidMoves = getValidMoves(currentPlayer);

        if (currentValidMoves.length === 0) {
            // 둘 다 둘 곳이 없으면 게임 종료
            endGame();
            return;
        } else {
            const skipPlayer = currentPlayer === CELESTE ? '샐리' : '부엉이';
            updateMessage(`${skipPlayer}는 둘 곳이 없어요! 패스! 🙈`);
        }
    }

    setTimeout(() => {
        renderBoard();
        updateUI();
    }, 300);
}

// 뒤집힐 돌들 찾기
function getFlippedDisks(row, col, player) {
    const opponent = player === CELESTE ? SALLY : CELESTE;
    let allFlipped = [];

    for (const [dr, dc] of directions) {
        let flipped = [];
        let r = row + dr;
        let c = col + dc;

        // 해당 방향으로 상대 돌 찾기
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
            flipped.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        // 끝에 자신의 돌이 있으면 유효
        if (flipped.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
            allFlipped = allFlipped.concat(flipped);
        }
    }

    return allFlipped;
}

// 돌 뒤집기
function flipDisks(disks) {
    for (const disk of disks) {
        board[disk.row][disk.col] = currentPlayer;
    }
}

// 유효한 수 가져오기
function getValidMoves(player) {
    const validMoves = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === EMPTY) {
                const flipped = getFlippedDisks(row, col, player);
                if (flipped.length > 0) {
                    validMoves.push({ row, col });
                }
            }
        }
    }

    return validMoves;
}

// 점수 계산
function countPieces() {
    let celeste = 0;
    let sally = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === CELESTE) celeste++;
            if (board[row][col] === SALLY) sally++;
        }
    }

    return { celeste, sally };
}

// UI 업데이트
function updateUI() {
    const scores = countPieces();

    document.getElementById('score1').textContent = scores.celeste;
    document.getElementById('score2').textContent = scores.sally;

    // 활성 플레이어 표시
    document.getElementById('player1').classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    document.getElementById('player2').classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    if (!isGameOver) {
        const playerName = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦉' : '🐑';
        updateMessage(`${playerName}의 차례입니다! ${emoji}`);
    }
}

// 메시지 업데이트
function updateMessage(msg) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = msg;
    messageArea.style.animation = 'none';
    messageArea.offsetHeight; // reflow
    messageArea.style.animation = 'messageSlide 0.5s ease';
}

// 힌트 토글
function toggleHint() {
    showHints = !showHints;
    renderBoard();

    const hintBtn = document.querySelector('.btn-hint');
    hintBtn.textContent = showHints ? '💡 힌트 숨기기' : '💡 힌트 보기';
}

// 게임 종료
function endGame() {
    isGameOver = true;
    const scores = countPieces();

    let winnerText = '';
    let winnerImg = '';

    if (scores.celeste > scores.sally) {
        winnerText = '🎉 부엉이 승리! 🎉';
        winnerImg = 'celeste.png';
    } else if (scores.sally > scores.celeste) {
        winnerText = '🎉 샐리 승리! 🎉';
        winnerImg = 'sally.png';
    } else {
        winnerText = '🤝 무승부! 🤝';
        winnerImg = '';
    }

    // 모달 표시
    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerTextElement = document.getElementById('winnerText');
    const finalScoreElement = document.getElementById('finalScore');

    if (winnerImg) {
        winnerAvatar.innerHTML = `<img src="${winnerImg}" alt="winner">`;
        winnerAvatar.style.display = 'block';
    } else {
        winnerAvatar.style.display = 'none';
    }

    winnerTextElement.textContent = winnerText;
    finalScoreElement.textContent = `부엉이 ${scores.celeste} : ${scores.sally} 샐리`;

    modal.classList.add('show');

    // 색종이 효과
    createConfetti();

    // 승리 사운드 효과 (없으면 생략)
    playWinSound();

    // 승리 동영상 표시 (무승부가 아닌 경우에만)
    if (scores.celeste !== scores.sally && typeof showVictoryVideo === 'function') {
        const winnerName = scores.celeste > scores.sally ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('gameOverModal');
    modal.classList.remove('show');
}

// 색종이 효과
function createConfetti() {
    const container = document.getElementById('confetti');
    container.innerHTML = '';

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }

        container.appendChild(confetti);
    }
}

// 승리 사운드 (Web Audio API)
function playWinSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 간단한 승리 멜로디
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 0.2;

        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * duration);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * duration + duration);

            oscillator.start(audioContext.currentTime + index * duration);
            oscillator.stop(audioContext.currentTime + index * duration + duration);
        });
    } catch (e) {
        // 오디오 지원되지 않으면 무시
        console.log('Audio not supported');
    }
}

// 돌 놓을 때 효과음
function playPlaceSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// 페이지 로드 시 게임 시작
document.addEventListener('DOMContentLoaded', initGame);
