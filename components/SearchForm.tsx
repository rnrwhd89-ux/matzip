'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm({ defaultValue = '' }: { defaultValue?: string }) {
  const [region, setRegion] = useState(defaultValue)
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = region.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2 bg-[#1A1A2E] border border-[#FF6B6B]/30 rounded-2xl p-2 shadow-lg shadow-[#FF6B6B]/10">
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="지역명을 입력하세요 (예: 부산 서면, 도쿄 신주쿠)"
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 text-base outline-none"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!region.trim()}
          className="bg-[#FF6B6B] hover:bg-[#FF5252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap"
        >
          분석하기
        </button>
      </div>
    </form>
  )
}
