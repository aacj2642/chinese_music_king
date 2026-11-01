// =====================================================
// 盲聽搶答主舞台、提示系統與暫停快速扣分 (Quiz Arena & Hint System)
// =====================================================
function resetRoundHints() {
  hintsUsedCount = 0;
  currentRoundPoints = 3;
  currentRoundPenalty = 1;
  selectedWinnerIdx = null;
  selectedPenaltyPlayerIdx = null;

  const pausedBox = document.getElementById("pausedPenaltyBox");
  if (pausedBox) pausedBox.style.display = "none";

  updateHintUI();
}

function unlockNextHint(event) {
  if (event) event.stopPropagation();
  if (!currentTrack) return;
  if (roundPhase !== "PLAYING" && roundPhase !== "PAUSED") return;
  if (hintsUsedCount >= 2) return;

  hintsUsedCount++;
  currentRoundPoints = Math.max(1, 3 - hintsUsedCount);
  currentRoundPenalty = 1 + hintsUsedCount;
  updateHintUI();

  // 若暫停快速扣分選單開著，同步更新其中的扣分數字
  const pausedBox = document.getElementById("pausedPenaltyBox");
  if (pausedBox && pausedBox.style.display === "flex") {
    renderPausedPenaltyButtons();
  }
}

function updateHintUI() {
  const pointsTag = document.getElementById("roundPointsTag");
  const btnHeaderHint = document.getElementById("btnHeaderHint");
  const btnPlayingHint = document.getElementById("btnOverlayPlayingHint");
  const btnPausedHint = document.getElementById("btnOverlayPausedHint");
  const btnPausedQuickWrong = document.getElementById("btnOverlayQuickWrong");
  const quickPenaltyLabel = document.getElementById("quickPenaltyPointsLabel");
  const scoreboardRuleText = document.getElementById("scoreboardRuleText");
  const hintPanel = document.getElementById("hintPanel");
  const hintCard1 = document.getElementById("hintCard1");
  const hintCard2 = document.getElementById("hintCard2");
  const hintText1 = document.getElementById("hintText1");
  const hintText2 = document.getElementById("hintText2");

  // 更新即時計分板規則標籤
  if (scoreboardRuleText) {
    scoreboardRuleText.innerText = penaltyEnabled
      ? "👑 即時積分榜（0 提示 +3/-1 分｜1 提示 +2/-2 分｜2 提示 +1/-3 分）"
      : "👑 即時積分榜（0 提示 +3 分｜1 提示 +2 分｜2 提示 +1 分）";
  }

  // 更新本題可得積分與答錯扣分標籤
  if (pointsTag) {
    pointsTag.className = "tag-points";
    if (roundPhase === "IDLE") {
      pointsTag.innerText = penaltyEnabled
        ? "💎 答對最高 +3 分 ｜ ⚠️ 答錯扣 1~3 分"
        : "💎 每題最高 3 分";
    } else if (hintsUsedCount === 0) {
      pointsTag.innerText = penaltyEnabled
        ? "💎 答對 +3 分 ｜ ⚠️ 答錯 -1 分"
        : "💎 本題可得 3 分（未用提示）";
    } else if (hintsUsedCount === 1) {
      pointsTag.innerText = penaltyEnabled
        ? "💎 答對 +2 分 ｜ ⚠️ 答錯 -2 分"
        : "💎 本題可得 2 分（已用 1 提示）";
      pointsTag.classList.add("pts-2");
    } else {
      pointsTag.innerText = penaltyEnabled
        ? "💎 答對 +1 分 ｜ ⚠️ 答錯 -3 分"
        : "💎 本題可得 1 分（已用 2 提示）";
      pointsTag.classList.add("pts-1");
    }
  }

  // 控制頂部提示按鈕顯示時機
  if (btnHeaderHint) {
    if (roundPhase === "PLAYING" || roundPhase === "PAUSED") {
      btnHeaderHint.style.display = "inline-flex";
    } else {
      btnHeaderHint.style.display = "none";
    }
  }

  // 更新三處提示按鈕的文字與啟用狀態
  let btnLabel = penaltyEnabled
    ? "💡 開啟提示 1（答對變 2 分，答錯扣 2 分）"
    : "💡 開啟提示 1（答對變 2 分）";
  let isDisabled = false;
  if (hintsUsedCount === 1) {
    btnLabel = penaltyEnabled
      ? "💡 開啟提示 2（答對變 1 分，答錯扣 3 分）"
      : "💡 開啟提示 2（答對變 1 分）";
  } else if (hintsUsedCount >= 2) {
    btnLabel = penaltyEnabled
      ? "💡 提示已全開（答對 +1 分，答錯扣 3 分）"
      : "💡 提示已全開（本題 1 分）";
    isDisabled = true;
  }

  [btnHeaderHint, btnPlayingHint, btnPausedHint].forEach((btn) => {
    if (!btn) return;
    btn.innerText = btnLabel;
    btn.disabled = isDisabled;
  });

  // 更新暫停時的快速答錯扣分按鈕
  if (btnPausedQuickWrong) {
    btnPausedQuickWrong.style.display = penaltyEnabled ? "inline-flex" : "none";
    btnPausedQuickWrong.innerText = `❌ 此玩家答錯（扣 ${currentRoundPenalty} 分）`;
  }
  if (quickPenaltyLabel) {
    quickPenaltyLabel.innerText = currentRoundPenalty;
  }

  // 更新提示內容卡片顯示
  if (!currentTrack || roundPhase === "IDLE") {
    hintPanel.style.display = "none";
    hintCard1.style.display = "none";
    hintCard2.style.display = "none";
    return;
  }

  const { tip1, tip2 } = getTrackTips(currentTrack);
  hintText1.innerText = tip1;
  hintText2.innerText = tip2;

  if (roundPhase === "REVEALED") {
    // 揭曉答案後完整展示兩個提示作為曲目導聆介紹（不影響已鎖定的本題得分）
    hintPanel.style.display = "flex";
    hintCard1.style.display = "flex";
    hintCard2.style.display = "flex";
  } else if (hintsUsedCount === 1) {
    hintPanel.style.display = "flex";
    hintCard1.style.display = "flex";
    hintCard2.style.display = "none";
  } else if (hintsUsedCount >= 2) {
    hintPanel.style.display = "flex";
    hintCard1.style.display = "flex";
    hintCard2.style.display = "flex";
  } else {
    hintPanel.style.display = "none";
    hintCard1.style.display = "none";
    hintCard2.style.display = "none";
  }
}

