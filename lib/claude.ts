import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import type { RecommendResponse } from '@/types/restaurant'

function getAlgorithmPrompt(): string {
  const mdPath = path.join(process.cwd(), 'docs', 'algorithm.md')
  return fs.readFileSync(mdPath, 'utf-8')
}

export async function recommendRestaurants(region: string): Promise<RecommendResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const systemPrompt = getAlgorithmPrompt()

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContent(
    `대상 지역: ${region}\n\n위 지역의 맛집 TOP 10을 알고리즘에 따라 분석하여 JSON 형식으로 추천해주세요.`
  )

  const text = result.response
    .text()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(text) as RecommendResponse
    return parsed
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 200)}`)
  }
}
