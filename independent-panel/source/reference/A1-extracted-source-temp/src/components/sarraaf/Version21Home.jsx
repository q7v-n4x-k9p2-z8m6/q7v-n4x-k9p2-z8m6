import React from 'react';
import Version21Workspace from './Version21Workspace';
import './version21-responsive-layout.css';
import './version21-laptop-reference.css';

// Version 21 shares one module set across laptop and mobile;
// the responsive stylesheet changes presentation only.
export default function Version21Home() {
  return <Version21Workspace />;
}