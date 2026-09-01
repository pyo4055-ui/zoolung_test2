# 주렁주렁 동탄 단체 시스템 3사이트 분리 계획

작성 기준: 2026-09-01 / 작업 브랜치 `refactor-preserve-behavior`

## 목표

현재 하나의 `index.html` 안에서 고객 예약 화면과 관리자 화면이 함께 로드되는 구조를 다음 3개의 독립 화면으로 분리한다.

1. **예약사이트(Customer)**
   - 고객 예약 신청
   - 기존 예약 조회
   - 1:1 문의 / 사전답사 신청
   - 주차·인솔 안내 / 가이드맵 / 최종 스케줄 조회

2. **예약관리사이트(Admin)**
   - 예약 캘린더 / 예약 현황 / 식사 현황
   - 스케줄 편성 / 확정 / 고객 알림
   - 정산 / 아웃소싱 / 카페 메뉴
   - 1:1 문의 / 사전답사
   - 경고 / 과거예약 정리 / 설정
   - 향후 좌측 Navigation Rail + 중앙 Workspace + 우측 Smart Panel UI

3. **현장스케줄사이트(Onsite)**
   - 현재 `schedule.html` 역할 유지
   - 당일 실제 인원 / 도착·퇴장 / 결제완료 / 컬러북 / 메모 / 컨텐츠 스케줄 수정

세 사이트는 서로 다른 데이터 복사본을 만들지 않는다. **같은 Firebase/Firestore 데이터를 공유하는 하나의 시스템 + 3개의 화면**으로 유지한다.

---

## 절대 변경하지 않는 데이터 계약

3사이트 분리 중 아래 계약은 그대로 유지한다.

- Firestore 주요 데이터
  - `reservations`
  - `reservationAvailability`
  - `scheduleGroups`
  - `scheduleSharedMemos`
  - `customerGuides/main`
  - `schedulePublished`
  - `customerSchedule`
- LocalStorage
  - `zr_bookings`
  - 기존 문의/설정 관련 키는 현재 동작 확인 전 이름 변경 금지
- 예약 인원 필드
  - `paidCount`
  - `chaperoneCount`
  - `freeChaperone`
  - `paidChaperone`
- Excel 양식/열 구조 변경 금지
- 현장스케줄에서 임의 수정한 데이터가 예약 원본으로 예상치 못하게 역반영되지 않도록 현재 계약 유지

---

## 현재 구조에서 확인된 핵심 문제

### 1. 고객 + 관리자 런타임이 같은 입구에 얽혀 있음

현재 `index.html`은 원본 페이지를 복원한 뒤 아래 런타임을 한 화면에 추가한다.

- `admin_features.js`
- `admin_features_v2_loader.js`
- `reservation_firebase_bridge.js`

그리고 `admin_features_v2_loader.js` 안에서 관리자 기능뿐 아니라 고객 기능도 함께 로드한다.

예:

- `customer_booking_ux_v24.js`
- `customer_visit_guide_v16.js`
- `customer_visit_guide_fix_v20.js`
- `parking_info_v31.js`
- `customer_lookup_actions_v1.js`
- `customer_info_tabs_v1.js`
- `customer_status_banner_v1.js`
- `customer_playground_booking_guard_v1.js`
- `customer_holiday_booking_setting_v1.js`
- `customer_return_home_v1.js`

따라서 고객 UI와 관리자 UI를 각각 크게 개편하기 전에 **로더 책임을 분리하는 단계가 필요**하다.

### 2. 관리자 기능이 여러 파일에서 동적으로 탭을 추가함

기본 관리자 탭 외에도 다음 기능들이 실행 중 DOM에 탭을 추가한다.

- `스케줄 관리` → `admin_schedule_tab_v14.js`
- `고객 안내 관리` → `customer_visit_guide_v16.js`
- `사전답사 관리` → `admin_preview_visit_v1.js`
- `Today` → `admin_today_tab_v1.js`
- `경고` → `admin_warning_tab_v1.js`
- `과거 예약 정리` → `admin_reservation_cleanup_v1.js`
- `아웃소싱 결제대금` → `admin_features.js`

향후 새 관리자 UI는 각 파일이 직접 상단 탭을 관리하게 두지 않고, **기존 버튼/화면을 하나의 Navigation Registry가 참조하는 방식**으로 전환한다.

---

## 현재 관리자 Top-Level 메뉴 인벤토리 (13개)

