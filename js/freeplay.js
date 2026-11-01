// =====================================================
// 自由播放與曲庫鑑賞模式 (Free Play / Jukebox Mode)
// =====================================================
function getTrackCategoryGroup(track) {
  const inst = track["編制 / 主奏"] || "";
  if (inst.includes("二胡") || inst.includes("京胡") || inst.includes("高胡") || inst.includes("胡")) {
    return "二胡 / 胡琴";
  }
  if (inst.includes("古箏")) {
    return "古箏";
  }
  if (inst.includes("琵琶") || inst.includes("中阮") || inst.includes("揚琴") || inst.includes("柳琴")) {
    return "琵琶 / 彈撥";
  }
  if (inst.includes("笛") || inst.includes("嗩吶") || inst.includes("笙")) {
    return "吹管 (笛/嗩吶/笙)";
  }
  if (inst.includes("打擊")) {
    return "打擊樂";
  }
  return "國樂合奏";
}

function initFreePlayView() {
  // 若尚未選擇任何曲目且曲庫不為空，預設選中第 1 首曲目並展示其導聆資訊
  if (freeCurrentTrackIndex === -1 && playlist.length > 0) {
    freeCurrentTrackIndex = 0;
    updateFreeTrackMetaDisplay(0);
  }
  renderFreeCategoryPills();
  renderFreePlayTrackList();
}

function renderFreeCategoryPills() {
  const container = document.getElementById("freeCategoryPills");
  if (!container) return;

  const categories = [
    "全部",
    "國樂合奏",
    "二胡 / 胡琴",
    "古箏",
    "琵琶 / 彈撥",
    "吹管 (笛/嗩吶/笙)",
    "打擊樂",
  ];

  container.innerHTML = "";
  categories.forEach((cat) => {
    const count =
      cat === "全部"
        ? playlist.length
        : playlist.filter((t) => getTrackCategoryGroup(t) === cat).length;

    const btn = document.createElement("button");
    btn.className = `cat-pill ${freeSelectedCategory === cat ? "active" : ""}`;
    btn.onclick = () => {
      freeSelectedCategory = cat;
      renderFreeCategoryPills();
      renderFreePlayTrackList();
    };
    btn.innerText = `${cat} (${count})`;
    container.appendChild(btn);
  });
}

