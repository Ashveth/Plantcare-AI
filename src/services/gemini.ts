import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getPlantFeedback(plantData: any) {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this plant's data and provide a short, encouraging feedback (1-2 sentences).
  Plant: ${plantData.name}
  Type: ${plantData.type}
  Height: ${plantData.height}cm
  Age: ${plantData.age} days
  Last Watered: ${plantData.lastWatered}
  Watering Frequency: Every ${plantData.wateringFrequency} days
  Health: ${plantData.healthStatus}
  
  Example: "Your Rose plant is growing well! Keep up the good work." or "Your Aloe Vera may need less water."`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Keep taking good care of your plant!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Your plant looks happy! Keep it up.";
  }
}

export async function chatWithGemini(message: string, context?: string) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = "You are a helpful plant care assistant named PlantCare AI. Answer questions about plant diseases, watering, growth, and care tips. Keep answers concise and friendly.";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: context ? `${context}\n\nUser: ${message}` : message,
      config: { systemInstruction }
    });
    return response.text || "I'm not sure about that, but I can help with other plant questions!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

export async function identifyPlantFromImage(base64Image: string) {
  const model = "gemini-3-flash-preview";
  const prompt = "Identify this plant. Return a JSON object with 'name' and 'type' (one of: Flowering, Indoor, Outdoor, Medicinal, Succulent). If unsure, provide your best guess.";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt },
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return result as { name: string; type: string };
  } catch (error) {
    console.error("Gemini Identification Error:", error);
    return null;
  }
}
