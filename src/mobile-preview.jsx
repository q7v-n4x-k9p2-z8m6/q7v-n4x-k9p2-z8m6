import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileLayoutPreview from '@/components/sarraaf/MobileLayoutPreview';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <main className="min-h-screen bg-[#f3f7fc] p-2 sm:p-4">
      <MobileLayoutPreview />
    </main>
  </React.StrictMode>
);
