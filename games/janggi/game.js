// 장기 (Janggi) 게임 로직
// 부엉이(Celeste) vs 샐리(Sally) - 아빠와 딸을 위한 귀여운 장기 게임

// ============================================================
// 상수 정의
// ============================================================
const CELESTE = 1;  // 부엉이 - 위쪽 (초/Han)
const SALLY = 2;    // 샐리 - 아래쪽 (한/Cho)
const EMPTY = 0;

const COLS = 9;   // 가로 9줄
const ROWS = 10;  // 세로 10줄

// 기물 종류
const KING = 'king';
const CHARIOT = 'chariot';
const CANNON = 'cannon';
const HORSE = 'horse';
const ELEPHANT = 'elephant';
const GUARD = 'guard';
const SOLDIER = 'soldier';

// 기물 이모지 매핑
const PIECE_EMOJI = {
    [CELESTE]: {
        [KING]: '🦁',
        [CHARIOT]: '🚗',
        [CANNON]: '🎯',
        [HORSE]: '🐴',
        [ELEPHANT]: '🐘',
        [GUARD]: '🐱',
        [SOLDIER]: '🐣'
    },
    [SALLY]: {
        [KING]: '🦊',
        [CHARIOT]: '🚙',
        [CANNON]: '🎪',
        [HORSE]: '🦄',
        [ELEPHANT]: '🐰',
        [GUARD]: '🐶',
        [SOLDIER]: '🐥'
    }
};

// 기물 한글 이름
const PIECE_NAME = {
    [KING]: '왕',
    [CHARIOT]: '차',
    [CANNON]: '포',
    [HORSE]: '마',
    [ELEPHANT]: '상',
    [GUARD]: '사',
    [SOLDIER]: '졸'
};

// 궁성 영역 (대각선 이동 가능 구역)
const PALACES = {
    top: { minRow: 0, maxRow: 2, minCol: 3, maxCol: 5 },
    bottom: { minRow: 7, maxRow: 9, minCol: 3, maxCol: 5 }
};

// 궁성 대각선 연결 (중심에서 꼭짓점 + 꼭짓점에서 중심)
const PALACE_DIAGONALS = {
    top: [
        // 중심(1,4)에서 네 꼭짓점으로
        { from: [1, 4], to: [0, 3] },
        { from: [1, 4], to: [0, 5] },
        { from: [1, 4], to: [2, 3] },
        { from: [1, 4], to: [2, 5] },
        // 꼭짓점에서 중심으로
        { from: [0, 3], to: [1, 4] },
        { from: [0, 5], to: [1, 4] },
        { from: [2, 3], to: [1, 4] },
        { from: [2, 5], to: [1, 4] },
        // 꼭짓점 간 대각선 (2칸)
        { from: [0, 3], to: [2, 5] },
        { from: [0, 5], to: [2, 3] },
        { from: [2, 3], to: [0, 5] },
        { from: [2, 5], to: [0, 3] }
    ],
    bottom: [
        { from: [8, 4], to: [7, 3] },
        { from: [8, 4], to: [7, 5] },
        { from: [8, 4], to: [9, 3] },
        { from: [8, 4], to: [9, 5] },
        { from: [7, 3], to: [8, 4] },
        { from: [7, 5], to: [8, 4] },
        { from: [9, 3], to: [8, 4] },
        { from: [9, 5], to: [8, 4] },
        { from: [7, 3], to: [9, 5] },
        { from: [7, 5], to: [9, 3] },
        { from: [9, 3], to: [7, 5] },
        { from: [9, 5], to: [7, 3] }
    ]
};

// ============================================================
// 게임 상태
// ============================================================
let board = [];           // 10x9 보드 배열
let currentPlayer = CELESTE;
let selectedPos = null;   // 선택된 기물 위치 {row, col}
let validMoves = [];      // 이동 가능한 위치 배열 [{row, col}, ...]
let isGameOver = false;
let inCheck = false;      // 현재 플레이어가 체크 상태인지
let moveHistory = [];     // 이동 기록
let capturedPieces = { [CELESTE]: [], [SALLY]: [] }; // 잡힌 기물
let lastMove = null;      // 마지막 이동 {from, to}
let scores = { [CELESTE]: 0, [SALLY]: 0 };

