<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'

type MathSegment = {
  id: number
  type: 'math'
  html: string
  displayMode: boolean
}

type TextSegment = {
  id: number
  type: 'text'
  content: string
}

type Segment = MathSegment | TextSegment

const props = defineProps<{
  text: string
}>()

const segments = computed(() => parseMathText(props.text))

function parseMathText(text: string): Segment[] {
  const result: Segment[] = []
  let cursor = 0
  let id = 0

  while (cursor < text.length) {
    const start = findDelimiter(text, cursor)

    if (start === -1) {
      result.push({ id: id++, type: 'text', content: text.slice(cursor) })
      break
    }

    if (start > cursor) {
      result.push({ id: id++, type: 'text', content: text.slice(cursor, start) })
    }

    const displayMode = text[start + 1] === '$'
    const delimiter = displayMode ? '$$' : '$'
    const contentStart = start + delimiter.length
    const end = findClosingDelimiter(text, contentStart, delimiter)

    if (end === -1) {
      result.push({ id: id++, type: 'text', content: text.slice(start) })
      break
    }

    const math = text.slice(contentStart, end)
    result.push({
      id: id++,
      type: 'math',
      displayMode,
      html: katex.renderToString(math, {
        displayMode,
        strict: 'ignore',
        throwOnError: false,
        trust: false,
      }),
    })
    cursor = end + delimiter.length
  }

  return result
}

function findDelimiter(text: string, from: number) {
  for (let index = from; index < text.length; index += 1) {
    if (text[index] === '$' && text[index - 1] !== '\\') return index
  }

  return -1
}

function findClosingDelimiter(text: string, from: number, delimiter: '$' | '$$') {
  for (let index = from; index < text.length; index += 1) {
    if (text[index] !== '$' || text[index - 1] === '\\') continue
    if (delimiter === '$') return index
    if (text[index + 1] === '$') return index
  }

  return -1
}
</script>

<template>
  <span class="math-text">
    <template v-for="segment in segments" :key="segment.id">
      <span v-if="segment.type === 'text'">{{ segment.content }}</span>
      <span
        v-else
        class="math-fragment"
        :class="{ 'math-display': segment.displayMode }"
        v-html="segment.html"
      ></span>
    </template>
  </span>
</template>