| 그룹(향후) | 현재 메뉴 | 기존 연결 | 비고 |
|---|---|---|---|
| 운영 | Today | `#zrTodayTabBtn` → `#tab-today` | 향후 표시명 `오늘 운영` 검토 |
| 운영 | 예약 캘린더 | `data-tab="calendar"` → `#tab-calendar` | 기본 탭 |
| 운영 | 스케줄 관리 | `#zrScheduleTabBtn` → `#tab-schedule` | 핵심/동결 우선 |
| 운영 | 경고 | `#zrWarningTabBtn` → `#tab-warning` | 처리 필요 항목 계산 |
| 예약 | 예약 현황 | `data-tab="activity"` → `#tab-activity` | 조회/검색/엑셀 |
| 예약 | 식사 현황 | `data-tab="meals"` → `#tab-meals` | 식사/카페 집계 |
| 예약 | 과거 예약 정리 | `#zrCleanupTabBtn` → `#tab-cleanup` | 삭제/아카이브 고위험 |
| 고객 | 1:1 문의 | `data-tab="inquiries"` → `#tab-inquiries` | 답변/문자앱 연동 |
| 고객 | 사전답사 관리 | `#zrPreviewVisitTabBtn` → `#tab-preview-visit` | 문의 데이터 기반 |
| 고객 | 고객 안내 관리 | `#zrGuideAdminTab` → `#zrGuideAdminSection` | 이용안내/가이드맵/주차안내 서브탭 |
| 매출 | 아웃소싱 결제대금 | `#outsourceTabBtn` → `#tab-outsourcing` | 정산 데이터 사용 |
| 매출 | 카페 메뉴 관리 | `data-tab="menuadmin"` → `#tab-menuadmin` | 고객 주문 메뉴와 연동 |
| 설정 | 예약설정 | `data-tab="settings"` → `#tab-settings` | 예약운영/문자/업체설정 서브탭 |

### 현재 이미 존재하는 내부 서브탭

`admin_section_subtabs_v1.js`에서 아래 구조를 이미 만든다.

- 고객 안내 관리
  - 이용 안내
  - 가이드맵
  - 주차 안내
- 예약설정
  - 예약운영
  - 스케줄알림문자
  - 아웃소싱업체설정
  - 예약확정문자
- 과거 예약 정리
  - 예약 정리
  - 정리 내역

향후 새 Navigation UI는 위 서브탭을 다시 새 메뉴로 중복 생성하지 않고 기존 서브탭을 그대로 연결한다.

---

## 목표 파일 구조 (점진 전환)

초기에는 파일을 실제 폴더로 대규모 이동하지 않는다. 먼저 Entry와 Loader만 분리한다.

```text
/
  index.html                       # 고객 예약 전용 Entry
  admin.html                       # 예약 관리자 전용 Entry (신규)
  schedule.html                    # 현장 스케줄 Entry (기존 유지)

  customer_runtime_loader_v1.js    # 고객 전용 로더 (신규 예정)
  admin_runtime_loader_v1.js       # 관리자 전용 로더 (신규 예정)

  reservation_firebase_bridge.js   # 공통 데이터 브리지 (현재 계약 유지)
  modal_ux_consistency_v1.js       # 공통 UI helper (사용 범위 재검증)

  customer_*.js                    # 고객 기능
  admin_*.js                       # 관리자 기능
  schedule_*.js / schedule_refactor/* # 현장 기능
```

3사이트가 안정된 뒤에만 `/customer`, `/admin`, `/shared`, `/onsite` 디렉터리 물리 이동을 검토한다.

---

## 분리 공사 단계

### Phase 0 — 구조 감사 / 도면 확정 (현재 단계)

- [x] 작업 브랜치 HEAD 확인
- [x] 루트 파일 트리 확인
- [x] 현재 관리자 Top-Level 13개 메뉴 정리
- [x] 고객/관리자 런타임 혼재 지점 확인
- [x] 현장스케줄은 이미 별도 Entry임을 확인
- [ ] 활성 로더 체인 세부 의존성 표 작성
- [ ] 삭제 후보와 단순 보관 파일 분리

**이 단계에서는 런타임 동작 변경 없음.**

### Phase 1 — `admin.html` 별도 Entry 생성

목표: 화면과 기능은 현재와 완전히 동일하되 URL만 관리자 전용으로 분리.

- 기존 관리자 인증/Firestore 연결 유지
- 관리자 기능만 로드
- 기존 `index.html`은 당장 관리자 진입을 제거하지 않고 fallback 유지
- `admin.html` 실사용 검증 완료 전 기존 관리자 진입 삭제 금지

완료 조건:

