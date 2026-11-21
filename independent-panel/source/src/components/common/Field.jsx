import React from 'react';

export default function Field({ label, hint, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[11.5px] font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}