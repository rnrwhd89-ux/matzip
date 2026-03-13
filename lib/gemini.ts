import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import type { RecommendResponse } from '@/types/restaurant'
import type { KakaoPlace } from '@/lib/kakao'
import { checkUsage, recordUsage } from '@/lib/usageTracker'

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

function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').replace(/[^\w가-힣]/g, '').toLowerCase()
}

function filterToValidPlaces(
  response: RecommendResponse,
  validNames: string[]
): RecommendResponse {
  const normalizedValid = new Set(validNames.map(normalizeName))
  const filtered = response.restaurants.filter(r =>
    normalizedValid.has(normalizeName(r.name))
  )
  const reranked = filtered.map((r, i) => ({ ...r, rank: i + 1 }))
  return { ...response, restaurants: reranked }
}

async function generateText(userPrompt: string): Promise<string> {
  const systemPrompt = getAlgorithmPrompt()

  // GROQ_API_KEY 있으면 Groq 사용, 없으면 Gemini 사용
  if (process.env.GROQ_API_KEY) {
    const groqCheck = checkUsage('groq')
    if (!groqCheck.allowed) {
      throw new Error(groqCheck.warningMessage ?? 'Groq 일일 한도 초과')
    }
    try {
      recordUsage('groq')
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000 })
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0,
        seed: 42,
      })
      return completion.choices[0]?.message?.content ?? ''
    } catch (groqError) {
      console.warn('Groq API 실패, Gemini로 fallback:', groqError)
      // Gemini fallback으로 계속 진행
    }
  }

  // Gemini fallback
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY 환경변수가 설정되지 않았습니다.')
  const geminiCheck = checkUsage('gemini')
  if (!geminiCheck.allowed) {
    throw new Error(geminiCheck.warningMessage ?? 'Gemini 일일 한도 초과')
  }
  recordUsage('gemini')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0,
    },
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

위 목록에 있는 식당 중에서만 알고리즘에 따라 분석하여 TOP 10을 선정하고 JSON 형식으로 반환해주세요.
반드시 위에 나열된 식당 이름만 사용하고, 목록에 없는 새 식당을 추가하거나 이름을 변형하는 것은 절대 금지입니다.
각 항목의 address는 실제 주소를, naver_link는 카카오맵 place_url을 사용해주세요.`

  const result = parseResponse(await generateText(userPrompt))
  const validNames = places.map(p => p.place_name)
  return filterToValidPlaces(result, validNames)
}

