// 윷놀이 게임 로직 - 완전 리라이트
// 부엉이(Celeste, P1) vs 샐리(Sally, P2)
const P1 = 0, P2 = 1;
const CELESTE = P1, SALLY = P2;
const FINISH = 999;

// ===== 윷판 노드 위치 (29개 노드, 퍼센트 기반) =====
const nodes = [
    { id: 0, x: 92, y: 92, isCorner: true },   // 출발/도착점
    { id: 1, x: 92, y: 75 }, { id: 2, x: 92, y: 58 }, { id: 3, x: 92, y: 42 }, { id: 4, x: 92, y: 25 },
    { id: 5, x: 92, y: 8, isCorner: true },    // 우상단 코너
    { id: 6, x: 75, y: 8 }, { id: 7, x: 58, y: 8 }, { id: 8, x: 42, y: 8 }, { id: 9, x: 25, y: 8 },
    { id: 10, x: 8, y: 8, isCorner: true },    // 좌상단 코너
    { id: 11, x: 8, y: 25 }, { id: 12, x: 8, y: 42 }, { id: 13, x: 8, y: 58 }, { id: 14, x: 8, y: 75 },
    { id: 15, x: 8, y: 92, isCorner: true },   // 좌하단 코너
    { id: 16, x: 25, y: 92 }, { id: 17, x: 42, y: 92 }, { id: 18, x: 58, y: 92 }, { id: 19, x: 75, y: 92 },
    // 오른쪽 대각선 (우상단 → 중앙)
    { id: 20, x: 75, y: 25 }, { id: 21, x: 60, y: 40 }, { id: 22, x: 50, y: 50, isCenter: true },
    { id: 23, x: 40, y: 60 }, { id: 24, x: 25, y: 75 },
    // 왼쪽 대각선 (좌상단 → 중앙)
    { id: 25, x: 25, y: 25 }, { id: 26, x: 40, y: 40 }, { id: 27, x: 60, y: 60 }, { id: 28, x: 75, y: 75 }
];

// ===== 경로 정의 =====
// 바깥 경로: 0→1→2→3→4→5→6→7→8→9→10→11→12→13→14→15→16→17→18→19→finish
// 오른쪽 대각선: 5→20→21→22→23→24→15 (이후 바깥 경로)
// 왼쪽 대각선: 10→25→26→22→27→28→finish

// 각 pathType별 다음 노드 매핑
const nextNode = {
    'outer': {
        0: 1, 1: 2, 2: 3, 3: 4, 4: 5,
        5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
        10: 11, 11: 12, 12: 13, 13: 14, 14: 15,
        15: 16, 16: 17, 17: 18, 18: 19, 19: FINISH
    },
    'right-diag': {
        // 5에서 지름길 진입 → 20→21→22→23→24→15 → 이후 바깥
        5: 20, 20: 21, 21: 22, 22: 23, 23: 24, 24: 15,
        15: 16, 16: 17, 17: 18, 18: 19, 19: FINISH
    },
    'left-diag': {
        // 10에서 지름길 진입 → 25→26→22→27→28→finish
        10: 25, 25: 26, 26: 22, 22: 27, 27: 28, 28: FINISH
    }
};

// 빽도용 역방향 경로 (pathType별)
const prevNode = {
    'outer': {
        1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
        6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
        11: 10, 12: 11, 13: 12, 14: 13, 15: 14,
        16: 15, 17: 16, 18: 17, 19: 18, 0: 19
    },
    'right-diag': {
        20: 5, 21: 20, 22: 21, 23: 22, 24: 23, 15: 24,
        16: 15, 17: 16, 18: 17, 19: 18
    },
    'left-diag': {
        25: 10, 26: 25, 22: 26, 27: 22, 28: 27
    }
};

// 윷 결과 이름
const yutNames = { 1: "도", 2: "개", 3: "걸", 4: "윷", 5: "모", "-1": "빽도" };
const yutEmojis = { 1: "", 2: "", 3: "", 4: " 🎉", 5: " 🎊", "-1": " 😱" };

// ===== 게임 상태 =====
let gameState = null;

