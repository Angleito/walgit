import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// Create a helper for handling GitHub Pages path issues
const getBasename = () => {
  // When deployed to GitHub Pages, the app is served from /walgit/
  // In development, it's served from the root
  return process.env.NODE_ENV === 'production' ? '/walgit' : '/'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
