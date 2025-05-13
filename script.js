const form   = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out    = document.getElementById("result");
const btn    = document.getElementById("generateBtn");
const listenBtn = document.getElementById("listenBtn");

let lastStory = '';
let lastLang  = 'English';
let currAudio = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "";
  loader.hidden = false;
  btn.disabled  = true;
  listenBtn.hidden = true;
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
    }
    else throw new Error(json.error || "No story returned");
  } catch (err) {
    out.textContent = "X " + err.message;
    listenBtn.hidden = true;
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
  listenBtn.textContent = "🔄 Generating voice…";
  try {
    // Request TTS mp3 from Netlify function
    const resp = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastStory, language: lastLang })
    });
    if (!resp.ok) throw new Error("TTS failed: " + (await resp.text()));

    // Get mp3 Base64 and play
    const arrBuf = await resp.arrayBuffer();
    const blob = new Blob([arrBuf], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    currAudio = new Audio(url);
    currAudio.onended = () => {
      listenBtn.textContent = "🔊 Listen to story";
      listenBtn.disabled = false;
      URL.revokeObjectURL(url);
    };
    currAudio.onerror = () => {
      listenBtn.textContent = "🔊 Listen to story";
      listenBtn.disabled = false;
      URL.revokeObjectURL(url);
      alert("Audio playback error.");
    };
    currAudio.play();
    listenBtn.textContent = "⏸️ Stop";
    listenBtn.disabled = false;

    // Allow user to click again to stop
    listenBtn.onclick = () => {
      currAudio.pause();
      URL.revokeObjectURL(url);
      listenBtn.textContent = "🔊 Listen to story";
      listenBtn.onclick = arguments.callee;
    };
  } catch (err) {
    alert("Voice reading failed: " + err.message);
    listenBtn.textContent = "🔊 Listen to story";
    listenBtn.disabled = false;
  }
});