import { GoogleGenAI, Type } from "@google/genai";
import { Plant, PlantEvent, FarmerLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const cleanJson = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("Invalid AI response format");
  }
};

export const generatePlantProfile = async (plant: Partial<Plant>) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Generate a comprehensive lifetime profile for this plant:
      Name: ${plant.name}
      Species: ${plant.species}
      Location: ${plant.location} (${plant.isIndoor ? 'Indoor' : 'Outdoor'})
      Plantation Date: ${plant.plantationDate}
      
      Provide:
      1. Expected lifespan.
      2. Current health status (based on the fact it was just added).
      3. Short description and basic characteristics.
      4. Full care guide (watering, sunlight, temperature, humidity, soil, repotting).
      5. Lifetime fertilizer schedule (type, seasonal guidance, quantity).
      6. Growth expectations and next repotting prediction.
      7. 3-5 specific "Smart Care Tips" for this specimen (e.g., pruning techniques, pest prevention, leaf cleaning).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expectedLifespan: { type: Type.STRING },
          healthStatus: { type: Type.STRING },
          description: { type: Type.STRING },
          smartCareTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          careRequirements: {
            type: Type.OBJECT,
            properties: {
              wateringFrequency: { type: Type.STRING },
              sunlightRequirement: { type: Type.STRING },
              idealTemperatureRange: { type: Type.STRING },
              humidityRequirement: { type: Type.STRING },
              soilType: { type: Type.STRING },
              repottingFrequency: { type: Type.STRING },
            },
            required: ["wateringFrequency", "sunlightRequirement", "idealTemperatureRange", "humidityRequirement", "soilType", "repottingFrequency"]
          },
          fertilizerSchedule: {
            type: Type.OBJECT,
            properties: {
              fertilizerType: { type: Type.STRING },
              seasonalSchedule: {
                type: Type.OBJECT,
                properties: {
                  springSummer: { type: Type.STRING },
                  monsoon: { type: Type.STRING },
                  winter: { type: Type.STRING },
                },
                required: ["springSummer", "monsoon", "winter"]
              },
              quantityGuidance: { type: Type.STRING },
            },
            required: ["fertilizerType", "seasonalSchedule", "quantityGuidance"]
          },
          futurePredictions: {
            type: Type.OBJECT,
            properties: {
              nextRepotting: { type: Type.STRING },
              seasonalTips: { type: Type.STRING },
              growthExpectations: { type: Type.STRING },
              riskAlerts: { type: Type.STRING },
            },
            required: ["nextRepotting", "seasonalTips", "growthExpectations", "riskAlerts"]
          }
        },
        required: ["expectedLifespan", "healthStatus", "description", "smartCareTips", "careRequirements", "fertilizerSchedule", "futurePredictions"]
      }
    }
  });

  return cleanJson(response.text);
};

export const diagnosePlantIssue = async (plant: Plant, issue: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Diagnose a health issue for this plant:
      Plant: ${plant.name} (${plant.species})
      Location: ${plant.location}
      Issue: ${issue}
      
      Provide a diagnosis and a recommended solution.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          solution: { type: Type.STRING }
        },
        required: ["diagnosis", "solution"]
      }
    }
  });

  return cleanJson(response.text);
};

export const chatExpert = async (history: {role: 'user' | 'model', parts: {text: string}[]}[], message: string, plantContext?: {plant: Plant, events: PlantEvent[]}) => {
  const systemInstruction = plantContext 
    ? `You are a world-class botanical expert specializing in ${plantContext.plant.species}. 
       You are currently advising on a specific specimen named "${plantContext.plant.name}" located ${plantContext.plant.location}.
       Care Requirements: ${JSON.stringify(plantContext.plant.careRequirements)}
       Recent History: ${JSON.stringify(plantContext.events.slice(-5))}
       Provide detailed, scientific, yet practical advice. Be encouraging but precise.`
    : `You are a world-class botanical expert and master gardener. 
       You provide advice on plant care, landscaping, pest control, and soil health.
       Answer questions with scientific accuracy and practical gardening wisdom.
       If the user asks about a specific plant, ask for its species and symptoms if applicable.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction
    }
  });

  return response.text;
};

export const generateFarmerInsights = async (logs: FarmerLog[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Analyze these farming logs and provide insights:
      Logs: ${JSON.stringify(logs.slice(0, 20))}
      
      Provide:
      1. Fertilizer usage analysis (efficiency, timing).
      2. Water usage tips based on irrigation logs.
      3. Cost saving suggestions based on expenses.
      4. General productivity observations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fertilizerAnalysis: { type: Type.STRING },
          waterTips: { type: Type.STRING },
          costSavingSuggestions: { type: Type.STRING },
          productivityObservations: { type: Type.STRING }
        },
        required: ["fertilizerAnalysis", "waterTips", "costSavingSuggestions", "productivityObservations"]
      }
    }
  });

  return cleanJson(response.text);
};

export const generateLandReport = async (land: { area: string, areaUnit: string, cropType: string, treesPlanted?: string, soilType?: string, location?: string }) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Generate a future farming roadmap and care solution for this land:
      Area: ${land.area} ${land.areaUnit}
      Main Crop: ${land.cropType}
      Trees/Plants already planted: ${land.treesPlanted || 'Not specified'}
      Soil Type: ${land.soilType || 'Not specified'}
      Location: ${land.location || 'Not specified'}
      
      Provide:
      1. Future watering schedule and needs.
      2. Fertilizer requirements (types and timing).
      3. Potential pest alerts and prevention.
      4. Harvest timeline prediction.
      5. General strategic advice.
      6. A step-by-step roadmap for the next 12 months.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wateringSchedule: { type: Type.STRING },
          fertilizerNeeds: { type: Type.STRING },
          pestAlerts: { type: Type.STRING },
          harvestPrediction: { type: Type.STRING },
          generalAdvice: { type: Type.STRING },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                action: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["month", "action", "details"]
            }
          }
        },
        required: ["wateringSchedule", "fertilizerNeeds", "pestAlerts", "harvestPrediction", "generalAdvice", "roadmap"]
      }
    }
  });

  return cleanJson(response.text);
};