// 귀여운 메시지 모음
const CAPTURE_MESSAGES = [
    '와! 기물을 잡았어요! 🎉',
    '대단해요! 🌟',
    '잘했어요! 👏',
    '멋져요! ✨',
    '최고예요! 🏆'
];

const CHECK_MESSAGES = [
    '장군이에요! 왕을 지켜요! 👑',
    '앗! 왕이 위험해요! 🚨',
    '장군! 조심하세요! ⚠️'
];

// ============================================================
// 보드 초기화
// ============================================================
function createPiece(player, type) {
    return { player, type };
}

function getInitialBoard() {
    // 10x9 빈 보드 생성
    const b = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    // === 부엉이 (CELESTE) - 위쪽 ===
    // Row 0: 차 마 상 사 _ 사 상 마 차
    b[0][0] = createPiece(CELESTE, CHARIOT);
    b[0][1] = createPiece(CELESTE, HORSE);
    b[0][2] = createPiece(CELESTE, ELEPHANT);
    b[0][3] = createPiece(CELESTE, GUARD);
    b[0][5] = createPiece(CELESTE, GUARD);
    b[0][6] = createPiece(CELESTE, ELEPHANT);
    b[0][7] = createPiece(CELESTE, HORSE);
    b[0][8] = createPiece(CELESTE, CHARIOT);

    // Row 1: 왕 (궁성 중앙)
    b[1][4] = createPiece(CELESTE, KING);

    // Row 2: 포
    b[2][1] = createPiece(CELESTE, CANNON);
    b[2][7] = createPiece(CELESTE, CANNON);

    // Row 3: 졸
    b[3][0] = createPiece(CELESTE, SOLDIER);
    b[3][2] = createPiece(CELESTE, SOLDIER);
    b[3][4] = createPiece(CELESTE, SOLDIER);
    b[3][6] = createPiece(CELESTE, SOLDIER);
    b[3][8] = createPiece(CELESTE, SOLDIER);

    // === 샐리 (SALLY) - 아래쪽 ===
    // Row 9: 차 마 상 사 _ 사 상 마 차
    b[9][0] = createPiece(SALLY, CHARIOT);
    b[9][1] = createPiece(SALLY, HORSE);
    b[9][2] = createPiece(SALLY, ELEPHANT);
    b[9][3] = createPiece(SALLY, GUARD);
    b[9][5] = createPiece(SALLY, GUARD);
    b[9][6] = createPiece(SALLY, ELEPHANT);
    b[9][7] = createPiece(SALLY, HORSE);
    b[9][8] = createPiece(SALLY, CHARIOT);

    // Row 8: 왕 (궁성 중앙)
    b[8][4] = createPiece(SALLY, KING);

    // Row 7: 포
    b[7][1] = createPiece(SALLY, CANNON);
    b[7][7] = createPiece(SALLY, CANNON);

    // Row 6: 졸
    b[6][0] = createPiece(SALLY, SOLDIER);
    b[6][2] = createPiece(SALLY, SOLDIER);
    b[6][4] = createPiece(SALLY, SOLDIER);
    b[6][6] = createPiece(SALLY, SOLDIER);
    b[6][8] = createPiece(SALLY, SOLDIER);

    return b;
}

// ============================================================
// 게임 초기화
// ============================================================
function initGame() {
    board = getInitialBoard();
    currentPlayer = CELESTE;
    selectedPos = null;
    validMoves = [];
    isGameOver = false;
    inCheck = false;
    moveHistory = [];
    capturedPieces = { [CELESTE]: [], [SALLY]: [] };
    lastMove = null;

    renderBoard();
    updateUI();
    updateMessage('부엉이가 먼저 시작합니다! 🦁');
    closeModal();
}

