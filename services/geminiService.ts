import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, GeneratedPlan } from "../types";

const mapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Uma visão geral motivadora e estratégica do plano semanal para o usuário.",
    },
    nutritionalStrategy: {
      type: Type.STRING,
      description: "Explicação da estratégia nutricional adotada (ex: foco em proteínas, baixo índice glicêmico).",
    },
    sideEffectManagement: {
      type: Type.STRING,
      description: "Dicas de bem-estar, digestão e energia.",
    },
    dailyPlans: {
      type: Type.ARRAY,
      description: "Plano detalhado para 7 dias.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "Nome do dia (ex: Segunda-feira)" },
          theme: { type: Type.STRING, description: "Foco do dia (ex: Recuperação, Alta Proteína)" },
          totalCalories: { type: Type.INTEGER, description: "Soma total de calorias de todas as refeições do dia." },
          hydrationTip: { type: Type.STRING, description: "Dica específica de hidratação para o dia" },
          exerciseSuggestion: { type: Type.STRING, description: "Sugestão de atividade física compatível" },
          breakfast: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.STRING },
            },
            required: ["name", "description", "calories", "protein"]
          },
          lunch: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.STRING },
            },
            required: ["name", "description", "calories", "protein"]
          },
          snack: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.STRING },
            },
            required: ["name", "description", "calories", "protein"]
          },
          dinner: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.STRING },
            },
            required: ["name", "description", "calories", "protein"]
          },
        },
        required: ["day", "theme", "totalCalories", "breakfast", "lunch", "snack", "dinner", "hydrationTip", "exerciseSuggestion"],
      },
    },
  },
  required: ["summary", "dailyPlans", "nutritionalStrategy", "sideEffectManagement"],
};

export const generateDietPlan = async (userProfile: UserProfile): Promise<GeneratedPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Aja como um nutricionista clínico de elite e treinador de estilo de vida focado em emagrecimento de alta performance e reeducação alimentar.
    
    Crie um plano semanal altamente personalizado para o seguinte cliente:
    
    Nome: ${userProfile.name}
    Idade: ${userProfile.age}
    Gênero: ${userProfile.gender}
    Altura: ${userProfile.height} cm
    Peso Atual: ${userProfile.currentWeight} kg
    Peso Meta: ${userProfile.goalWeight} kg
    Nível de Atividade: ${userProfile.activityLevel}
    Objetivo Principal: ${userProfile.goal}
    Restrições Alimentares: ${userProfile.dietaryRestrictions || "Nenhuma"}
    
    DIRETRIZES IMPORTANTES:
    1. Calcule e inclua o TOTAL DE CALORIAS DIÁRIAS (totalCalories) para cada dia, garantindo que esteja adequado ao objetivo de peso do usuário.
    2. Priorize a ingestão de proteínas para manutenção de massa magra.
    3. Foco total em hidratação e qualidade dos alimentos.
    4. As refeições devem ser ricas em nutrientes (densidade nutritiva) e fibras para saúde intestinal.
    5. O plano deve ser natural e sustentável.
    6. O tom deve ser profissional, encorajador e objetivo.
    7. NÃO mencione uso de medicamentos, injeções ou fármacos específicos. Foque apenas na nutrição e hábitos.
    8. Retorne tudo em PORTUGUÊS DO BRASIL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mapSchema,
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("No response text generated");
    }

    // Bug Fix: Remove markdown code blocks if present (common LLM behavior)
    // Sometimes the model returns ```json ... ``` even if mimeType is set
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    
    return JSON.parse(text) as GeneratedPlan;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar o plano. Por favor, tente novamente.");
  }
};