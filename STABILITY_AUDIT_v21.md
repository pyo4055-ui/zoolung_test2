# 주렁주렁 동탄 안정성 점검 v21

기준일: 2026-08-21

## 안전 기준점

- 운영 기준 브랜치: `main`
- 정상 동작 백업: `backup/stable-20260821-v20`
- 안정화 작업 브랜치: `hardening/stability-v21`
- 검증용 Draft PR: `#1 Stability v21 hardening audit`
- v21 검증 완료 전 `main`에 반영하지 않는다.
- 새 기능 추가, 대규모 리팩터링, Firestore 데이터 구조 변경을 하지 않는다.
- 중간 버전 코드가 중복되어 보여도 최종 실행 상태에서 실제 위험이 확인되지 않으면 제거하지 않는다.

## 현재 확인한 실행 구조

예약 사이트 핵심 순서:

1. `index.html`
2. 압축 원본 `data1.txt` + `data2.txt` 복원 및 SECURITY_PATCH 적용
3. `admin_features.js`
4. `admin_features_v2_loader.js`
5. 관리자 패치 v3 → v9
6. v9가 최신 추가 모듈을 단일 경로로 로드
   - 고객 방문안내 `customer_visit_guide_v19.js` → `customer_visit_guide_fix_v20.js`
   - 관리자 스케줄 `admin_schedule_tab_v14.js`
   - 고객 확정스케줄, 당일예약 차단, 스케줄 엑셀 등
7. `reservation_firebase_bridge.js`가 예약 로컬 저장과 Firestore를 연결

현장스케줄 핵심 순서:

- 운영/alias 진입점: `schedule.html`, `schedule_v8.html`
- `schedule_v6.js`
- `schedule_display_v8.js`
- `schedule_shared_memo_unlock_v10.js`

## v21에서 수정한 확정 위험

### 1. 고객 방문안내 이중 로더

구형 로더가 v16을 먼저 로드하고, 최신 v9도 v19 → v20을 로드하도록 되어 있어 실행 순서에 따라 구버전이 최신 모듈을 선점할 수 있었다.

조치: 고객 방문안내 로딩 소유권을 최신 v9 한 곳으로 통일. 최신 의도된 순서는 v19 → v20.

### 2. 고객안내 관리자 렌더러 충돌

v19와 v20이 동일한 관리자 DOM을 서로 다른 data 속성으로 렌더링할 수 있다. 스냅샷 콜백 순서에 따라 v19 화면이 마지막으로 남으면 v20 저장 함수가 화면 수정값을 수집하지 못할 가능성이 있다.

조치: v20이 구형 렌더 마크업을 감지하면 v20 마크업으로 복구하는 호환 가드 추가. 저장 소유권은 계속 v20 하나만 유지.

### 3. 예약 Firestore patch의 undefined 가능성

기존 예약 객체에서 선택 필드가 사라질 경우 `changedTop()`이 `undefined` 값을 Firestore patch에 포함할 가능성이 있었다. Firestore Web SDK에서는 invalid-argument 원인이 될 수 있다.

조치: 정리 후 값이 `undefined`면 patch에 포함하지 않는다. 정상 데이터 값의 저장 방식은 변경하지 않음.

### 4. 현장스케줄 alias 캐시 버전 불일치

최신 현장 표시 수정 후 `schedule_v8.html`은 `schedule_display_v8.js?v=15`를 사용하지만 `schedule.html`은 `?v=12`에 남아 있었다. 사용 URL과 브라우저 캐시에 따라 서로 다른 세대의 표시 JS가 사용될 수 있다.

조치: `schedule.html`도 `?v=15`로 맞춘다. 실제 JS 코드나 현장 데이터 저장 로직은 변경하지 않는다.

### 5. 안정화 파일의 배포 캐시 혼재

v21에서 `admin_features_v2_loader.js`, `reservation_firebase_bridge.js`, `customer_visit_guide_fix_v20.js`를 수정해도 진입 HTML/로더의 query version이 그대로면 기존 브라우저 캐시가 남을 수 있다.

조치:

- `index.html`: admin loader `?v=21`, Firebase bridge `?v=21`
- v9 loader: customer guide v20 `?v=21`

query string만 변경하며 실행 내용 자체를 추가로 변경하지 않는다.

## 데이터 덮어쓰기 관점 점검 결과

### 관리자 스케줄 → 현장스케줄

관리자 `스케줄 반영/확정`은 `scheduleGroups/{예약ID}`에 예약·컨텐츠 관련 필드만 `{merge:true}`로 쓴다. 현장 전용 실제 인원, 인상착의, 식사 위치, 메모, 결제/컬러북 등의 필드를 전체 문서 덮어쓰기로 지우지 않는다.

### 현장스케줄 수정

기존 현장 단체 수정은 변경된 필드만 `{merge:true}`로 쓴다. 현장에서 임의 추가하는 새 스케줄은 신규 ID 문서이므로 예약 원본에 역반영되지 않는다.

### 공용메모

`scheduleSharedMemos` 별도 컬렉션을 사용하므로 단체 스케줄 문서와 분리되어 있다.

## 검토 후 의도적으로 되돌린 변경

### 관리자 로그아웃 시 `legacyLocal.clear()`

처음에는 관리자 캐시가 고객 모드에 다시 섞이는 가능성을 줄이기 위해 `legacyLocal.clear()`를 검토했다. 그러나 `legacyLocal`은 관리자 로그인 전에 존재하던 정상 로컬 예약의 복원 경로 역할도 할 수 있어, 이를 일괄 삭제하면 기존 로컬 예약을 잃어버리는 회귀가 생길 수 있다.

