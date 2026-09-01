# 활성 Runtime 의존성 지도

작성 기준: 2026-09-01 / `refactor-preserve-behavior`

목적: 3사이트 분리 전에 **현재 어떤 Entry가 어떤 파일을 실제로 로드하는지** 고정해두는 문서. 이 문서가 완성되기 전에는 구버전처럼 보이는 파일도 임의 삭제하지 않는다.

---

## 1. 현재 고객+관리자 혼합 Entry: `index.html`

`index.html` 자체가 완성 HTML을 직접 들고 있지 않고 다음 순서로 동작한다.

1. `pako` 로드
2. `data1.txt` + `data2.txt` 로드
3. 합친 데이터를 gzip 해제해 원본 HTML 복원
4. 관리자 인증 관련 Security Patch 문자열 치환
5. 복원된 HTML 끝에 다음 파일 삽입
   - `admin_features.js`
   - `admin_features_v2_loader.js`
   - `reservation_firebase_bridge.js`
6. `document.write()`로 최종 페이지 실행

즉 현재 고객 사이트와 관리자 사이트를 분리하려면 가장 먼저 `index.html`의 **복원된 공통 원본 + 관리자 런타임 주입** 구조를 분리해야 한다.

---

## 2. `admin_features.js`

현재 관리자 확장 기능의 초기 베이스 역할.

확인된 책임:

- 관리자 예약 등록 모드
- 예약 마감 설정 확장
- 아웃소싱 업체 설정
- 실제 결제/정산 입력
- `아웃소싱 결제대금` Top-Level 탭 생성
  - button: `#outsourceTabBtn`
  - section: `#tab-outsourcing`

고위험 파일이므로 3사이트 분리 초기에는 직접 리팩터링하지 않고 그대로 로드한다.

---

## 3. `admin_features_v2_loader.js`

현재 혼재의 핵심 Loader.

### 3-1. 시작 즉시

- Boot Shield 설치
- 스케줄 Auth Guard 설치
- Legacy 고객 가이드 guard marker 설치
- `loadCustomerQuickTools()` 실행
- `loadAdminSearchEnhancements()` 실행

### 3-2. `loadCustomerQuickTools()`에서 로드

고객 기능과 관리자 기능이 같은 배열에 섞여 있음.

#### 고객/공통 성격

- `customer_lookup_actions_v1.js`
- `customer_info_tabs_v1.js`
- `customer_status_banner_v1.js`
- `customer_guide_map_admin_ui_v2.js` (이름은 customer지만 관리자 편집 UI도 포함)
- `customer_time_guide_guard_v2.js`
- `customer_playground_booking_guard_v1.js`
- `customer_holiday_booking_setting_v1.js`
- `customer_return_home_v1.js`

#### 관리자 성격

- `admin_cancel_visibility_v1.js`
- `admin_tab_active_fix_v1.js`
- `admin_activity_filter_fix_v1.js`

### 3-3. 관리자 베이스 로드

- `admin2_part1.txt`
- `admin2_part2.txt`
- `admin2_part3.txt`
- `admin2_part4.txt`

4개를 문자열로 합친 뒤 `eval()` 실행.

### 3-4. 관리자 Patch Chain

순서 고정:

1. `admin_features_v3_patch.js`
2. `admin_features_v3_excel_fix.js`
3. `admin_features_v4_patch.js`
4. `admin_features_v5_patch.js`
5. `admin_features_v6_patch.js`
6. `admin_features_v7_patch.js`
7. `admin_features_v8_patch.js`
8. `admin_features_v9_patch.js`

현재 이 순서를 임의 변경하면 전역 함수 wrapper/override 순서가 달라질 수 있으므로 초기 분리에서는 그대로 유지.

### 3-5. Patch Chain 이후 고객 기능 직접 로드

- `customer_booking_ux_v24.js`
- `customer_visit_guide_v16.js`를 읽어 문자열 일부 치환 후 `eval()`
- `customer_visit_guide_fix_v20.js`를 읽어 문자열 일부 치환 후 `eval()`
- `parking_info_v31.js`를 읽어 문자열 일부 치환 후 `eval()`

이 부분 때문에 현재 Loader를 그대로 `admin.html`에 옮긴다고 해서 관리자 전용 Runtime이 되는 것은 아니다.

### 3-6. Legacy schedule fallback

`#zrAdminScheduleScript`가 없으면 `admin_schedule_tab.js`를 로드하는 fallback이 존재.

하지만 현재 `admin_features_v9_patch.js`가 먼저 guard marker를 만들고 이후 V14를 로드하므로 실제 정상 경로는 아래 V9 chain을 우선 확인한다.

---

## 4. `admin_features_v9_patch.js` 추가 동적 로드