// ============================================================
// 보드 렌더링
// ============================================================
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'intersection';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 선택된 기물 표시
            if (selectedPos && selectedPos.row === row && selectedPos.col === col) {
                cell.classList.add('selected');
            }

            // 이동 가능 위치 표시
            const isValid = validMoves.some(m => m.row === row && m.col === col);
            if (isValid) {
                const target = board[row][col];
                if (target && target.player !== currentPlayer) {
                    cell.classList.add('capturable');
                } else {
                    cell.classList.add('valid-move');
                }
            }

            // 마지막 이동 표시
            if (lastMove) {
                if ((lastMove.from.row === row && lastMove.from.col === col) ||
                    (lastMove.to.row === row && lastMove.to.col === col)) {
                    cell.classList.add('last-move');
                }
            }

            // 기물 배치
            const piece = board[row][col];
            if (piece) {
                const pieceEl = document.createElement('div');
                pieceEl.className = `piece ${piece.player === CELESTE ? 'celeste' : 'sally'}`;
                pieceEl.textContent = PIECE_EMOJI[piece.player][piece.type];

                // 왕이 체크 상태면 강조
                if (piece.type === KING && inCheck && piece.player === currentPlayer) {
                    pieceEl.classList.add('in-check');
                }

                cell.appendChild(pieceEl);
            }

            cell.addEventListener('click', () => handleClick(row, col));
            boardEl.appendChild(cell);
        }
    }
}

// ============================================================
// 클릭 처리
// ============================================================
function handleClick(row, col) {
    if (isGameOver) return;

    // 이동 가능한 위치를 클릭한 경우 - 이동 실행
    if (selectedPos && validMoves.some(m => m.row === row && m.col === col)) {
        makeMove(selectedPos, { row, col });
        return;
    }

    // 기물 선택
    const piece = board[row][col];
    if (piece && piece.player === currentPlayer) {
        selectedPos = { row, col };
        validMoves = getLegalMoves(row, col);
        renderBoard();

        if (validMoves.length === 0) {
            updateMessage('이 기물은 움직일 수 없어요! 😅');
        } else {
            const emoji = PIECE_EMOJI[piece.player][piece.type];
            updateMessage(`${PIECE_NAME[piece.type]}${emoji} 선택! 초록색 칸으로 이동하세요 ✨`);
        }
    } else {
        // 선택 해제
        selectedPos = null;
        validMoves = [];
        renderBoard();
    }
}

// ============================================================
// 이동 실행
// ============================================================
function makeMove(from, to) {
    const piece = board[from.row][from.col];
    const captured = board[to.row][to.col];

    // 이동 기록
    moveHistory.push({
        from: { ...from },
        to: { ...to },
        piece: { ...piece },
        captured: captured ? { ...captured } : null
    });

    // 기물 잡기
    if (captured) {
        capturedPieces[currentPlayer].push(captured);
        showCaptureEffect(to.row, to.col);
    }

    // 기물 이동
    board[to.row][to.col] = piece;
    board[from.row][from.col] = null;

    lastMove = { from: { ...from }, to: { ...to } };

    // 턴 전환
    const prevPlayer = currentPlayer;
    currentPlayer = currentPlayer === CELESTE ? SALLY : CELESTE;
    selectedPos = null;
    validMoves = [];

    // 체크 확인
    inCheck = isInCheck(currentPlayer);

    // 체크메이트 확인 (합법적 이동이 없으면)
    if (!hasAnyLegalMove(currentPlayer)) {
        if (inCheck) {
            // 체크메이트! 이전 플레이어 승리
            isGameOver = true;
            renderBoard();
            const winner = prevPlayer;
            const winnerName = winner === CELESTE ? '부엉이' : '샐리';
            updateMessage(`🎉 장군! ${winnerName} 승리! 🎉`);
            setTimeout(() => endGame(winner), 800);
            return;
        }
        // 체크 아닌데 이동 불가 = 스테일메이트 (장기에서는 패배)
        isGameOver = true;
        renderBoard();
        const winner = prevPlayer;
        const winnerName = winner === CELESTE ? '부엉이' : '샐리';
        updateMessage(`${winnerName} 승리! 상대가 움직일 수 없어요! 🎉`);
        setTimeout(() => endGame(winner), 800);
        return;
    }

    // 비장 (빅장) 확인 - 두 왕이 같은 열에서 마주보고 사이에 기물 없음
    if (isBikjang()) {
        isGameOver = true;
        renderBoard();
        updateMessage('비장! 무승부입니다! 🤝');
        setTimeout(() => endGame(0), 800);
        return;
    }

    renderBoard();

    // 이동 잔상 효과 적용
    showMoveEffect(to.row, to.col);

    // 메시지 표시
    if (captured) {
        const msg = CAPTURE_MESSAGES[Math.floor(Math.random() * CAPTURE_MESSAGES.length)];
        updateMessage(msg);
    } else if (inCheck) {
        const msg = CHECK_MESSAGES[Math.floor(Math.random() * CHECK_MESSAGES.length)];
        updateMessage(msg);
    } else {
        updateUI();
    }
}

