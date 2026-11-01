// =====================================================
// 裁判判定、即時積分榜與賽事結算畫面 (Referee Judgment, Scoreboard & Settlement)
// =====================================================
function showWinnerSelection() {
  selectedWinnerIdx = null;
  document.getElementById("refereeStepAsk").style.display = "none";
  document.getElementById("refereeStepSelectPenaltyPlayer").style.display = "none";
  document.getElementById("refereeStepSelectPlayer").style.display = "flex";

  const selectPrompt = document.getElementById("refereeSelectPlayerPrompt");
  if (selectPrompt) {
    selectPrompt.innerText = `👑 請選擇本題分數 (+${currentRoundPoints} 分) 要給哪一位玩家：`;
  }

  const confirmBtn = document.getElementById("btnConfirmWinnerNext");
  confirmBtn.style.display = "none";

  renderWinnerSelectButtons();
}

function showPenaltySelection() {
  selectedPenaltyPlayerIdx = null;
  document.getElementById("refereeStepAsk").style.display = "none";
  document.getElementById("refereeStepSelectPlayer").style.display = "none";
  document.getElementById("refereeStepSelectPenaltyPlayer").style.display = "flex";

  const penaltyPrompt = document.getElementById("refereeSelectPenaltyPrompt");
  if (penaltyPrompt) {
    penaltyPrompt.innerText = `⚠️ 請選擇哪一位玩家答錯要扣 ${currentRoundPenalty} 分：`;
  }

  const confirmBtn = document.getElementById("btnConfirmPenaltyNext");
  if (confirmBtn) confirmBtn.style.display = "none";

  const confirmThenWinnerBtn = document.getElementById("btnConfirmPenaltyThenWinner");
  if (confirmThenWinnerBtn) confirmThenWinnerBtn.style.display = "none";

  renderPenaltySelectButtons();
}

function backToRefereeAsk() {
  selectedWinnerIdx = null;
  selectedPenaltyPlayerIdx = null;
  document.getElementById("refereeStepAsk").style.display = "flex";
  document.getElementById("refereeStepSelectPlayer").style.display = "none";
  document.getElementById("refereeStepSelectPenaltyPlayer").style.display = "none";
}

function renderWinnerSelectButtons() {
  const grid = document.getElementById("winnerSelectGrid");
  grid.innerHTML = "";

  players.forEach((player, idx) => {
    const isSelected = selectedWinnerIdx === idx;
    const btn = document.createElement("button");
    btn.className = `btn-player-award ${isSelected ? "selected" : ""}`;
    btn.onclick = () => selectWinnerPlayer(idx);
    btn.innerHTML = `
      <span>${isSelected ? "✅ " : "👤 "}${escapeHtml(player.name)}</span>
      <span class="award-pts">${
        isSelected
          ? `${player.score} → ${player.score + currentRoundPoints} 分 (+${currentRoundPoints})`
          : `目前 ${player.score} 分`
      }</span>
    `;
    grid.appendChild(btn);
  });
}

function selectWinnerPlayer(idx) {
  selectedWinnerIdx = idx;
  renderWinnerSelectButtons();

  const confirmBtn = document.getElementById("btnConfirmWinnerNext");
  const confirmText = document.getElementById("btnConfirmWinnerText");
  confirmBtn.style.display = "inline-flex";

  const isLastTrack = unplayedTracks.length === 0;
  confirmText.innerText = isLastTrack
    ? `🏆 給「${players[idx].name}」+${currentRoundPoints} 分，曲目已用完進入結算`
    : `🎲 給「${players[idx].name}」+${currentRoundPoints} 分，繼續下一首`;
}

function renderPenaltySelectButtons() {
  const grid = document.getElementById("penaltySelectGrid");
  if (!grid) return;
  grid.innerHTML = "";

  players.forEach((player, idx) => {
    const isSelected = selectedPenaltyPlayerIdx === idx;
    const btn = document.createElement("button");
    btn.className = `btn-player-penalty ${isSelected ? "selected" : ""}`;
    btn.onclick = () => selectPenaltyPlayer(idx);
    btn.innerHTML = `
      <span>${isSelected ? "❌ " : "👤 "}${escapeHtml(player.name)}</span>
      <span class="penalty-pts">${
        isSelected
          ? `${player.score} → ${player.score - currentRoundPenalty} 分 (-${currentRoundPenalty})`
          : `目前 ${player.score} 分`
      }</span>
    `;
    grid.appendChild(btn);
  });
}

