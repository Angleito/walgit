import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import './index.css' // Removed as Tailwind handles global styles
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

// Create a helper for handling GitHub Pages path issues
// const getBasename = () => {
//   // When deployed to GitHub Pages, the app is served from /walgit/
//   // In development, it's served from the root
//   return process.env.NODE_ENV === 'production' ? '/walgit' : '/'
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
