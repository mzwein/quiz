import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an instructional designer. Generate a 10-question multiple choice quiz on a given topic. Each question should include 4 choices and a correct answer.'
        },
        {
          role: 'user',
          content: `Create a 10-question quiz on this topic: ${topic}`
        }
      ],
      temperature: 0.7
    });

    const raw = response.choices[0].message.content;

    // Look for a valid JSON output
    const match = raw.match(/\{[\s\S]*\}/);
    const quizJson = match ? JSON.parse(match[0]) : null;

    if (!quizJson || !quizJson.questions) {
      return res.status(500).json({ error: 'Invalid GPT format. Got:\n' + raw });
    }

    res.status(200).json({ topic, questions: quizJson.questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
}
