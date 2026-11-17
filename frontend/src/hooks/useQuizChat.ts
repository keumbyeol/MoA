
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  quizChatApi,
  type QuizChatMessage,
  type QuizChatSource,
} from '../api/quizChat'
import { getApiErrorMessage } from '../api/client'

export interface QuizChatEntry extends QuizChatMessage {
  id: number
  sources: QuizChatSource[]
}

export function useQuizChat(questionId: number) {
  const [messagesByQuestion, setMessagesByQuestion] = useState<
    Record<number, QuizChatEntry[]>
  >({})

  const [loadingQuestionId, setLoadingQuestionId] =
    useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)
  const activeQuestionRef = useRef(questionId)
  const messagesRef = useRef(messagesByQuestion)
  const pendingRef = useRef(false)
  const nextMessageIdRef = useRef(0)

  useEffect(() => {
    messagesRef.current = messagesByQuestion
  }, [messagesByQuestion])

  useEffect(() => {
    activeQuestionRef.current = questionId
    setError(null)
  }, [questionId])

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [])

  const messages = messagesByQuestion[questionId] ?? []

  const loading = loadingQuestionId === questionId

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const content = rawMessage.trim()

      if (!content || pendingRef.current) {
        return false
      }

      const targetQuestionId = questionId
      const previousMessages =
        messagesRef.current[targetQuestionId] ?? []

      const history: QuizChatMessage[] = previousMessages
        .slice(-12)
        .map(({ role, content: text }) => ({
          role,
          content: text,
        }))

      const userEntry: QuizChatEntry = {
        id: ++nextMessageIdRef.current,
        role: 'user',
        content,
        sources: [],
      }

      const updatedMessages = [
        ...previousMessages,
        userEntry,
      ]

      messagesRef.current = {
        ...messagesRef.current,
        [targetQuestionId]: updatedMessages,
      }

      setMessagesByQuestion(messagesRef.current)
      setError(null)
      setLoadingQuestionId(targetQuestionId)
      pendingRef.current = true

      const requestId = ++requestIdRef.current

      try {
        const response = await quizChatApi.sendMessage({
          question_id: targetQuestionId,
          message: content,
          history,
        })

        if (requestId !== requestIdRef.current) {
          return false
        }

        const assistantEntry: QuizChatEntry = {
          id: ++nextMessageIdRef.current,
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
        }

        setMessagesByQuestion((previous) => {
          const updated = {
            ...previous,
            [targetQuestionId]: [
              ...(previous[targetQuestionId] ?? []),
              assistantEntry,
            ],
          }

          messagesRef.current = updated
          return updated
        })

        return true
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return false
        }

        if (activeQuestionRef.current === targetQuestionId) {
          setError(
            getApiErrorMessage(
              requestError,
              'AI 답변을 불러오지 못했습니다.',
            ),
          )
        }

        return false
      } finally {
        if (requestId === requestIdRef.current) {
          pendingRef.current = false
          setLoadingQuestionId(null)
        }
      }
    },
    [questionId],
  )

  const clearMessages = useCallback(() => {
    setMessagesByQuestion((previous) => {
      const updated = { ...previous }
      delete updated[questionId]

      messagesRef.current = updated
      return updated
    })

    setError(null)
  }, [questionId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  }
}
