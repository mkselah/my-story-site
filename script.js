const form = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out = document.getElementById("result");
const btn = document.getElementById("generateBtn");
const listenBtn = document.getElementById("listenBtn");

// If you want download functionality, make sure your index.html has a downloadBtn!
let downloadBtn = document.getElementById("downloadBtn");

let lastStory = '';
let lastLang = 'English';
let currAudio = null;
let lastMp3BlobUrl = null;
let isPlaying = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "";
  loader.hidden = false;
  btn.disabled = true;
  listenBtn.hidden = true;
  if (downloadBtn) downloadBtn.hidden = true;
  stopAudioIfPlaying();

  const data = Object.fromEntries(new FormData(form).entries());
  lastLang = data.language || 'English';

  try {
    const resp = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if (json.story) {
      out.textContent = json.story;
      lastStory = json.story;
      listenBtn.hidden = false;
      if (downloadBtn) downloadBtn.hidden = false;
      lastMp3BlobUrl = null; // clear any old mp3
    } else throw new Error(json.error || "No story returned");
  } catch (err) {
    out.textContent = "X " + err.message;
    listenBtn.hidden = true;
    if (downloadBtn) downloadBtn.hidden = true;
  } finally {
    loader.hidden = true;
    btn.disabled = false;
  }
});

// Helper - stop any audio/tts currently playing
function stopAudioIfPlaying() {
  if (currAudio) {
    currAudio.pause();
    currAudio = null;
  }
  isPlaying = false;
  listenBtn.textContent = "🔊 Listen to story";
  listenBtn.disabled = false;
  window.speechSynthesis.cancel();
}

// Listen/play logic
listenBtn.addEventListener("click", async () => {
  // If already playing, stop
  if (isPlaying) {
    stopAudioIfPlaying();
    return;
  }
  if (!lastStory) return;

  stopAudioIfPlaying();
  listenBtn.disabled = true;
  listenBtn.textContent = "Generating voice…";

  try {
    // Fetch TTS mp3
    const resp = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastStory, language: lastLang })
    });
    if (!resp.ok) throw new Error("TTS failed: " + (await resp.text()));
    const arrBuf = await resp.arrayBuffer();
    const blob = new Blob([arrBuf], { type: "audio/mpeg" });
    // Revoke previous audio url
    if (lastMp3BlobUrl) URL.revokeObjectURL(lastMp3BlobUrl);
    const url = URL.createObjectURL(blob);
    lastMp3BlobUrl = url;

    isPlaying = true;
    currAudio = new Audio(url);
    currAudio.onended = () => {
      stopAudioIfPlaying();
    };
    currAudio.onerror = () => {
      stopAudioIfPlaying();
      alert("Audio playback error.");
    };
    listenBtn.textContent = "⏹ Stop";
    listenBtn.disabled = false;
    currAudio.play();
  } catch (err) {
    alert("Voice reading failed: " + err.message);
    listenBtn.textContent = "🔊 Listen to story";
    listenBtn.disabled = false;
    isPlaying = false;
  }
});

// DOWNLOAD BUTTON (optional)
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    if (lastMp3BlobUrl) {
      triggerDownload(lastMp3BlobUrl, "story.mp3");
      return;
    }
    // Otherwise - fetch and save mp3
    try {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Generating…";
      const resp = await fetch("/.netlify/functions/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastStory, language: lastLang })
      });
      if (!resp.ok) throw new Error("TTS failed: " + (await resp.text()));
      const arrBuf = await resp.arrayBuffer();
      const blob = new Blob([arrBuf], { type: "audio/mpeg" });
      if (lastMp3BlobUrl) URL.revokeObjectURL(lastMp3BlobUrl);
      const blobUrl = URL.createObjectURL(blob);
      lastMp3BlobUrl = blobUrl;
      triggerDownload(blobUrl, "story.mp3");
    } catch (err) {
      alert("Download failed: " + err.message);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = "Download mp3";
    }
  });
  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}