// ===== 초기화 =====
function initGame() {
    const boardEl = document.getElementById('board');

    // 기존 노드 제거 (리셋 시 중복 방지)
    boardEl.querySelectorAll('.node').forEach(el => el.remove());

    // 노드 생성
    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `node${node.isCorner ? ' corner' : ''}${node.isCenter ? ' center' : ''}`;
        el.style.left = node.x + '%';
        el.style.top = node.y + '%';
        el.dataset.nodeId = node.id;
        boardEl.appendChild(el);
    });

    // 보드 클릭 시 선택 취소 (다른 말 선택 가능)
    boardEl.onclick = (e) => {
        // 말이나 목적지를 클릭한 경우가 아니면 선택 취소
        if (!e.target.closest('.piece') &&
            !e.target.closest('.waiting-piece') &&
            !e.target.closest('.destination-preview')) {
            if (gameState && gameState.movesAvailable.length > 0 && !gameState.isAnimating) {
                removeDestinationPreview();
                updateMessage('말을 클릭하여 이동하세요!');
                highlightMovablePieces();
            }
        }
    };

    resetGame();

    // 윷 초기 상태
    for (let i = 0; i < 4; i++) {
        const stick = document.getElementById(`stick-${i}`);
        stick.style.transform = `rotateX(0deg) rotateZ(${(Math.random() * 10) - 5}deg)`;
    }
}

function resetGame() {
    gameState = {
        turn: P1,
        pieces: {
            [P1]: Array(4).fill(null).map((_, i) => ({
                id: i, loc: -1, finished: false, pathType: 'outer'
            })),
            [P2]: Array(4).fill(null).map((_, i) => ({
                id: i, loc: -1, finished: false, pathType: 'outer'
            }))
        },
        movesAvailable: [],
        isAnimating: false
    };

    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('move-history').innerHTML = '';
    document.getElementById('p1-score').innerText = '0/4';
    document.getElementById('p2-score').innerText = '0/4';
    updateMessage('부엉이가 먼저 시작합니다! 윷을 던져주세요 🦉');
    renderPieces();
    enableThrowBtn(true);
    updatePlayerUI();
}

// ===== 윷 던지기 =====
function generateYutResult() {
    // 각 윷: 60% 앞면(flat), 40% 뒷면(round)
    // 도(1 flat): ~15%, 개(2): ~35%, 걸(3): ~30%, 윷(4): ~13%, 모(0 flat=5): ~7%
    let flatCount = 0;
    for (let i = 0; i < 4; i++) {
        if (Math.random() < 0.6) flatCount++;
    }

    if (flatCount === 0) return 5; // 모
    if (flatCount === 1) {
        // 15% 확률로 빽도 (도가 나올 뻔한 경우)
        if (Math.random() < 0.15) return -1; // 빽도
        return 1; // 도
    }
    return flatCount; // 개(2), 걸(3), 윷(4)
}

function throwYut() {
    if (gameState.isAnimating) return;
    enableThrowBtn(false);

    const sticks = [], shadows = [];
    for (let i = 0; i < 4; i++) {
        sticks.push(document.getElementById(`stick-${i}`));
        shadows.push(document.getElementById(`shadow-${i}`));
    }

    // 던지기 애니메이션 시작
    sticks.forEach(el => {
        el.classList.remove('anim-jump');
        void el.offsetWidth; // reflow 트리거
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
        const result = generateYutResult();

        // 윷 시각적 결과 표시 (flat 개수에 맞게)
        let flatsToShow;
        if (result === 5) flatsToShow = 0;        // 모: 0개 flat
        else if (result === -1) flatsToShow = 1;   // 빽도: 1개 flat (특수)
        else flatsToShow = result;                  // 도~윷: 1~4개 flat

        // 랜덤 순서로 flat/round 배치
        const flatIndices = [];
        const indices = [0, 1, 2, 3];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        for (let i = 0; i < flatsToShow; i++) flatIndices.push(indices[i]);

        sticks.forEach((stick, idx) => {
            const isFlat = flatIndices.includes(idx);
            stick.innerHTML = `<svg class="yut-svg"><use href="${isFlat ? '#yut-flat' : '#yut-round'}"></use></svg>`;
            const landZ = (Math.random() * 20) - 10;
            stick.style.transition = 'transform 0.15s ease-out';
            stick.style.transform = `translateY(0) rotateX(0deg) rotateZ(${landZ}deg) scale(1)`;
        });

        // 결과 저장
        gameState.movesAvailable.push(result);

        // 결과 표시
        const hist = document.getElementById('move-history');
        const resultName = yutNames[result];
        const emoji = yutEmojis[result];
        hist.innerHTML = `<span style="color:#5d4037; font-size:2rem;">${resultName}!${emoji}</span>`;

        if (result === -1) {
            // 빽도 특별 메시지
            playBackdoSound();
            updateMessage('빽도! 1칸 뒤로! 😱');
            // 빽도는 추가 던지기 없음, 바로 이동 단계
            setTimeout(() => {
                if (canAnyPieceMove()) {
                    highlightMovablePieces();
                } else {
                    // 빽도인데 이동 가능한 말이 없으면 패스
                    updateMessage('빽도! 이동할 수 있는 말이 없어요 😅');
                    gameState.movesAvailable = [];
                    setTimeout(() => switchTurn(), 1000);
                }
            }, 600);
        } else if (result === 4 || result === 5) {
            // 윷/모: 한 번 더 던지기
            playSpecialSound();
            const extra = result === 4 ? '윷! 🎉 한 번 더!' : '모! 🎊 한 번 더!';
            updateMessage(extra);
            enableThrowBtn(true, "한 번 더!");
        } else {
            // 도/개/걸: 이동 단계
            updateMessage('말을 클릭하여 이동하세요!');
            highlightMovablePieces();
        }

        setTimeout(() => {
            sticks.forEach(el => el.classList.remove('anim-jump'));
            shadows.forEach(el => el.classList.remove('anim-shadow'));
        }, 200);
    }, 650);
}

