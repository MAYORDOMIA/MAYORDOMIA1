
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
      alert(`Error en la IA: ${err.message || "No se pudo conectar"}.`);
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
          LISTA
        </button>
        <button 
          onClick={() => setActiveTab('STORES')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'STORES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          TIENDAS
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="px-4 md:px-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-5 uppercase tracking-tighter">MANDADO</h2>
            
            <form onSubmit={addItem} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Añadir producto..." 
                className="flex-1 px-4 py-4 border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xl shadow-lg active:scale-90 transition-all">+</button>
            </form>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100" onClick={() => toggleItem(item.id)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`text-[10px] font-black px-2 py-1 rounded ${item.checked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {item.checked ? 'OK' : '...'}
                    </span>
                    <span className={`font-bold text-sm truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-[9px] font-black text-rose-400 uppercase tracking-widest p-2">BORRAR</button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-12">
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Lista Vacía</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleOptimize} 
            disabled={loading || items.length === 0} 
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? "PROCESANDO..." : "OPTIMIZAR CON IA"}
          </button>

          {results && (
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-indigo-100 space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Precios Reales</h3>
              </div>
              
              <div className="space-y-4">
                {results.items.map((res: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-black text-[9px] text-slate-400 uppercase tracking-widest mb-3">{res.name}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {res.suggestions.map((s: any, sIdx: number) => (
                        <a key={sIdx} href={s.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 transition-colors group">
                          <span className="text-[10px] font-black text-slate-700 uppercase">{s.store}</span>
                          <span className="text-xs font-black text-indigo-600">${s.price.toLocaleString()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="p-6 bg-slate-900 text-white rounded-3xl text-center shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">TOTAL ESTIMADO</span>
                  <span className="text-3xl font-black text-emerald-400">${results.totalEstimated.toLocaleString()}</span>
                </div>

                {/* Fix: Displaying website sources from Gemini Search grounding as required by guidelines */}
                {results.searchSources && results.searchSources.length > 0 && (
                  <div className="pt-6 mt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fuentes de la Web:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.searchSources.map((source: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[10px] rounded-lg hover:bg-indigo-100 transition-colors truncate max-w-full"
                        >
                          {source.title}
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
            <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">TIENDAS</h2>
            
            <form onSubmit={addStore} className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Nombre de tienda" 
                required
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
              />
              <input 
                type="url" 
                placeholder="URL (opcional)" 
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                value={newStoreUrl}
                onChange={(e) => setNewStoreUrl(e.target.value)}
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-lg uppercase tracking-widest">Añadir Tienda</button>
            </form>

            <div className="space-y-3">
              {stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-black text-[10px] text-slate-800 uppercase tracking-tight">{store.name}</span>
                  <button onClick={() => removeStore(store.id)} className="text-[9px] font-black text-rose-400 uppercase tracking-widest">QUITAR</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
