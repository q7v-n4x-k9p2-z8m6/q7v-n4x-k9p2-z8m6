import React from 'react';
import Version21SandboxWorkspace from './Version21SandboxWorkspace';
import './version21-responsive-layout.css';
import './version21-laptop-reference.css';

// The isolated preview reuses the active Version 21 presentation only.
// Its data and write adapters are local-browser-only.
export default function Version21SandboxHome(){ return <Version21SandboxWorkspace/>; }
