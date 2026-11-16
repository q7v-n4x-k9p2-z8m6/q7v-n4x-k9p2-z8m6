import React from 'react';
import Version21Workspace from './Version21Workspace';

// Version 21 uses the Builder laptop layout as its complete workspace UI.
// The workspace starts with empty in-memory data and has no database connection.
export default function Version21Home() {
  return <Version21Workspace />;
}
