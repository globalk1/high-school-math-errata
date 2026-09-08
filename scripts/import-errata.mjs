import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const sourceManifestArg = process.argv.find((arg) => arg.startsWith('--sources='))
const sourceManifestPath = resolve(
  projectRoot,
  sourceManifestArg ? sourceManifestArg.replace('--sources=', '') : 'scripts/errata-sources.json',
)
const sources = JSON.parse(readFileSync(sourceManifestPath, 'utf8'))

const gradeShells = [
  { grade: '高一', label: '高一', description: '已匯入高一上第一冊' },
  { grade: '高二', label: '高二', description: '尚未匯入資料' },
  { grade: '高三', label: '高三', description: '尚未匯入資料' },
]

function splitMarkdownRow(row) {
  const text = row.trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells = []
  let current = ''
  let inCode = false
  let inMath = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const previous = text[index - 1]

    if (char === '`') {
      inCode = !inCode
      current += char
      continue
    }

    if (char === '$' && previous !== '\\' && !inCode) {
      inMath = !inMath
      current += char
      continue
    }

    if (char === '|' && !inCode && !inMath) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function cleanCell(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<span\b[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function pageNumber(pageText) {
  const match = cleanCell(pageText).match(/p\.(\d+)/)
  return match ? Number(match[1]) : 0
}

function pdfPage(pageText) {
  const match = cleanCell(pageText).match(/PDF p\.(\d+)/)
  return match ? Number(match[1]) : null
}

function sectionForPage(page, ranges) {
  return ranges.find((range) => page >= range.start && page <= range.end) ?? ranges[0]
}

function priorityFor(text) {
  if (/重大|全錯|漏解|漏選|答案錯誤|計算錯誤|題幹|公式|定義混淆|命題矛盾|不等號|指數漏/.test(text)) {
    return 'high'
  }

  if (/圖形|標籤|目錄|頁碼|解析|術語|條件|名詞|符號/.test(text)) {
    return 'medium'
  }

  return 'low'
}

function rowsFromMarkdown(source) {
  const content = readFileSync(source.sourcePath, 'utf8')
  const rows = []
  let inTable = false

  for (const line of content.split('\n')) {
    if (line.includes('頁') && line.includes('題目定位') && line.includes('錯誤')) {
      inTable = true
      continue
    }

    if (!inTable || !line.startsWith('|')) {
      if (inTable && line.trim() === '') break
      continue
    }

    if (/^\|:?-/.test(line)) continue

    const cells = splitMarkdownRow(line)
    if (cells.length < 6) continue

    const page = pageNumber(cells[0])
    const section = sectionForPage(page, source.ranges)
    const combined = cleanCell(cells.slice(1).join(' '))

    rows.push({
      id: `${source.unitNo}-${String(rows.length + 1).padStart(2, '0')}`,
      grade: source.grade,
      semester: source.semester,
      volume: source.volume,
      unitNo: source.unitNo,
      unitTitle: source.title,
      sectionCode: section.code,
      sectionTitle: section.title,
      page,
      pdfPage: pdfPage(cells[0]),
      locator: cleanCell(cells[1]),
      original: cleanCell(cells[2]),
      correction: cleanCell(cells[3]),
      category: cleanCell(cells[4]),
      detail: cleanCell(cells.slice(5).join(' | ')),
      priority: priorityFor(combined),
    })
  }

  return rows
}

const units = sources.map((source) => {
  if (!source.sourceName) source.sourceName = basename(source.sourcePath)
  if (!source.sourcePdfName && source.sourcePdfPath) source.sourcePdfName = basename(source.sourcePdfPath)

  const items = rowsFromMarkdown(source)

  return {
    grade: source.grade,
    semester: source.semester,
    volume: source.volume,
    unitNo: source.unitNo,
    title: source.title,
    sourceName: source.sourceName,
    sourcePath: source.sourcePath,
    sourcePdfName: source.sourcePdfName,
    sourcePdfPath: source.sourcePdfPath,
    sections: source.ranges.map(({ code, title }) => ({ code, title })),
    items,
  }
})

const output = `export type Priority = 'high' | 'medium' | 'low'

export interface GradeOption {
  grade: string
  label: string
  description: string
}

export interface ErrataItem {
  id: string
  grade: string
  semester: string
  volume: string
  unitNo: string
  unitTitle: string
  sectionCode: string
  sectionTitle: string
  page: number
  pdfPage: number | null
  locator: string
  original: string
  correction: string
  category: string
  detail: string
  priority: Priority
}

export interface ErrataUnit {
  grade: string
  semester: string
  volume: string
  unitNo: string
  title: string
  sourceName: string
  sourcePath: string
  sourcePdfName: string
  sourcePdfPath: string
  sections: Array<{ code: string; title: string }>
  items: ErrataItem[]
}

export const gradeOptions: GradeOption[] = ${JSON.stringify(gradeShells, null, 2)}

export const errataUnits: ErrataUnit[] = ${JSON.stringify(units, null, 2)}
`

const outputPath = resolve(projectRoot, 'src/data/errata.ts')
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, output)

console.log(`Imported ${units.reduce((sum, unit) => sum + unit.items.length, 0)} errata items.`)
