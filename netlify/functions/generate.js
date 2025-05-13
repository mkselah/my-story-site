import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event, context) {
  try {
    const { topic, minutes, age, language } = JSON.parse(event.body);

    const prompt = `
      You are a children story teller.
      dont mention that you are ai nor a robot. DOnt summarize the instructions and say i will write a story etc, just do it.
      religion is allowed and should be based on islam and its teachings, though keep it minimal.
      Stories should be fun and educational.
      stories should be interesting and imaginative, as stories are told without pictures.
      use a random storytelling style based of one of 10 most popular children storytelling styles.
      Write a story for a ${age}-year-old child.
      The topic is "${topic}".
      Reading aloud should take about ${minutes} minutes.
      Language: ${language}.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1600,
    });

    const story = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story }),
    };
  } catch (err) {
    console.error("Function error: ", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
}

    <button id="listen-btn" disabled>🔊 Listen</button>