# 윷놀이 게임 코드 검증 요청

개선된 윷놀이 코드를 검증해주세요. 다음 항목을 확인해주세요:

1. 경로 분기 로직: center(22) 노드에서 pathType에 따라 올바르게 분기하는지
2. 빽도 로직: 역방향 이동이 올바른지, 대기중/출발점 처리가 맞는지
3. 업기(stacking) 처리: 같은 위치 말 그룹 이동, 잡힐 때 전체 되돌림
4. 잡기 후 추가 던지기와 남은 이동 우선순위
5. 이동 가능 여부 체크 (canPieceMove, canAnyPieceMove)
6. 윷/모 추가 던지기 누적

특히 이 코드에서 버그가 있는지 확인:
- calculateDestination에서 코너 지름길 진입 조건 (i===0 && piece.loc!==-1)
- prevNode 매핑이 모든 노드를 커버하는지
- executeMove의 async/await 패턴이 올바른지
