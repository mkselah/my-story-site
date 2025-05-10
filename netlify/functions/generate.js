import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, age, minutes } = req.body;

  if (!topic || !age || !minutes) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const prompt = `Write a engaging bedtime story for a ${age}-year-old child about "${topic}".
It should take about ${minutes} minutes to read. Use simple language and positive tone.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{role:"user", content: prompt}],
      max_tokens: 600
    });

    const story = completion.data.choices[0].message.content.trim();
    return res.status(200).json({ story });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OpenAI request failed" });
  }
};