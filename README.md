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

## Codex release skill

使用 `$high-school-math-prepare-release` 準備本地發佈流程：檢查修改、執行建置、用 Conventional Commit 自動命名並提交，但不 push 或 deploy。

## GitHub Pages

Repository Settings 的 Pages source 請選 `GitHub Actions`。不要選 `main / root`，否則 GitHub Pages 會直接發布 Vite 的開發入口 `index.html`，導致線上讀取 `/src/main.ts` 或靜態資源時出現 404。