// ============================================================
// 잡기 이펙트
// ============================================================
function showCaptureEffect(row, col) {
    const boardEl = document.getElementById('board');
    const index = row * COLS + col;
    const cell = boardEl.children[index];
    if (!cell) return;

    const effect = document.createElement('div');
    effect.className = 'capture-effect';
    effect.textContent = '💥';
    cell.appendChild(effect);

    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 600);
}

// ============================================================
// 이동 잔상 효과
// ============================================================
function showMoveEffect(row, col) {
    const boardEl = document.getElementById('board');
    const index = row * COLS + col;
    const cell = boardEl.children[index];
    if (!cell) return;

    const pieceEl = cell.querySelector('.piece');
    if (pieceEl) {
        pieceEl.classList.add('moving');
        setTimeout(() => {
            pieceEl.classList.remove('moving');
        }, 400);
    }
}

// ============================================================
// 이동 규칙 - 각 기물별 이동 가능 위치 계산
// ============================================================

// 보드 범위 확인
function inBounds(row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// 궁성 안에 있는지 확인
function isInPalace(row, col, player) {
    if (player === CELESTE) {
        return row >= 0 && row <= 2 && col >= 3 && col <= 5;
    } else {
        return row >= 7 && row <= 9 && col >= 3 && col <= 5;
    }
}

// 어느 궁성이든 안에 있는지 확인
function isInAnyPalace(row, col) {
    return (row >= 0 && row <= 2 && col >= 3 && col <= 5) ||
        (row >= 7 && row <= 9 && col >= 3 && col <= 5);
}

// 궁성 대각선 방향 가져오기 (궁성 내에서 대각선 이동용)
function getPalaceDiagonalMoves(row, col) {
    const moves = [];
    const allDiags = [...PALACE_DIAGONALS.top, ...PALACE_DIAGONALS.bottom];
    for (const d of allDiags) {
        if (d.from[0] === row && d.from[1] === col) {
            // 1칸 대각선만 (2칸짜리 제외 - 차/포 전용)
            if (Math.abs(d.to[0] - row) <= 1 && Math.abs(d.to[1] - col) <= 1) {
                moves.push({ row: d.to[0], col: d.to[1] });
            }
        }
    }
    return moves;
}

// 왕(King/將) 이동: 궁성 내에서 1칸 (상하좌우 + 궁성 대각선)
function getKingMoves(row, col, player) {
    const moves = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 상하좌우

    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInPalace(nr, nc, player)) {
            const target = board[nr][nc];
            if (!target || target.player !== player) {
                moves.push({ row: nr, col: nc });
            }
        }
    }

    // 궁성 대각선 이동
    const diagMoves = getPalaceDiagonalMoves(row, col);
    for (const m of diagMoves) {
        if (isInPalace(m.row, m.col, player)) {
            const target = board[m.row][m.col];
            if (!target || target.player !== player) {
                moves.push(m);
            }
        }
    }

    return moves;
}