결론: 확실한 개선으로 입증되지 않아 v21 후보에서 제거하고 기존 동작을 유지한다. 관리자/고객 캐시 소유권을 완전히 분리하려면 별도 설계가 필요하다.

## 의도적으로 건드리지 않은 부분

- 예약 가격/인원 계산 로직
- 예약 생성/확정/취소 업무 로직
- 현장스케줄의 예약 원본 역반영 정책
- 스케줄 컨텐츠 검증 규칙
- 엑셀 출력 로직
- Firebase 컬렉션 구조
- 기존 예약/현장 데이터
- 구버전 파일 삭제
- `reservation_staff_login_fix_v14.js` 등 관리자 로그인 보조 패치
- v3~v9의 과거 관리자 패치 계층
- 아웃소싱/정산 계산 패치 계층

위 항목은 중복되어 보이는 부분이 있어도 현재 최종 함수가 뒤 패치에서 의도적으로 덮어써지는 구조가 확인되며, 안정화 명목으로 제거하면 회귀 위험이 더 크다고 판단했다.

## 확인했지만 이번 v21에서 변경하지 않는 잔여 위험

### A. Firebase bridge 자체가 완전히 부팅 실패하는 경우

기본 예약 페이지는 로컬 저장을 계속 사용할 수 있으므로 브리지 자체가 로드/초기화에 완전히 실패하면 해당 기기의 예약이 서버와 즉시 공유되지 않을 가능성이 있다. 이를 완전히 해결하려면 예약 완료 플로우와 서버 확인/재시도 큐를 결합해야 해서 현재 안정화 범위를 넘는 구조 변경이 필요하다.

결론: v21에서는 건드리지 않는다. 별도 설계·테스트 후 진행한다.

### B. 관리자 스케줄 공개와 예약 bridge 동기화의 최종 ACK

스케줄 공개 시 예약 로컬 상태를 변경하면 Firebase bridge가 비동기로 동기화한다. UI 성공 표시와 원격 예약 문서 반영 시점이 완전히 동일하지 않을 수 있다. 이를 강제 동기화하려면 bridge의 flush/ACK API를 새로 노출해야 하므로 이번 v21에서는 변경하지 않는다.

### C. 패치형 로더 구조 자체

`eval`과 버전 패치가 누적된 구조는 장기 유지보수 위험이다. 그러나 지금 이를 통합 리팩터링하는 것은 가장 큰 회귀 위험이므로 v21의 목적과 반대다. 기능이 안정적으로 굳어진 뒤 별도 복제 환경에서만 통합을 검토한다.

## Firestore rules 주의 — 중요

저장소의 현재 `firestore.rules`에는 `scheduleGroups`, `scheduleSharedMemos` 규칙만 확인된다.

반면 실제 앱은 다음 컬렉션도 사용한다.

- `reservations`
- `reservationAvailability`
- `customerGuides`
- `scheduleGroups`
- `scheduleSharedMemos`

현재 운영 Firebase에는 별도로 전체 최신 규칙이 적용된 상태라고 알려져 있으나, 정확한 운영 규칙 전문을 저장소에서 검증할 수 없다.

**따라서 저장소의 `firestore.rules`를 운영 Firebase에 그대로 배포하면 안 된다.**
정확한 운영 규칙 전문을 확보하기 전에는 이 파일을 수정/배포하지 않는다.

## 자동 검사 상태

`hardening/stability-v21`에 정적 검사 workflow를 준비했다.

검사 항목:

- 수정 JS `node --check`
- 구형 v16 직접 로더 재유입 금지
- v19 → v20 최신 로딩 경로 확인
- v20 저장 소유권 확인
- Firestore undefined patch 방어 확인
- 현장 alias display cache v15 확인
- index loader/bridge v21 cache 확인

단, 이 저장소에는 기존 default branch workflow가 없었고 새 workflow도 아직 `main`에 존재하지 않으므로 Draft PR에서 실제 Actions run을 확인하지 못했다. **따라서 CI 통과라고 주장하지 않는다.** 검사 파일은 향후 보호장치이며, 현재 판단은 실제 diff/호출경로/커밋 이력을 직접 검토한 결과를 기준으로 한다.

## main 반영 전 필수 회귀 테스트

1. 신규 고객 예약 접수
2. 기존 예약 조회/수정
3. 관리자 예약 확정 및 취소
4. 확정 예약 → 관리자 스케줄 표시
5. 스케줄 반영 → 현장스케줄 실시간 표시
6. 현장 실인원/인상착의/식사위치/메모 저장
7. 공용메모 수정 잠금 무관 저장
8. 관리자 스케줄 변경 겹침/종료≤시작/퇴장시간 초과 차단
9. 스케줄 확정/확정취소 및 고객 확정스케줄 표시
10. 고객 방문안내 편집 저장 후 새로고침 및 고객 팝업 반영
11. 예약현황/아웃소싱/스케줄 엑셀 내려받기
12. `schedule.html`과 `schedule_v8.html`에서 동일한 현장 표시 확인
13. 새로고침 및 재로그인 후 데이터 유지

## 롤백 원칙

v21 반영 후 이상 발생 시 `main`을 `backup/stable-20260821-v20`의 커밋으로 즉시 되돌릴 수 있다. Firestore 데이터 구조를 변경하지 않으므로 코드 롤백이 기존 데이터 형식을 깨뜨리지 않도록 유지한다.

현재 확인된 v20 백업과 `main`은 동일한 기준 커밋을 가리키며, v21 검증 과정에서 `main`이나 백업 브랜치는 변경하지 않는다.