function selectPenaltyPlayer(idx) {
  selectedPenaltyPlayerIdx = idx;
  renderPenaltySelectButtons();

  const confirmBtn = document.getElementById("btnConfirmPenaltyNext");
  const confirmText = document.getElementById("btnConfirmPenaltyText");
  const confirmThenWinnerBtn = document.getElementById("btnConfirmPenaltyThenWinner");
  const confirmThenWinnerText = document.getElementById("btnConfirmPenaltyThenWinnerText");

  if (confirmBtn && confirmText) {
    confirmBtn.style.display = "inline-flex";
    const isLastTrack = unplayedTracks.length === 0;
    confirmText.innerText = isLastTrack
      ? `🏆 扣「${players[idx].name}」${currentRoundPenalty} 分，曲目已用完進入結算`
      : `🎲 扣「${players[idx].name}」${currentRoundPenalty} 分，繼續下一首`;
  }

  if (confirmThenWinnerBtn && confirmThenWinnerText) {
    confirmThenWinnerBtn.style.display = "inline-flex";
    confirmThenWinnerText.innerText = `⭕ 扣「${players[idx].name}」${currentRoundPenalty} 分後，接著選「答對得 +${currentRoundPoints} 分」的玩家`;
  }
}

function confirmWinnerAndNext() {
  if (selectedWinnerIdx === null || !players[selectedWinnerIdx]) return;

  const winner = players[selectedWinnerIdx];
  winner.score += currentRoundPoints;

  roundHistory.push({
    round: currentRoundNumber,
    track: currentTrack,
    winnerName: winner.name,
    points: currentRoundPoints,
    hintsUsed: hintsUsedCount,
    type: "CORRECT",
  });

  renderScoreboard(selectedWinnerIdx);
  proceedToNextOrSettle();
}

function confirmPenaltyAndNext() {
  if (selectedPenaltyPlayerIdx === null || !players[selectedPenaltyPlayerIdx]) return;

  const penalizedPlayer = players[selectedPenaltyPlayerIdx];
  penalizedPlayer.score -= currentRoundPenalty;

  roundHistory.push({
    round: currentRoundNumber,
    track: currentTrack,
    wrongName: penalizedPlayer.name,
    points: -currentRoundPenalty,
    hintsUsed: hintsUsedCount,
    type: "WRONG",
  });

  renderScoreboard(null, selectedPenaltyPlayerIdx);
  proceedToNextOrSettle();
}

function confirmPenaltyThenWinner() {
  if (selectedPenaltyPlayerIdx === null || !players[selectedPenaltyPlayerIdx]) return;

  const penalizedPlayer = players[selectedPenaltyPlayerIdx];
  penalizedPlayer.score -= currentRoundPenalty;

  roundHistory.push({
    round: currentRoundNumber,
    track: currentTrack,
    wrongName: penalizedPlayer.name,
    points: -currentRoundPenalty,
    hintsUsed: hintsUsedCount,
    type: "WRONG",
  });

  renderScoreboard(null, selectedPenaltyPlayerIdx);

  // 接著進入得分選擇
  document.getElementById("refereeStepSelectPenaltyPlayer").style.display = "none";
  showWinnerSelection();
}

function handleNoOneCorrect() {
  roundHistory.push({
    round: currentRoundNumber,
    track: currentTrack,
    winnerName: null,
    points: 0,
    hintsUsed: hintsUsedCount,
    type: "SKIP",
  });

  proceedToNextOrSettle();
}

function proceedToNextOrSettle() {
  if (!unplayedTracks || unplayedTracks.length === 0) {
    finishGame("曲目庫已全數播完");
  } else {
    startNextRandomRound();
  }
}

// 更新即時積分榜
function renderScoreboard(justScoredIdx = null, justPenalizedIdx = null) {
  const grid = document.getElementById("scoreboardGrid");
  grid.innerHTML = "";

  const maxScore = Math.max(...players.map((p) => p.score), 0);

  players.forEach((player, idx) => {
    const isLeader = maxScore > 0 && player.score === maxScore;
    const isNegative = player.score < 0;
    const card = document.createElement("div");
    card.className = `score-card ${isLeader ? "is-leader" : ""} ${
      justScoredIdx === idx ? "just-scored" : ""
    } ${
      justPenalizedIdx === idx ? "just-penalized" : ""
    }`;
    card.innerHTML = `
      <div class="score-player-name" title="${escapeHtml(player.name)}">
        <span>${isLeader ? "👑" : isNegative ? "⚠️" : "🎋"}</span>
        <span>${escapeHtml(player.name)}</span>
      </div>
      <div class="score-badge ${isNegative ? "is-negative" : ""}">${player.score} 分</div>
    `;
    grid.appendChild(card);
  });

  const leaderHint = document.getElementById("leaderHintText");
  if (maxScore <= 0) {
    leaderHint.innerText = "尚未有人獲得正分，快搶答拿下首勝！";
  } else {
    const leaders = players
      .filter((p) => p.score === maxScore)
      .map((p) => p.name);
    leaderHint.innerText = `目前領先：${leaders.join("、")} (${maxScore} 分)`;
  }
}

