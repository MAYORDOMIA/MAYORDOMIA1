
import React, { useState, useEffect } from 'react';
import { ShoppingListItem, StoreConfig } from '../types';
import { getShoppingPriceComparison } from '../services/geminiService';

export const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [stores, setStores] = useState<StoreConfig[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreUrl, setNewStoreUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Cargar desde localStorage para persistencia rápida
  useEffect(() => {
    const savedItems = localStorage.getItem('shopping_items');
    const savedStores = localStorage.getItem('shopping_stores');
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedStores) setStores(JSON.parse(savedStores));
  }, []);

  useEffect(() => {
    localStorage.setItem('shopping_items', JSON.stringify(items));
    localStorage.setItem('shopping_stores', JSON.stringify(stores));
  }, [items, stores]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      name: newItemName,
      quantity: 1,
      checked: false
    };
    setItems([...items, newItem]);
    setNewItemName('');
  };

  const addStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreUrl) return;
    const newStore: StoreConfig = {
      id: crypto.randomUUID(),
      name: newStoreName,
      url: newStoreUrl
    };
    setStores([...stores, newStore]);
    setNewStoreName('');
    setNewStoreUrl('');
  };

  const handleOptimize = async () => {
    if (items.length === 0 || stores.length === 0) {
      alert("Necesitas al menos un producto y un supermercado configurado.");
      return;
    }
    setLoading(true);
    try {
      const data = await getShoppingPriceComparison(items, stores);
      setResults(data);
    } catch (err) {
      alert("Error consultando precios. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const toggleItem = (id: string) => setItems(items.map(i => i.id === id ? {...i, checked: !i.checked} : i));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-20 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Lista de Compras
          </h2>
          
          <form onSubmit={addItem} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Ej: Azúcar, Leche..." 
              className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">+</button>
          </form>

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} className="w-5 h-5 accent-indigo-600" />
                  <span className={`${item.checked ? 'line-through text-slate-400' : 'text-slate-700'} font-medium`}>{item.name}</span>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="text-center text-slate-400 py-10">Tu lista está vacía.</p>}
          </div>
        </div>

        {results && (
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-100 animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Mejores Precios Encontrados</h3>
            <div className="space-y-4">
              {results.items.map((res: any, idx: number) => (
                <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="font-bold text-slate-700 mb-1">{res.name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {res.suggestions.map((s: any, sIdx: number) => (
                      <a key={sIdx} href={s.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-2 bg-emerald-50 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors">
                        <span className="text-xs font-medium text-emerald-800">{s.store}</span>
                        <span className="text-sm font-bold text-emerald-600">${s.price.toLocaleString()}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Displaying Search Grounding URLs as required by guidelines */}
              {results.searchSources && results.searchSources.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Fuentes consultadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {results.searchSources.map((source: any, sIdx: number) => (
                      <a key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline bg-white border border-indigo-100 px-2 py-1 rounded shadow-sm">
                        {source.title || source.uri}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                <span className="font-medium">Total Estimado (Ahorro Máximo):</span>
                <span className="text-2xl font-bold text-emerald-400">${results.totalEstimated.toLocaleString()}</span>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs italic">
                "{results.biblicalTip}"
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Supermercados a Comparar</h3>
          <form onSubmit={addStore} className="space-y-3 mb-6">
            <input 
              type="text" 
              placeholder="Nombre (ej: Carrefour)" 
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
            />
            <input 
              type="url" 
              placeholder="Web (ej: https://...)" 
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              value={newStoreUrl}
              onChange={(e) => setNewStoreUrl(e.target.value)}
            />
            <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold">Añadir Super</button>
          </form>

          <div className="space-y-2">
            {stores.map(store => (
              <div key={store.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{store.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{store.url}</p>
                </div>
                <button onClick={() => setStores(stores.filter(s => s.id !== store.id))} className="text-slate-300 hover:text-rose-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleOptimize}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Buscando ofertas...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Comparar Precios IA
            </>
          )}
        </button>
      </div>
    </div>
  );
};
