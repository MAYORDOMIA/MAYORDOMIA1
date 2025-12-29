
import { GoogleGenAI } from "@google/genai";
import { Transaction, Debt, FixedExpense, Budget, ShoppingListItem, StoreConfig } from "../types";

export const getBiblicalFinancialAdvice = async (
  transactions: Transaction[],
  debts: Debt[],
  fixedExpenses: FixedExpense[],
  budgets: Budget[],
  userQuery: string
): Promise<string> => {
  // Always initialize GoogleGenAI with the API key directly from process.env.API_KEY.
  // Using 'gemini-3-flash-preview' as the default model for basic text counseling tasks.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebt = debts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const systemInstruction = `
    Eres un consejero financiero sabio y empático que basa sus consejos en principios bíblicos.
    Ayuda al usuario a administrar con prudencia. Tono alentador y bíblico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Consulta: ${userQuery}. Deuda total: ${totalDebt}. Gastos fijos: ${totalFixed}.`,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    // Access response text as a property, not a method.
    return response.text || "No pude generar consejo.";
  } catch (error) {
    console.error("Error en consejero:", error);
    return "Error al conectar con el consejero. Verifica tu conexión.";
  }
};

export const getShoppingPriceComparison = async (
  items: ShoppingListItem[],
  stores: StoreConfig[]
): Promise<any> => {
  // Always initialize GoogleGenAI with the API key directly from process.env.API_KEY.
  // 'gemini-3-flash-preview' supports the googleSearch tool for grounding.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const itemsList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
  const storesContext = stores.map(s => `${s.name} (${s.url})`).join(", ");

  const prompt = `
    Actúa como un experto en compras inteligentes. 
    Analiza esta lista de compras: [${itemsList}].
    BUSCA precios reales y actualizados en estas webs: [${storesContext}].
    
    Devuelve la respuesta EXCLUSIVAMENTE en formato JSON con esta estructura:
    {
      "items": [
        {
          "name": "nombre del producto",
          "suggestions": [
            {"store": "Tienda A", "price": 1200.50, "url": "enlace"},
            {"store": "Tienda B", "price": 1250.00, "url": "enlace"}
          ]
        }
      ],
      "totalEstimated": 15000.00,
      "biblicalTip": "Un versículo breve sobre ahorro"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    // Access response text as a property.
    const text = response.text || "";
    
    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Fallo al parsear JSON, usando estructura de emergencia.", e);
      data = { 
        items: items.map(i => ({ name: i.name, suggestions: [{ store: "Buscando...", price: 0, url: "#" }] })), 
        totalEstimated: 0, 
        biblicalTip: "La hormiga, pueblo no fuerte, prepara su comida en el verano (Prov 30:25)." 
      };
    }
    
    // Extract grounding sources for the UI as required when using search grounding.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && data) {
      data.searchSources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || 'Fuente web',
          uri: chunk.web?.uri
        }));
    }

    return data;
  } catch (error: any) {
    console.error("Error en Gemini Search:", error);
    throw error;
  }
};
