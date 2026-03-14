export interface KakaoPlace {
  id: string
  place_name: string
  category_name: string
  category_group_code: string
  category_group_name: string
  phone: string
  address_name: string
  road_address_name: string
  place_url: string
  x: string  // 경도
  y: string  // 위도
  distance: string
}

interface KakaoSearchResponse {
  documents: KakaoPlace[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

export async function searchKakaoPlaces(query: string, size = 15): Promise<KakaoPlace[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY

  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query + ' 맛집')}&category_group_code=FD6&size=${size}`

  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    if (res.status === 429) {
      throw new Error('KAKAO_QUOTA_EXCEEDED')
    }
    throw new Error(`카카오 API 오류 (${res.status}): ${text}`)
  }

  const data: KakaoSearchResponse = await res.json()
  return data.documents
}
