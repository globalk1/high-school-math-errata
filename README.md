# 寰宇教育高中數學勘誤網站

Vue 3 + TypeScript + Vite 專案，用來瀏覽高中數學教材勘誤項目。

目前已匯入：

- 高一上 第一冊 單元01「數與式」
- 高一上 第一冊 單元02「多項式函數」

## 開發

```bash
npm install
npm run dev
```

## 重新匯入勘誤資料

匯入腳本會讀取 `scripts/errata-sources.json` 內設定的來源報告，並更新 `src/data/errata.ts`。

```bash
npm run import:errata
```

新增單元時，先在 `scripts/errata-sources.json` 追加一筆來源設定，再重新匯入。
"# high-school-math-errata" 
"# high-school-math-errata" 
