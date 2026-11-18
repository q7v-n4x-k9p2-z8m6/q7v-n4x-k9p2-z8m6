import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Version21SandboxHome from '@/components/sarraaf/Version21SandboxHome';
import '@/index.css';

const root=document.getElementById('sandbox-root');
if(root){
  createRoot(root).render(
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 p-2 sm:p-3">
        <Version21SandboxHome/>
      </div>
    </BrowserRouter>
  );
}
