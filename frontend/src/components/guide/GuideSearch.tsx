
import { Search, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface GuideSearchProps {
  keyword: string
  onSearch: (keyword: string) => void
}

export default function GuideSearch({
  keyword,
  onSearch,
}: GuideSearchProps) {
  const [input, setInput] = useState(keyword)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(input.trim())
  }

  const handleClear = () => {
    setInput('')
    onSearch('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full items-center gap-3 rounded-full border border-line-strong bg-surface px-4 py-3 transition-colors focus-within:border-primary"
    >
      <Search
        size={19}
        className="shrink-0 text-primary-dark"
        aria-hidden="true"
      />

      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="가이드에서 궁금한 내용을 검색해 보세요."
        aria-label="금융정보 가이드 검색"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />

      {input && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="검색어 지우기"
          className="text-ink-muted hover:text-ink"
        >
          <X size={16} />
        </button>
      )}

      <button
        type="submit"
        className="rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-800 transition-colors hover:bg-primary-200"
      >
        검색
      </button>
    </form>
  )
}