// 暫停搶答中的即時答錯扣分（不揭曉答案，可繼續播給他人聽）
function togglePausedPenaltyBox(event) {
  if (event) event.stopPropagation();
  const box = document.getElementById("pausedPenaltyBox");
  if (!box) return;

  if (box.style.display === "none" || box.style.display === "") {
    box.style.display = "flex";
    renderPausedPenaltyButtons();
  } else {
    box.style.display = "none";
  }
}

function renderPausedPenaltyButtons() {
  const grid = document.getElementById("pausedPenaltyGrid");
  if (!grid) return;
  grid.innerHTML = "";

  players.forEach((player, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-player-penalty";
    btn.onclick = (e) => executePausedPenalty(e, idx);
    btn.innerHTML = `
      <span>❌ ${escapeHtml(player.name)}</span>
      <span class="penalty-pts">${player.score} → ${player.score - currentRoundPenalty} 分 (-${currentRoundPenalty})</span>
    `;
    grid.appendChild(btn);
  });
}

function executePausedPenalty(event, playerIdx) {
  if (event) event.stopPropagation();
  if (!players[playerIdx]) return;

  const player = players[playerIdx];
  player.score -= currentRoundPenalty;

  roundHistory.push({
    round: currentRoundNumber,
    track: currentTrack,
    wrongName: player.name,
    points: -currentRoundPenalty,
    hintsUsed: hintsUsedCount,
    type: "WRONG",
  });

  renderScoreboard(null, playerIdx);

  const box = document.getElementById("pausedPenaltyBox");
  if (box) box.style.display = "none";

  alert(
    `⚠️ 已扣除「${player.name}」${currentRoundPenalty} 分！\n` +
      `• 若還有其他玩家要搶答：請點擊「▶️ 繼續播放音樂」\n` +
      `• 若無人能猜出要看答案：請點擊「✨ 揭曉答案」`,
  );
}

// 牌局初始化與隨機抽題播放
function initGameSession() {
  // 重置本局未播曲目池（深拷貝索引陣列，確保同一局播過的不再出現）
  unplayedTracks = [...playlist];
  currentTrack = null;
  currentRoundNumber = 0;
  roundHistory = [];
  selectedWinnerIdx = null;
  selectedPenaltyPlayerIdx = null;
  roundPhase = "IDLE";
  lastQuizView = "game";

  pauseCurrentVideo();
  pauseFreePlayVideo();

  // 切換顯示區
  document.getElementById("setupSection").style.display = "none";
  document.getElementById("settlementSection").style.display = "none";
  document.getElementById("freePlaySection").style.display = "none";
  document.getElementById("gameSection").style.display = "flex";

  // 更新頂部狀態與計分板
  document.getElementById("roundBadge").innerText = "準備開賽";
  document.getElementById("remainingCount").innerText =
    unplayedTracks.length;
  document.getElementById("totalPoolCount").innerText = playlist.length;

  renderScoreboard();
  setStageToReadyForFirstRound();
}

