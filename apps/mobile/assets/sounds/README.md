# 사운드 폴더

홀덤 게임에 필요한 효과음 세트입니다.
현재 파일은 **합성 자리표시(placeholder)** — 실제 사운드로 교체할 때 **파일명은 그대로 두고 내용만** 바꾸면 코드 수정 없이 반영됩니다.
포맷: WAV(권장) 또는 mp3/m4a. 짧고(0.1~0.8s) 노멀라이즈된 모노 권장.

| 파일명 | 용도 | 트리거 시점 |
|--------|------|-------------|
| `ui_click.wav` | UI 버튼 클릭 | 메뉴/버튼 탭 |
| `card_deal.wav` | 카드 한 장 딜 | 홀카드/커뮤니티 카드 나눌 때 |
| `card_shuffle.wav` | 덱 셔플 | 새 핸드 시작 |
| `card_flip.wav` | 카드 오픈 | 쇼다운에서 카드 공개 |
| `check.wav` | 체크(노크) | 체크 액션 |
| `call.wav` | 콜 | 콜 액션 |
| `bet.wav` | 벳 | 베팅 |
| `raise.wav` | 레이즈 | 레이즈 |
| `fold.wav` | 폴드 | 폴드(카드 접기) |
| `allin.wav` | 올인 | 올인 |
| `blind_post.wav` | 블라인드 게시 | SB/BB 게시 |
| `chips_collect.wav` | 칩 모으기 | 베팅 칩이 팟으로 모일 때 |
| `pot_win.wav` | 팟 획득 | 승자가 팟을 가져갈 때 |
| `win.wav` | 승리 팬파레 | 내가 이겼을 때 |
| `lose.wav` | 패배 | 내가 졌을 때 |
| `your_turn.wav` | 내 차례 알림 | 내 액션 차례 도래 |
| `time_warning.wav` | 시간 경고 | 타임뱅크 임박(카운트다운) |
| `notify.wav` | 일반 알림 | 시스템 알림 |
| `chat.wav` | 채팅 메시지 | 채팅 수신 |

교체/추가 시 `src/sound/sfx.ts` 의 `FILES` 맵에 등록하세요.
