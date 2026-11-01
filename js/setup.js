// =====================================================
// 初始化、模式切換與開新局設定 (Init, Mode Switcher & Setup Screen)
// =====================================================
async function init() {
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");

  if (window.location.protocol === "file:") {
    const notice = document.getElementById("fileProtocolNotice");
    if (notice) notice.style.display = "flex";
  }

  try {
    const response = await fetch("./曲目表.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP Status " + response.status);
    playlist = await response.json();
    statusText.innerText = `已載入 曲目表.json (共 ${playlist.length} 首)`;
    statusDot.style.backgroundColor = "#10b981";
  } catch (err) {
    console.error("載入 曲目表.json 失敗：", err);
    statusText.innerText = `無法載入 曲目表.json`;
    statusDot.style.backgroundColor = "#ef4444";
  }

  renderPlayerInputs();
  initFreePlayView();
  loadYouTubeIframeAPI();

  // 支援空白鍵快速暫停搶答
  window.addEventListener("keydown", (e) => {
    if (
      e.code === "Space" &&
      appMode === "quiz" &&
      document.getElementById("gameSection").style.display !== "none" &&
      roundPhase === "PLAYING"
    ) {
      e.preventDefault();
      pauseForBuzz();
    }
  });
}

// 模式切換：盲聽搶答爭霸賽 vs 自由播放模式
function switchAppMode(targetMode) {
  if (targetMode === appMode) return;
  appMode = targetMode;

  const tabQuiz = document.getElementById("tabBtnQuizMode");
  const tabFree = document.getElementById("tabBtnFreeMode");
  const setupSec = document.getElementById("setupSection");
  const gameSec = document.getElementById("gameSection");
  const settleSec = document.getElementById("settlementSection");
  const freeSec = document.getElementById("freePlaySection");

  if (targetMode === "free") {
    tabQuiz.classList.remove("active");
    tabFree.classList.add("active");

    // 記錄目前競賽模式所在的子畫面並暫停競賽音樂
    if (gameSec.style.display !== "none") {
      lastQuizView = "game";
      if (roundPhase === "PLAYING") {
        pauseForBuzz();
      } else {
        pauseCurrentVideo();
      }
    } else if (settleSec.style.display !== "none") {
      lastQuizView = "settlement";
      pauseCurrentVideo();
    } else {
      lastQuizView = "setup";
      pauseCurrentVideo();
    }

    setupSec.style.display = "none";
    gameSec.style.display = "none";
    settleSec.style.display = "none";
    freeSec.style.display = "flex";

    initFreePlayView();
    initYTFreePlayerInstance();
  } else {
    tabFree.classList.remove("active");
    tabQuiz.classList.add("active");

    pauseFreePlayVideo();
    freeSec.style.display = "none";

    if (lastQuizView === "game") {
      gameSec.style.display = "flex";
    } else if (lastQuizView === "settlement") {
      settleSec.style.display = "block";
    } else {
      setupSec.style.display = "block";
      renderPlayerInputs();
    }
  }
}

// 開新局、選擇遊戲人數與輸入名字
function saveCurrentInputValues() {
  const inputs = document.querySelectorAll(".player-name-input");
  inputs.forEach((input, idx) => {
    savedPlayerNames[idx] = input.value;
  });
}

function setPlayerCount(count) {
  saveCurrentInputValues();
  setupPlayerCount = Math.max(1, Math.min(20, count));
  while (savedPlayerNames.length < setupPlayerCount) {
    savedPlayerNames.push("");
  }
  renderPlayerInputs();
}

function changePlayerCount(delta) {
  setPlayerCount(setupPlayerCount + delta);
}

function renderPlayerInputs() {
  document.getElementById("playerCountDisplay").innerText =
    `${setupPlayerCount} 人`;

  // 更新快速人數按鈕高亮
  const presetCounts = [2, 3, 4, 5, 6, 8];
  document
    .querySelectorAll("#playerCountSelectorRow .count-pill")
    .forEach((btn, idx) => {
      if (presetCounts[idx] === setupPlayerCount) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

  const container = document.getElementById("playerInputsContainer");
  container.innerHTML = "";

  for (let i = 0; i < setupPlayerCount; i++) {
    const val = savedPlayerNames[i] || "";
    const card = document.createElement("div");
    card.className = "player-input-card";
    card.innerHTML = `
      <div class="player-avatar-badge">P${i + 1}</div>
      <input
        type="text"
        class="player-name-input"
        placeholder="玩家 ${i + 1} 名字"
        value="${escapeHtml(val)}"
        maxlength="16"
      />
    `;
    container.appendChild(card);
  }
}

function setPenaltyMode(enabled) {
  penaltyEnabled = enabled;
  const btnOn = document.getElementById("btnPenaltyOn");
  const btnOff = document.getElementById("btnPenaltyOff");
  if (btnOn && btnOff) {
    if (enabled) {
      btnOn.classList.add("active");
      btnOff.classList.remove("active");
    } else {
      btnOff.classList.add("active");
      btnOn.classList.remove("active");
    }
  }
  updateHintUI();
}

// 點擊「開始新局爭霸」
function startNewGame() {
  if (!playlist || playlist.length === 0) {
    alert("曲目庫為空，請確認曲目表.json是否正確！");
    return;
  }

  saveCurrentInputValues();
  players = [];
  for (let i = 0; i < setupPlayerCount; i++) {
    const rawName = (savedPlayerNames[i] || "").trim();
    players.push({
      name: rawName || `玩家 ${i + 1}`,
      score: 0,
    });
  }

  initGameSession();
}

// 原班人馬再開一局
function restartSamePlayers() {
  players.forEach((p) => (p.score = 0));
  initGameSession();
}

function confirmReturnToSetup() {
  goToSetupScreen();
}

function goToSetupScreen() {
  pauseCurrentVideo();
  lastQuizView = "setup";
  document.getElementById("gameSection").style.display = "none";
  document.getElementById("settlementSection").style.display = "none";
  document.getElementById("freePlaySection").style.display = "none";
  document.getElementById("setupSection").style.display = "block";
  renderPlayerInputs();
}

// 手動載入自訂本機 JSON 檔案
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data) && data.length > 0) {
        playlist = data;
        document.getElementById("statusText").innerText =
          `已載入自訂檔案：${file.name} (共 ${playlist.length} 首)`;
        freeCurrentTrackIndex = -1;
        initFreePlayView();
        alert(
          `成功載入 ${playlist.length} 首曲目！開新局與自由播放模式將使用新的曲目庫。`,
        );
      } else {
        alert("檔案格式不正確，需為包含曲目陣列的 JSON！");
      }
    } catch (err) {
      alert("解析 JSON 失敗：" + err.message);
    }
  };
  reader.readAsText(file, "utf-8");
}

window.addEventListener("DOMContentLoaded", init);