// ===== 이동 가능 여부 체크 =====
function canAnyPieceMove() {
    const player = gameState.turn;
    const pieces = gameState.pieces[player];
    const moves = gameState.movesAvailable;

    for (const move of moves) {
        for (const piece of pieces) {
            if (piece.finished) continue;
            if (canPieceMove(piece, move)) return true;
        }
    }
    return false;
}

function canPieceMove(piece, steps) {
    if (piece.finished) return false;

    if (steps === -1) {
        // 빽도
        if (piece.loc === -1) return false; // 대기 중인 말은 빽도 불가
        if (piece.loc === 0) return true;   // 출발점 → 대기로 돌아감
        // 역방향으로 갈 수 있는지 확인
        const rev = prevNode[piece.pathType];
        return rev && rev[piece.loc] !== undefined;
    }

    // 양수 이동: 대기(-1) 포함 항상 가능
    return true;
}

// ===== 목적지 계산 =====
function calculateDestination(piece, steps) {
    if (steps === -1) {
        // 빽도 처리
        return calculateBackdo(piece);
    }

    let currentLoc = piece.loc;
    let pathType = piece.pathType;
    let newPathType = pathType;

    // 대기 중인 말 → 출발점(0)으로
    if (currentLoc === -1) {
        currentLoc = 0;
        newPathType = 'outer';
        steps--;
    }

    for (let i = 0; i < steps; i++) {
        if (currentLoc === FINISH) break;

        // 코너에서 지름길 진입 판단 (출발 위치일 때만)
        if (i === 0 && piece.loc !== -1) {
            // 5번 코너: 오른쪽 대각선
            if (currentLoc === 5 && pathType === 'outer') {
                newPathType = 'right-diag';
            }
            // 10번 코너: 왼쪽 대각선
            if (currentLoc === 10 && pathType === 'outer') {
                newPathType = 'left-diag';
            }
        }

        // 현재 pathType의 경로에서 다음 노드 찾기
        const pathMap = nextNode[newPathType];
        if (pathMap && pathMap[currentLoc] !== undefined) {
            currentLoc = pathMap[currentLoc];
        } else {
            // 해당 pathType 경로에 없으면 outer 경로 사용
            const outerMap = nextNode['outer'];
            if (outerMap && outerMap[currentLoc] !== undefined) {
                currentLoc = outerMap[currentLoc];
                newPathType = 'outer';
            } else {
                currentLoc = FINISH;
                break;
            }
        }
    }

    return { loc: currentLoc, pathType: newPathType };
}

