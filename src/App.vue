<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  ListFilter,
} from '@lucide/vue'
import MathText from './components/MathText.vue'
import { errataUnits, gradeOptions, type ErrataItem, type ErrataUnit, type Priority } from './data/errata'

const selectedGrade = ref('高一')
const selectedUnitKey = ref('all')
const expandedId = ref<string | null>(null)

const priorityLabel: Record<Priority, string> = {
  high: '優先修訂',
  medium: '核對修訂',
  low: '文字排版',
}

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const allItems = computed(() => errataUnits.flatMap((unit) => unit.items))

const unitsForGrade = computed(() => errataUnits.filter((unit) => unit.grade === selectedGrade.value))

const activeUnits = computed(() => {
  if (selectedUnitKey.value === 'all') return unitsForGrade.value
  return unitsForGrade.value.filter((unit) => unitKey(unit) === selectedUnitKey.value)
})

const visibleItems = computed<ErrataItem[]>(() => {
  const items = activeUnits.value.flatMap((unit) => unit.items)

  return [...items].sort((left, right) => {
    if (left.unitNo !== right.unitNo) return left.unitNo.localeCompare(right.unitNo, 'zh-Hant')
    if (priorityRank[left.priority] !== priorityRank[right.priority]) {
      return priorityRank[left.priority] - priorityRank[right.priority]
    }
    return left.page - right.page
  })
})

const currentHighCount = computed(() => visibleItems.value.filter((item) => item.priority === 'high').length)

const currentSectionCount = computed(() => new Set(visibleItems.value.map((item) => item.sectionCode)).size)

const totalUnitCount = computed(() => errataUnits.length)

function unitKey(unit: ErrataUnit) {
  return `${unit.grade}-${unit.semester}-${unit.unitNo}`
}

function selectGrade(grade: string) {
  selectedGrade.value = grade
  selectedUnitKey.value = 'all'
  expandedId.value = null
}

function selectUnit(key: string) {
  selectedUnitKey.value = key
  expandedId.value = null
}

function itemCountForGrade(grade: string) {
  return errataUnits
    .filter((unit) => unit.grade === grade)
    .reduce((count, unit) => count + unit.items.length, 0)
}

function toggleDetails(itemId: string) {
  expandedId.value = expandedId.value === itemId ? null : itemId
}

function sourceNameFor(item: ErrataItem) {
  return (
    errataUnits.find((unit) => unit.unitNo === item.unitNo && unit.title === item.unitTitle)?.sourceName ??
    '來源報告'
  )
}
</script>

