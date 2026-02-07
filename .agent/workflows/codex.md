---
description: Use Codex CLI to analyze and fix code issues
---

# Codex CLI Workflow

Codex CLI (OpenAI)를 사용하여 코드를 분석하고 수정하는 워크플로우입니다.

## 사용 가능 명령어

### 1. 기본 실행
```powershell
// turbo
codex "분석하고 싶은 내용 또는 질문"
```

### 2. 특정 파일 분석
```powershell
// turbo
codex "game.js 파일의 버그를 찾아줘"
```

### 3. 대화형 모드
```powershell
codex
```
대화형으로 실행 후 직접 질문

### 4. 이전 세션 이어서
```powershell
// turbo
codex --resume <session-id>
```

## 프롬프트 파일 활용

`.omc/prompts/` 폴더에 저장된 프롬프트 파일을 활용할 수 있습니다:

```powershell
// turbo
Get-Content .omc/prompts/codex-yut-analysis.md | codex
```

## 설치된 버전
- Codex CLI: v0.98.0
- 모델: gpt-5.2-codex

## 주의사항
- Codex는 OpenAI API 키가 필요합니다
- 대용량 코드 분석 시 시간이 걸릴 수 있습니다
