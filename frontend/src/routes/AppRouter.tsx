
import {
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import CalculatorPage from '../pages/CalculatorPage'

function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="font-display text-5xl text-primary">
        404
      </h1>

      <p className="text-sm text-ink-secondary">
        페이지를 찾을 수 없습니다.
      </p>

      <Link
        to="/calculator"
        className="text-sm font-semibold text-primary hover:underline"
      >
        임금 계산기로 이동
      </Link>
    </main>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/calculator" replace />}
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<MainLayout />}>
        <Route
          element={<ProtectedRoute />}
        >
          <Route
            path="/calculator"
            element={<CalculatorPage />}
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
