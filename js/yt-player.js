// =====================================================
// YouTube IFrame Player API 載入與隨機段落控制 (競賽舞台 + 自由播放)
// =====================================================
function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) {
    initYTPlayerInstance();
    if (appMode === "free") initYTFreePlayerInstance();
    return;
  }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function () {
  initYTPlayerInstance();
  if (appMode === "free") {
    initYTFreePlayerInstance();
  }
};

function getCommonPlayerVars() {
  const playerVars = {
    autoplay: 0,
    controls: 1,
    playsinline: 1,
    rel: 0,
    modestbranding: 1,
    enablejsapi: 1,
  };
  if (window.location.protocol.startsWith("http")) {
    playerVars.origin = window.location.origin;
  }
  return playerVars;
}

function initYTPlayerInstance() {
  if (ytPlayer || !window.YT || !window.YT.Player) return;

  ytPlayer = new YT.Player("ytPlayer", {
    width: "100%",
    height: "100%",
    playerVars: getCommonPlayerVars(),
    events: {
      onReady: () => {
        ytApiReady = true;
        if (pendingVideoLoad) {
          const { videoId, fallbackStart } = pendingVideoLoad;
          pendingVideoLoad = null;
          executeRandomSegmentLoad(videoId, fallbackStart);
        }
      },
      onStateChange: onYTStateChange,
      onError: onYTError,
    },
  });
}

function initYTFreePlayerInstance() {
  if (ytFreePlayer || !window.YT || !window.YT.Player) return;

  const defaultIdx =
    freeCurrentTrackIndex >= 0 ? freeCurrentTrackIndex : 0;
  const defaultTrack = playlist[defaultIdx];
  const defaultVideoId = defaultTrack
    ? extractVideoId(defaultTrack["YouTube 外嵌連結"] || "")
    : "";

  ytFreePlayer = new YT.Player("ytFreePlayer", {
    width: "100%",
    height: "100%",
    videoId: defaultVideoId || undefined,
    playerVars: getCommonPlayerVars(),
    events: {
      onReady: () => {
        ytFreeApiReady = true;
        if (pendingFreeVideoLoad) {
          const { videoId, startSec } = pendingFreeVideoLoad;
          pendingFreeVideoLoad = null;
          executeFreeVideoLoad(videoId, startSec);
        }
      },
      onStateChange: onYTFreeStateChange,
    },
  });
}

function onYTStateChange(event) {
  // 當影片首次開始播放時，若尚未根據真實曲長做隨機段落切入，則根據總長度動態跳轉至 12%~78% 之間的隨機段落
  if (
    event.data === YT.PlayerState.PLAYING &&
    needsProportionalRandomSeek
  ) {
    needsProportionalRandomSeek = false;
    try {
      const duration = ytPlayer.getDuration();
      if (duration && duration > 45) {
        const minSec = Math.max(12, Math.floor(duration * 0.12));
        const maxSec = Math.max(
          minSec + 10,
          Math.min(Math.floor(duration - 20), Math.floor(duration * 0.78)),
        );
        const randomStart =
          Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
        ytPlayer.seekTo(randomStart, true);
      }
    } catch (e) {
      console.warn("動態段落跳轉失敗，維持預設隨機秒數", e);
    }

    clearTimeout(unmuteSafetyTimer);
    unmuteSafetyTimer = setTimeout(() => {
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
      } catch (e) {}
    }, 220);
  }
}

function onYTError(event) {
  console.warn("YouTube 播放器回報錯誤代碼：", event.data);
  const titleEl = document.getElementById("playingStatusTitle");
  if (titleEl && roundPhase === "PLAYING") {
    titleEl.innerText = "⚠️ 此曲目影片無法內嵌播放，請點下方「重抽一首」";
  }
}

function loadTrackAtRandomSegment(track) {
  const embedUrl = track["YouTube 外嵌連結"] || "";
  const videoId = extractVideoId(embedUrl);

  // 預設隨機起點 (25秒 ~ 95秒)，若 YT.Player 取得真實總長會再精準校正至全曲 12%~78% 區間
  const fallbackStart = Math.floor(Math.random() * 70) + 25;

  // 更新外部 YouTube 連結按鈕 (僅揭曉答案後顯示)
  const btnExternal = document.getElementById("btnExternalLink");
  if (videoId) {
    btnExternal.href = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    btnExternal.href = embedUrl;
  }

  if (ytApiReady && ytPlayer && typeof ytPlayer.loadVideoById === "function") {
    executeRandomSegmentLoad(videoId, fallbackStart);
  } else if (window.YT && window.YT.Player && !ytApiReady) {
    pendingVideoLoad = { videoId, fallbackStart };
  } else {
    // 備援：直接使用 iframe src 搭配 start 參數與 enablejsapi
    fallbackIframeLoad(embedUrl, fallbackStart);
  }
}

