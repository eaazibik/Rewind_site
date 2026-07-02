const fs = require('fs');
const path = require('path');

const outDir = __dirname;
const outFile = path.join(outDir, 'env.js');

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || ''
};

const content = `window.__ENV = ${JSON.stringify(env, null, 2)};`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('Wrote', outFile);