// 사(Guard/士) 이동: 왕과 동일 (궁성 내 1칸)
function getGuardMoves(row, col, player) {
    return getKingMoves(row, col, player);
}

// 차(Chariot/車) 이동: 직선 무제한 + 궁성 대각선
function getChariotMoves(row, col, player) {
    const moves = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 상하좌우

    for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        while (inBounds(nr, nc)) {
            const target = board[nr][nc];
            if (!target) {
                moves.push({ row: nr, col: nc });
            } else {
                if (target.player !== player) {
                    moves.push({ row: nr, col: nc });
                }
                break;
            }
            nr += dr;
            nc += dc;
        }
    }

    // 궁성 대각선 이동 (궁성 안에 있을 때)
    if (isInAnyPalace(row, col)) {
        const palaceDiagMoves = getChariotPalaceDiagonalMoves(row, col, player);
        moves.push(...palaceDiagMoves);
    }

    return moves;
}

// 차의 궁성 대각선 이동
function getChariotPalaceDiagonalMoves(row, col, player) {
    const moves = [];

    // 궁성 꼭짓점 또는 중심에서만 대각선 이동 가능
    const palace = (row <= 2) ? PALACE_DIAGONALS.top : PALACE_DIAGONALS.bottom;

    for (const d of palace) {
        if (d.from[0] === row && d.from[1] === col) {
            const tr = d.to[0];
            const tc = d.to[1];
            const dr = Math.sign(tr - row);
            const dc = Math.sign(tc - col);

            // 1칸 대각선
            if (Math.abs(tr - row) === 1) {
                const target = board[tr][tc];
                if (!target || target.player !== player) {
                    moves.push({ row: tr, col: tc });
                }
            }
            // 2칸 대각선 (꼭짓점 간) - 중간에 기물 확인
            if (Math.abs(tr - row) === 2) {
                const midR = row + dr;
                const midC = col + dc;
                const midPiece = board[midR][midC];
                if (!midPiece) {
                    const target = board[tr][tc];
                    if (!target || target.player !== player) {
                        moves.push({ row: tr, col: tc });
                    }
                }
            }
        }
    }

    return moves;
}

// 포(Cannon/包) 이동: 직선으로 정확히 1개 기물을 뛰어넘어야 함
// 뛰어넘는 기물(포대)이 포이면 안됨, 잡는 대상이 포여도 안됨
function getCannonMoves(row, col, player) {
    const moves = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        let jumped = false;
        let jumpedPiece = null;

        while (inBounds(nr, nc)) {
            const target = board[nr][nc];

            if (!jumped) {
                // 아직 뛰어넘지 않음 - 기물을 찾아야 함
                if (target) {
                    // 포는 다른 포를 뛰어넘을 수 없음
                    if (target.type === CANNON) break;
                    jumped = true;
                    jumpedPiece = target;
                }
            } else {
                // 뛰어넘은 후
                if (!target) {
                    moves.push({ row: nr, col: nc });
                } else {
                    // 포는 포를 잡을 수 없음
                    if (target.type !== CANNON && target.player !== player) {
                        moves.push({ row: nr, col: nc });
                    }
                    break;
                }
            }
            nr += dr;
            nc += dc;
        }
    }

    // 궁성 대각선에서의 포 이동
    if (isInAnyPalace(row, col)) {
        const palaceDiagMoves = getCannonPalaceDiagonalMoves(row, col, player);
        moves.push(...palaceDiagMoves);
    }

    return moves;
}

