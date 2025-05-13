const form   = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out    = document.getElementById("result");
const btn    = document.getElementById("generateBtn");
const listenBtn = document.getElementById("listenBtn");

let lastStory = '';
let lastLang  = 'English';

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "";
  loader.hidden = false;
  btn.disabled  = true;
  listenBtn.hidden = true;

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

listenBtn.addEventListener("click", () => {
  if (!lastStory) return;
  // Optional: Stop reading if already talking
  window.speechSynthesis.cancel();

   // Map languages to lang codes
  const langMap = {
    'English': 'en-US',
    'Turkce': 'tr-TR',
    'Dansk': 'da-DK',
    'German': 'de-DE',
    'Dutch': 'nl-NL',
    'Spanish': 'es-ES',
    'French': 'fr-FR'
  };
  const targetLang = langMap[lastLang] || 'en-US';
  const utter = new SpeechSynthesisUtterance(lastStory);
  utter.lang = targetLang;
  utter.rate = 0.95;
  utter.pitch = 1.1;
  
  // Wait for voices to be loaded, then pick the right one
  function speakWithVoice() {
    let voices = window.speechSynthesis.getVoices();
    // Try to find the best matching voice
    let voice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    // fallback: just a voice that starts with 'tr-' etc.
    if (!voice) voice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0,2).toLowerCase()));
    // fallback: first default voice
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    // some browsers, voices load async!
    window.speechSynthesis.onvoiceschanged = speakWithVoice;
  } else {
    speakWithVoice();
  }
});