import fs from 'node:fs';

const filePath = './node_modules/@astrojs/vercel/dist/serverless/adapter.js';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replaceAll("return 'nodejs18.x';", "return 'nodejs20.x';");
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✓ Successfully patched @astrojs/vercel adapter to use nodejs20.x runtime!');
}