// 포의 궁성 대각선 이동 (꼭짓점에서 대각선 반대편으로, 중심 기물 뛰어넘기)
function getCannonPalaceDiagonalMoves(row, col, player) {
    const moves = [];
    const palace = (row <= 2) ? PALACE_DIAGONALS.top : PALACE_DIAGONALS.bottom;

    // 2칸 대각선만 해당 (꼭짓점 → 꼭짓점, 중간에 중심 기물)
    for (const d of palace) {
        if (d.from[0] === row && d.from[1] === col && Math.abs(d.to[0] - row) === 2) {
            const midR = (row + d.to[0]) / 2;
            const midC = (col + d.to[1]) / 2;
            const midPiece = board[midR][midC];

            // 중간에 기물이 있어야 하고, 포가 아니어야 함
            if (midPiece && midPiece.type !== CANNON) {
                const target = board[d.to[0]][d.to[1]];
                if (!target) {
                    moves.push({ row: d.to[0], col: d.to[1] });
                } else if (target.player !== player && target.type !== CANNON) {
                    moves.push({ row: d.to[0], col: d.to[1] });
                }
            }
        }
    }

    return moves;
}

// 마(Horse/馬) 이동: 1칸 직선 + 1칸 대각선 (직선 경로에 기물 있으면 차단)
function getHorseMoves(row, col, player) {
    const moves = [];

    // [직선방향dr, 직선방향dc, 대각선dr, 대각선dc]
    const paths = [
        [-1, 0, -1, -1], // 위로 1칸 → 왼쪽 위 대각선
        [-1, 0, -1, 1],  // 위로 1칸 → 오른쪽 위 대각선
        [1, 0, 1, -1],   // 아래로 1칸 → 왼쪽 아래 대각선
        [1, 0, 1, 1],    // 아래로 1칸 → 오른쪽 아래 대각선
        [0, -1, -1, -1], // 왼쪽 1칸 → 왼쪽 위 대각선
        [0, -1, 1, -1],  // 왼쪽 1칸 → 왼쪽 아래 대각선
        [0, 1, -1, 1],   // 오른쪽 1칸 → 오른쪽 위 대각선
        [0, 1, 1, 1]     // 오른쪽 1칸 → 오른쪽 아래 대각선
    ];

    for (const [dr1, dc1, dr2, dc2] of paths) {
        // 직선 경로 확인
        const midR = row + dr1;
        const midC = col + dc1;
        if (!inBounds(midR, midC)) continue;

        // 직선 경로에 기물이 있으면 차단 (쐐기)
        if (board[midR][midC]) continue;

        // 대각선 도착지
        const nr = row + dr1 + dr2;
        const nc = col + dc1 + dc2;
        if (!inBounds(nr, nc)) continue;

        const target = board[nr][nc];
        if (!target || target.player !== player) {
            moves.push({ row: nr, col: nc });
        }
    }

    return moves;
}

// 상(Elephant/象) 이동: 1칸 직선 + 2칸 대각선 (경로에 기물 있으면 차단)
function getElephantMoves(row, col, player) {
    const moves = [];

    // [직선dr, 직선dc, 대각선1dr, 대각선1dc, 대각선2dr, 대각선2dc]
    const paths = [
        [-1, 0, -1, -1, -1, -1], // 위 → 좌상 → 좌상
        [-1, 0, -1, 1, -1, 1],   // 위 → 우상 → 우상
        [1, 0, 1, -1, 1, -1],    // 아래 → 좌하 → 좌하
        [1, 0, 1, 1, 1, 1],      // 아래 → 우하 → 우하
        [0, -1, -1, -1, -1, -1], // 왼쪽 → 좌상 → 좌상
        [0, -1, 1, -1, 1, -1],   // 왼쪽 → 좌하 → 좌하
        [0, 1, -1, 1, -1, 1],    // 오른쪽 → 우상 → 우상
        [0, 1, 1, 1, 1, 1]       // 오른쪽 → 우하 → 우하
    ];

    for (const [dr1, dc1, dr2, dc2, dr3, dc3] of paths) {
        // 1단계: 직선 1칸
        const mid1R = row + dr1;
        const mid1C = col + dc1;
        if (!inBounds(mid1R, mid1C)) continue;
        if (board[mid1R][mid1C]) continue; // 차단

        // 2단계: 대각선 1칸
        const mid2R = mid1R + dr2;
        const mid2C = mid1C + dc2;
        if (!inBounds(mid2R, mid2C)) continue;
        if (board[mid2R][mid2C]) continue; // 차단

        // 3단계: 대각선 1칸 더 (최종 도착)
        const nr = mid2R + dr3;
        const nc = mid2C + dc3;
        if (!inBounds(nr, nc)) continue;

        const target = board[nr][nc];
        if (!target || target.player !== player) {
            moves.push({ row: nr, col: nc });
        }
    }

    return moves;
}

