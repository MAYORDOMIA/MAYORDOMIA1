
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Consulta: ${userQuery}. Deuda total: ${totalDebt}. Gastos fijos: ${totalFixed}.`,
      config: {
        systemInstruction: systemInstruction,
      }
    });
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
        // Nota: No usamos responseMimeType aquí porque googleSearch genera metadatos que rompen el JSON estricto
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const text = response.text || "";
    
    // Extractor robusto de JSON
    let data;
    try {
      // Intentamos encontrar el bloque de JSON en la respuesta si el modelo puso texto extra
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
    
    // Agregar fuentes de búsqueda (Requerido por guías)
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
    // Si es un error de API Key no configurada en Vercel
    if (error.message?.includes("API_KEY")) {
      throw new Error("API Key no configurada en el servidor.");
    }
    throw error;
  }
};
