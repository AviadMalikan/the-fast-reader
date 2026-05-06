import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, RotateCcw, Type, Upload, Plus, Minus, BookOpen, Maximize, X, MousePointer2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// רכיב מילה אופטימלי - ללא מרווחים (ml-0)
const Word = React.memo(({ word, index, isCurrent, isPast }) => {
  return (
    <span
      id={`word-${index}`}
      className={`inline-block ml-0 px-0.5 rounded transition-colors duration-100 ${
        isCurrent 
        ? 'bg-blue-600 text-white shadow-md z-10' 
        : isPast ? 'text-gray-600' : 'text-gray-200'
      }`}
    >
      {"\u200F" + word}
    </span>
  );
});

export default function HebrewSpeed() {
  const [activeTab, setActiveTab] = useState('pacer');
  const [draftText, setDraftText] = useState("");
  const [activeText, setActiveText] = useState("");
  const [allWords, setAllWords] = useState([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(400); 
  const [fontSize, setFontSize] = useState(16); 
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // עדכון טקסט - ניקוי והכנה
  const handleUpdateContent = useCallback(() => {
    if (!draftText.trim()) return;

    // ניקוי רווחים כפולים אך שמירה על ירידות שורה בודדות
    const cleaned = draftText
      .replace(/[ \t]+/g, ' ') // החלפת טאבים ורווחים כפולים ברווח אחד
      .replace(/ +([.,!?;:])/g, '$1') // הצמדת פיסוק
      .trim();
    
    setActiveText(cleaned);
    
    // יצירת רשימת מילים נקייה (ללא תלות במבנה השורות) עבור המנוע
    const wordsArray = cleaned.split(/\s+/).filter(w => w.length > 0);
    setAllWords(wordsArray);
    
    setCurrentIndex(0);
    setIsPlaying(false);
    setWpm(400); 
  }, [draftText]);

  // מנוע הקצב - אחיד לחלוטין ללא השהיות בין שורות
  useEffect(() => {
    if (isPlaying && currentIndex < allWords.length) {
      const delay = 60000 / wpm; 
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
    } else {
      clearTimeout(timerRef.current);
      if (currentIndex >= allWords.length && allWords.length > 0) {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, wpm, allWords.length]);

  // גלילה אוטומטית (רק במצב רגיל)
  useEffect(() => {
    if (activeTab === 'pacer' && containerRef.current && !isFocusMode) {
      const el = document.getElementById(`word-${currentIndex}`);
      if (el) {
        const container = containerRef.current;
        const targetScroll = el.offsetTop - 80;
        container.scrollTo({ top: targetScroll, behavior: currentIndex % 5 === 0 ? 'smooth' : 'auto' });
      }
    }
  }, [currentIndex, activeTab, isFocusMode]);

  // רינדור הטקסט עם הצמדה לאינדקס גלובלי ללא דילוגים
  const pacerContent = useMemo(() => {
    let globalWordIdx = 0;
    const lines = activeText.split('\n');

    return lines.map((line, lIdx) => {
      const wordsInLine = line.split(/[ \t]+/).filter(w => w.length > 0);
      if (wordsInLine.length === 0 && line.length === 0) return <div key={lIdx} className="h-4" />; // שורה ריקה

      return (
        <div key={lIdx} className="mb-0 leading-tight">
          {wordsInLine.map((word, wIdx) => {
            const currentIdx = globalWordIdx;
            globalWordIdx++; // קידום האינדקס רק עבור מילים אמיתיות
            return (
              <Word 
                key={currentIdx} 
                word={word} 
                index={currentIdx} 
                isCurrent={currentIdx === currentIndex} 
                isPast={currentIdx < currentIndex} 
              />
            );
          })}
        </div>
      );
    });
  }, [activeText, currentIndex]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Assistant',_sans-serif] select-none flex flex-col" dir="rtl">
      
      {/* מצב מסך מלא - ללא גלילה אוטומטית */}
      {isFocusMode && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in overflow-hidden">
          <div className="p-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center shrink-0">
            <ControlGroup 
              wpm={wpm} setWpm={setWpm} 
              fontSize={fontSize} setFontSize={setFontSize} 
              isPlaying={isPlaying} setIsPlaying={setIsPlaying}
              stats={{total: allWords.length, remaining: Math.max(0, allWords.length - currentIndex)}}
            />
            <button onClick={() => setIsFocusMode(false)} className="p-3 text-gray-400 hover:text-white transition-colors"><X size={28}/></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-24 py-10 pb-[40vh]" style={{ fontSize: `${fontSize}px` }}>
            {activeTab === 'pacer' ? pacerContent : (
               <div className="h-full flex items-center justify-center text-6xl md:text-9xl font-black">
                  {"\u200F" + (allWords[currentIndex] || "")}
               </div>
            )}
          </div>
        </div>
      )}

      {/* תפריט עליון */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="text-lg md:text-xl font-black text-blue-500 tracking-tighter">HEBREW SPEED</div>
          <div className="flex gap-1 bg-black p-1 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('pacer')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pacer' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>PACER</button>
            <button onClick={() => setActiveTab('reader')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'reader' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>RSVP</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full p-3 md:p-6 space-y-4 flex-1">
        
        {/* פאנל בקרה */}
        <div className="sticky top-[56px] md:top-20 z-40 bg-gray-900/95 p-3 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
          <ControlGroup 
            wpm={wpm} setWpm={setWpm} 
            fontSize={fontSize} setFontSize={setFontSize} 
            isPlaying={isPlaying} setIsPlaying={setIsPlaying}
            stats={{total: allWords.length, remaining: Math.max(0, allWords.length - currentIndex)}}
          />
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end border-t md:border-0 border-gray-800 pt-2 md:pt-0">
            <button onClick={() => setCurrentIndex(0)} className="p-2 text-gray-500 hover:text-white flex items-center gap-1 text-xs"><RotateCcw size={16}/> איפוס</button>
            <button onClick={() => setIsFocusMode(true)} className="p-2 text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold"><Maximize size={16}/> מסך מלא</button>
          </div>
        </div>

        {/* תצוגה */}
        <div 
          ref={containerRef}
          className="bg-gray-900/40 rounded-3xl border border-gray-800 p-6 md:p-12 h-[50vh] md:h-[550px] overflow-y-auto shadow-inner relative custom-scrollbar pb-[45vh]"
          style={{ fontSize: `${fontSize}px` }}
        >
          {allWords.length > 0 ? (
            activeTab === 'pacer' ? pacerContent : (
              <div className="h-full flex items-center justify-center text-7xl md:text-9xl font-black">
                {"\u200F" + (allWords[currentIndex] || "")}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-800 italic font-bold">
              הזן טקסט למטה ולחץ על "עדכן טקסט"
            </div>
          )}
        </div>

        {/* הזנת טקסט */}
        <div className="bg-gray-900 p-4 md:p-6 rounded-3xl border border-gray-800 space-y-4 shadow-xl">
          <textarea 
            className="w-full h-36 md:h-44 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-blue-600 outline-none resize-none transition-all text-gray-200"
            placeholder="הדבק כאן תוכן חדש..."
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          ></textarea>

          <button 
            onClick={handleUpdateContent}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-md transition-all flex items-center justify-center gap-3 shadow-lg group active:scale-95"
          >
            <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
            עדכן טקסט והתחל ב-400 WPM
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        @media (max-width: 768px) { .custom-scrollbar { scrollbar-width: none; } }
      `}} />
    </div>
  );
}

function ControlGroup({ wpm, setWpm, fontSize, setFontSize, isPlaying, setIsPlaying, stats }) {
  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-6 justify-center md:justify-start">
      <button 
        onClick={() => setIsPlaying(!isPlaying)} 
        className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs transition-all shrink-0 ${isPlaying ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white shadow-md shadow-blue-900/30'}`}
      >
        {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
        <span>{isPlaying ? 'השהה' : 'נגן'}</span>
      </button>

      <div className="flex items-center gap-2 border-r border-gray-800 pr-3 shrink-0">
        <span className="text-[9px] font-black text-gray-600 uppercase">מהירות</span>
        <div className="flex items-center bg-black rounded-lg border border-gray-800">
          <button onClick={() => setWpm(p => Math.max(50, p - 50))} className="p-2 md:p-1.5 hover:text-red-400"><Minus size={14}/></button>
          <span className="w-10 md:w-12 text-center font-bold text-xs text-blue-400">{wpm}</span>
          <button onClick={() => setWpm(p => p + 50)} className="p-2 md:p-1.5 hover:text-green-400"><Plus size={14}/></button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-r border-gray-800 pr-3 shrink-0">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">גופן</span>
        <div className="flex items-center bg-black rounded-lg border border-gray-800">
          <button onClick={() => setFontSize(p => Math.max(8, p - 1))} className="p-2 md:p-1.5 hover:text-blue-400"><ZoomOut size={14}/></button>
          <span className="w-8 md:w-10 text-center font-bold text-xs">{fontSize}</span>
          <button onClick={() => setFontSize(p => Math.min(100, p + 1))} className="p-2 md:p-1.5 hover:text-blue-400"><ZoomIn size={14}/></button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-r border-gray-800 pr-4 text-[10px] font-bold shrink-0">
         <div className="flex flex-col">
            <span className="text-gray-600 text-[8px] uppercase tracking-tighter">מילים</span>
            <span className="text-white tracking-tighter">{stats.total}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-gray-600 text-[8px] uppercase tracking-tighter">נותרו</span>
            <span className="text-blue-400 tracking-tighter">{stats.remaining}</span>
         </div>
      </div>
    </div>
  );
}