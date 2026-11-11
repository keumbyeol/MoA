
import { CheckCircle2, Lightbulb } from 'lucide-react'

const tips = [
  '주휴수당은 주 15시간 이상 등 지급 요건을 충족하면 받을 수 있어요.',
  '연장근로 가산수당은 적용 대상 사업장에서 법정 기준을 초과한 근로 등에 적용돼요.',
  '야간근로는 오후 10시부터 오전 6시까지의 근로를 말해요.',
]

export default function WageInfoBox() {
  return (
    <aside className="rounded-2xl bg-[#FFFBEA] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb
          size={22}
          className="text-[#E8B833]"
        />
        <h3 className="text-[15px] font-bold text-ink">
          알아두세요!
        </h3>
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip} className="flex items-start gap-2">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-primary"
            />
            <p className="text-[13px] leading-5 text-ink-secondary">
              {tip}
            </p>
          </div>
        ))}
      </div>
    </aside>
  )
}
