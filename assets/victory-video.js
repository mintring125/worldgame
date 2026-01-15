// 승리 동영상 표시 기능
// 게임 승리 시 승자에 따라 춤추는 영상을 표시

const CELESTE_VIDEO = '../../댄스_비디오_생성.mp4';  // 부옥이 영상
const SALLY_VIDEO = '../../Dancing_Video_Generation.mp4';  // 샐리 영상

// 승리 동영상 표시
// winner: 'celeste' 또는 'sally'
function showVictoryVideo(winner) {
    const videoSrc = winner === 'sally' ? SALLY_VIDEO : CELESTE_VIDEO;

    // 기존 비디오 컨테이너 제거
    const existingContainer = document.getElementById('victoryVideoContainer');
    if (existingContainer) {
        existingContainer.remove();
    }

    // 비디오 컨테이너 생성
    const container = document.createElement('div');
    container.id = 'victoryVideoContainer';
    container.className = 'victory-video-container';
    container.innerHTML = `
        <div class="victory-video-backdrop"></div>
        <div class="victory-video-content">
            <h2 class="victory-video-title">🎉 축하합니다! 🎉</h2>
            <video id="victoryVideo" autoplay playsinline class="victory-video">
                <source src="${videoSrc}" type="video/mp4">
            </video>
            <button class="victory-video-close" onclick="closeVictoryVideo()">✕ 닫기</button>
        </div>
    `;

    document.body.appendChild(container);

    // 영상 로드 및 재생
    const video = document.getElementById('victoryVideo');
    video.load();
    video.play().catch(e => console.log('Auto-play blocked:', e));

    // 영상 종료 시 자동 닫기
    video.addEventListener('ended', () => {
        closeVictoryVideo();
    });

    // 애니메이션으로 표시
    requestAnimationFrame(() => {
        container.classList.add('show');
    });
}

// 승리 동영상 닫기
function closeVictoryVideo() {
    const container = document.getElementById('victoryVideoContainer');
    if (container) {
        container.classList.remove('show');
        setTimeout(() => {
            const video = document.getElementById('victoryVideo');
            if (video) {
                video.pause();
                video.src = '';
            }
            container.remove();
        }, 300);
    }
}