- 예약 캘린더
- 예약현황
- 식사현황
- 카페 메뉴
- 1:1 문의
- 사전답사
- 고객 안내 관리
- 스케줄 관리
- 아웃소싱/정산
- 경고
- 과거 예약 정리
- 예약설정
- Excel

모두 기존과 동일하게 동작.

### Phase 2 — 고객 `index.html`에서 관리자 런타임 분리

`admin.html` 검증 이후 진행.

- 고객 사이트에는 고객 예약/조회/안내 코드만 로드
- 관리자 전용 코드 로드 제거
- 고객 UI 개편이 관리자 CSS에 영향받지 않는 상태 확보

### Phase 3 — 관리자 Navigation Registry 도입

기존 버튼과 section은 삭제하지 않는다.

새 Registry는 다음 정보만 관리한다.

```js
{
  id: 'schedule',
  group: 'operation',
  label: '스케줄 관리',
  buttonId: 'zrScheduleTabBtn',
  sectionId: 'tab-schedule'
}
```

새 UI에서 메뉴를 선택하면 기존 버튼 `.click()`을 호출한다.

초기 안정화 동안 기존 상단 탭은 DOM에 유지하고 필요 시 숨기기만 한다.

### Phase 4 — 관리자 OS UI

PC:

- 좌측 Navigation Rail
- 중앙 기존 Workspace
- 우측 Smart Panel
- 메뉴 검색 (`Ctrl+K`)
- 즐겨찾기 / 메뉴 순서 편집

모바일:

- 하단 `오늘 / 예약 / 스케줄 / 고객 / 전체`
- `전체` Bottom Sheet
- 현재 모바일 알림 UX 유지/흡수

### Phase 5 — PC `처리 필요` Smart Panel

기존 도넛형 고객 확인 차트보다 업무 우선순위를 먼저 보여준다.

표시 대상:

1. **새 예약 접수**
   - 미처리 `pending` 예약 수
   - 클릭 → 예약현황 + 접수대기 필터
2. **1:1 문의**
   - 관리자 미답변 문의 수
   - 클릭 → 1:1 문의 + 미답변 중심
3. **사전답사 요청**
   - 미확정 사전답사 수
   - 클릭 → 사전답사 관리 + 접수 필터

추가 원칙:

- 저장 로직을 새로 만들지 말고 기존 데이터를 **읽어서 계산하는 알림 레이어**로 시작
- 상단 PC 벨 배지에는 처리 필요 총합 표시 가능
- 처리 완료 시 기존 상태/답변 데이터를 기준으로 자동 감소

### Phase 6 — 고객 예약사이트 UI 개편

관리자 코드가 분리된 이후 고객 UI를 별도로 디자인한다.

- 기존 예약 로직/데이터 계약 그대로
- 고객 전용 정보 구조 및 모바일 UX 개선
- `zoolungzoolung.com` 계열 디자인 방향 적용 가능

### Phase 7 — 마지막 코드 정리

3사이트 실사용 검증 이후에만 진행.

- 중복 구버전 삭제
- patch chain 축소
- shared 모듈 추출
- 파일/폴더 구조 재배치

---

## 파일 분류 — 현재 1차 결과

### 고객 전용 성격

- `customer_booking_rules_v3.js`
- `customer_booking_ux_v24.js`
- `customer_group_minimum_v1.js`
- `customer_info_tabs_v1.js`
- `customer_inquiry_visit_v1.js` (고객 입력 + 문의 데이터 연결, 관리자 연계 지점 별도 확인 필요)
- `customer_lookup_actions_v1.js`
- `customer_playground_booking_guard_v1.js`
- `customer_return_home_v1.js`
- `customer_schedule_ui_v5.js`
- `customer_schedule_view_v3.js`
- `customer_status_banner_v1.js`
- `customer_time_guide_guard_v2.js`
- `customer_view_tracking_v1.js`
- `customer_visit_guide_v16.js`의 고객 표시 영역
- `customer_visit_guide_fix_v20.js`
- `parking_info_v31.js`의 고객 표시 영역

### 관리자 전용 성격

- `admin_features.js`
- `admin_features_v2_loader.js`의 관리자 로드 책임
- `admin2_part1.txt` ~ `admin2_part4.txt`
- `admin_features_v3_patch.js` ~ `admin_features_v9_patch.js`
- `admin_activity_filter_fix_v1.js`
- `admin_booking_hold_v1.js`
- `admin_calendar_status_select_v1.js`
- `admin_calendar_status_summary_v1.js`
- `admin_excel_reliability_fix_v1.js`
- `admin_group_search_v2.js`
- `admin_inquiry_reply_v1.js`
- `admin_inquiry_reply_layout_v1.js`
- `admin_list_pagination_v1.js`
- `admin_ops_v10.js`
- `admin_ops_v11_patch.js`
- `admin_preview_visit_*.js`
- `admin_reservation_cleanup_*.js`
- `admin_schedule_customer_notify_v1.js`
- `admin_schedule_tab_v14.js`
- `admin_section_subtabs_v1.js`
- `admin_settlement_*.js`
- `admin_tab_active_fix_v1.js`
- `admin_today_*.js`
- `admin_warning_*.js`

