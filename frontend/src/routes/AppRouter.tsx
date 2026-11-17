
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

// 페이지
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import CalculatorPage from '../pages/CalculatorPage'
import GuidePage from '../pages/GuidePage'
import GuideDetailPage from '../pages/GuideDetailPage'
import QuizPage from '../pages/QuizPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* 최초 접속 시 로그인 페이지로 이동 */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* 로그인 및 회원가입 */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      {/* 공통 레이아웃 */}
      <Route element={<MainLayout />}>
        {/* 메인 홈페이지 - 비회원 접근 가능 */}
        <Route
          path="/home"
          element={<HomePage />}
        />

        {/* 금융정보 가이드 - 비회원 접근 가능 */}
        <Route
          path="/guides"
          element={<GuidePage />}
        />

        {/* 금융정보 가이드 상세 - 비회원 접근 가능 */}
        <Route
          path="/guides/:guideId"
          element={<GuideDetailPage />}
        />

        {/* 금융 지식 퀴즈 - 비회원 접근 가능 */}
        <Route
          path="/quiz"
          element={<QuizPage />}
        />

        {/* 로그인 필요한 페이지 */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/calculator"
            element={<CalculatorPage />}
          />
        </Route>

        {/* 404 페이지 */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  )
}
