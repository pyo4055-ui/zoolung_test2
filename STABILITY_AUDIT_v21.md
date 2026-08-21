# 주렁주렁 동탄 안정성 점검 v21

기준일: 2026-08-21

## 안전 기준점

- 운영 기준 브랜치: `main`
- 정상 동작 백업: `backup/stable-20260821-v20`
- 안정화 작업 브랜치: `hardening/stability-v21`
- v21 검증 완료 전 `main`에 반영하지 않는다.
- 새 기능 추가, 대규모 리팩터링, Firestore 데이터 구조 변경을 하지 않는다.

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

- `schedule.html`
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

### 4. 수정 JS 캐시 혼재

`customer_visit_guide_fix_v20.js` 수정 후 기존 query version을 그대로 쓰면 브라우저 캐시에 의해 구버전이 섞일 수 있다.

조치: hardening 브랜치에서 v20 로드 캐시 키를 갱신.

## 의도적으로 건드리지 않은 부분

- 예약 가격/인원 계산 로직
- 예약 생성/확정/취소 로직
- 현장스케줄의 예약 원본 역반영 정책
- 스케줄 컨텐츠 검증 규칙
- 엑셀 출력 로직
- Firebase 컬렉션 구조
- 기존 예약/현장 데이터
- 구버전 파일 삭제
- 관리자 로그인 보조 패치

## Firestore rules 주의 — 중요

저장소의 현재 `firestore.rules`에는 `scheduleGroups`, `scheduleSharedMemos` 규칙만 확인된다.

반면 실제 앱은 다음 컬렉션도 사용한다.

- `reservations`
- `reservationAvailability`
- `customerGuides`
- `scheduleGroups`
- `scheduleSharedMemos`

현재 운영 Firebase에는 사용자가 별도로 '전체 최신 규칙'을 적용한 상태라고 알려져 있으나, 그 정확한 전문을 저장소에서 검증할 수 없다.

**따라서 저장소의 `firestore.rules`를 운영 Firebase에 그대로 배포하면 안 된다.**
정확한 운영 규칙 전문을 확보하기 전에는 이 파일을 수정/배포하지 않는다.

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
10. 고객 방문안내 편집 저장 후 고객 팝업 반영
11. 예약현황/아웃소싱/스케줄 엑셀 내려받기
12. 새로고침 및 재로그인 후 데이터 유지

## 롤백 원칙

v21 반영 후 이상 발생 시 `main`을 `backup/stable-20260821-v20`의 커밋으로 즉시 되돌릴 수 있다. Firestore 데이터 구조를 변경하지 않으므로 코드 롤백이 기존 데이터 형식을 깨뜨리지 않도록 유지한다.
