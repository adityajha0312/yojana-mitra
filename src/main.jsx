import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import NeonCursorFx from './NeonCursorFx.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NeonCursorFx />
    <App />
  </React.StrictMode>,
)