function calculateBackdo(piece) {
    if (piece.loc === 0) {
        // 출발점에서 빽도 → 대기(-1)로 돌아감
        return { loc: -1, pathType: 'outer' };
    }

    const rev = prevNode[piece.pathType];
    if (rev && rev[piece.loc] !== undefined) {
        return { loc: rev[piece.loc], pathType: piece.pathType };
    }

    // fallback: outer 역방향 시도
    const outerRev = prevNode['outer'];
    if (outerRev && outerRev[piece.loc] !== undefined) {
        return { loc: outerRev[piece.loc], pathType: 'outer' };
    }

    // 더 이상 뒤로 갈 수 없으면 대기로
    return { loc: -1, pathType: 'outer' };
}

// ===== 이동 경로 노드 목록 (애니메이션용) =====
function getPathNodes(piece, steps) {
    const pathNodes = [];
    if (steps === -1) {
        // 빽도: 한 칸만
        const dest = calculateBackdo(piece);
        if (dest.loc !== -1 && dest.loc !== FINISH) pathNodes.push(dest.loc);
        return pathNodes;
    }

    let currentLoc = piece.loc;
    let pathType = piece.pathType;
    let newPathType = pathType;

    if (currentLoc === -1) {
        currentLoc = 0;
        newPathType = 'outer';
        pathNodes.push(0);
        steps--;
    }

    for (let i = 0; i < steps; i++) {
        if (currentLoc === FINISH) break;

        if (i === 0 && piece.loc !== -1) {
            if (currentLoc === 5 && pathType === 'outer') newPathType = 'right-diag';
            if (currentLoc === 10 && pathType === 'outer') newPathType = 'left-diag';
        }

        const pathMap = nextNode[newPathType];
        if (pathMap && pathMap[currentLoc] !== undefined) {
            currentLoc = pathMap[currentLoc];
        } else {
            const outerMap = nextNode['outer'];
            if (outerMap && outerMap[currentLoc] !== undefined) {
                currentLoc = outerMap[currentLoc];
                newPathType = 'outer';
            } else {
                break;
            }
        }
        if (currentLoc !== FINISH) pathNodes.push(currentLoc);
    }

    return pathNodes;
}

// ===== UI: 이동 가능 말 하이라이트 =====
function highlightMovablePieces() {
    clearSelections();

    const player = gameState.turn;
    const pieces = gameState.pieces[player];
    const moves = gameState.movesAvailable;

    // 이동 가능한 말만 하이라이트
    const movablePieceIds = new Set();
    for (const move of moves) {
        for (const piece of pieces) {
            if (!piece.finished && canPieceMove(piece, move)) {
                movablePieceIds.add(piece.id);
            }
        }
    }

    if (movablePieceIds.size === 0) {
        // 이동 가능한 말이 없으면 패스
        updateMessage('이동할 수 있는 말이 없어요! 😅');
        gameState.movesAvailable = [];
        setTimeout(() => switchTurn(), 1200);
        return;
    }

    // 이동 가능한 말에 selectable 클래스 추가
    document.querySelectorAll(`.piece.p${player + 1}, .waiting-piece.p${player + 1}`).forEach(el => {
        const pid = parseInt(el.dataset.id);
        if (movablePieceIds.has(pid)) {
            el.classList.add('selectable');
            el.onclick = (e) => handlePieceClick(e, el);
        }
    });
}

function clearSelections() {
    document.querySelectorAll('.selectable').forEach(el => {
        el.classList.remove('selectable');
        el.onclick = null;
    });
    // 목적지 프리뷰 제거
    document.querySelectorAll('.destination-preview').forEach(el => el.remove());
}

// ===== 말 클릭 처리 =====
function handlePieceClick(e, domElement) {
    e.stopPropagation();
    if (gameState.movesAvailable.length === 0) return;
    if (gameState.isAnimating) return;

    const pid = parseInt(domElement.dataset.id);
    const piece = gameState.pieces[gameState.turn].find(p => p.id === pid);
    if (!piece || piece.finished) return;

    // 이 말로 사용 가능한 이동만 필터
    const validMoves = [];
    gameState.movesAvailable.forEach((move, index) => {
        if (canPieceMove(piece, move)) {
            validMoves.push({ move, index });
        }
    });

    if (validMoves.length === 0) return;

    // 선택된 말 강조
    clearSelections();
    domElement.classList.add('selectable');

    // 모든 가능한 목적지 표시
    showAllDestinations(piece, validMoves);

    // 메시지 업데이트
    const moveNames = validMoves.map(v => yutNames[v.move]).join(', ');
    updateMessage(`🎯 갈 수 있는 칸을 클릭하세요! (${moveNames})`);
}

