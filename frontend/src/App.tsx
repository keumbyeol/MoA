
import { BrowserRouter } from 'react-router-dom'

import MessageProvider from './components/common/Message'
import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './routes/AppRouter'

function App() {
  return (
    <MessageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-page">
            <AppRouter />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </MessageProvider>
  )
}

export default App
