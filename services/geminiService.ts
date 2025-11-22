import { GoogleGenAI } from "@google/genai";
import { AlarmLog } from "../types";

export const analyzeAlarms = async (alarms: AlarmLog[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const recentAlarms = alarms.slice(0, 20); // Analyze last 20 alarms
  
  if (recentAlarms.length === 0) {
    return "No alarms to analyze. The system is running smoothly.";
  }

  const alarmData = JSON.stringify(recentAlarms, null, 2);

  const prompt = `
    You are an industrial automation expert analyzing an error log from an ibaPDA system.
    Analyze the following JSON alarm history:
    ${alarmData}

    Please provide a concise Root Cause Analysis (RCA) in Markdown format.
    1. Identify the most frequent alarms.
    2. Look for correlations (e.g., did high speed cause high vibration?).
    3. Recommend immediate maintenance actions.
    Keep the tone professional and technical.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Error: Could not contact AI service for analysis.";
  }
};