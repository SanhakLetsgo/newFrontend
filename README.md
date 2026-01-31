# 警告(위험한 일을 조심하거나 삼가도록 미리 일러서 주의를 주다.)

팀원의 **운동 출석/시간 기록**과 **논문 스터디(읽은 논문 + 리뷰 등록)** 만 지원하는 미니멀 웹앱입니다.

## 기능

- **참여자 선택**: 시작 시 이름 선택 (신현호, 창민석, 송수현, 강태영, 이윤지, 조수민). 로그인 없음.
- **운동**: 오늘 출석 체크, 운동 시작/종료 시간 기록. 최근 14일 기록 테이블 및 날짜별 수정.
- **논문 스터디**: 내가 읽은 논문 목록, 논문 추가, 논문별 리뷰(한줄요약, 핵심 기여, 방법/모델, 실험/결과, 한계/의문점, 아이디어/후속 실험).

## 기술 스택

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **MongoDB** (Atlas) + **Prisma**
- 세션: 쿠키 기반 참여자 ID (NextAuth 미사용)

## 요구 사항

- Node.js 18+
- MongoDB (로컬 또는 Atlas)

## 어떻게 하라고? (실행 순서)

### 1. team-routine 폴더로 이동

```bash
cd team-routine
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고 **DATABASE_URL**만 본인 DB에 맞게 수정합니다.

```bash
cp .env.example .env
```

`.env` 예시 (MongoDB Atlas):

```
DATABASE_URL="mongodb+srv://syralee1004:본인비밀번호@cluster0.qbfefdi.mongodb.net/team_routine?retryWrites=true&w=majority"
```

`<db_password>` 또는 `본인비밀번호` 부분을 Atlas 비밀번호로 바꾸세요.

### 4. DB 스키마 반영 (MongoDB는 migrate 대신 push)

```bash
npm run db:generate
npm run db:push
```

(MongoDB는 Prisma Migrate 미지원 → `db:push`로 스키마 반영)

### 5. 시드 (선택)

참여자 6명 + 운동 7일 + 논문 3개 + 리뷰 1개 넣기:

```bash
npm run db:seed
```

### 6. 서버 실행

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 접속 → **참여자 이름** 선택 → 대시보드 사용.

---

## 에러가 났을 때

- **"This page isn't working" / 500 에러**  
  → `team-routine` 안에서 `npm run dev` 했는지 확인.  
  → `.next` 캐시 문제면: `rm -rf .next` 후 다시 `npm run dev`.

- **DB 연결 실패**  
  → PostgreSQL 실행 중인지, `.env`의 `DATABASE_URL`이 맞는지 확인.

- **push 시 "Large files"**  
  → `node_modules`는 커밋하지 말 것. `.gitignore`에 이미 있음.

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:push` | 스키마를 MongoDB에 반영 (MongoDB는 이걸 사용) |
| `npm run db:migrate` | 마이그레이션 (PostgreSQL용, MongoDB는 사용 안 함) |
| `npm run db:seed` | 시드 데이터 삽입 |
| `npm run db:studio` | Prisma Studio 실행 |

## 라이선스

MIT
