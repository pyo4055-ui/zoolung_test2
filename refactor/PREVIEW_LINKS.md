# 리팩토링 비교 링크

## 운영 기준본

- 고객/관리자: https://pyo4055-ui.github.io/zoolung_test2/
- 현장스케줄: https://pyo4055-ui.github.io/zoolung_test2/schedule.html

## 리팩토링 브랜치 미리보기

raw.githack 개발용 브랜치 URL을 사용한다. 첫 접속 시 외부 미리보기 확인 화면이 한 번 나올 수 있다.

- 고객/관리자: https://raw.githack.com/pyo4055-ui/zoolung_test2/refactor-preserve-behavior/index.html
- 현장스케줄: https://raw.githack.com/pyo4055-ui/zoolung_test2/refactor-preserve-behavior/schedule.html

## 현재 검증 포인트

- 고객/관리자: 기존 기능은 그대로 두고 관리자 patch loader만 구조화했다.
- 초기 화면: patch 준비 중에는 boot shield를 표시해 이전 UI 순간 노출을 막는다.
- 현장스케줄: 기존 `schedule_v6.js + schedule_display_v8.js + schedule_shared_memo_unlock_v10.js`를 역할별 모듈로 통합했다.
- 현장 `scheduleGroups` 날짜 실시간 listener는 통합본에서 1개만 사용한다.
- 공용 메모는 기존 v10처럼 수정 잠금과 관계없이 수정 가능하다.

## 주의

- 리팩토링 미리보기는 실제 Firebase 프로젝트에 연결되므로 테스트용 예약만 사용한다.
- 운영 예약은 수정하지 않는다.
- 비밀번호/계정 정보는 GitHub 문서나 채팅에 남기지 않는다.
- 이상이 하나라도 있으면 PR을 main에 병합하지 않는다.