// ===== 모든 가능한 목적지 표시 =====
function showAllDestinations(piece, validMoves) {
    removeDestinationPreview();

    validMoves.forEach(({ move, index }) => {
        const dest = calculateDestination(piece, move);
        if (dest.loc === -1 || dest.loc === FINISH) {
            // 대기로 복귀하거나 완주하는 경우 - 특별 표시
            if (dest.loc === FINISH) {
                showFinishPreview(piece, move, index);
            }
            return;
        }

        const node = nodes.find(n => n.id === dest.loc);
        if (!node) return;

        const preview = document.createElement('div');
        preview.className = 'destination-preview clickable';
        preview.style.left = node.x + '%';
        preview.style.top = node.y + '%';
        preview.dataset.move = move;
        preview.dataset.moveIndex = index;
        preview.dataset.pieceId = piece.id;

        // 이동 칸 수 표시
        const label = document.createElement('span');
        label.className = 'destination-label';
        label.innerText = yutNames[move];
        preview.appendChild(label);

        // 목적지 클릭 시 이동 실행
        preview.onclick = (ev) => {
            ev.stopPropagation();
            const m = parseInt(preview.dataset.move);
            const idx = parseInt(preview.dataset.moveIndex);
            removeDestinationPreview();
            executeMove(piece, m, idx);
        };

        document.getElementById('board').appendChild(preview);
    });
}

// 완주 표시 (특별 UI)
function showFinishPreview(piece, move, index) {
    const finishIndicator = document.createElement('div');
    finishIndicator.className = 'finish-indicator';
    finishIndicator.innerHTML = `🏁 ${yutNames[move]}`;
    finishIndicator.onclick = (ev) => {
        ev.stopPropagation();
        removeDestinationPreview();
        executeMove(piece, move, index);
    };

    // 완주 표시를 메시지 영역 근처에 표시
    const msgArea = document.getElementById('messageArea');
    msgArea.innerHTML = `<span style="cursor:pointer" onclick="finishMove(${piece.id}, ${move}, ${index})">🏁 완주! ${yutNames[move]} 클릭하세요!</span>`;
}

// 완주 이동 헬퍼
function finishMove(pieceId, move, index) {
    const piece = gameState.pieces[gameState.turn].find(p => p.id === pieceId);
    if (piece) {
        removeDestinationPreview();
        executeMove(piece, move, index);
    }
}

function showMoveSelection(piece, validMoves) {
    // 이제 showAllDestinations로 대체되어 거의 사용 안 함
    // 하지만 백업용으로 유지
    showAllDestinations(piece, validMoves);
}

// ===== 목적지 프리뷰 =====
function showDestinationPreview(piece, steps) {
    removeDestinationPreview();
    const dest = calculateDestination(piece, steps);
    if (dest.loc === -1 || dest.loc === FINISH) return;

    const node = nodes.find(n => n.id === dest.loc);
    if (!node) return;

    const preview = document.createElement('div');
    preview.className = 'destination-preview';
    preview.style.left = node.x + '%';
    preview.style.top = node.y + '%';
    document.getElementById('board').appendChild(preview);
}

function removeDestinationPreview() {
    document.querySelectorAll('.destination-preview').forEach(el => el.remove());
    document.querySelectorAll('.finish-indicator').forEach(el => el.remove());
}

