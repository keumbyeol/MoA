
import { Outlet } from 'react-router-dom'

import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Header />

      <div className="w-full flex-1">
        <Outlet />
      </div>

      <Footer />
    </div>
  )
}
