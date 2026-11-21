import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'

const rootElement = document.getElementById('root')

// آیا این بارگذاری، محیط آزمون است؟ (مسیر، هش یا پارامتر نشانی)
const { pathname, hash, search } = window.location
const isHarness = /harness/i.test(pathname)
  || /harness/i.test(hash)
  || new URLSearchParams(search).has('harness')

// ورود به محیط آزمون فقط از مسیر صریح /harness (یا ?harness) است؛
// هیچ تشخیصی از مرورگر یا نشست انجام نمی‌شود و مسیر عادی برنامه دست‌نخورده می‌ماند.
if (isHarness) {
  import('./test-harness/bootstrap.jsx').then((module) => module.mountHarness(rootElement))
} else {
  import('@/App.jsx').then(({ default: App }) => {
    ReactDOM.createRoot(rootElement).render(<App />)
  })
}