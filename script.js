const form   = document.getElementById("storyForm");
const loader = document.getElementById("loader");
const out    = document.getElementById("result"); // Still here for now, not strictly needed
const btn    = document.getElementById("generateBtn");

const listenBtn = document.getElementById('listen-btn');
const storyContainer = document.getElementById('story-container');

// On page load, disable listen button
listenBtn.disabled = true;
listenBtn.onclick = () => {
  if (currentStoryText) {
    speakStory(currentStoryText);
  }
};

let currentStoryText = "";

// Handle form submit & story generation
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = ""; // Optionally remove this if not using [result]
  loader.hidden = false;
  btn.disabled  = true;
  listenBtn.disabled = true;
  storyContainer.innerText = ""; // Clear previous story

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const resp = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if (json.story) {
      currentStoryText = json.story;
      showStory(json.story);
    }
    else throw new Error(json.error || "No story returned");
  } catch (err) {
    out.textContent = " " + err.message;
    storyContainer.innerText = " " + err.message;
    currentStoryText = "";
    listenBtn.disabled = true;
  } finally {
    loader.hidden = true;
    btn.disabled  = false;
  }
});

// Show story in the story container
function showStory(storyText) {
  storyContainer.innerText = storyText; // or innerHTML if you add formatting
  listenBtn.disabled = false;
}

// Listen functionality
function speakStory(text) {
  window.speechSynthesis.cancel(); // Stop any previous speech

  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = detectLanguage(text);
  utterance.rate = 1.0; // You can tweak for child-friendliness

  window.speechSynthesis.speak(utterance);
}

// Very basic language detect demo
function detectLanguage(text) {
  // This is very naive. For real detection, a package is best.
  // Example: If Danish characters are present
  if (/[æøåÆØÅ]/.test(text)) return 'da-DK';
  // You could add more languages here
  return 'en-US';
}