이 파일은 단순 UI patch가 아니라 **2차 Loader 역할도 수행**한다.

### V14 스케줄 경로

`reservation_firebase_bridge` 준비 후:

1. `admin_schedule_tab_v14.js`
2. callback 안에서
   - `customer_schedule_view_v3.js`
   - `customer_booking_rules_v3.js`
   - `admin_schedule_excel_v3.js`
   - `schedule_ui_fix_v4.js`

주의:

- 관리자 스케줄 탭을 위해 `customer_schedule_view_v3.js`, `customer_booking_rules_v3.js`도 관리자 Runtime에 같이 들어온다.
- `schedule_ui_fix_v4.js` 이름은 schedule이지만 관리자 페이지의 스케줄 관련 보정도 수행할 수 있으므로 현장 전용으로 단정하면 안 된다.

### 기타 동적 로드

- `customer_visit_guide_v19.js`
  - load 후 `customer_visit_guide_fix_v20.js`
- `reservation_staff_login_fix_v14.js`
- `admin_ops_v10.js`
  - load 후 `admin_ops_v11_patch.js`

또한 이 파일은 구형 `admin_schedule_tab.js` 자동 주입을 막기 위해 `#zrAdminScheduleScript` guard marker를 사용한다.

**결론:** v9 patch는 현재 분리 공사에서 제거/순서변경 금지. 관리자 전용 Loader를 만들 때도 우선 그대로 가져가고, 안정화 후 Loader 책임만 추출한다.

---

## 5. `admin_tab_active_fix_v1.js` — 3차 Loader/관리자 기능 확장 허브

`admin_features_v2_loader.js`의 Quick Tools에서 로드됨.

이 파일에서 다음 기능을 추가 로드한다.

### 고객/문의 경계

- `customer_inquiry_visit_v1.js`
- `admin_preview_visit_v1.js`
- `admin_preview_visit_query_ui_v1.js`
- `admin_preview_visit_notify_v1.js`
- `admin_preview_visit_content_v1.js`
- `admin_inquiry_reply_v1.js`
- `admin_inquiry_reply_layout_v1.js`

### 관리자 화면/업무 기능

- `admin_calendar_status_summary_v1.js`
- `admin_activity_org_detail_modal_fix_v1.js`
- `admin_mobile_date_input_fix_v1.js`
- `admin_schedule_customer_notify_v1.js`
- `admin_booking_hold_v1.js`
- `admin_booking_hold_query_fix_v1.js`
- `admin_calendar_status_select_v1.js`
- `admin_settlement_workspace_v1.js`
- `admin_settlement_ui_stability_v1.js`
- `admin_unsaved_changes_guard_v1.js`
- `admin_excel_reliability_fix_v1.js`
- `admin_list_pagination_v1.js`
- `admin_today_tab_v1.js`
- `admin_today_print_layout_v1.js`
- `admin_warning_tab_v1.js`
- `admin_warning_schedule_shortcut_v1.js`
- `admin_reservation_cleanup_v1.js`
- `admin_reservation_cleanup_reliability_v1.js`
- `admin_time_15min_v1.js`
- `admin_section_subtabs_v1.js`
- `admin_preview_cafe_ui_v1.js`

### 고객 규칙이지만 관리자 Runtime에서도 필요한 파일

- `customer_group_minimum_v1.js`
- `customer_view_tracking_v1.js`

이 파일 역시 이름은 `tab_active_fix`지만 사실상 Loader 허브다. 향후에는 이름/책임을 정리할 필요가 있으나 **초기 3사이트 분리에서는 동작을 그대로 보존**한다.

---

## 6. 관리자 동적 Top-Level 탭 생성 파일

| 파일 | 버튼 | 화면 | 표시명 |
|---|---|---|---|
| 기본 복원 HTML | `data-tab="calendar"` | `#tab-calendar` | 예약 캘린더 |
| 기본 복원 HTML | `data-tab="activity"` | `#tab-activity` | 예약 현황 |
| 기본 복원 HTML | `data-tab="meals"` | `#tab-meals` | 식사 현황 |
| 기본 복원 HTML | `data-tab="menuadmin"` | `#tab-menuadmin` | 카페 메뉴 관리 |
| 기본 복원 HTML | `data-tab="inquiries"` | `#tab-inquiries` | 1:1 문의 |
| 기본 복원 HTML | `data-tab="settings"` | `#tab-settings` | 설정 → 현재 `예약설정`으로 rename |
| `admin_features.js` | `#outsourceTabBtn` | `#tab-outsourcing` | 아웃소싱 결제대금 |
| `admin_schedule_tab_v14.js` | `#zrScheduleTabBtn` | `#tab-schedule` | 스케줄 관리 |
| `customer_visit_guide_v16.js` | `#zrGuideAdminTab` | `#zrGuideAdminSection` | 고객 안내 관리 |
| `admin_preview_visit_v1.js` | `#zrPreviewVisitTabBtn` | `#tab-preview-visit` | 사전답사 관리 |
| `admin_today_tab_v1.js` | `#zrTodayTabBtn` | `#tab-today` | `Today` |
| `admin_warning_tab_v1.js` | `#zrWarningTabBtn` | `#tab-warning` | 경고 |
| `admin_reservation_cleanup_v1.js` | `#zrCleanupTabBtn` | `#tab-cleanup` | 과거 예약 정리 |

