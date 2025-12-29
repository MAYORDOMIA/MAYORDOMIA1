
import React, { useState, useEffect } from 'react';
import { ShoppingListItem, StoreConfig } from '../types';
import { getShoppingPriceComparison } from '../services/geminiService';

export const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [stores, setStores] = useState<StoreConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'LIST' | 'STORES'>('LIST');
  
  const [newItemName, setNewItemName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreUrl, setNewStoreUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('shopping_items');
    const savedStores = localStorage.getItem('shopping_stores');
    if (savedItems) setItems(JSON.parse(savedItems));
    
    if (savedStores) {
      setStores(JSON.parse(savedStores));
    } else {
      const defaults = [
        { id: '1', name: 'Supermercado General', url: 'https://www.google.com/search?q=precios+supermercado' }
      ];
      setStores(defaults);
    }
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
    if (!newStoreName.trim() || !newStoreUrl.trim()) return;
    const newStore: StoreConfig = {
      id: crypto.randomUUID(),
      name: newStoreName,
      url: newStoreUrl
    };
    setStores([...stores, newStore]);
    setNewStoreName('');
    setNewStoreUrl('');
  };

  const removeStore = (id: string) => setStores(stores.filter(s => s.id !== id));

  const handleOptimize = async () => {
    if (items.length === 0 || stores.length === 0) {
      alert("Añade productos a la lista y configura tus tiendas primero.");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const data = await getShoppingPriceComparison(items, stores);
      setResults(data);
      setActiveTab('LIST');
    } catch (err: any) {
      console.error(err);
      alert(`Error en la IA: ${err.message || "No se pudo conectar"}. Si estás en Vercel, verifica que la API_KEY esté configurada.`);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const toggleItem = (id: string) => setItems(items.map(i => i.id === id ? {...i, checked: !i.checked} : i));

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1 mx-4 md:mx-0">
        <button 
          onClick={() => setActiveTab('LIST')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Mi Lista
        </button>
        <button 
          onClick={() => setActiveTab('STORES')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'STORES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Tiendas ({stores.length})
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="px-4 md:px-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              Mandado
            </h2>
            
            <form onSubmit={addItem} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Ej: Leche deslactosada" 
                className="flex-1 px-4 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 text-white px-5 py-4 rounded-2xl font-black text-xl shadow-lg shadow-indigo-100 active:scale-90 transition-all">+</button>
            </form>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 active:bg-slate-100 transition-colors" onClick={() => toggleItem(item.id)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                      {item.checked && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`font-bold text-sm truncate ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>{item.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-slate-300 hover:text-rose-500 p-2 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                   </div>
                   <p className="text-slate-400 text-sm font-medium">¿Qué falta en la alacena?</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleOptimize} 
            disabled={loading || items.length === 0} 
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50 border-b-4 border-slate-700"
          >
            {loading ? <div className="w-6 h-6 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : "Optimizar con IA"}
          </button>

          {results && (
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-indigo-100 space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800">Comparativa Real</h3>
                <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Powered by Gemini</span>
              </div>
              
              <div className="space-y-4">
                {results.items.map((res: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-3">{res.name}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {res.suggestions.map((s: any, sIdx: number) => (
                        <a key={sIdx} href={s.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 active:bg-indigo-50 transition-colors group">
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">{s.store}</span>
                            <p className="text-[8px] text-slate-400 truncate">Ver producto ↗</p>
                          </div>
                          <span className="text-sm font-black text-indigo-600">${s.price.toLocaleString()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="p-6 bg-slate-900 text-white rounded-3xl text-center shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total del Mandado</span>
                  <span className="text-3xl font-black text-emerald-400">${results.totalEstimated.toLocaleString()}</span>
                </div>
                
                {results.biblicalTip && (
                  <div className="p-4 bg-amber-50 rounded-2xl text-amber-900 text-xs font-medium italic border border-amber-100 flex gap-3">
                    <svg className="w-5 h-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg>
                    "{results.biblicalTip}"
                  </div>
                )}

                {results.searchSources && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Páginas consultadas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {results.searchSources.map((source: any, i: number) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold truncate max-w-[150px] border border-indigo-100">
                          {source.title || 'Referencia'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'STORES' && (
        <div className="px-4 md:px-0 space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-2">Mis Supermercados</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">Configura los sitios donde sueles comprar para que la IA sepa dónde buscar ofertas.</p>
            
            <form onSubmit={addStore} className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Nombre (ej: Walmart, Carrefour)" 
                required
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
              />
              <input 
                type="url" 
                placeholder="https://tienda.com" 
                required
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newStoreUrl}
                onChange={(e) => setNewStoreUrl(e.target.value)}
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest">Añadir Tienda</button>
            </form>

            <div className="space-y-3">
              {stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <div className="overflow-hidden">
                    <p className="font-black text-sm text-slate-800 truncate">{store.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-medium">{store.url}</p>
                  </div>
                  <button onClick={() => removeStore(store.id)} className="text-slate-300 hover:text-rose-500 p-2 shrink-0 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {stores.length === 0 && (
                <div className="text-center py-10">
                   <p className="text-slate-300 italic text-sm font-medium">Usa la búsqueda general por defecto.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
