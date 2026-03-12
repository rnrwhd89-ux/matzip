// 네이버 API에서 가져온 원본 장소 데이터
export interface NaverPlaceInput {
  title: string
  category: string
  address: string
  roadAddress: string
  link: string
}

// 베이지안 알고리즘으로 산출된 점수 요약
export interface RestaurantDataSummary {
  estimated_review_count: number    // N: 추정 리뷰 수
  estimated_avg_rating: number      // R: 평균 평점 (0~5)
  estimated_std_deviation: number   // σ: 표준편차
  region_avg_rating: number         // m: 지역 평균 평점
  local_index: number               // L: 현지인 비율 (0~1)
  bayesian_score: number            // S_opt: 최종 알고리즘 점수
}

export interface Restaurant {
  rank: number
  name: string
  category: string
  address: string
  naver_link: string
  data_summary: RestaurantDataSummary
  algorithm_reason: string   // 알고리즘 통과 사유
  local_features: string     // 현지인 평가 특징
}

export interface RecommendResponse {
  region: string
  restaurants: Restaurant[]
}