function executeRandomSegmentLoad(videoId, fallbackStart) {
  needsProportionalRandomSeek = true;
  clearTimeout(unmuteSafetyTimer);
  try {
    ytPlayer.mute();
    ytPlayer.loadVideoById({
      videoId: videoId,
      startSeconds: fallbackStart,
    });
    unmuteSafetyTimer = setTimeout(() => {
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
      } catch (e) {}
    }, 950);
  } catch (err) {
    console.warn("YT.Player loadVideoById 異常：", err);
  }
}

function fallbackIframeLoad(embedUrl, startSec) {
  const wrapper = document.getElementById("ytMountWrapper");
  const separator = embedUrl.includes("?") ? "&" : "?";
  let params = `autoplay=1&playsinline=1&enablejsapi=1&rel=0&start=${startSec}`;
  if (window.location.protocol.startsWith("http")) {
    params += `&origin=${encodeURIComponent(window.location.origin)}`;
  }
  wrapper.innerHTML = `<iframe id="ytFallbackIframe" src="${embedUrl}${separator}${params}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function pauseCurrentVideo() {
  if (ytApiReady && ytPlayer && typeof ytPlayer.pauseVideo === "function") {
    try {
      ytPlayer.pauseVideo();
    } catch (e) {}
  }
  const iframe = wrapperIframeElement();
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "*",
    );
  }
}

function playCurrentVideo() {
  if (ytApiReady && ytPlayer && typeof ytPlayer.playVideo === "function") {
    try {
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      ytPlayer.playVideo();
    } catch (e) {}
  }
  const iframe = wrapperIframeElement();
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*",
    );
  }
}

function wrapperIframeElement() {
  return document.querySelector("#ytMountWrapper iframe");
}

function executeFreeVideoLoad(videoId, startSec) {
  try {
    ytFreePlayer.unMute();
    ytFreePlayer.setVolume(100);
    ytFreePlayer.loadVideoById({
      videoId: videoId,
      startSeconds: startSec,
    });
  } catch (err) {
    console.warn("自由播放載入異常：", err);
  }
}

function fallbackFreeIframeLoad(embedUrl, startSec) {
  const wrapper = document.getElementById("ytFreeMountWrapper");
  const separator = embedUrl.includes("?") ? "&" : "?";
  let params = `autoplay=1&playsinline=1&enablejsapi=1&rel=0&start=${startSec}`;
  if (window.location.protocol.startsWith("http")) {
    params += `&origin=${encodeURIComponent(window.location.origin)}`;
  }
  wrapper.innerHTML = `<iframe id="ytFreeFallbackIframe" src="${embedUrl}${separator}${params}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function onYTFreeStateChange(event) {
  if (
    event.data === YT.PlayerState.PLAYING &&
    freeNeedsRandomSeek
  ) {
    freeNeedsRandomSeek = false;
    try {
      const duration = ytFreePlayer.getDuration();
      if (duration && duration > 45) {
        const minSec = Math.max(12, Math.floor(duration * 0.12));
        const maxSec = Math.max(
          minSec + 10,
          Math.min(Math.floor(duration - 20), Math.floor(duration * 0.78)),
        );
        const randomStart =
          Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
        ytFreePlayer.seekTo(randomStart, true);
      }
    } catch (e) {}
  } else if (event.data === YT.PlayerState.ENDED) {
    if (freeAutoMode === "sequential") {
      freePlayNextTrack();
    } else if (freeAutoMode === "random") {
      freePlayRandomTrack();
    }
  }
}

function pauseFreePlayVideo() {
  if (
    ytFreeApiReady &&
    ytFreePlayer &&
    typeof ytFreePlayer.pauseVideo === "function"
  ) {
    try {
      ytFreePlayer.pauseVideo();
    } catch (e) {}
  }
  const iframe = document.querySelector("#ytFreeMountWrapper iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "*",
    );
  }
}

