import { GoogleGenAI, Type } from "@google/genai";
import { Plant, PlantEvent, FarmerLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const generatePlantProfile = async (plant: Partial<Plant>) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
      6. Growth expectations and next repotting prediction.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expectedLifespan: { type: Type.STRING },
          healthStatus: { type: Type.STRING },
          description: { type: Type.STRING },
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
        required: ["expectedLifespan", "healthStatus", "description", "careRequirements", "fertilizerSchedule", "futurePredictions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const diagnosePlantIssue = async (plant: Plant, issue: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  return JSON.parse(response.text);
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
    model: "gemini-3.1-pro-preview",
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction
    }
  });

  return response.text;
};

export const generateFarmerInsights = async (logs: FarmerLog[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  return JSON.parse(response.text);
};
