import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import type { NaverPlaceInput, RecommendResponse } from '@/types/restaurant'
import type { KakaoPlace } from '@/lib/kakao'

function getAlgorithmPrompt(): string {
  const mdPath = path.join(process.cwd(), 'docs', 'algorithm.md')
  return fs.readFileSync(mdPath, 'utf-8')
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: getAlgorithmPrompt(),
  })
}

function parseResponse(text: string): RecommendResponse {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned) as RecommendResponse
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.slice(0, 200)}`)
  }
}

/**
 * 카카오에서 가져온 맛집 목록을 Gemini로 분석하여 베이지안 점수 기반 TOP 10 반환
 */
export async function analyzeWithKakao(
  region: string,
  places: KakaoPlace[]
): Promise<RecommendResponse> {
  const model = getModel()

  const placeList = places
    .map((p, i) => `${i + 1}. ${p.place_name} (${p.category_name}) - ${p.road_address_name || p.address_name} | 카카오맵: ${p.place_url}`)
    .join('\n')

  const userPrompt = `대상 지역: ${region}

카카오 지도에서 가져온 맛집 후보 목록:
${placeList}

위 목록을 알고리즘에 따라 분석하여 TOP 10을 선정하고 JSON 형식으로 반환해주세요.
각 항목의 address는 실제 주소를, naver_link는 카카오맵 place_url을 사용해주세요.`

  const result = await model.generateContent(userPrompt)
  return parseResponse(result.response.text())
}

/**
 * 네이버에서 가져온 맛집 목록을 Gemini로 분석하여 베이지안 점수 기반 TOP 10 반환
 */
export async function analyzeWithGemini(
  region: string,
  places: NaverPlaceInput[]
): Promise<RecommendResponse> {
  const model = getModel()

  const placeList = places
    .map((p, i) => `${i + 1}. ${p.title} (${p.category}) - ${p.roadAddress || p.address}`)
    .join('\n')

  const userPrompt = `대상 지역: ${region}

네이버 지도에서 가져온 맛집 후보 목록:
${placeList}

위 목록을 알고리즘에 따라 분석하여 TOP 10을 선정하고 JSON 형식으로 반환해주세요.
각 항목에 address와 naver_link 필드도 포함해주세요.`

  const result = await model.generateContent(userPrompt)
  return parseResponse(result.response.text())
}

/**
 * 외부 API 없이 Gemini 단독으로 추천 (fallback)
 */
export async function analyzeWithGeminiOnly(region: string): Promise<RecommendResponse> {
  const model = getModel()

  const result = await model.generateContent(
    `대상 지역: ${region}\n\n위 지역의 맛집 TOP 10을 알고리즘에 따라 분석하여 JSON 형식으로 추천해주세요. address와 naver_link 필드도 포함해주세요.`
  )
  return parseResponse(result.response.text())
}