function setStageToReadyForFirstRound() {
  roundPhase = "IDLE";
  resetRoundHints();

  const videoContainer = document.getElementById("videoContainer");
  videoContainer.classList.add("is-blind");

  const blindOverlay = document.getElementById("blindOverlay");
  blindOverlay.style.display = "flex";
  blindOverlay.classList.remove("clickable-buzz");

  document.getElementById("overlayStateReady").style.display = "flex";
  document.getElementById("overlayStatePlaying").style.display = "none";
  document.getElementById("overlayStatePaused").style.display = "none";

  document.getElementById("refereePanel").style.display = "none";
  document.getElementById("revealedFooterControls").style.display = "none";

  const titleEl = document.getElementById("trackTitle");
  titleEl.innerText = "🔒 準備開始第 1 題";
  titleEl.classList.add("mystery-text");
  document.getElementById("trackInst").innerText = "盲聽搶答模式";
  document.getElementById("trackViews").innerText = "畫面與曲名已隱藏";
}

function startNextRandomRound(event) {
  if (event) event.stopPropagation();

  // 若曲目庫已用完，自動進入結算
  if (!unplayedTracks || unplayedTracks.length === 0) {
    finishGame("曲目庫已全數播完");
    return;
  }

  // 從本局未播放池中隨機抽取一首並移除（確保本局絕不重複）
  const randomIndex = Math.floor(Math.random() * unplayedTracks.length);
  currentTrack = unplayedTracks.splice(randomIndex, 1)[0];
  currentRoundNumber++;
  selectedWinnerIdx = null;
  selectedPenaltyPlayerIdx = null;

  // 更新頂部題號與剩餘曲目數
  document.getElementById("roundBadge").innerText =
    `第 ${currentRoundNumber} 題`;
  document.getElementById("remainingCount").innerText =
    unplayedTracks.length;
  document.getElementById("totalPoolCount").innerText = playlist.length;

  // 進入盲聽播放狀態（隱藏影片與曲名），重置本題提示與階梯分數
  roundPhase = "PLAYING";
  resetRoundHints();

  const videoContainer = document.getElementById("videoContainer");
  videoContainer.classList.add("is-blind");

  const blindOverlay = document.getElementById("blindOverlay");
  blindOverlay.style.display = "flex";
  blindOverlay.classList.add("clickable-buzz");

  document.getElementById("overlayStateReady").style.display = "none";
  document.getElementById("overlayStatePlaying").style.display = "flex";
  document.getElementById("overlayStatePaused").style.display = "none";
  document.getElementById("playingStatusTitle").innerText =
    `🎶 第 ${currentRoundNumber} 題：隨機段落播放中...`;

  document.getElementById("refereePanel").style.display = "none";
  document.getElementById("revealedFooterControls").style.display = "none";

  const titleEl = document.getElementById("trackTitle");
  titleEl.innerText = `🔒 神秘曲目（第 ${currentRoundNumber} 題）`;
  titleEl.classList.add("mystery-text");
  document.getElementById("trackInst").innerText = "🙈 盲聽猜歌中";
  document.getElementById("trackViews").innerText = "點擊下方畫面暫停搶答";

  // 載入並從隨機段落開始播放
  loadTrackAtRandomSegment(currentTrack);
}

// 同曲目換另一個隨機段落聽
function seekAnotherRandomSegment(event) {
  if (event) event.stopPropagation();
  if (!currentTrack) return;

  if (
    ytApiReady &&
    ytPlayer &&
    typeof ytPlayer.getDuration === "function"
  ) {
    const duration = ytPlayer.getDuration();
    let randomSec = Math.floor(Math.random() * 80) + 20;
    if (duration && duration > 45) {
      const minSec = Math.max(10, Math.floor(duration * 0.1));
      const maxSec = Math.max(
        minSec + 10,
        Math.min(Math.floor(duration - 18), Math.floor(duration * 0.82)),
      );
      randomSec =
        Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    }
    ytPlayer.seekTo(randomSec, true);
    ytPlayer.unMute();
    ytPlayer.playVideo();
  } else {
    loadTrackAtRandomSegment(currentTrack);
  }

  // 若原本在暫停狀態，切回盲聽播放狀態
  if (roundPhase === "PAUSED") {
    resumeBlindPlayback();
  }
}

