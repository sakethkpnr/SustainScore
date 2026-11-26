import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
document.documentElement.dataset.theme = localStorage.getItem('sustainscore_theme') || 'light'
document.documentElement.style.setProperty('--accent', localStorage.getItem('sustainscore_accent') || '#2563eb')
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
)