// ===== 이동 실행 =====
async function executeMove(piece, steps, moveIndex) {
    if (gameState.isAnimating) return;
    gameState.isAnimating = true;

    playMoveSound();

    // 이동 사용 처리
    gameState.movesAvailable.splice(moveIndex, 1);

    // 업기: 같은 위치의 내 말들을 함께 이동
    const playerPieces = gameState.pieces[gameState.turn];
    let movingGroup;

    if (piece.loc === -1) {
        movingGroup = [piece];
    } else {
        movingGroup = playerPieces.filter(p => !p.finished && p.loc === piece.loc);
    }

    const startLoc = piece.loc;
    const dest = calculateDestination(piece, steps);
    const endLoc = dest.loc;
    const newPathType = dest.pathType;

    // 이동 경로 노드 (애니메이션용)
    const pathNodeIds = getPathNodes(piece, steps);

    // 애니메이션 실행
    await animateMove(movingGroup, startLoc, pathNodeIds, endLoc);

    // 상대방 잡기 체크
    let caught = false;
    if (endLoc !== FINISH && endLoc !== -1) {
        const opponent = gameState.turn === P1 ? P2 : P1;
        const oppPiecesAtLoc = gameState.pieces[opponent].filter(
            opp => !opp.finished && opp.loc === endLoc
        );
        if (oppPiecesAtLoc.length > 0) {
            caught = true;
            oppPiecesAtLoc.forEach(opp => {
                opp.loc = -1;
                opp.pathType = 'outer';
            });
            playCatchSound();
        }
    }

    // 위치 & 경로 업데이트
    movingGroup.forEach(p => {
        p.loc = endLoc;
        p.pathType = newPathType;
        if (endLoc === FINISH) p.finished = true;
    });

    // UI 정리
    clearSelections();
    renderPieces();

    gameState.isAnimating = false;

    // 승리/턴 체크
    checkWinState(caught);
}

