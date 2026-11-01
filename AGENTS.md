# AGENTS.md — 國樂之王 (Token-Saving Architecture Guide)

本專案為純前端靜態專案（無須打包工具，直接透過 `serve.py` 或 GitHub Pages 執行）。
**AI 工作守則：為節省 Context Token，在「調畫面」或「改功能」時，請根據下方索引「只讀取目標檔案」，切勿一次讀取全部檔案。**

## 1. 檔案職責與定位速查表

### 🧱 HTML 結構
- `index.html`：純 HTML DOM 結構（4 大區塊：`#setupSection`、`#gameSection`、`#settlementSection`、`#freePlaySection`）。除非需增減 DOM 節點，否則改樣式或改邏輯時無須讀取此檔。

### 🎨 調畫面 / 改樣式 (`css/`)
- `css/base.css`：`:root` 色票變數、全域背景、Header、模式切換 Tabs (`.mode-switcher`)、通用卡片 (`.stage-card`)、主金鈕 (`.btn-gold-large`)、Footer。
- `css/setup.css`：**[畫面 1：開新局設定]** 人數選擇膠囊、加減步進器、玩家姓名輸入網格、答錯扣分規則按鈕、規則說明框。
- `css/arena.css`：**[畫面 2：盲聽主舞台]** 頂部題號列、即時積分榜 (`.scoreboard-panel`)、盲聽遮罩 (`.blind-overlay`)、音波動畫、階梯提示卡片 (`.hint-card`)。
- `css/referee.css`：**[畫面 2：裁判判定區]** 揭曉後裁判面板 (`.referee-panel`)、答對/答錯/略過按鈕、玩家給分/扣分選擇網格、暫停中快速扣分框 (`.paused-penalty-box`)。
- `css/settlement.css`：**[畫面 3：結算畫面]** 最終榮耀排行榜 (`.ranking-list`)、金銀銅獎牌、每題搶答歷史紀錄 (`.round-history-box`)。
- `css/freeplay.css`：**[畫面 4：自由播放模式]** 播控列、曲目導聆卡片、搜尋框/排序下拉選單、樂器分類膠囊、曲目清單網格。
- `css/responsive.css`：**[全解析度 RWD]** `@media` 響應式斷點（`1280px`、`768px`、`640px`、`430px`、`350px` 及橫向矮螢幕）。

### ⚙️ 改功能 / 改邏輯 (`js/`)
> 所有 JS 檔案透過傳統 `<script>` 依序載入並共用全域變數與函式，相容 `http://` 與 `file://`。
- `js/state.js`：全域狀態變數（`playlist`, `unplayedTracks`, `players`, `roundPhase`, `hintsUsedCount` 等）與共用工具（`getTrackTips`, `escapeHtml`, `extractVideoId`）。
- `js/yt-player.js`：YouTube IFrame API 雙播放器實例（`ytPlayer`, `ytFreePlayer`）、動態 `12%~78%` 隨機段落跳轉、靜音保護計時器、iframe 備援載入。
- `js/quiz-game.js`：牌局初始化（`initGameSession`）、不重複隨機抽題（`startNextRandomRound`）、換段落/重抽、空白鍵或點擊暫停搶答（`pauseForBuzz`）、揭曉答案（`revealAnswer`）、階梯提示（`unlockNextHint`, `updateHintUI`）、暫停快速扣分（`executePausedPenalty`）。
- `js/referee-settle.js`：裁判給分/扣分流程（`showWinnerSelection`, `showPenaltySelection`, `confirmWinnerAndNext`, `confirmPenaltyThenWinner`）、即時積分榜（`renderScoreboard`）、結算畫面與排名（`finishGame`）。
- `js/freeplay.js`：自由播放曲庫鑑賞：樂器分類（`getTrackCategoryGroup`）、關鍵字搜尋與觀看量排序（`renderFreePlayTrackList`）、上下首/隨機抽播/隨機段落/播完自動接續（`playFreeTrack`, `toggleFreeAutoMode`）。
- `js/setup.js`：啟動載入（`init`）、模式切換（`switchAppMode`）、人數與名字設定（`setPlayerCount`, `renderPlayerInputs`）、扣分模式切換（`setPenaltyMode`）、自訂 JSON 檔案讀取（`handleFileSelect`）。

## 2. 常見任務快速指引
- **改計分/扣分公式或提示文字** 👉 只讀寫 `js/quiz-game.js`
- **改裁判給分/扣分流程或結算排名** 👉 只讀寫 `js/referee-settle.js`
- **改 YouTube 隨機切入秒數比例或播放器行為** 👉 只讀寫 `js/yt-player.js`
- **改自由播放樂器分類或搜尋排序** 👉 只讀寫 `js/freeplay.js`
- **改手機版/平板 RWD 排版** 👉 只讀寫 `css/responsive.css`
- **改整體配色、字體或背景** 👉 只讀寫 `css/base.css`

