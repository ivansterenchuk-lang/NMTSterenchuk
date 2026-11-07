import React from 'react';

export default function CommunitySearch({ 
  tests, query, onQueryChange, onImport, onAssign, onAddToBasket, onView
}: any) {
  
  const filteredTests = (tests || []).filter((t: any) => {
    if (!t) return false;
    const searchStr = (query || '').toLowerCase().trim();
    if (!searchStr) return true;

    const matchTitle = (t.title || '').toLowerCase().includes(searchStr);
    const matchAuthor = (t.author || '').toLowerCase().includes(searchStr);
    const matchSubject = (t.subject || '').toLowerCase().includes(searchStr);
    
    const matchTags = Array.isArray(t.tags) && t.tags.some((tag: any) => {
      const label = typeof tag === 'string' ? tag : (tag?.label || tag?.name || '');
      return label.toLowerCase().includes(searchStr);
    });

    return matchTitle || matchAuthor || matchSubject || matchTags;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Загальна база тестів</h2>
          <p className="text-xs text-slate-400 mt-1">Знайдено {filteredTests.length} тестів (натисніть на картку, щоб переглянути питання)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Пошук за назвою, автором або тегом..."
            value={query || ''}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-500 border border-slate-800 rounded-2xl">
            Нічого не знайдено. Спробуйте інший запит.
          </div>
        )}
        
        {filteredTests.map((test: any) => (
          <div 
            key={test.id} 
            onClick={() => onView && onView(test)}
            className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white leading-tight group-hover:text-indigo-400 transition">{test.title || 'Без назви'}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md shrink-0 ml-2">{test.subject || 'Предмет'}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Автор: {test.author || 'Невідомий'}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(test.tags) && test.tags.map((tag: any, i: number) => {
                  const label = typeof tag === 'string' ? tag : (tag?.label || tag?.name || 'Тег');
                  return (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-300 rounded-md">
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800/60">
              <button 
                onClick={(e) => { e.stopPropagation(); onImport(test); }} 
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                Копіювати собі
              </button>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onAssign(test); }} 
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Призначити
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddToBasket(test.questions || []); }} 
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition"
                >
                  + Збірка
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}