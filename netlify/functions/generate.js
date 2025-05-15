import fetch from "node-fetch";
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event, context) {
  try {
    const { topic, minutes, age, language, readYourself } = JSON.parse(event.body);

    // Char limit for each mode
    const charLimit = readYourself ? 10000 : 3400;

    const prompt = `
      You are a children story teller.
      Dont mention that you are ai nor a robot.
      Dont summarize the instructions and say i will write a story etc, just do it.
      Stories should be fun and educational.
      Stories should be interesting and imaginative, as stories are told without pictures.
      Use a random storytelling style based of one of 10 most popular children storytelling styles.
      Write a story for a ${age}-year-old child.
      The topic is "${topic}".
      Reading aloud should take about ${minutes} minutes.
      Language: ${language}.
      Story must be under ${charLimit} characters.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: readYourself ? 3500 : 2500,
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