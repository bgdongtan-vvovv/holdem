# Research Log

Gemini 리서치 브리프(대용량 컨텍스트 조사·분석 결과)를 기록하는 곳.

목적: 같은 조사를 반복해서 Gemini에 또 요청하지 않도록, 결론만 여기 남겨서 Claude/Codex가 재사용할 수 있게 한다.

관련 문서: [`ORCA_DEV_WORKFLOW.md`](../ORCA_DEV_WORKFLOW.md) §9(Architecture Decision Log)·§4(When to Use Gemini),
[`.claude/skills/visual-first-multi-agent-development/SKILL.md`](../.claude/skills/visual-first-multi-agent-development/SKILL.md)

## 사용 규칙

- Gemini를 호출하기 전, Codex/Claude는 먼저 이 로그에 이미 답이 있는지 확인한다.
- 답이 이미 있으면 Gemini를 다시 부르지 않고 바로 구현/설계에 사용한다.
- Gemini가 새 리서치 브리프를 반환하면, 요청한 Codex 또는 Claude가 핵심 결론만 요약해서 아래 "Entries"에 추가한다(브리프 전문을 그대로 붙여넣지 않는다).
- 더 이상 유효하지 않은 항목(코드가 바뀌어 결론이 깨진 경우)은 삭제하거나 "Status: stale"로 표시한다.

## Entry 형식

```
### YYYY-MM-DD — <한 줄 질문/주제>

- Requested by: Codex | Claude
- Scope: 조사한 범위 (파일/문서/로그 등)
- Finding: 핵심 결론 (2~5줄)
- Action: 이 결론이 어떤 결정/구현에 반영됐는지
- Status: active | stale
```

## Entries

_아직 기록된 리서치 브리프가 없습니다. 위 형식대로 항목을 추가하세요._
