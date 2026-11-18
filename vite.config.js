import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The release-candidate build includes the isolated preview entry; production workflow is unchanged.
export default defineConfig({ plugins:[react()], resolve:{alias:{'@':path.resolve(__dirname,'src')}}, base:'/-1/', build:{rollupOptions:{input:{main:path.resolve(__dirname,'index.html'),sarrafSandbox:path.resolve(__dirname,'sandbox-preview.html')}}} });
