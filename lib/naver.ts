export interface NaverPlace {
  title: string        // 가게명 (HTML 태그 포함 가능)
  link: string         // 네이버 플레이스 URL
  category: string     // 카테고리
  description: string  // 설명
  address: string      // 지번 주소
  roadAddress: string  // 도로명 주소
  mapx: string         // 경도 (x좌표)
  mapy: string         // 위도 (y좌표)
}

interface NaverSearchResponse {
  total: number
  start: number
  display: number
  items: NaverPlace[]
}

// HTML 태그 제거 (네이버 API는 <b>태그 포함)
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

export async function searchNaverPlaces(query: string, display = 20): Promise<NaverPlace[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query + ' 맛집')}&display=${display}&sort=comment`

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`네이버 API 오류 (${res.status}): ${text}`)
  }

  const data: NaverSearchResponse = await res.json()

  return data.items.map((item) => ({
    ...item,
    title: stripHtml(item.title),
  }))
}
