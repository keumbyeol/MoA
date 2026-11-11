
import { useState } from 'react'
import { Info } from 'lucide-react'

import { message } from '../components/common/Message'
import { saveWageRecord } from '../api/wage'

import WageCalculatorForm from '../components/calculator/WageCalculatorForm'
import WageResultCard from '../components/calculator/WageResultCard'
import WageRecordList from '../components/calculator/WageRecordList'

import type {
  WageCalculateRequest,
  WageCalculateResponse,
} from '../types/wage'

const IMAGES = {
  banner: '/images/mascot/moa_calcul_car.png',
  result: '/images/mascot/moa_car1.png',
  guide: '/images/mascot/moa_car2.png',
}

export default function CalculatorPage() {
  const [result, setResult] =
    useState<WageCalculateResponse | null>(null)

  const [lastRequest, setLastRequest] =
    useState<WageCalculateRequest | null>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [calculateKey, setCalculateKey] = useState(0)

  const handleResetResult = () => {
    setResult(null)
    setLastRequest(null)
    setResetKey((prev) => prev + 1)
  }

  const handleRecalculate = () => {
    if (loading) return

    setCalculateKey((prev) => prev + 1)
  }

  const handleSave = async () => {
    if (!result || !lastRequest) {
      message.warning('먼저 급여를 계산해주세요.')
      return
    }

    if (saving) return

    setSaving(true)

    try {
      await saveWageRecord(lastRequest)

      message.success(
        '급여 계산 결과가 저장되었습니다.',
      )

      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('급여 저장 오류:', error)

      message.error(
        '급여 저장에 실패했습니다. 로그인 상태와 서버 연결을 확인해주세요.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-page pb-16">
      <div className="mx-auto w-full max-w-[1500px] px-5 pt-6 md:px-8 lg:px-12">
        {/* 상단 배너 */}
        <section
          className="
            relative
            min-h-[195px]
            overflow-hidden
            rounded-[32px]
            bg-[#EDF6DA]
            md:min-h-[210px]
          "
        >
          <div
            className="
              relative z-10
              flex min-h-[195px]
              flex-col justify-center
              px-8 py-8
              md:min-h-[210px]
              md:px-16
            "
          >
            <h1
              className="
                font-display
                text-[36px]
                leading-tight
                text-[#253C20]
                md:text-[46px]
              "
            >
              임금 계산기
            </h1>

            <p
              className="
                mt-3
                text-[16px]
                leading-[1.55]
                text-[#253C20]
                md:text-[21px]
              "
            >
              내 근무 조건에 맞는 예상 급여와
              <br />
              수당을 한눈에 계산해보세요.
            </p>
          </div>

          <img
            src={IMAGES.banner}
            alt="계산기를 들고 있는 모아 캐릭터"
            className="
              pointer-events-none
              absolute
              bottom-[-8px]
              right-[-20px]
              hidden
              h-[205px]
              w-[68%]
              object-contain
              object-bottom
              lg:block
            "
          />
        </section>

        {/* 왼쪽 입력 / 오른쪽 결과 및 저장 내역 */}
        <div
          className="
            mt-8
            grid
            items-start
            gap-6
            lg:grid-cols-[1.4fr_1fr]
          "
        >
          {/* 왼쪽: 근무 조건 입력 */}
          <div className="relative min-w-0">
            <WageCalculatorForm
              key={resetKey}
              onResultChange={setResult}
              onRequestChange={setLastRequest}
              onLoadingChange={setLoading}
              calculateKey={calculateKey}
            />

            <div
              className="
                pointer-events-none
                absolute
                bottom-3
                right-4
                hidden
                xl:block
              "
            >
              <img
                src={IMAGES.guide}
                alt=""
                aria-hidden="true"
                className="
                  h-[75px]
                  w-[105px]
                  object-contain
                "
              />
            </div>
          </div>

          {/* 오른쪽: 결과 카드 + 저장 목록 */}
          <div className="min-w-0">
            <div className="relative min-w-0">
              <WageResultCard
                result={result}
                loading={loading}
                saving={saving}
                onReset={handleResetResult}
                onCalculate={handleRecalculate}
                onSave={() => void handleSave()}
              />

              {/* 결과 카드 캐릭터 */}
              <img
                src={IMAGES.result}
                alt=""
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  right-5
                  top-3
                  hidden
                  h-[105px]
                  w-[125px]
                  object-contain
                  xl:block
                "
              />
            </div>

            {/* 계산 결과 바로 아래 저장 목록 */}
            <WageRecordList refreshKey={refreshKey} />
          </div>
        </div>

        {/* 페이지 하단 참고 안내 */}
        <div
          className="
            mt-8
            flex
            items-start
            gap-2
            px-2
            text-[13px]
            leading-6
            text-ink-muted
          "
        >
          <Info
            size={17}
            className="mt-1 shrink-0 text-primary"
          />

          <p>
            본 계산기는 2026년 일반적인 근무 및
            공제 조건을 적용한 예상 급여 안내 서비스입니다.
            실제 지급액은 근로계약, 사업장 규모,
            4대보험 가입 여부, 과세 대상 급여,
            부양가족 수 및 관련 법령에 따라
            달라질 수 있습니다. 소득세는 공식
            간이세액표가 아닌 임시 추정치입니다.
          </p>
        </div>
      </div>
    </main>
  )
}