// ===== 이동 애니메이션 =====
async function animateMove(movingGroup, fromLoc, pathNodeIds, endLoc) {
    // 보드 위 말 DOM 요소 찾기
    const player = gameState.turn;
    const pieceEls = [];

    movingGroup.forEach(p => {
        let el;
        if (fromLoc === -1) {
            el = document.querySelector(`.waiting-piece.p${player + 1}[data-id="${p.id}"]`);
        } else {
            el = document.querySelector(`.piece.p${player + 1}[data-id="${p.id}"]`);
        }
        if (el) pieceEls.push(el);
    });

    if (pieceEls.length === 0) return;

    // 각 중간 노드를 거쳐 이동
    for (const nodeId of pathNodeIds) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        pieceEls.forEach(el => {
            el.style.transition = 'left 0.12s ease, top 0.12s ease';
            el.style.left = `calc(${node.x}%)`;
            el.style.top = `calc(${node.y}%)`;
            el.style.position = 'absolute';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.zIndex = '50';
        });

        await sleep(130);
    }

    // 최종 위치 (finish이면 사라지는 효과)
    if (endLoc === FINISH) {
        pieceEls.forEach(el => {
            el.style.transition = 'all 0.3s ease';
            el.style.transform = 'translate(-50%, -50%) scale(0)';
            el.style.opacity = '0';
        });
        await sleep(300);
    } else if (endLoc === -1) {
        // 빽도로 대기로 복귀
        pieceEls.forEach(el => {
            el.style.transition = 'all 0.3s ease';
            el.style.transform = 'translate(-50%, -50%) scale(0.5)';
            el.style.opacity = '0.5';
        });
        await sleep(300);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== 승리/턴 체크 =====
function checkWinState(caught) {
    // 점수 업데이트
    [P1, P2].forEach(p => {
        const finished = gameState.pieces[p].filter(pc => pc.finished).length;
        document.getElementById(p === P1 ? 'p1-score' : 'p2-score').innerText = `${finished}/4`;
    });

    const finished = gameState.pieces[gameState.turn].filter(p => p.finished).length;

    if (finished === 4) {
        endGame(gameState.turn);
        return;
    }

    if (caught) {
        // 잡으면 추가 던지기!
        playSpecialSound();
        updateMessage('잡았다! 🎯 한 번 더 던져요!');
        if (gameState.movesAvailable.length > 0) {
            // 남은 이동이 있으면 먼저 소진
            updateMessage('잡았다! 🎯 남은 이동을 먼저 사용하세요!');
            highlightMovablePieces();
        } else {
            enableThrowBtn(true, "잡았다! 한 번 더!");
        }
        return;
    }

    if (gameState.movesAvailable.length > 0) {
        updateMessage('남은 윷으로 이동하세요!');
        highlightMovablePieces();
    } else {
        switchTurn();
    }
}

function switchTurn() {
    gameState.turn = gameState.turn === P1 ? P2 : P1;
    gameState.movesAvailable = [];
    enableThrowBtn(true);
    const name = gameState.turn === P1 ? '부엉이' : '샐리';
    const emoji = gameState.turn === P1 ? '🦉' : '🐱';
    updateMessage(`${name} 차례입니다! 윷을 던져주세요 ${emoji}`);
    updatePlayerUI();
}

// ===== UI 업데이트 =====
function enableThrowBtn(enable, text) {
    const btn = document.getElementById('btn-throw');
    btn.disabled = !enable;
    btn.innerText = text || '윷 던지기';
}

function updatePlayerUI() {
    document.getElementById('player1').classList.toggle('active', gameState.turn === P1);
    document.getElementById('player2').classList.toggle('active', gameState.turn === P2);
}

function updateMessage(msg) {
    document.getElementById('messageArea').innerHTML = msg;
}

// ===== 말 렌더링 =====
function renderPieces() {
    // 기존 말 모두 제거
    document.querySelectorAll('.piece, .waiting-piece').forEach(el => el.remove());
    document.getElementById('p1-waiting').innerHTML = '';
    document.getElementById('p2-waiting').innerHTML = '';

    [P1, P2].forEach(player => {
        const pieces = gameState.pieces[player];

        // 보드 위 말: 같은 위치끼리 그룹핑 (업기 표시)
        const locGroups = {};
        pieces.forEach(p => {
            if (p.finished || p.loc === -1) return;
            if (!locGroups[p.loc]) locGroups[p.loc] = [];
            locGroups[p.loc].push(p);
        });

        // 대기 중인 말
        pieces.forEach(p => {
            if (p.finished || p.loc !== -1) return;
            const div = document.createElement('div');
            div.className = `waiting-piece p${player + 1}`;
            div.dataset.id = p.id;
            div.innerText = p.id + 1;
            document.getElementById(player === P1 ? 'p1-waiting' : 'p2-waiting').appendChild(div);
        });

        // 보드 위 말 (업기 그룹)
        Object.entries(locGroups).forEach(([locStr, group]) => {
            const loc = parseInt(locStr);
            const node = nodes.find(n => n.id === loc);
            if (!node) return;

            // 대표 말 표시
            const leadPiece = group[0];
            const el = document.createElement('div');
            el.className = `piece p${player + 1}`;
            el.dataset.id = leadPiece.id;

            if (group.length > 1) {
                // 업기: 카운트 뱃지 표시
                el.innerHTML = `${leadPiece.id + 1}<span class="stack-badge">\u00d7${group.length}</span>`;
            } else {
                el.innerText = leadPiece.id + 1;
            }

            // 같은 위치에 상대 말도 있으면 약간 오프셋
            const opponent = player === P1 ? P2 : P1;
            const oppAtLoc = gameState.pieces[opponent].filter(
                op => !op.finished && op.loc === loc
            );
            let offsetX = 0, offsetY = 0;
            if (oppAtLoc.length > 0) {
                offsetX = player === P1 ? -6 : 6;
                offsetY = player === P1 ? -3 : 3;
            }

            el.style.left = `calc(${node.x}% + ${offsetX}px)`;
            el.style.top = `calc(${node.y}% + ${offsetY}px)`;
            el.style.zIndex = 20 + group.length;

            document.getElementById('board').appendChild(el);
        });
    });
}

// ===== 게임 종료 =====
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
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FFD93D'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
        container.appendChild(confetti);
    }
}

// ===== 효과음 (Web Audio API) =====
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playThrowSound() {
    try {
        const ctx = getAudioCtx();
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
        const ctx = getAudioCtx();
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
        const ctx = getAudioCtx();
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
            o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.3);
        });
    } catch (e) { }
}

function playBackdoSound() {
    try {
        const ctx = getAudioCtx();
        // 하강하는 슬픈 소리
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        o.start(); o.stop(ctx.currentTime + 0.4);
    } catch (e) { }
}

function playCatchSound() {
    try {
        const ctx = getAudioCtx();
        // 짧고 통쾌한 효과음
        [800, 1000, 1200].forEach((freq, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'square';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
            o.start(ctx.currentTime + i * 0.05);
            o.stop(ctx.currentTime + i * 0.05 + 0.1);
        });
    } catch (e) { }
}

function playWinSound() {
    try {
        const ctx = getAudioCtx();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
            o.start(ctx.currentTime + i * 0.15);
            o.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
    } catch (e) { }
}

// ===== 시작 =====
document.addEventListener('DOMContentLoaded', initGame);
