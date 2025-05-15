// MODE SWITCH UI
const listenPageBtn = document.getElementById("listenPageBtn");
const readPageBtn   = document.getElementById("readPageBtn");
const listenSection = document.getElementById("listenSection");
const readSection   = document.getElementById("readSection");

// Highlight the active mode and show correct section
function setMode(mode) {
  if (mode === "listen") {
    listenSection.hidden = false;
    readSection.hidden = true;
    listenPageBtn.classList.add("activeBtn");
    readPageBtn.classList.remove("activeBtn");
  } else {
    listenSection.hidden = true;
    readSection.hidden = false;
    listenPageBtn.classList.remove("activeBtn");
    readPageBtn.classList.add("activeBtn");
  }
}
listenPageBtn.addEventListener("click", () => setMode("listen"));
readPageBtn.addEventListener("click", () => setMode("read"));
setMode("listen"); // default

// EXISTING Listen mode code — unchanged except for isolation in Listen section!

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
      lastMp3BlobUrl = null;
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

// TTS and Download code remain identical

listenBtn.addEventListener("click", async () => {
  if (!lastStory) return;
  window.speechSynthesis.cancel();
  if (currAudio) {
    currAudio.pause();
    currAudio = null;
  }
  listenBtn.disabled = true;
  listenBtn.textContent = " Generating voice…";
  try {
    const resp = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastStory, language: lastLang })
    });
    if (!resp.ok) throw new Error("TTS failed: " + (await resp.text()));
    const arrBuf = await resp.arrayBuffer();
    const blob = new Blob([arrBuf], { type: "audio/mpeg" });
    if (lastMp3BlobUrl) URL.revokeObjectURL(lastMp3BlobUrl);
    const url = URL.createObjectURL(blob);
    lastMp3BlobUrl = url;

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
    listenBtn.onclick = () => {
      currAudio.pause();
      listenBtn.textContent = " Listen to story";
      listenBtn.onclick = listenHandler;
    };
  } catch (err) {
    alert("Voice reading failed: " + err.message);
    listenBtn.textContent = " Listen to story";
    listenBtn.disabled = false;
  }
});

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

downloadBtn.addEventListener("click", async () => {
  if (lastMp3BlobUrl) {
    triggerDownload(lastMp3BlobUrl, "story.mp3");
    return;
  }
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

// --- NEW: "Read yourself" section logic! --- //

const readForm = document.getElementById("readForm");
const readLoader = document.getElementById("readLoader");
const readResult = document.getElementById("readResult");

// At first, Read Yourself section is hidden above

readForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  readResult.textContent = "";
  readLoader.hidden = false;
  readForm.readGenerateBtn.disabled = true;

  // Send info, but allow larger stories:
  const data = Object.fromEntries(new FormData(readForm).entries());
  // We'll tell the backend to use a bigger char limit by sending a new field:
  data.readYourself = true;
  try {
    const resp = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if (json.story) {
      readResult.textContent = json.story;
    }
    else throw new Error(json.error || "No story returned");
  } catch (err) {
    readResult.textContent = "X " + err.message;
  } finally {
    readLoader.hidden = true;
    readForm.readGenerateBtn.disabled = false;
  }
});