<template>
  <main class="app-shell">
    <section class="overview-panel" aria-labelledby="site-title">
      <div class="title-block">
        <p class="eyebrow">
          <BookOpen :size="18" aria-hidden="true" />
          高中數學勘誤資料庫
        </p>
        <h1 id="site-title">寰宇教育高中數學勘誤</h1>
        <p class="intro">
          目前匯入高一上第一冊「數與式」與「多項式函數」兩份審核資料；附檔內容只作為勘誤資料來源。
        </p>
      </div>

      <div class="stat-grid" aria-label="目前資料統計">
        <div class="stat-tile">
          <span>全部項目</span>
          <strong>{{ allItems.length }}</strong>
        </div>
        <div class="stat-tile accent">
          <span>目前顯示</span>
          <strong>{{ visibleItems.length }}</strong>
        </div>
        <div class="stat-tile danger">
          <span>優先修訂</span>
          <strong>{{ currentHighCount }}</strong>
        </div>
        <div class="stat-tile">
          <span>已建單元</span>
          <strong>{{ totalUnitCount }}</strong>
        </div>
      </div>
    </section>

    <section class="workspace" aria-label="勘誤瀏覽工作區">
      <aside class="filter-panel">
        <div class="filter-header">
          <ListFilter :size="18" aria-hidden="true" />
          <h2>篩選</h2>
        </div>

        <div class="control-group">
          <p class="control-label">
            <GraduationCap :size="17" aria-hidden="true" />
            年級
          </p>
          <div class="segmented-control" role="group" aria-label="選擇年級">
            <button
              v-for="grade in gradeOptions"
              :key="grade.grade"
              type="button"
              :class="{ active: selectedGrade === grade.grade }"
              :aria-pressed="selectedGrade === grade.grade"
              @click="selectGrade(grade.grade)"
            >
              <span>{{ grade.label }}</span>
              <small>{{ itemCountForGrade(grade.grade) }}</small>
            </button>
          </div>
        </div>

        <div class="control-group">
          <p class="control-label">
            <Layers :size="17" aria-hidden="true" />
            單元
          </p>
          <div v-if="unitsForGrade.length" class="unit-list" role="group" aria-label="選擇單元">
            <button
              type="button"
              :class="{ active: selectedUnitKey === 'all' }"
              :aria-pressed="selectedUnitKey === 'all'"
              @click="selectUnit('all')"
            >
              <span>全部單元</span>
              <strong>{{ itemCountForGrade(selectedGrade) }}</strong>
            </button>
            <button
              v-for="unit in unitsForGrade"
              :key="unitKey(unit)"
              type="button"
              :class="{ active: selectedUnitKey === unitKey(unit) }"
              :aria-pressed="selectedUnitKey === unitKey(unit)"
              @click="selectUnit(unitKey(unit))"
            >
              <span>{{ unit.unitNo }} {{ unit.title }}</span>
              <strong>{{ unit.items.length }}</strong>
              <small>{{ unit.sections.map((section) => section.code).join(' / ') }}</small>
            </button>
          </div>
          <div v-else class="empty-box">尚未匯入{{ selectedGrade }}勘誤資料。</div>
        </div>

        <div class="source-note">
          <FileText :size="17" aria-hidden="true" />
          <p>單元 02 摘要寫 29 處，速查表列出 30 筆；本站以速查表逐列呈現。</p>
        </div>
      </aside>

      <section class="result-panel" aria-live="polite">
        <div class="result-heading">
          <div>
            <p class="eyebrow compact">
              <AlertTriangle :size="17" aria-hidden="true" />
              {{ priorityLabel.high }} {{ currentHighCount }} 筆
            </p>
            <h2>{{ selectedGrade }}勘誤項目</h2>
          </div>
          <p>{{ currentSectionCount }} 個章節，{{ visibleItems.length }} 筆修訂。</p>
        </div>

        <div v-if="visibleItems.length" class="errata-list">
          <article
            v-for="item in visibleItems"
            :key="item.id"
            class="errata-card"
            :class="`priority-${item.priority}`"
          >
            <header class="errata-topline">
              <div class="page-badge">
                <strong>p.{{ item.page }}</strong>
                <span v-if="item.pdfPage">PDF p.{{ item.pdfPage }}</span>
              </div>

              <div class="errata-title">
                <p>{{ item.unitNo }} {{ item.unitTitle }} / {{ item.sectionCode }} {{ item.sectionTitle }}</p>
                <h3><MathText :text="item.locator" /></h3>
              </div>

              <span class="priority-chip">{{ priorityLabel[item.priority] }}</span>
            </header>

            <div class="compare-grid">
              <section>
                <span>原印內容</span>
                <p><MathText :text="item.original" /></p>
              </section>
              <section>
                <span>修訂內容</span>
                <p><MathText :text="item.correction" /></p>
              </section>
            </div>

            <button
              type="button"
              class="detail-toggle"
              :aria-expanded="expandedId === item.id"
              @click="toggleDetails(item.id)"
            >
              <ChevronRight :size="18" :class="{ rotated: expandedId === item.id }" aria-hidden="true" />
              修訂說明
            </button>

            <div v-if="expandedId === item.id" class="detail-body">
              <p class="category"><MathText :text="item.category" /></p>
              <p><MathText :text="item.detail" /></p>
              <small>來源：{{ sourceNameFor(item) }}</small>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <GraduationCap :size="28" aria-hidden="true" />
          <h3>{{ selectedGrade }}尚未建立單元</h3>
          <p>匯入新的單元報告後，會出現在這裡。</p>
        </div>
      </section>
    </section>
  </main>
</template>
