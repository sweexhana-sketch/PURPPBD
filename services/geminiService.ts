/**
 * Frontend Service for Gemini AI
 * 
 * NOTE: The GoogleGenAI SDK is NO LONGER used here to prevent the API Key 
 * from leaking to the browser. Instead, these functions make standard HTTP 
 * POST requests to our secure Vercel Serverless Functions (/api/gemini/*).
 */

export async function chatWithGemini(userMessage: string, history: any[] = []) {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userMessage, history }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Frontend Error:", error);
    return "Maaf, terjadi gangguan pada sistem komunikasi kami. Silakan coba beberapa saat lagi.";
  }
}

export async function analyzeRoadImage(imageBuffer: string, locationData?: any) {
  try {
    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBuffer, locationData }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Image Analysis Frontend Error:", error);
    return "ERROR";
  }
}
