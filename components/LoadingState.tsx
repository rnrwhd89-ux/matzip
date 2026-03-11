export default function LoadingState({ region }: { region: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#FF6B6B]/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#FF6B6B] animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-white text-lg font-semibold">
          <span className="text-[#FF6B6B]">{region}</span> 분석 중...
        </p>
        <p className="text-gray-400 text-sm mt-2">베이즈 평균 알고리즘을 적용하고 있습니다</p>
      </div>
      <div className="flex gap-2 mt-2">
        {['베이즈 평균 계산', '표준편차 패널티 적용', '로컬 지수 분석'].map((step, i) => (
          <span
            key={step}
            className="text-xs bg-[#1A1A2E] border border-[#FF6B6B]/20 text-gray-400 px-3 py-1 rounded-full"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}
