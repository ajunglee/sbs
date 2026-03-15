# 관리자 프론트엔드 연동 가이드

> `myauth` 백엔드에 구현된 관리자 API를 프론트엔드에서 바로 연동하기 위한 문서

## 1. 문서 범위

이 문서는 현재 백엔드에 구현 완료된 관리자 기능만 다룬다.

- 관리자 대시보드 요약
- 관리자 사용자 목록/상세 조회
- 사용자 상태 변경
- 사용자 권한 변경
- 관리자 게시물 목록/상세 조회
- 게시물 강제 삭제
- 관리자 댓글 목록/상세 조회
- 댓글 강제 삭제

아직 구현되지 않은 기능은 포함하지 않는다.

- 관리자 감사 로그 조회 API
- 신고 관리 API
- 벌크 액션 API

---

## 2. 기본 정보

### Base URL

```txt
http://localhost:9080
```

### 관리자 API Prefix

```txt
/api/admin
```

### 인증 방식

모든 관리자 API는 JWT Access Token이 필요하다.

```http
Authorization: Bearer {accessToken}
```

### 접근 권한

- `/api/admin/**` 는 `ROLE_ADMIN` 이상만 접근 가능하다.
- 사용자 권한 변경 API는 사실상 `isSuperUser = true` 관리자만 성공한다.

### 공통 응답 형식

모든 관리자 API는 기존 `ApiResponse<T>` 구조를 사용한다.

```json
{
  "success": true,
  "message": "응답 메시지",
  "data": {}
}
```

에러 시:

```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

---

## 3. 프론트엔드 공통 처리 규칙

### 3.1 관리자 진입 조건

로그인 응답의 `user.role` 이 `ROLE_ADMIN` 인 경우에만 관리자 화면 진입을 허용하는 것이 안전하다.

추가로 다음 상황을 프론트에서 구분해두는 것이 좋다.

- `ROLE_ADMIN` 이 아니면 관리자 메뉴 숨김
- `ROLE_ADMIN` 이지만 `isSuperUser` 가 아니면 권한 변경 UI 비활성화

### 3.2 날짜 파라미터 형식

`createdFrom`, `createdTo`, `lockedUntil` 은 `LocalDateTime` 형식이다.

권장 전송 형식:

```txt
2026-03-15T10:30:00
```

### 3.3 페이지네이션 응답 형식

목록 API는 Spring `Page<T>` 를 그대로 반환한다.

예시:

```json
{
  "success": true,
  "message": "목록 조회 성공",
  "data": {
    "content": [],
    "pageable": {},
    "last": true,
    "totalPages": 1,
    "totalElements": 3,
    "size": 20,
    "number": 0,
    "sort": {},
    "first": true,
    "numberOfElements": 3,
    "empty": false
  }
}
```

프론트에서는 보통 아래 필드만 우선 사용하면 된다.

- `data.content`
- `data.number`
- `data.size`
- `data.totalElements`
- `data.totalPages`
- `data.first`
- `data.last`

### 3.4 삭제 API 요청 바디

게시물/댓글 삭제 API는 요청 바디 없이 호출해도 되고, 사유를 보낼 수도 있다.

```json
{
  "reason": "운영 정책 위반"
}
```

---

## 4. 권장 타입 정의

프론트엔드에서 먼저 아래 enum을 정의해두면 연동이 편하다.

```ts
export type UserRole = "ROLE_USER" | "ROLE_ADMIN";

export type UserStatus =
  | "ACTIVE"
  | "DELETED"
  | "INACTIVE"
  | "PENDING_VERIFICATION"
  | "SUSPENDED";

