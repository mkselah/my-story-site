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