// 若遇到失效影片，允許不扣題號重抽一首
function redrawCurrentRoundTrack(event) {
  if (event) event.stopPropagation();
  if (!unplayedTracks || unplayedTracks.length === 0) {
    alert("曲目庫已無其他剩餘曲目可重抽，將進入結算！");
    finishGame("曲目庫已全數播完");
    return;
  }
  currentRoundNumber = Math.max(0, currentRoundNumber - 1);
  startNextRandomRound();
}

// 點擊畫面暫停搶答 -> 猜完揭曉答案
function handleBlindOverlayClick(event) {
  if (roundPhase === "PLAYING") {
    pauseForBuzz();
  }
}

function pauseForBuzz() {
  if (roundPhase !== "PLAYING") return;
  roundPhase = "PAUSED";
  pauseCurrentVideo();

  const blindOverlay = document.getElementById("blindOverlay");
  blindOverlay.classList.remove("clickable-buzz");

  document.getElementById("overlayStateReady").style.display = "none";
  document.getElementById("overlayStatePlaying").style.display = "none";
  document.getElementById("overlayStatePaused").style.display = "flex";

  document.getElementById("trackInst").innerText = "⏸️ 搶答暫停中";
  document.getElementById("trackViews").innerText = "等待揭曉答案";
  updateHintUI();
}

function resumeBlindPlayback(event) {
  if (event) event.stopPropagation();
  roundPhase = "PLAYING";
  playCurrentVideo();

  const blindOverlay = document.getElementById("blindOverlay");
  blindOverlay.classList.add("clickable-buzz");

  document.getElementById("overlayStateReady").style.display = "none";
  document.getElementById("overlayStatePlaying").style.display = "flex";
  document.getElementById("overlayStatePaused").style.display = "none";

  document.getElementById("trackInst").innerText = "🙈 盲聽猜歌中";
  document.getElementById("trackViews").innerText = "點擊下方畫面暫停搶答";
  updateHintUI();
}

// 點擊「揭曉答案」
function revealAnswer(event) {
  if (event) event.stopPropagation();
  if (!currentTrack) return;

  roundPhase = "REVEALED";

  // 解除盲聽遮罩，顯示影片畫面與真實曲名資訊
  document.getElementById("videoContainer").classList.remove("is-blind");
  document.getElementById("blindOverlay").style.display = "none";

  // 恢復播放讓大家邊看畫面邊聽答案
  playCurrentVideo();

  const titleEl = document.getElementById("trackTitle");
  titleEl.innerText = `🎵 ${currentTrack["曲名"] || "未知曲目"}`;
  titleEl.classList.remove("mystery-text");

  document.getElementById("trackInst").innerText =
    currentTrack["編制 / 主奏"] || "國樂演奏";

  const views = currentTrack["參考觀看量"];
  document.getElementById("trackViews").innerText = views
    ? `🔥 ${Number(views).toLocaleString()} 次觀看`
    : "經典名曲";

  updateHintUI();

  // 顯示裁判判定面板（步驟 1：判定結果，並標明本題階梯得分與扣分）
  const askPrompt = document.getElementById("refereeAskPrompt");
  if (askPrompt) {
    askPrompt.innerText = penaltyEnabled
      ? `🎯 答案已揭曉！本題答對可得 +${currentRoundPoints} 分，答錯扣 -${currentRoundPenalty} 分（已開 ${hintsUsedCount} 個提示），裁判請判定：`
      : `🎯 答案已揭曉！本題答對可得 +${currentRoundPoints} 分（已開 ${hintsUsedCount} 個提示），裁判請判定：有沒有人答對？`;
  }

  const btnJudgeWrong = document.getElementById("btnJudgeWrong");
  if (btnJudgeWrong) {
    btnJudgeWrong.style.display = penaltyEnabled ? "inline-flex" : "none";
    btnJudgeWrong.innerText = `❌ 有人答錯！（扣 ${currentRoundPenalty} 分）`;
  }

  document.getElementById("refereePanel").style.display = "flex";
  document.getElementById("refereeStepAsk").style.display = "flex";
  document.getElementById("refereeStepSelectPlayer").style.display = "none";
  document.getElementById("refereeStepSelectPenaltyPlayer").style.display = "none";
  document.getElementById("revealedFooterControls").style.display = "flex";
}

