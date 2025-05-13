const form   = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out    = document.getElementById("result");
const btn    = document.getElementById("generateBtn");
const listenBtn = document.getElementById("listenBtn");
const downloadBtn = document.getElementById("downloadBtn");

let lastStory = '';
let lastLang  = 'English';
let currAudio = null;
let lastMp3BlobUrl = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "";
  loader.hidden = false;
  btn.disabled  = true;
  listenBtn.hidden = true;
  downloadBtn.hidden = true;
  if (currAudio) {
    currAudio.pause();
    currAudio = null;
  }
  // Cancel browser synth if was reading
  window.speechSynthesis.cancel();

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
      downloadBtn.hidden = false;
      lastMp3BlobUrl = null; // clear any old mp3
    }
    else throw new Error(json.error || "No story returned");
  } catch (err) {
    out.textContent = "X " + err.message;
    listenBtn.hidden = true;
    downloadBtn.hidden = true;
  } finally {
    loader.hidden = true;
    btn.disabled  = false;
  }
});

// Helper: get TTS audio and play it using AI voice!
listenBtn.addEventListener("click", async () => {
  if (!lastStory) return;
  // Stop browser's built-in reading and old audio:
  window.speechSynthesis.cancel();
  if (currAudio) {
    currAudio.pause();
    currAudio = null;
  }
  listenBtn.disabled = true;
  listenBtn.textContent = " Generating voice…";
  try {
    // Request TTS mp3 from Netlify function
    const resp = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastStory, language: lastLang })
    });
    if (!resp.ok) throw new Error("TTS failed: " + (await resp.text()));

    // Get mp3 binary and play
    const arrBuf = await resp.arrayBuffer();
    const blob = new Blob([arrBuf], { type: "audio/mpeg" });
    // revoke previous audio urls
    if (lastMp3BlobUrl) URL.revokeObjectURL(lastMp3BlobUrl);
    const url = URL.createObjectURL(blob);
    lastMp3BlobUrl = url; // Save for download

    currAudio = new Audio(url);
    currAudio.onended = () => {
      listenBtn.textContent = " Listen to story";
      listenBtn.disabled = false;
    };
    currAudio.onerror = () => {
      listenBtn.textContent = " Listen to story";
      listenBtn.disabled = false;
      alert("Audio playback error.");
    };
    currAudio.play();
    listenBtn.textContent = " Stop";
    listenBtn.disabled = false;

    // Allow user to click again to stop
    listenBtn.onclick = () => {
      currAudio.pause();
      listenBtn.textContent = " Listen to story";
      // Restore 'click' event
      listenBtn.onclick = listenHandler;
    };
  } catch (err) {
    alert("Voice reading failed: " + err.message);
    listenBtn.textContent = " Listen to story";
    listenBtn.disabled = false;
  }
});

// Separate handler ref for reconnecting stopped button
function listenHandler() {
  listenBtn.removeEventListener("click", listenHandler);
  listenBtn.addEventListener("click", listenClickHandler);
  listenClickHandler();
}

function listenClickHandler() {
  listenBtn.removeEventListener("click", listenClickHandler);
  listenBtn.addEventListener("click", listenHandler);
  listenBtn.dispatchEvent(new Event("click"));
}
listenBtn.addEventListener("click", listenClickHandler);

// DOWNLOAD BUTTON
downloadBtn.addEventListener("click", async () => {
  // If we've previously fetched and have a blob URL, just use it!
  if (lastMp3BlobUrl) {
    triggerDownload(lastMp3BlobUrl, "story.mp3");
    return;
  }
  // Otherwise fetch TTS as in listenBtn
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
    downloadBtn.textContent = " Download mp3";
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