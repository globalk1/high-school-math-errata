import { access, copyFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const distDir = resolve(projectRoot, 'dist')
const indexPath = resolve(distDir, 'index.html')

try {
  await access(indexPath)
} catch {
  throw new Error('dist/index.html was not found. Run this script after vite build.')
}

await copyFile(indexPath, resolve(distDir, '404.html'))
await writeFile(resolve(distDir, '.nojekyll'), '')
