# N5 100 Days

以 100 天為週期設計的 JLPT N5 自學工具。課程從基本句型開始，逐步加入單句理解、短文、聽解與 N5 題型；學習進度保存在使用者自己的瀏覽器，不需要帳號或後端服務。

## Features

- 100 天漸進式課程
- 繁體中文文法解說與例句
- 前期漢字振假名輔助，後期逐步降低提示
- 每日約 20 張新字／複習單字
- Web Speech API 日文發音
- 單字熟悉度與弱點複習
- 分階段閱讀、聽辨與每日測驗
- LocalStorage 學習進度
- JSON 匯出／匯入備份
- PWA 與手機版操作

## Learning design

課程不是從第一天直接套用完整 JLPT 題型，而是依能力逐步增加負荷：

| Days | Focus |
| --- | --- |
| 1–10 | 基本句型、單字、例句與句型練習 |
| 11–20 | 單句理解與聽句辨意 |
| 21–30 | 超短閱讀與短句聽辨 |
| 31–50 | 短文與短對話 |
| 51–70 | N5 讀解／聽解題型導入 |
| 71–90 | N5 題型混合訓練 |
| 91–100 | 模擬與弱點整理 |

教材區依階段提供振假名；每日練習與測驗固定不顯示振假名，讓提示與實際辨認分開。

## Tech

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Web Speech API
- LocalStorage
- Service Worker / PWA
- GitHub Pages

## Project structure

```text
n5-study/
├─ index.html
├─ assets/
│  └─ icons/
├─ data/
│  ├─ curriculum.js
│  ├─ vocabulary.js
│  └─ lessons/
├─ scripts/
│  ├─ app.js
│  ├─ japanese.js
│  ├─ quiz.js
│  ├─ speech.js
│  ├─ state.js
│  ├─ utils.js
│  └─ views.js
├─ styles/
│  └─ app.css
├─ manifest.webmanifest
└─ sw.js
```

教材資料與 JavaScript 依職責分開維護；樣式集中在單一 `app.css`，包含共用樣式與 RWD 規則，方便直接維護與查找。

## Why no backend?

這個專案最初是兩位使用者的自學工具。沒有跨裝置同步與多人資料管理需求，因此採用純前端架構，進度儲存在各自裝置；需要換裝置時可匯出 JSON 備份。若未來增加帳號同步，再將狀態層改接 API 即可，不需要重寫教材與介面。

## Curriculum references

學習順序與題型主要參考：

- [JLPT N5 Level Summary](https://www.jlpt.jp/e/about/levelsummary.html)
- [JLPT Test Sections](https://www.jlpt.jp/e/guideline/testsections.html)
- [JLPT FAQ](https://www.jlpt.jp/e/faq/)
- [GENKI 3rd Edition](https://genki3.japantimes.co.jp/en/intro/index.html)
- [IRODORI Starter A1](https://www.irodori.jpf.go.jp/en/starter/pdf.html)
- [Marugoto Starter A1](https://marugoto.jpf.go.jp/en/teacher/feature/)

JLPT 自 2010 年改制後不再公布固定的單字、漢字與文法清單，因此本專案以官方能力描述與題型作為考試目標，再用初級教材校準學習順序；網站內練習並非複製官方試題。