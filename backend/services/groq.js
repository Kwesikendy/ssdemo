'use strict';

const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama-3.3-70b-versatile';

async function markScript(schemeText, scriptText, customInstructions = '') {
  const systemPrompt = `You are an expert exam marker. Mark the following student exam script against the marking scheme provided. Be fair, consistent, and provide detailed feedback. Always return valid JSON only, no extra text.`;

  const userMessage = `Marking Scheme:
${schemeText}

${customInstructions ? `Custom Instructions: ${customInstructions}\n\n` : ''}Student Script:
${scriptText}

For each question, provide: score awarded, max marks, and brief feedback. Return ONLY valid JSON in this exact format:
{
  "total_score": <number>,
  "max_score": <number>,
  "percentage": <number>,
  "questions": [
    {"number": <number>, "score": <number>, "max_marks": <number>, "feedback": "<string>"}
  ],
  "overall_feedback": "<string>"
}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.1,
    max_tokens: 2000
  });

  const content = response.choices[0].message.content.trim();

  // Extract JSON from response (in case there is any surrounding text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Groq did not return valid JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

async function parseSchemeQuestions(schemeText) {
  const systemPrompt = `You are an expert at parsing exam marking schemes. Extract the questions and their marks from the provided text. Return ONLY valid JSON, no extra text.`;

  const userMessage = `Parse this marking scheme and extract all questions with their marks:

${schemeText}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question_number": <number>,
      "question_text": "<string>",
      "expected_answer": "<string>",
      "marks": <number>
    }
  ],
  "total_marks": <number>
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { questions: [], total_marks: 0 };
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Error parsing scheme questions:', err.message);
    return { questions: [], total_marks: 0 };
  }
}

module.exports = { markScript, parseSchemeQuestions };
