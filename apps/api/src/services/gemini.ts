import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

export async function queryDashboard(
  userQuestion: string,
  restaurantData: object,
): Promise<{ answer: string; dataSource: string }> {
  if (!genAI) {
    return {
      answer:
        'Gemini AI is not configured. Please ask an administrator to set the GEMINI_API_KEY environment variable.',
      dataSource: 'error',
    }
  }

  const prompt = `You are a restaurant analytics assistant. Answer the user's question using ONLY the provided restaurant data below.

RULES:
- Answer ONLY based on the provided data. Never use general knowledge to add numbers or stats.
- Keep your answer concise and specific to this restaurant.
- NEVER invent numbers, percentages, or statistics not present in the data.
- If the question is about something outside restaurant operations (sales, inventory, orders, operations), respond with: "I can only answer questions about your restaurant's sales, inventory, orders, and operations data."

RESTAURANT DATA:
${JSON.stringify(restaurantData, null, 2)}

USER QUESTION:
${userQuestion}

Answer:`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const answer = result.response.text().trim()

    return { answer, dataSource: 'gemini-1.5-flash' }
  } catch (err) {
    console.error('[GEMINI] API error:', err)
    return {
      answer: 'Sorry, I encountered an error while processing your question. Please try again.',
      dataSource: 'error',
    }
  }
}
