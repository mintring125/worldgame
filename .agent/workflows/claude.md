---
description: Use Claude Code CLI for AI-powered coding
---

# Claude Code CLI Workflow

Anthropic Claude Code CLI를 사용하여 AI 기반 코딩 지원을 받는 워크플로우입니다.

## 사용 가능 명령어

### 1. 기본 실행
```powershell
// turbo
claude "분석하고 싶은 내용 또는 질문"
```

### 2. 대화형 모드
```powershell
claude
```
대화형으로 실행 후 직접 질문

### 3. 이전 세션 계속
```powershell
// turbo
claude --resume <session-id>
```

### 4. 특정 모델 사용
```powershell
// turbo
claude --model claude-sonnet-4-20250514 "질문"
```

### 5. 파일과 함께 분석
```powershell
// turbo
Get-Content game.js | claude "이 코드 리뷰해줘"
```

## 설치된 버전
- Claude Code: v2.1.34
- 기본 모델: Claude Sonnet 4

## 인증 설정
첫 실행 시 Anthropic API 키 또는 계정 로그인이 필요합니다.

## 주의사항
- Anthropic 계정 또는 API 키가 필요합니다
- 대용량 코드 분석 시 토큰 제한에 주의하세요
