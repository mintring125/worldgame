---
description: Use Gemini CLI for AI-powered code assistance
---

# Gemini CLI Workflow

Google Gemini CLI를 사용하여 AI 기반 코드 지원을 받는 워크플로우입니다.

## 사용 가능 명령어

### 1. 기본 실행
```powershell
// turbo
gemini "분석하고 싶은 내용 또는 질문"
```

### 2. 대화형 모드
```powershell
gemini
```
대화형으로 실행 후 직접 질문

### 3. 파일과 함께 분석
```powershell
// turbo
Get-Content game.js | gemini "이 코드의 문제점을 찾아줘"
```

### 4. 샌드박스 모드 (안전한 실행)
```powershell
// turbo
gemini -s "코드 생성해줘"
```

### 5. YOLO 모드 (자동 승인)
```powershell
gemini -y "자동으로 수정해줘"
```

## 설치된 버전
- Gemini CLI: v0.27.3
- 모델: Gemini 2.5

## 인증 설정
첫 실행 시 Google 계정 로그인이 필요합니다:
```powershell
gemini
```
브라우저가 열리면 Google 계정으로 로그인하세요.

## 주의사항
- Google 계정 인증이 필요합니다
- 일부 기능은 Gemini API 키가 필요할 수 있습니다
