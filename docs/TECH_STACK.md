# 기술 스택 문서

## 1. 프로젝트 개요

`myauth`는 Spring Boot 기반의 인증/소셜 API 백엔드 프로젝트입니다. 현재 코드베이스 기준으로 회원가입, 로그인, JWT 인증, 카카오 OAuth, 게시글, 댓글, 좋아요, 북마크, 팔로우, 해시태그, 이미지 업로드, DM 기능이 포함되어 있습니다.

## 2. 핵심 기술 스택

### Backend

- Java 17
- Spring Boot 4.0.0
- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- Lombok

### Database

- MySQL
- Hibernate ORM

### Authentication / Authorization

- JWT (`io.jsonwebtoken:jjwt`)
- Spring Security 기반 Stateless 인증
- BCrypt 비밀번호 해싱
- Kakao OAuth 연동
- Refresh Token 기반 Access Token 재발급

### File / Media

- Spring Multipart Upload
- 로컬 파일 스토리지 (`./uploads`)
- 정적 리소스 매핑을 통한 `/uploads/**` 제공
- S3 업로드 서비스 인터페이스 초안 존재
  - 현재 기본 구현은 로컬 스토리지이며, S3 구현은 예시 수준입니다.

### Infra / DevOps

- Gradle
- Docker
- Docker Compose
- Amazon Corretto 17 Alpine 이미지

### Test

- JUnit Platform
- Spring Boot 테스트 스타터
- Spring Security 테스트
- JPA 테스트
- Validation / Web MVC 테스트

## 3. 상세 구성

### 애플리케이션 레이어

- `controller`: REST API 엔드포인트 제공
- `service`: 인증, 게시글, 팔로우, DM 등 비즈니스 로직 처리
- `repository`: Spring Data JPA 기반 데이터 접근
- `entity`: JPA 엔티티 모델
- `dto`: 요청/응답 모델
- `config`: 보안, CORS, MVC, Jackson, 앱 속성 설정
- `security`: JWT 필터, 토큰 제공자, 사용자 인증 처리

### API 스타일

- JSON 기반 REST API
- 공통 응답 래퍼 `ApiResponse` 사용
- `/api` prefix 기반 엔드포인트 구성

### 인증 구조

- Access Token + Refresh Token 구조
- 서버 세션을 사용하지 않는 Stateless 인증
- 웹 클라이언트는 HttpOnly 쿠키로 Refresh Token 전달
- 모바일/기타 클라이언트는 JSON 바디 기반 토큰 전달 지원

### 환경 분리

- `application.yaml`: 공통 설정
- `application-dev.yaml`: 개발 환경 설정
- `application-prod.yaml`: 운영 환경 설정

## 4. 운영 및 배포 관련 스택

### 컨테이너 환경

- 애플리케이션 포트: `9080`
- Docker 멀티스테이지 빌드 사용
- JAR 빌드 후 별도 런타임 이미지에서 실행

### 로그 및 파일

- 로그 파일 기록 사용
- 업로드 파일은 로컬 디렉터리에 저장
- 운영 환경에서도 파일 업로드 경로와 로그 경로를 분리해서 관리 가능

### 외부 연동

- MySQL 데이터베이스
- Kakao OAuth API

## 5. 현재 코드 기준 기술 스택 요약표

| 구분 | 기술 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 4.0.0 |
| Web | Spring MVC / REST |
| Security | Spring Security, JWT, BCrypt |
| ORM | Spring Data JPA, Hibernate |
| Database | MySQL |
| Build | Gradle |
| Auth Integration | Kakao OAuth |
| File Upload | Multipart, Local Storage |
| Container | Docker, Docker Compose |
| Runtime Image | Amazon Corretto 17 Alpine |
| Test | JUnit, Spring Test |

## 6. 참고 파일

- `build.gradle`
- `src/main/resources/application.yaml`
- `src/main/resources/application-dev.yaml`
- `src/main/resources/application-prod.yaml`
- `src/main/java/com/example/myauth/config/SecurityConfig.java`
- `src/main/java/com/example/myauth/config/WebMvcConfig.java`
- `src/main/java/com/example/myauth/controller/AuthController.java`
- `src/main/java/com/example/myauth/service/LocalImageStorageService.java`
- `src/main/java/com/example/myauth/service/S3ImageStorageService.java`
- `Dockerfile`
- `docker-compose.yml`

