
import { GoogleGenAI } from "@google/genai";
import { Transaction, Debt, FixedExpense, Budget, ShoppingListItem, StoreConfig } from "../types";

export const getBiblicalFinancialAdvice = async (
  transactions: Transaction[],
  debts: Debt[],
  fixedExpenses: FixedExpense[],
  budgets: Budget[],
  userQuery: string
): Promise<string> => {
  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebt = debts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const systemInstruction = `
    Eres un consejero financiero sabio y empático que basa sus consejos en principios bíblicos.
    Ayuda al usuario a administrar con prudencia. Tono alentador y bíblico.
  `;

  // Always initialize client inside the function using process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Consulta: ${userQuery}. Deuda total: ${totalDebt}. Gastos fijos: ${totalFixed}.`,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || "No pude generar consejo.";
  } catch (error) {
    return "Error al conectar con el consejero.";
  }
};

export const getShoppingPriceComparison = async (
  items: ShoppingListItem[],
  stores: StoreConfig[]
): Promise<any> => {
  const itemsList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
  const storesContext = stores.map(s => `${s.name} (${s.url})`).join(", ");

  const prompt = `
    Actúa como un experto en compras inteligentes. 
    Analiza la siguiente lista de compras: [${itemsList}].
    Busca los precios más actualizados en estas webs de supermercados: [${storesContext}].
    
    Para cada producto de la lista, devuélveme:
    1. Los 2 mejores precios encontrados (indicando el supermercado).
    2. El precio total estimado de la compra completa si se compra lo más barato.
    
    Responde en formato JSON puro con esta estructura:
    {
      "items": [
        {
          "name": "nombre del producto",
          "suggestions": [
            {"store": "Supermercado A", "price": 1200.50, "url": "link al producto"},
            {"store": "Supermercado B", "price": 1250.00, "url": "link al producto"}
          ]
        }
      ],
      "totalEstimated": 15000.00,
      "biblicalTip": "Un versículo breve sobre la diligencia y el ahorro"
    }
  `;

  // Always initialize client inside the function using process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    // Extract grounding sources as required by guidelines when using googleSearch
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const data = JSON.parse(response.text || "{}");
    
    // Enrich response data with search sources for UI display
    if (groundingChunks) {
      data.searchSources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return data;
  } catch (error) {
    console.error("Error comparando precios:", error);
    throw error;
  }
};