function renderFreePlayTrackList() {
  const listEl = document.getElementById("freeTrackList");
  const countEl = document.getElementById("freeFilterCountText");
  if (!listEl) return;

  const keyword = (
    document.getElementById("freeSearchInput")?.value || ""
  )
    .trim()
    .toLowerCase();
  const sortBy =
    document.getElementById("freeSortSelect")?.value || "default";

  // 篩選符合分類與搜尋關鍵字的曲目索引
  let matched = playlist
    .map((track, idx) => ({ track, idx }))
    .filter(({ track }) => {
      if (
        freeSelectedCategory !== "全部" &&
        getTrackCategoryGroup(track) !== freeSelectedCategory
      ) {
        return false;
      }
      if (!keyword) return true;
      const { tip1, tip2 } = getTrackTips(track);
      const haystack = `${track["曲名"] || ""} ${track["編制 / 主奏"] || ""} ${tip1} ${tip2}`.toLowerCase();
      return haystack.includes(keyword);
    });

  // 排序
  if (sortBy === "views_desc") {
    matched.sort(
      (a, b) =>
        (Number(b.track["參考觀看量"]) || 0) -
        (Number(a.track["參考觀看量"]) || 0),
    );
  } else if (sortBy === "views_asc") {
    matched.sort(
      (a, b) =>
        (Number(a.track["參考觀看量"]) || 0) -
        (Number(b.track["參考觀看量"]) || 0),
    );
  } else if (sortBy === "name_asc") {
    matched.sort((a, b) =>
      (a.track["曲名"] || "").localeCompare(
        b.track["曲名"] || "",
        "zh-Hant",
      ),
    );
  }

  freeFilteredIndices = matched.map((m) => m.idx);
  if (countEl) {
    countEl.innerText = `顯示 ${matched.length} / ${playlist.length} 首`;
  }

  listEl.innerHTML = "";
  if (matched.length === 0) {
    listEl.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 2rem;">找不到符合條件的曲目，請嘗試其他關鍵字或分類</div>`;
    return;
  }

  matched.forEach(({ track, idx }) => {
    const isActive = idx === freeCurrentTrackIndex;
    const views = Number(track["參考觀看量"]) || 0;
    const viewsFormatted =
      views >= 10000
        ? `${(views / 10000).toFixed(1)} 萬次觀看`
        : `${views.toLocaleString()} 次觀看`;

    const item = document.createElement("div");
    item.className = `free-track-item ${isActive ? "active" : ""}`;
    item.onclick = () => playFreeTrack(idx, false);
    item.innerHTML = `
      <div class="free-track-left">
        <span class="free-track-num">${isActive ? "🔊" : `#${String(idx + 1).padStart(2, "0")}`}</span>
        <div class="free-track-info">
          <div class="free-track-name" title="${escapeHtml(track["曲名"])}">${escapeHtml(track["曲名"])}</div>
          <div class="free-track-sub">${escapeHtml(track["編制 / 主奏"] || "國樂")} · ${viewsFormatted}</div>
        </div>
      </div>
      <span style="color: var(--accent-gold); font-size: 0.9rem; flex-shrink: 0;">▶</span>
    `;
    listEl.appendChild(item);
  });
}

function updateFreeTrackMetaDisplay(trackIdx) {
  const track = playlist[trackIdx];
  if (!track) return;

  document.getElementById("freeTrackTitle").innerText =
    `🎵 ${track["曲名"] || "未知曲目"}`;
  document.getElementById("freeTrackInst").innerText =
    track["編制 / 主奏"] || "國樂演奏";

  const views = Number(track["參考觀看量"]) || 0;
  document.getElementById("freeTrackViews").innerText = views
    ? `🔥 ${views.toLocaleString()} 次觀看`
    : "經典名曲";

  const embedUrl = track["YouTube 外嵌連結"] || "";
  const videoId = extractVideoId(embedUrl);
  const btnFreeExternal = document.getElementById("btnFreeExternalLink");
  if (btnFreeExternal) {
    btnFreeExternal.href = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : embedUrl;
  }

  const { tip1, tip2 } = getTrackTips(track);
  document.getElementById("freeTipText1").innerText = tip1;
  document.getElementById("freeTipText2").innerText = tip2;
}

function playFreeTrack(trackIdx, randomSegment = false) {
  if (trackIdx < 0 || trackIdx >= playlist.length) return;
  freeCurrentTrackIndex = trackIdx;
  updateFreeTrackMetaDisplay(trackIdx);
  renderFreePlayTrackList();

  const track = playlist[trackIdx];
  const embedUrl = track["YouTube 外嵌連結"] || "";
  const videoId = extractVideoId(embedUrl);
  const startSec = randomSegment
    ? Math.floor(Math.random() * 70) + 25
    : 0;
  freeNeedsRandomSeek = randomSegment;

  if (
    ytFreeApiReady &&
    ytFreePlayer &&
    typeof ytFreePlayer.loadVideoById === "function"
  ) {
    executeFreeVideoLoad(videoId, startSec);
  } else if (window.YT && window.YT.Player) {
    pendingFreeVideoLoad = { videoId, startSec };
    initYTFreePlayerInstance();
  } else {
    fallbackFreeIframeLoad(embedUrl, startSec);
  }
}

function freePlayPrevTrack() {
  const pool =
    freeFilteredIndices.length > 0
      ? freeFilteredIndices
      : playlist.map((_, i) => i);
  if (pool.length === 0) return;

  const pos = pool.indexOf(freeCurrentTrackIndex);
  const prevIdx =
    pos > 0 ? pool[pos - 1] : pool[pool.length - 1];
  playFreeTrack(prevIdx, false);
}

function freePlayNextTrack() {
  const pool =
    freeFilteredIndices.length > 0
      ? freeFilteredIndices
      : playlist.map((_, i) => i);
  if (pool.length === 0) return;

  const pos = pool.indexOf(freeCurrentTrackIndex);
  const nextIdx =
    pos >= 0 && pos < pool.length - 1 ? pool[pos + 1] : pool[0];
  playFreeTrack(nextIdx, false);
}

function freePlayRandomTrack() {
  const pool =
    freeFilteredIndices.length > 0
      ? freeFilteredIndices
      : playlist.map((_, i) => i);
  if (pool.length === 0) return;

  let candidates = pool;
  if (pool.length > 1 && pool.includes(freeCurrentTrackIndex)) {
    candidates = pool.filter((i) => i !== freeCurrentTrackIndex);
  }
  const randomIdx =
    candidates[Math.floor(Math.random() * candidates.length)];
  playFreeTrack(randomIdx, false);
}

function freePlaySeekRandomSegment() {
  if (freeCurrentTrackIndex === -1 && playlist.length > 0) {
    playFreeTrack(0, true);
    return;
  }
  if (
    ytFreeApiReady &&
    ytFreePlayer &&
    typeof ytFreePlayer.getDuration === "function"
  ) {
    const duration = ytFreePlayer.getDuration();
    let randomSec = Math.floor(Math.random() * 80) + 20;
    if (duration && duration > 45) {
      const minSec = Math.max(10, Math.floor(duration * 0.12));
      const maxSec = Math.max(
        minSec + 10,
        Math.min(Math.floor(duration - 18), Math.floor(duration * 0.8)),
      );
      randomSec =
        Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    }
    ytFreePlayer.seekTo(randomSec, true);
    ytFreePlayer.playVideo();
  } else if (freeCurrentTrackIndex >= 0) {
    playFreeTrack(freeCurrentTrackIndex, true);
  }
}

function toggleFreeAutoMode() {
  const btn = document.getElementById("btnFreeAutoMode");
  if (freeAutoMode === "sequential") {
    freeAutoMode = "random";
    btn.innerText = "🔀 播完自動：隨機下一首";
  } else if (freeAutoMode === "random") {
    freeAutoMode = "stop";
    btn.innerText = "⏹️ 播完自動：單曲停止";
  } else {
    freeAutoMode = "sequential";
    btn.innerText = "🔁 播完自動：順序下一首";
  }
}