// 졸(Soldier/卒) 이동: 앞으로 또는 옆으로 1칸
// 부엉이(위쪽)는 아래로 전진, 샐리(아래쪽)는 위로 전진
function getSoldierMoves(row, col, player) {
    const moves = [];
    const forward = player === CELESTE ? 1 : -1; // 전진 방향

    // 전진
    const dirs = [
        [forward, 0], // 앞
        [0, -1],      // 왼쪽
        [0, 1]        // 오른쪽
    ];

    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (inBounds(nr, nc)) {
            const target = board[nr][nc];
            if (!target || target.player !== player) {
                moves.push({ row: nr, col: nc });
            }
        }
    }

    // 궁성 안에서 대각선 이동도 가능 (전진 방향 대각선만)
    if (isInAnyPalace(row, col)) {
        const diagMoves = getPalaceDiagonalMoves(row, col);
        for (const m of diagMoves) {
            const dr = m.row - row;
            // 전진 방향이거나 좌우 대각선만 허용
            if (dr === forward || dr === 0) {
                const target = board[m.row][m.col];
                if (!target || target.player !== player) {
                    // 중복 확인
                    if (!moves.some(mv => mv.row === m.row && mv.col === m.col)) {
                        moves.push(m);
                    }
                }
            }
        }
    }

    return moves;
}

// 기물별 이동 가능 위치 계산 (체크 고려하지 않음)
function getRawMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    switch (piece.type) {
        case KING: return getKingMoves(row, col, piece.player);
        case GUARD: return getGuardMoves(row, col, piece.player);
        case CHARIOT: return getChariotMoves(row, col, piece.player);
        case CANNON: return getCannonMoves(row, col, piece.player);
        case HORSE: return getHorseMoves(row, col, piece.player);
        case ELEPHANT: return getElephantMoves(row, col, piece.player);
        case SOLDIER: return getSoldierMoves(row, col, piece.player);
        default: return [];
    }
}

// ============================================================
// 체크 / 합법적 이동 검사
// ============================================================

// 왕 위치 찾기
function findKing(player) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (p && p.player === player && p.type === KING) {
                return { row: r, col: c };
            }
        }
    }
    return null; // 왕이 없으면 (잡힌 경우)
}

// 특정 플레이어가 체크 상태인지 확인
function isInCheck(player) {
    const kingPos = findKing(player);
    if (!kingPos) return true; // 왕이 없으면 체크 상태

    const opponent = player === CELESTE ? SALLY : CELESTE;

    // 상대 모든 기물의 이동 가능 위치에 왕이 있는지 확인
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (p && p.player === opponent) {
                const moves = getRawMoves(r, c);
                if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 합법적 이동 (체크를 벗어나는 이동만 허용)
function getLegalMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const rawMoves = getRawMoves(row, col);
    const legalMoves = [];

    for (const move of rawMoves) {
        // 임시로 이동 실행
        const capturedPiece = board[move.row][move.col];
        board[move.row][move.col] = piece;
        board[row][col] = null;

        // 이동 후 자기 왕이 체크 상태가 아닌지 확인
        if (!isInCheck(piece.player)) {
            legalMoves.push(move);
        }

        // 이동 되돌리기
        board[row][col] = piece;
        board[move.row][move.col] = capturedPiece;
    }

    return legalMoves;
}

// 플레이어가 합법적 이동이 하나라도 있는지 확인
function hasAnyLegalMove(player) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (p && p.player === player) {
                const moves = getLegalMoves(r, c);
                if (moves.length > 0) return true;
            }
        }
    }
    return false;
}