// 提前結算 或 曲目庫用完結算
function finishGame(reasonText = "賽事結算") {
  pauseCurrentVideo();
  lastQuizView = "settlement";

  document.getElementById("setupSection").style.display = "none";
  document.getElementById("gameSection").style.display = "none";
  document.getElementById("freePlaySection").style.display = "none";
  document.getElementById("settlementSection").style.display = "block";

  document.getElementById("settlementReasonBadge").innerText =
    reasonText === "曲目庫已全數播完"
      ? "🎉 曲目庫已全數播完 · 完賽結算"
      : `🏆 ${reasonText}`;

  document.getElementById("settlementSummaryText").innerText =
    `本局共完成 ${roundHistory.length} 題曲目搶答（剩餘未播曲目：${unplayedTracks.length} 首）`;

  // 若是提前結算且還有未播完的曲目，提供「返回繼續未完牌局」按鈕以防誤觸
  const btnResume = document.getElementById("btnResumeUnfinished");
  if (reasonText === "提前結算" && unplayedTracks.length > 0) {
    btnResume.style.display = "inline-flex";
  } else {
    btnResume.style.display = "none";
  }

  // 依分數高低排序玩家（同分並列同名次）
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const rankingContainer = document.getElementById(
    "rankingListContainer",
  );
  rankingContainer.innerHTML = "";

  let currentRank = 1;
  sorted.forEach((player, index) => {
    if (index > 0 && player.score < sorted[index - 1].score) {
      currentRank = index + 1;
    }
    const medal =
      currentRank === 1
        ? "🥇"
        : currentRank === 2
          ? "🥈"
          : currentRank === 3
            ? "🥉"
            : `第 ${currentRank} 名`;

    const isTextRank = currentRank > 3;
    const row = document.createElement("div");
    row.className = `ranking-row ${currentRank === 1 && player.score > 0 ? "rank-1" : ""}`;
    row.innerHTML = `
      <div class="ranking-left">
        <span class="rank-medal ${isTextRank ? "is-text-rank" : ""}">${medal}</span>
        <span class="rank-name">${escapeHtml(player.name)}</span>
      </div>
      <div class="rank-score">${player.score} 分</div>
    `;
    rankingContainer.appendChild(row);
  });

  // 渲染本局每題搶答紀錄
  const historyList = document.getElementById("roundHistoryList");
  document.getElementById("historyTotalLabel").innerText =
    `共 ${roundHistory.length} 首`;
  historyList.innerHTML = "";

  if (roundHistory.length === 0) {
    historyList.innerHTML = `<div style="text-align:center; color: var(--text-dim); padding: 1rem;">本局尚無已揭曉判定的題目紀錄</div>`;
  } else {
    roundHistory.forEach((item) => {
      const div = document.createElement("div");
      div.className = "round-history-item";
      const pts = item.points !== undefined ? item.points : 1;
      const hints = item.hintsUsed !== undefined ? item.hintsUsed : 0;
      let resultBadge = "";
      if (item.type === "WRONG" || item.wrongName) {
        const displayPts = pts <= 0 ? pts : -pts;
        resultBadge = `<span style="color: #f87171; font-weight: 700;">❌ ${escapeHtml(item.wrongName || "有人")} 答錯 (${displayPts}分 · ${hints}提示)</span>`;
      } else if (item.winnerName) {
        resultBadge = `<span style="color: #10b981; font-weight: 700;">⭕ ${escapeHtml(item.winnerName)} 答對 (+${pts}分 · ${hints}提示)</span>`;
      } else {
        resultBadge = `<span style="color: var(--text-dim);">⏭️ 無人作答 (${hints}提示)</span>`;
      }
      div.innerHTML = `
        <div class="round-history-track">
          <span style="color: var(--accent-gold); font-weight: 700;">第 ${item.round} 題</span>
          <span>${escapeHtml(item.track ? item.track["曲名"] : "曲目")}</span>
          <span style="color: var(--text-dim); font-size: 0.8rem;">(${escapeHtml(item.track ? item.track["編制 / 主奏"] || "" : "")})</span>
        </div>
        <div class="round-history-result">${resultBadge}</div>
      `;
      historyList.appendChild(div);
    });
  }
}

function resumeFromEarlySettlement() {
  lastQuizView = "game";
  document.getElementById("settlementSection").style.display = "none";
  document.getElementById("gameSection").style.display = "flex";
}

