/**
 * 카카오 Local Search API로 실제 식당 목록을 가져와
 * compare-algorithms.ts 에서 바로 쓸 수 있는 JSON 템플릿을 생성합니다.
 *
 * 사용법:
 *   KAKAO_REST_API_KEY=xxxx npx tsx scripts/fetch-places.ts --region "상도동 성대시장"
 *   KAKAO_REST_API_KEY=xxxx npx tsx scripts/fetch-places.ts --region "홍대" --size 20
 *
 * 출력:
 *   scripts/places-data.json  ← R·N·sigma·L 을 직접 채운 뒤 compare-algorithms.ts 에 전달
 */

import fs from 'fs'
import path from 'path'

// ─── 타입 ────────────────────────────────────────────────────────────

interface KakaoPlace {
  id: string
  place_name: string
  category_name: string
  category_group_name: string
  phone: string
  address_name: string
  road_address_name: string
  place_url: string
  x: string
  y: string
}

interface KakaoSearchResponse {
  documents: KakaoPlace[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

/** compare-algorithms.ts 의 Restaurant 인터페이스와 동일 */
export interface PlaceEntry {
  name: string
  category: string
  address: string
  phone: string
  kakaoUrl: string
  R: number | null   // ← 카카오맵에서 직접 확인 후 입력
  N: number | null   // ← 카카오맵에서 직접 확인 후 입력
  sigma: number      // ← 알 수 없으면 기본값 0.5 사용
  L: number          // ← 알 수 없으면 기본값 0.7 사용
  isFranchise?: boolean
  note?: string
}

// ─── 카카오 API 호출 ─────────────────────────────────────────────────

async function fetchKakaoPlaces(query: string, size: number): Promise<KakaoPlace[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY
  if (!apiKey) {
    throw new Error(
      'KAKAO_REST_API_KEY 환경변수가 없습니다.\n' +
      '실행 방법: KAKAO_REST_API_KEY=your_key npx tsx scripts/fetch-places.ts --region "지역명"'
    )
  }

  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(query + ' 맛집')}` +
    `&category_group_code=FD6` +
    `&size=${size}`

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`카카오 API 오류 (${res.status}): ${text}`)
  }

  const data: KakaoSearchResponse = await res.json()
  return data.documents
}

// ─── 메인 ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  const regionIdx = args.indexOf('--region')
  const region = regionIdx !== -1 ? args[regionIdx + 1] : '상도동 성대시장'

  const sizeIdx = args.indexOf('--size')
  const size = sizeIdx !== -1 ? Number(args[sizeIdx + 1]) : 15

  const outIdx = args.indexOf('--out')
  const outFile = outIdx !== -1
    ? args[outIdx + 1]
    : path.join(__dirname, 'places-data.json')

  console.log(`\n카카오 API 검색 중: "${region}" (최대 ${size}개)...`)

  const places = await fetchKakaoPlaces(region, size)

  if (places.length === 0) {
    console.log('검색 결과가 없습니다.')
    process.exit(1)
  }

  // JSON 템플릿 생성 — R·N 은 null 로 비워둠
  const entries: PlaceEntry[] = places.map(p => ({
    name: p.place_name,
    category: p.category_group_name || p.category_name.split('>').pop()?.trim() || '음식점',
    address: p.road_address_name || p.address_name,
    phone: p.phone,
    kakaoUrl: p.place_url,
    R: null,      // ← 카카오맵에서 직접 보고 입력하세요
    N: null,      // ← 카카오맵에서 직접 보고 입력하세요
    sigma: 0.5,   // 기본값 (리뷰 분포를 알 수 없을 때)
    L: 0.7,       // 기본값 (현지인 비율을 알 수 없을 때)
  }))

  fs.writeFileSync(outFile, JSON.stringify(entries, null, 2), 'utf-8')

  // 터미널 미리보기
  console.log(`\n✅ ${places.length}개 식당을 가져왔습니다.\n`)
  console.log('─'.repeat(72))
  console.log(
    '  #  ' +
    '가게 이름'.padEnd(24) +
    '카테고리'.padEnd(14) +
    '주소'
  )
  console.log('─'.repeat(72))
  entries.forEach((e, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. ` +
      e.name.padEnd(24) +
      e.category.padEnd(14) +
      e.address
    )
  })
  console.log('─'.repeat(72))

  console.log(`\n📄 저장 위치: ${outFile}`)
  console.log()
  console.log('다음 단계:')
  console.log('  1. places-data.json 을 열어 각 가게의 R(평점)·N(리뷰수) 입력')
  console.log('     → 카카오맵에서 가게 검색 후 별점·리뷰수 확인')
  console.log('  2. 알고리즘 비교 실행:')
  console.log(`     npx tsx scripts/compare-algorithms.ts --data scripts/places-data.json --region "${region}"`)
  console.log()
}

main().catch(err => {
  console.error('\n❌ 오류:', err.message)
  process.exit(1)
})