// ============================================================
// 비장 (빅장) 검사 - 두 왕이 같은 열에서 마주보고 사이에 기물 없음
// ============================================================
function isBikjang() {
    const celesteKing = findKing(CELESTE);
    const sallyKing = findKing(SALLY);

    if (!celesteKing || !sallyKing) return false;

    // 같은 열에 있어야 함
    if (celesteKing.col !== sallyKing.col) return false;

    // 사이에 기물이 없어야 함
    const minRow = Math.min(celesteKing.row, sallyKing.row);
    const maxRow = Math.max(celesteKing.row, sallyKing.row);

    for (let r = minRow + 1; r < maxRow; r++) {
        if (board[r][celesteKing.col]) return false;
    }

    return true;
}

// ============================================================
// UI 업데이트
// ============================================================
function updateUI() {
    const p1 = document.getElementById('player1');
    const p2 = document.getElementById('player2');

    if (p1) p1.classList.toggle('active', currentPlayer === CELESTE && !isGameOver);
    if (p2) p2.classList.toggle('active', currentPlayer === SALLY && !isGameOver);

    // 점수 표시 (잡은 기물 수)
    const s1 = document.getElementById('score1');
    const s2 = document.getElementById('score2');
    if (s1) s1.textContent = capturedPieces[CELESTE].length;
    if (s2) s2.textContent = capturedPieces[SALLY].length;

    // 잡은 기물 이모지 표시
    const c1 = document.getElementById('captured1');
    const c2 = document.getElementById('captured2');
    if (c1) c1.textContent = capturedPieces[CELESTE].map(p => PIECE_EMOJI[p.player][p.type]).join(' ');
    if (c2) c2.textContent = capturedPieces[SALLY].map(p => PIECE_EMOJI[p.player][p.type]).join(' ');

    if (!isGameOver) {
        const name = currentPlayer === CELESTE ? '부엉이' : '샐리';
        const emoji = currentPlayer === CELESTE ? '🦁' : '🦊';
        updateMessage(`${name}의 차례입니다! ${emoji}`);
    }
}

function updateMessage(msg) {
    const el = document.getElementById('messageArea');
    if (el) el.textContent = msg;
}

// ============================================================
// 게임 종료
// ============================================================
function endGame(winner) {
    isGameOver = true;

    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerText = document.getElementById('winnerText');
    const finalScore = document.getElementById('finalScore');

    if (winner === CELESTE) {
        if (winnerAvatar) winnerAvatar.innerHTML = '<img src="../../assets/celeste.png" alt="winner">';
        if (winnerText) winnerText.textContent = '🎉 부엉이 승리! 🎉';
        scores[CELESTE]++;
    } else if (winner === SALLY) {
        if (winnerAvatar) winnerAvatar.innerHTML = '<img src="../../assets/sally.png" alt="winner">';
        if (winnerText) winnerText.textContent = '🎉 샐리 승리! 🎉';
        scores[SALLY]++;
    } else {
        if (winnerAvatar) winnerAvatar.innerHTML = '🤝';
        if (winnerText) winnerText.textContent = '비장! 무승부! 🤝';
    }

    if (finalScore) {
        finalScore.textContent = `부엉이 ${scores[CELESTE]} : ${scores[SALLY]} 샐리`;
    }

    if (modal) modal.classList.add('show');
    createConfetti();

    // 승리 동영상 표시 (무승부가 아닌 경우)
    if (winner !== 0 && typeof showVictoryVideo === 'function') {
        const winnerName = winner === CELESTE ? 'celeste' : 'sally';
        setTimeout(() => showVictoryVideo(winnerName), 800);
    }
}

function closeModal() {
    const modal = document.getElementById('gameOverModal');
    if (modal) modal.classList.remove('show');
}

function showModal(winner) {
    endGame(winner);
}

// ============================================================
// 축하 이펙트
// ============================================================
function createConfetti() {
    const container = document.getElementById('confetti');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
        container.appendChild(confetti);
    }
}

// ============================================================
// DOM 로드 후 게임 시작
// ============================================================
document.addEventListener('DOMContentLoaded', initGame);
