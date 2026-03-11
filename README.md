# 🍽️ TrueScore - 진짜 현지 맛집 검색

> 베이즈 평균 알고리즘으로 관광객 함정을 피하고, 통계적으로 신뢰도 높은 현지 맛집 TOP 10을 추천합니다.

## 알고리즘

```
S_opt = α × (C×m + N×R) / (C+N) − β×σ + γ×L
```

- **R**: 평균 평점 | **N**: 리뷰 수 | **σ**: 표준편차 | **L**: 현지인 리뷰 비율
- 자세한 내용: [`docs/algorithm.md`](./docs/algorithm.md)

> `docs/algorithm.md`가 Claude AI 시스템 프롬프트로 직접 사용됩니다.
> 알고리즘을 수정하려면 이 파일만 편집하면 됩니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI**: Claude API (`claude-sonnet-4-6`)
- **배포**: Vercel

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 ANTHROPIC_API_KEY 입력

# 3. 개발 서버 실행
npm run dev
```

`http://localhost:3000` 접속 후 지역명 검색

## Vercel 배포

1. GitHub에 Push
2. [Vercel](https://vercel.com)에서 레포 Import
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy

## 파일 구조

```
matzip/
├── app/
│   ├── page.tsx              # 홈 (Hero + 검색창)
│   ├── search/page.tsx       # 검색 결과
│   └── api/recommend/        # Claude API 라우트
├── components/               # UI 컴포넌트
├── lib/claude.ts             # Claude 클라이언트
├── types/restaurant.ts       # 타입 정의
└── docs/algorithm.md         # 알고리즘 문서 (= AI 프롬프트)
```
