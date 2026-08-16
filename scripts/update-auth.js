import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminApiDir = path.join(__dirname, '../src/app/api/admin');

function getRelativePathToLib(filePath) {
  const depth = filePath.split(path.sep).length - adminApiDir.split(path.sep).length + 3; // +3 for src/app/api/admin -> src/lib
  return '../'.repeat(depth) + 'lib/auth.js';
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if not present
  if (filePath.endsWith('login\\route.js') || filePath.endsWith('login/route.js')) {
    if (!content.includes('signAdminToken')) {
      const relPath = getRelativePathToLib(filePath).replace(/\\/g, '/');
      content = `import { signAdminToken } from '${relPath}';\n` + content;
      content = content.replace(
        /cookieStore\.set\('admin_session',\s*'authenticated'/,
        "cookieStore.set('admin_session', await signAdminToken()"
      );
      changed = true;
    }
  } else {
    // Other admin routes
    if (!content.includes('verifyAdminToken')) {
      const relPath = getRelativePathToLib(filePath).replace(/\\/g, '/');
      content = `import { verifyAdminToken } from '${relPath}';\n` + content;
      content = content.replace(
        /if\s*\(!session\s*\|\|\s*session\.value\s*!==\s*'authenticated'\)/g,
        "if (!session || !(await verifyAdminToken(session.value)))"
      );
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.js')) {
      updateFile(fullPath);
    }
  }
}

traverse(adminApiDir);
