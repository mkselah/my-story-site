import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async (event, context) => {
  try {
    // Netlify (like AWS Lambda) passes a string as body:
    const { topic, minutes, age, language } = JSON.parse(event.body);

    const prompt = `
      You are a children story teller.
      Write a story for a ${age}-year-old child.
      The topic is "${topic}".
      Reading aloud should take about ${minutes} minutes.
      Language: ${language}.
    `;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const story = completion.choices[0].message.content;
    // Netlify requires you return an object with statusCode and body
    return {
      statusCode: 200,
      body: JSON.stringify({ story }),
      headers: {
        "Content-Type": "application/json",
      }
    };
  } catch (err) {
    console.error("Function error: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
};