
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
    
    // Default stores if none exist
    if (savedStores) {
      setStores(JSON.parse(savedStores));
    } else {
      const defaults = [
        { id: '1', name: 'Supermercado A', url: 'https://supermercado-ejemplo.com' }
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
      alert("Configura al menos un producto y un supermercado.");
      return;
    }
    setLoading(true);
    try {
      const data = await getShoppingPriceComparison(items, stores);
      setResults(data);
      setActiveTab('LIST'); // Vuelve a la lista para ver resultados
    } catch (err) {
      alert("Error en la consulta IA.");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const toggleItem = (id: string) => setItems(items.map(i => i.id === id ? {...i, checked: !i.checked} : i));

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      {/* Tabs for mobile efficiency */}
      <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
        <button 
          onClick={() => setActiveTab('LIST')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Mi Lista
        </button>
        <button 
          onClick={() => setActiveTab('STORES')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'STORES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Mis Tiendas ({stores.length})
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              Lista de Compras
            </h2>
            
            <form onSubmit={addItem} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="¿Qué necesitas?" 
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-black text-lg active:scale-95 transition-transform">+</button>
            </form>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 active:bg-slate-100 transition-colors" onClick={() => toggleItem(item.id)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                      {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`font-bold text-sm truncate ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>{item.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-slate-300 hover:text-rose-500 p-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {items.length === 0 && <div className="text-center py-10 text-slate-300 italic text-sm">Empieza tu lista de hoy</div>}
            </div>
          </div>

          <button onClick={handleOptimize} disabled={loading || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Optimizar con IA"}
          </button>

          {results && (
            <div className="bg-white p-5 rounded-2xl shadow-xl border-2 border-indigo-100 space-y-5 animate-fade-in-up">
              <h3 className="text-lg font-black text-slate-800">Comparativa de IA</h3>
              <div className="space-y-4">
                {results.items.map((res: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-2">{res.name}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {res.suggestions.map((s: any, sIdx: number) => (
                        <a key={sIdx} href={s.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 active:scale-95 transition-transform">
                          <span className="text-xs font-bold text-slate-600 truncate mr-2">{s.store}</span>
                          <span className="text-sm font-black text-indigo-600 shrink-0">${s.price.toLocaleString()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total Estimado</span>
                  <span className="text-2xl font-black text-emerald-400">${results.totalEstimated.toLocaleString()}</span>
                </div>
                
                {results.biblicalTip && (
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-[11px] font-medium italic border border-amber-100">
                    "{results.biblicalTip}"
                  </div>
                )}

                {results.searchSources && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuentes:</p>
                    <div className="flex flex-wrap gap-1">
                      {results.searchSources.map((source: any, i: number) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-slate-100 text-indigo-600 px-2 py-1 rounded truncate max-w-[120px]">{source.title || 'Fuente'}</a>
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
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-2">Mis Supermercados</h2>
            <p className="text-xs text-slate-400 mb-6">Añade las webs de tus tiendas favoritas para que la IA busque precios allí.</p>
            
            <form onSubmit={addStore} className="space-y-3 mb-8">
              <input 
                type="text" 
                placeholder="Nombre (ej: Walmart)" 
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
              />
              <input 
                type="url" 
                placeholder="Sitio Web (https://...)" 
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm"
                value={newStoreUrl}
                onChange={(e) => setNewStoreUrl(e.target.value)}
              />
              <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-sm active:scale-95 transition-transform uppercase tracking-widest">Añadir Tienda</button>
            </form>

            <div className="space-y-3">
              {stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="overflow-hidden">
                    <p className="font-black text-sm text-slate-800 truncate">{store.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{store.url}</p>
                  </div>
                  <button onClick={() => removeStore(store.id)} className="text-slate-300 hover:text-rose-500 p-2 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {stores.length === 0 && <div className="text-center py-10 text-slate-300 italic text-sm">No has configurado tiendas</div>}
            </div>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
              CONSEJO: Mientras más específica sea la URL (ej: la sección de "Precios"), mejores resultados obtendrás de la IA.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
