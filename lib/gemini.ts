import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import type { NaverPlaceInput, RecommendResponse } from '@/types/restaurant'
import type { KakaoPlace } from '@/lib/kakao'

function getAlgorithmPrompt(): string {
  const mdPath = path.join(process.cwd(), 'docs', 'algorithm.md')
  return fs.readFileSync(mdPath, 'utf-8')
}

// [VULN-06] Prompt Injection 방지: 사용자 입력에서 줄바꿈·구조 문자 제거
function sanitizeRegion(input: string): string {
  return input
    .replace(/[\n\r]/g, ' ')    // 줄바꿈 제거 (role 탈출 방지)
    .replace(/[<>{}[\]]/g, '')  // 구조 태그 제거
    .trim()
    .substring(0, 100)
}

function parseResponse(text: string): RecommendResponse {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned) as RecommendResponse
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`)
  }
}

async function generateText(userPrompt: string): Promise<string> {
  const systemPrompt = getAlgorithmPrompt()

  // GROQ_API_KEY 있으면 Groq 사용, 없으면 Gemini 사용
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    })
    return completion.choices[0]?.message?.content ?? ''
  }

  // Gemini fallback
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY 환경변수가 설정되지 않았습니다.')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

export async function analyzeWithKakao(
  region: string,
  places: KakaoPlace[]
): Promise<RecommendResponse> {
  const safeRegion = sanitizeRegion(region)
  const placeList = places
    .map((p, i) => `${i + 1}. ${p.place_name} (${p.category_name}) - ${p.road_address_name || p.address_name} | 카카오맵: ${p.place_url}`)
    .join('\n')

  const userPrompt = `대상 지역: ${safeRegion}

카카오 지도에서 가져온 맛집 후보 목록:
${placeList}

위 목록을 알고리즘에 따라 분석하여 TOP 10을 선정하고 JSON 형식으로 반환해주세요.
각 항목의 address는 실제 주소를, naver_link는 카카오맵 place_url을 사용해주세요.`

  return parseResponse(await generateText(userPrompt))
}

export async function analyzeWithGemini(
  region: string,
  places: NaverPlaceInput[]
): Promise<RecommendResponse> {
  const safeRegion = sanitizeRegion(region)
  const placeList = places
    .map((p, i) => `${i + 1}. ${p.title} (${p.category}) - ${p.roadAddress || p.address}`)
    .join('\n')

  const userPrompt = `대상 지역: ${safeRegion}

네이버 지도에서 가져온 맛집 후보 목록:
${placeList}

위 목록을 알고리즘에 따라 분석하여 TOP 10을 선정하고 JSON 형식으로 반환해주세요.
각 항목에 address와 naver_link 필드도 포함해주세요.`

  return parseResponse(await generateText(userPrompt))
}

export async function analyzeWithGeminiOnly(region: string): Promise<RecommendResponse> {
  const safeRegion = sanitizeRegion(region)
  const userPrompt = `대상 지역: ${safeRegion}\n\n위 지역의 맛집 TOP 10을 알고리즘에 따라 분석하여 JSON 형식으로 추천해주세요. address와 naver_link 필드도 포함해주세요.`
  return parseResponse(await generateText(userPrompt))
}
