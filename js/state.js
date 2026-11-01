// =====================================================
// 全域狀態管理與共用工具函式 (Global State & Shared Utilities)
// =====================================================
let playlist = []; // 完整曲目庫
let unplayedTracks = []; // 本局尚未播放過的曲目池（不重複抽取）
let currentTrack = null; // 當前題目的曲目物件
let currentRoundNumber = 0; // 目前題號
let roundPhase = "IDLE"; // 'IDLE' | 'PLAYING' | 'PAUSED' | 'REVEALED'

// 提示與階梯計分／扣分狀態 (0提示=+3/-1, 1提示=+2/-2, 2提示=+1/-3)
let penaltyEnabled = true;
let hintsUsedCount = 0;
let currentRoundPoints = 3;
let currentRoundPenalty = 1;

// 模式切換狀態 ('quiz' | 'free')
let appMode = "quiz";
let lastQuizView = "setup"; // 'setup' | 'game' | 'settlement'

// 玩家設定與分數
let setupPlayerCount = 4;
let savedPlayerNames = ["", "", "", ""];
let players = []; // [{ name: '玩家 1', score: 0 }, ...]
let selectedWinnerIdx = null;
let selectedPenaltyPlayerIdx = null;
let roundHistory = []; // [{ round, track, winnerName, wrongName, points, hintsUsed, type }]

// YouTube IFrame API 播放器狀態 (競賽主舞台)
let ytPlayer = null;
let ytApiReady = false;
let pendingVideoLoad = null;
let needsProportionalRandomSeek = false;
let unmuteSafetyTimer = null;

// 自由播放模式狀態與播放器
let ytFreePlayer = null;
let ytFreeApiReady = false;
let pendingFreeVideoLoad = null;
let freeNeedsRandomSeek = false;
let freeCurrentTrackIndex = -1;
let freeSelectedCategory = "全部";
let freeFilteredIndices = [];
let freeAutoMode = "sequential"; // 'sequential' | 'random' | 'stop'

function getTrackTips(track) {
  if (!track) return { tip1: "暫無提示", tip2: "暫無提示" };
  const name = track["曲名"] || "";
  const inst = track["編制 / 主奏"] || "國樂演奏";

  const rawTip1 = (track.tip1 || "").trim();
  const rawTip2 = (track.tip2 || "").trim();

  const tip1 =
    rawTip1 ||
    `此曲編制／主奏為「${inst}」，曲名共有 ${name.length || "?"} 個字。`;
  const tip2 =
    rawTip2 ||
    `編制為「${inst}」，曲名第一個字為「${name ? name.charAt(0) : "?"}」。`;

  return { tip1, tip2 };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractVideoId(embedUrl) {
  if (!embedUrl) return "";
  const match = embedUrl.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

