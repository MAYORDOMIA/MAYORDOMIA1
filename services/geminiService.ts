import { GoogleGenAI } from "@google/genai";
import { Transaction, Debt, FixedExpense, Budget } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBiblicalFinancialAdvice = async (
  transactions: Transaction[],
  debts: Debt[],
  fixedExpenses: FixedExpense[],
  budgets: Budget[],
  userQuery: string
): Promise<string> => {
  
  // Calculate summary for context
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebt = debts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  // Get current or upcoming budget
  const today = new Date();
  const currentMonthId = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const budget = budgets.find(b => b.id === currentMonthId);

  let budgetContext = "No hay presupuesto definido para este mes.";
  if (budget) {
      budgetContext = `Presupuesto del mes actual: Ingresos estimados $${budget.estimatedIncome}, Gasto planificado total: $${Object.values(budget.allocations).reduce((a,b)=>a+b,0)}.`;
  }

  const context = `
    Contexto Financiero del Usuario:
    - Ingresos Totales (Histórico): $${totalIncome}
    - Gastos Variables Totales (Histórico): $${totalExpense}
    - Gastos Fijos Mensuales (Comprometidos): $${totalFixed}
    - Deuda Total: $${totalDebt}
    - Número de deudas: ${debts.length}
    - Presupuesto Actual: ${budgetContext}
  `;

  const systemInstruction = `
    Eres un consejero financiero sabio y empático que basa sus consejos en principios bíblicos (Mayordomía, Contentamiento, Generosidad, Prudencia, No deber nada a nadie salvo amor).
    
    Tu objetivo es ayudar al usuario a ordenar sus finanzas y salir de deudas.
    1. Usa un tono alentador pero firme en la verdad.
    2. Cita versículos bíblicos relevantes (Reina Valera 1960 o NVI) para respaldar tus consejos.
    3. Si el usuario tiene deudas, sugiere el método de "Bola de Nieve" o "Avalancha".
    4. Considera sus GASTOS FIJOS ($${totalFixed}/mes) y su PRESUPUESTO si lo tiene.
    5. Anima al usuario a apegarse a su presupuesto si lo tiene.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context}\n\nPregunta del usuario: ${userQuery || "Analiza mi situación actual y dame un consejo bíblico general."}`,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Lo siento, no pude generar un consejo en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Hubo un error al conectar con el consejero virtual. Por favor intenta más tarde.";
  }
};