### 현장 전용 성격

- `schedule.html`
- `schedule_refactor/app.js`
- `schedule_refactor/core.js`
- `schedule_refactor/content.js`
- `schedule_refactor/detail.js`
- `schedule_refactor/display.js`
- `schedule_refactor/quick_time_fix.js`
- 현재 `schedule.html`에서 실제 로드되는 CSS/공통 modal helper

### 공유/경계 모듈 (분리 전에 주의)

- `reservation_firebase_bridge.js`
- `reservation_settings_firebase_sync_v1.js`
- `modal_ux_consistency_v1.js`
- `customer_visit_guide_v16.js` (고객 UI + 관리자 `고객 안내 관리`가 한 파일에 공존)
- `customer_guide_map_admin_ui_v2.js` (이름은 customer지만 관리자 편집 UI 포함)
- `customer_holiday_booking_setting_v1.js` (고객 예약 규칙 + 관리자 설정 UI 연계 가능)
- `customer_inquiry_visit_v1.js` (고객 신청과 관리자 문의 데이터 경계)
- `parking_info_v31.js` (고객 표시 + 관리자 편집/가이드 연계 여부 확인 필요)

**이 경계 모듈을 먼저 억지로 쪼개지 않는다.** `admin.html`/`index.html` 분리 성공 후 안전하게 분해한다.

---

## 제거 후보 — 즉시 삭제 금지

아래 파일은 이름/버전상 구버전 또는 실험 가능성이 있으나 현재 loader/contract 연결을 완전히 확인하기 전 삭제하지 않는다.

- `customer_booking_ux_v22.js`
- `customer_schedule_view.js`
- `customer_visit_guide_v19.js`
- `parking_info_v29.js`
- `parking_info_v30.js`
- `admin_group_search_v1.js`
- `admin_schedule_tab.js`
- `admin_schedule_tab_v3.js`
- `admin_schedule_excel.js`
- `schedule_v3.js`, `schedule_v4.js`, `schedule_v6.js`, `schedule_v8.html`
- `legacy/admin_features_v2_loader.js`
- `admin_mobile_date_input_fix_v1.js` (효과/필요성 재검토 대상)

삭제는 반드시 다음을 통과한 뒤 진행한다.

1. 어떤 Entry/Loader에서도 참조하지 않음
2. contract check에서 참조하지 않음
3. 테스트 URL에서 PC/모바일 실사용 정상
4. 롤백용 과거 파일 보관 필요 여부 판단

---

## 동결/고위험 파일

특별한 이유 없이 직접 대규모 수정하지 않는다.

- `index.html` (Entry 분리 시 최소 변경만)
- `firestore.rules`
- `admin_features.js`
- `admin_schedule_tab_v14.js`
- `customer_booking_ux_v24.js`
- `customer_schedule_view_v3.js`
- `reservation_firebase_bridge.js`
- `customer_visit_guide_v16.js`
- `customer_visit_guide_fix_v20.js`
- `parking_info_v31.js`

새 기능은 가능하면 Loader / Adapter / UI Shell을 새 파일로 추가한다.

---

## 롤백 원칙

각 Phase는 독립 커밋으로 진행한다.

- 기존 Entry/버튼/section을 바로 삭제하지 않는다.
- 새 `admin.html`이 실패하면 현재 `index.html` 관리자 진입으로 즉시 복귀 가능해야 한다.
- 새 관리자 Navigation이 실패하면 기존 상단 탭을 다시 표시하는 것으로 복구 가능해야 한다.
- Firestore 스키마 변경 없이 UI 구조만 먼저 분리한다.

---

## 다음 실제 코드 작업

다음 커밋부터의 우선순위:

1. **활성 Loader 의존성 상세표 완성**
2. **`admin.html` 전용 Entry 설계/생성** (기존 `index.html`은 유지)
3. **관리자 전용 Runtime Loader 신규 생성**
4. 기존 관리자 기능 13개 회귀 테스트
5. 검증 완료 후 고객 Runtime Loader 분리

UI 대공사는 3사이트 Entry 분리 검증 후 시작한다.
