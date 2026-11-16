
export default function GuideHero() {
  return (
    <section className="relative flex min-h-44 items-center overflow-hidden rounded-card bg-gradient-to-r from-primary-100 via-surface-green to-primary-200 px-6 py-7 sm:px-9">
      <div className="relative z-10 max-w-[65%]">
        <h1 className="font-display text-2xl text-primary-800 sm:text-3xl">
          금융 가이드
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          사회초년생에게 꼭 필요한 금융 정보를
          <br />
          주제별로 쉽게 확인해 보세요.
        </p>
      </div>

      <img
        src="/images/mascot/moa_cha_book1.png"
        alt="책을 읽는 모아 캐릭터"
        className="absolute -bottom-9 right-0 h-44 w-44 object-contain sm:right-8 sm:h-52 sm:w-52"
      />
    </section>
  )
}
