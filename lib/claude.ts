import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { RecommendResponse } from '@/types/restaurant'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getAlgorithmPrompt(): string {
  const mdPath = path.join(process.cwd(), 'docs', 'algorithm.md')
  return fs.readFileSync(mdPath, 'utf-8')
}

export async function recommendRestaurants(region: string): Promise<RecommendResponse> {
  const systemPrompt = getAlgorithmPrompt()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `대상 지역: ${region}\n\n위 지역의 맛집 TOP 10을 알고리즘에 따라 분석하여 JSON 형식으로 추천해주세요.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API')
  }

  // JSON 파싱 (마크다운 코드블록 제거)
  const text = content.text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(text) as RecommendResponse
    return parsed
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}`)
  }
}
