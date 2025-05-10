import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Must be set in Netlify > Site > Environment Variables
});

export default async (req, res) => {
  try {
    // Netlify passes the body as a string, so:
    const { topic, minutes, age, language } = JSON.parse(req.body);

    const prompt = `
      You are a children story teller.
      Write a story for a ${age}-year-old child.
      The topic is "${topic}".
      Reading aloud should take about ${minutes} minutes.
      Language: ${language}.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-3.5-turbo
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const story = completion.choices[0].message.content;
    res.status(200).json({ story });
  } catch (err) {
    console.error("Function error: ", err);
    res.status(500).json({ error: err.message });
  }
};