총 13개 Top-Level 메뉴.

---

## 7. 현장 Entry: `schedule.html`

현장스케줄은 이미 별도 Entry로 분리되어 있다.

현재 직접 로드:

- `schedule_v4.css?v=7`
- `modal_ux_consistency_v1.js?v=2`
- `schedule_refactor/app.js?v=1`
- `schedule_refactor/quick_time_fix.js?v=1`

`app.js` 내부 모듈 import 의존성은 다음 audit에서 별도 확인한다.

**현장사이트는 3사이트 분리 공사에서 가장 마지막에 건드린다.** 현재 별도 URL이므로 고객/관리자 분리로 인한 위험을 굳이 같이 확대하지 않는다.

---

## 8. 현재 구조상 즉시 확인된 리팩터링 포인트

### A. 파일명과 실제 책임이 다름

- `admin_tab_active_fix_v1.js` → 실제로는 여러 관리자 기능 Loader
- `admin_features_v9_patch.js` → 실제로는 V14 스케줄/ops/고객가이드 Loader도 담당
- `customer_visit_guide_v16.js` → 고객 가이드 + 관리자 고객안내 탭 동시 보유
- `customer_guide_map_admin_ui_v2.js` → customer prefix지만 관리자 UI 포함

따라서 이름만 보고 파일 이동/삭제 금지.

### B. 같은 계열 여러 버전이 저장되어 있음

예:

- `customer_booking_ux_v22.js` / `v24.js`
- `customer_schedule_view.js` / `v3.js`
- `customer_visit_guide_v16.js` / `v19.js` / `fix_v20.js`
- `parking_info_v29.js` / `v30.js` / `v31.js`
- `admin_schedule_tab.js` / `v3.js` / `v14.js`
- `schedule_v3.js` / `v4.js` / `v6.js` / `schedule_refactor/*`

이들은 제거 후보일 뿐이며 현재 동적 Loader와 guard 동작 때문에 실제 참조 관계를 확인한 뒤 삭제한다.

---

## 9. 관리자 Smart Panel `처리 필요` 데이터 소스 계획

새 관리자 UI에서 PC 우측 패널과 상단 알림 배지는 새 Collection을 만들지 않고 현재 데이터를 읽어 계산하는 것으로 시작한다.

### 새 예약 접수

- 기존 예약 데이터 중 `status === 'pending'`
- 완료/보류/취소는 처리 필요 수에서 제외
- 클릭 시 `예약 현황`으로 이동 후 상태 필터 `접수 대기`

### 1:1 문의

- 현재 문의 저장 구조의 관리자 답변 완료 여부를 `admin_inquiry_reply_v1.js` 기준으로 확인하여 계산
- 새 알림 필드/Collection 추가는 하지 않음
- 클릭 시 `1:1 문의` 화면 이동

### 사전답사

- `customer_inquiry_visit_v1.js` / `admin_preview_visit_v1.js`가 사용하는 기존 문의 데이터 중 `[사전답사 문의]`이고 아직 `[사전답사 확정]`이 아닌 건
- 클릭 시 `사전답사 관리` + `접수` 필터

Smart Panel 구현 전에 각 데이터의 정확한 “처리 완료 판정”을 코드에서 한 번 더 고정한다.

---

## 10. 다음 안전한 코드 변경 순서

1. `admin.html` 신규 파일 생성 — 기존 혼합 Runtime을 복제한 **격리 테스트 Entry**로 시작
2. 기존 `index.html`은 변경하지 않음
3. `admin.html` 테스트에서 관리자 13개 메뉴가 동일하게 작동하는지 검증
4. 그 다음 `admin_runtime_loader_v1.js`를 새로 만들어 관리자 로드 책임을 단계적으로 이동
5. 혼합 Loader와 결과가 완전히 동일한지 contract/human test
6. 이후 고객 Runtime을 `index.html`에서 분리

**중요:** 처음 `admin.html`을 만들 때부터 모든 customer 파일을 제거하려고 하지 않는다. 먼저 URL 분리 → 동작 동일 확인 → Loader 책임 분리 순으로 간다.
