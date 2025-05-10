/* CommonJS is the simplest on Netlify;
   no extra bundler flags needed. */

const { Configuration, OpenAIApi } = require("openai");

/* ❶ Create OpenAI client */
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

/* ❷ Export a handler(event, context) */
exports.handler = async (event, context) => {
  /* Allow only POST */
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  /* ❸ Parse and validate JSON body */
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  const { topic, age, minutes } = payload;
  if (!topic || !age || !minutes) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing fields" })
    };
  }

  /* ❹ Call OpenAI */
  try {
    const prompt = `Write an engaging bedtime story for a ${age}-year-old child about "${topic}". It should take about ${minutes} minutes to read. Use simple language and a positive tone.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600
    });

    const story = completion.data.choices[0].message.content.trim();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"     // CORS, useful for local dev
      },
      body: JSON.stringify({ story })
    };
  } catch (err) {
    console.error("OpenAI error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "OpenAI request failed" })
    };
  }
};