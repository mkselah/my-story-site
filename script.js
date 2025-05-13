const form   = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out    = document.getElementById("result");
const btn    = document.getElementById("generateBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "";
  loader.hidden = false;
  btn.disabled  = true;

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const resp = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if (json.story) out.textContent = json.story;
    else throw new Error(json.error || "No story returned");
  } catch (err) {
    out.textContent = "❌ " + err.message;
  } finally {
    loader.hidden = true;
    btn.disabled  = false;
  }
});

const listenBtn = document.getElementById('listen-btn');
let currentUtterance = null;

// Call this whenever you display a new story
function enableListenButton(storyText) {
  listenBtn.disabled = false;
  listenBtn.onclick = () => {
    // Stop any old speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    // Create and start new speech
    const utterance = new SpeechSynthesisUtterance(storyText);
    utterance.lang = detectLanguage(storyText);
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  };
}

// Optional: Try to pick the correct language for the story
function detectLanguage(text) {
  // Very basic demo: if there's æ, ø, å, assume Danish
  if (/[æøåÆØÅ]/.test(text)) return 'da-DK';
  else return 'en-US';
}

// When your code displays the story after fetching from API:
function showStory(storyText) {
  document.getElementById('story-container').innerText = storyText;
  enableListenButton(storyText);
}