export type PostVisibility = "PUBLIC" | "PRIVATE" | "FOLLOWERS";
```

공통 응답 타입 예시:

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

페이지 타입 예시:

```ts
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
```

---

## 5. 대시보드 API

### 5.1 관리자 대시보드 요약 조회

```http
GET /api/admin/dashboard/summary
Authorization: Bearer {accessToken}
```

응답 예시:

```json
{
  "success": true,
  "message": "관리자 대시보드 요약 조회 성공",
  "data": {
    "totalUsers": 1200,
    "activeUsers": 1100,
    "suspendedUsers": 35,
    "inactiveUsers": 20,
    "totalPosts": 8400,
    "activePosts": 8001,
    "deletedPosts": 399,
    "totalComments": 15200
  }
}
```

프론트 사용처:

- 관리자 메인 KPI 카드
- 상단 요약 통계
- 운영 현황 위젯

---

## 6. 사용자 관리 API

## 6.1 사용자 목록 조회

```http
GET /api/admin/users?page=0&size=20&keyword=test&status=ACTIVE&role=ROLE_USER&provider=LOCAL&isActive=true
Authorization: Bearer {accessToken}
```

지원 쿼리 파라미터:

- `page`: 기본값 `0`
- `size`: 기본값 `20`, 최대 `100`
- `keyword`: 이메일 또는 이름 검색
- `status`: `ACTIVE | DELETED | INACTIVE | PENDING_VERIFICATION | SUSPENDED`
- `role`: `ROLE_USER | ROLE_ADMIN`
- `provider`: 예: `LOCAL`, `KAKAO`
- `isActive`: `true | false`
- `createdFrom`: `2026-03-01T00:00:00`
- `createdTo`: `2026-03-31T23:59:59`

응답 아이템 타입:

```json
{
  "id": 1,
  "email": "admin@example.com",
  "name": "관리자",
  "provider": "LOCAL",
  "role": "ROLE_ADMIN",
  "status": "ACTIVE",
  "isActive": true,
  "isSuperUser": true,
  "createdAt": "2026-03-15T10:10:10"
}
```

프론트 화면 권장 컬럼:

- ID
- 이메일
- 이름
- 가입 방식
- 권한
- 상태
- 활성 여부
- 슈퍼 관리자 여부
- 가입일

## 6.2 사용자 상세 조회

```http
GET /api/admin/users/{userId}
Authorization: Bearer {accessToken}
```

응답 예시:

```json
{
  "success": true,
  "message": "관리자 사용자 상세 조회 성공",
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "관리자",
    "provider": "LOCAL",
    "providerId": null,
    "profileImage": null,
    "role": "ROLE_ADMIN",
    "status": "ACTIVE",
    "isActive": true,
    "isSuperUser": true,
    "failedLoginAttempts": 0,
    "accountLockedUntil": null,
    "emailVerifiedAt": "2026-03-15T10:00:00",
    "lastLoginAt": "2026-03-15T10:20:00",
    "lastLoginIp": "127.0.0.1",
    "createdAt": "2026-03-01T10:00:00",
    "updatedAt": "2026-03-15T10:20:00"
  }
}
```

## 6.3 사용자 상태 변경

```http
PATCH /api/admin/users/{userId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청 바디:

```json
{
  "status": "SUSPENDED",
  "reason": "반복 신고 누적",
  "lockedUntil": "2026-04-01T00:00:00"
}
```

상태별 프론트 처리 권장:

- `ACTIVE`: 활성화 버튼
- `INACTIVE`: 비활성화 버튼
- `SUSPENDED`: 정지 버튼 + 정지 종료일 입력
- `DELETED`: 운영 상태 변경 용도, 일반 UI에서는 신중히 노출

주의:

- 본인 계정은 변경할 수 없다.
- 일반 관리자는 다른 관리자 계정 상태 변경에 실패할 수 있다.

성공 응답은 `AdminUserDetailResponse` 와 동일하다.

## 6.4 사용자 권한 변경

```http
PATCH /api/admin/users/{userId}/role
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청 바디:

```json
{
  "role": "ROLE_ADMIN",
  "superUser": false,
  "reason": "운영 담당 승격"
}
```

권한 회수 예시:

```json
{
  "role": "ROLE_USER",
  "superUser": false,
  "reason": "운영 권한 회수"
}
```

주의:

- 이 API는 슈퍼 관리자만 성공한다.
- 본인 계정 권한 변경은 금지된다.
- 마지막 슈퍼 관리자의 `superUser` 해제는 금지된다.

프론트 UX 권장:

- `isSuperUser !== true` 면 권한 변경 버튼 숨김
- 회수 전 확인 모달 표시
- 실패 메시지 그대로 토스트 표시

---

## 7. 게시물 관리 API

## 7.1 게시물 목록 조회

```http
GET /api/admin/posts?page=0&size=20&keyword=test&authorEmail=user@example.com&isDeleted=false
Authorization: Bearer {accessToken}
```

지원 쿼리 파라미터:

- `page`
- `size`
- `keyword`: 본문 검색
- `authorId`
- `authorEmail`
- `visibility`: `PUBLIC | PRIVATE | FOLLOWERS`
- `isDeleted`: `true | false`
- `createdFrom`
- `createdTo`

응답 아이템 예시:

```json
{
  "id": 10,
  "authorId": 2,
  "authorEmail": "user@example.com",
  "authorName": "사용자",
  "content": "게시물 본문",
  "visibility": "PUBLIC",
  "likeCount": 3,
  "commentCount": 5,
  "viewCount": 40,
  "isDeleted": false,
  "createdAt": "2026-03-15T09:00:00"
}
```

프론트 화면 권장 컬럼:

- 게시물 ID
- 작성자
- 본문 미리보기
- 공개 범위
- 좋아요 수
- 댓글 수
- 조회 수
- 삭제 여부
- 작성일

## 7.2 게시물 상세 조회

```http
GET /api/admin/posts/{postId}
Authorization: Bearer {accessToken}
```

응답 예시:

```json
{
  "success": true,
  "message": "관리자 게시물 상세 조회 성공",
  "data": {
    "id": 10,
    "authorId": 2,
    "authorEmail": "user@example.com",
    "authorName": "사용자",
    "content": "게시물 본문",
    "visibility": "PUBLIC",
    "likeCount": 3,
    "commentCount": 5,
    "viewCount": 40,
    "isDeleted": false,
    "createdAt": "2026-03-15T09:00:00",
    "updatedAt": "2026-03-15T09:10:00",
    "images": [
      {
        "id": 100,
        "imageUrl": "http://localhost:9080/uploads/a.jpg",
        "thumbnailUrl": "http://localhost:9080/uploads/a.jpg",
        "sortOrder": 0,
        "width": null,
        "height": null,
        "mediaType": "IMAGE"
      }
    ]
  }
}
```

## 7.3 게시물 강제 삭제

```http
DELETE /api/admin/posts/{postId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청 바디 선택:

```json
{
  "reason": "운영 정책 위반"
}
```

응답:

```json
{
  "success": true,
  "message": "게시물 삭제 성공",
  "data": null
}
```

주의:

- 실제 동작은 soft delete 이다.
- 삭제 후 목록을 다시 조회하거나 로컬 캐시에서 `isDeleted=true` 반영 처리를 해도 된다.

---

## 8. 댓글 관리 API

## 8.1 댓글 목록 조회

```http
GET /api/admin/comments?page=0&size=20&keyword=test&postId=10&isDeleted=false
Authorization: Bearer {accessToken}
```

지원 쿼리 파라미터:

- `page`
- `size`
- `keyword`
- `authorId`
- `postId`
- `isDeleted`
- `createdFrom`
- `createdTo`

응답 아이템 예시:

```json
{
  "id": 55,
  "postId": 10,
  "authorId": 3,
  "authorEmail": "commenter@example.com",
  "authorName": "댓글작성자",
  "parentId": null,
  "content": "댓글 내용",
  "likeCount": 0,
  "isDeleted": false,
  "createdAt": "2026-03-15T09:30:00"
}
```

## 8.2 댓글 상세 조회

```http
GET /api/admin/comments/{commentId}
Authorization: Bearer {accessToken}
```

응답 예시:

```json
{
  "success": true,
  "message": "관리자 댓글 상세 조회 성공",
  "data": {
    "id": 55,
    "postId": 10,
    "postAuthorId": 2,
    "authorId": 3,
    "authorEmail": "commenter@example.com",
    "authorName": "댓글작성자",
    "parentId": null,
    "content": "댓글 내용",
    "likeCount": 0,
    "isDeleted": false,
    "createdAt": "2026-03-15T09:30:00",
    "updatedAt": "2026-03-15T09:31:00"
  }
}
```

## 8.3 댓글 강제 삭제

```http
DELETE /api/admin/comments/{commentId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청 바디 선택:

```json
{
  "reason": "욕설 포함"
}
```

응답:

```json
{
  "success": true,
  "message": "댓글 삭제 성공",
  "data": null
}
```

주의:

- 댓글도 soft delete 로 처리된다.
- 삭제 후 댓글 수를 UI에서 낙관적으로 줄이고 싶다면, 이후 게시물 상세 또는 댓글 목록을 재조회하는 방식이 가장 안전하다.

---

## 9. 에러 처리 가이드

관리자 화면에서는 아래 상태 코드를 우선 구분하면 된다.

### 400 Bad Request

주요 상황:

- 잘못된 enum 값 전송
- `lockedUntil` 형식 오류
- 사유 1000자 초과
- 본인 계정 수정 시도
- 마지막 슈퍼 관리자 회수 시도

예시:

```json
{
  "success": false,
  "message": "본인 계정은 관리자 기능으로 변경할 수 없습니다.",
  "data": null
}
```

### 401 Unauthorized

주요 상황:

- Access Token 누락
- 만료된 토큰

권장 처리:

- 로그인 페이지 이동
- 토큰 갱신 로직 실행

### 403 Forbidden

주요 상황:

- 일반 사용자가 관리자 API 호출
- 슈퍼 관리자 전용 기능 호출

예시:

```json
{
  "success": false,
  "message": "슈퍼 관리자만 권한을 변경할 수 있습니다.",
  "data": null
}
```

### 404 Not Found

주요 상황:

- 존재하지 않는 사용자/게시물/댓글 조회

### 500 Internal Server Error

주요 상황:

- 서버 내부 오류

권장 처리:

- 공통 에러 토스트
- 재시도 버튼 제공

---

## 10. 권장 프론트 화면 구성

### 10.1 관리자 대시보드

- KPI 카드: 전체 사용자 수, 정지 사용자 수, 전체 게시물 수, 전체 댓글 수
- 빠른 이동 버튼: 사용자 관리, 게시물 관리, 댓글 관리

### 10.2 사용자 관리 화면

- 필터: keyword, status, role, provider, isActive, createdFrom, createdTo
- 테이블
- 우측 상세 패널 또는 모달
- 액션 버튼: 활성화, 비활성화, 정지, 관리자 승격/회수

### 10.3 게시물 관리 화면

- 필터: keyword, authorEmail, visibility, isDeleted, createdFrom, createdTo
- 테이블
- 상세 모달
- 삭제 사유 입력 후 삭제

### 10.4 댓글 관리 화면

- 필터: keyword, postId, authorId, isDeleted, createdFrom, createdTo
- 테이블
- 상세 모달
- 삭제 사유 입력 후 삭제

---

## 11. 프론트 연동 예시

### 11.1 Axios 인스턴스 예시

```ts
import axios from "axios";

export const adminApi = axios.create({
  baseURL: "http://localhost:9080",
  headers: {
    "Content-Type": "application/json",
  },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 11.2 대시보드 호출 예시

```ts
export async function getAdminSummary() {
  const response = await adminApi.get("/api/admin/dashboard/summary");
  return response.data.data;
}
```

### 11.3 사용자 목록 호출 예시

```ts
export async function getAdminUsers(params: {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  role?: string;
  provider?: string;
  isActive?: boolean;
}) {
  const response = await adminApi.get("/api/admin/users", { params });
  return response.data.data;
}
```

### 11.4 사용자 상태 변경 예시

```ts
export async function updateAdminUserStatus(
  userId: number,
  payload: {
    status: string;
    reason?: string;
    lockedUntil?: string | null;
  }
) {
  const response = await adminApi.patch(`/api/admin/users/${userId}/status`, payload);
  return response.data.data;
}
```

### 11.5 게시물 삭제 예시

```ts
export async function deleteAdminPost(postId: number, reason?: string) {
  const response = await adminApi.delete(`/api/admin/posts/${postId}`, {
    data: reason ? { reason } : undefined,
  });
  return response.data;
}
```

### 11.6 댓글 삭제 예시

```ts
export async function deleteAdminComment(commentId: number, reason?: string) {
  const response = await adminApi.delete(`/api/admin/comments/${commentId}`, {
    data: reason ? { reason } : undefined,
  });
  return response.data;
}
```

---

## 12. 구현 시 주의사항

- 프론트에서 관리자 메뉴 노출 여부와 실제 API 권한은 별개다. 백엔드 403 처리를 반드시 함께 고려해야 한다.
- `size` 는 백엔드에서 최대 `100` 으로 제한된다.
- enum 문자열은 대소문자까지 정확히 맞춰야 한다.
- 삭제 API는 성공 후 `data` 가 `null` 이다.
- 현재 감사 로그는 저장만 하고 조회 API는 아직 없다.

---

## 13. 현재 구현된 관리자 API 목록

```txt
GET    /api/admin/dashboard/summary

GET    /api/admin/users
GET    /api/admin/users/{userId}
PATCH  /api/admin/users/{userId}/status
PATCH  /api/admin/users/{userId}/role

GET    /api/admin/posts
GET    /api/admin/posts/{postId}
DELETE /api/admin/posts/{postId}

GET    /api/admin/comments
GET    /api/admin/comments/{commentId}
DELETE /api/admin/comments/{commentId}
```

이 문서는 현재 코드 구현 기준이며, 추후 관리자 감사 로그 조회나 신고 관리 기능이 추가되면 별도 섹션으로 확장하면 된다.
