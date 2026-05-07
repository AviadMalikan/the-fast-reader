import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, RotateCcw, Type, Upload, Plus, Minus, BookOpen, Maximize, X, MousePointer2, ZoomIn, ZoomOut, RefreshCw, Download, Loader2 } from 'lucide-react';

// רכיב מילה בודדת - אופטימיזציה מקסימלית
const Word = React.memo(({ word, index }) => {
  const isEndOfSentence = /[.!?;]/.test(word);
  return (
    <span
      id={`word-${index}`}
      className={`word-unit inline-block ml-0 px-0.5 rounded text-gray-200 transition-colors duration-75 ${isEndOfSentence ? 'me-2' : ''}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      {"\u200F" + word}
    </span>
  );
});

export default function HebrewSpeed() {
  const [activeTab, setActiveTab] = useState('pacer');
  const [draftText, setDraftText] = useState("");
  const [allWords, setAllWords] = useState([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(400);
  const [fontSize, setFontSize] = useState(16);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const wpmRef = useRef(400);
  const lastUpdateTimeRef = useRef(0);
  const requestRef = useRef(null);
  const containerRef = useRef(null);
  const rsvpRef = useRef(null);
  const statsRemainingRef = useRef(null);

  // פונקציית ייצוא TXT
  const handleExportRemaining = useCallback(() => {
    if (allWords.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const remainingText = allWords.slice(currentIndexRef.current).join(' ');
      const blob = new Blob([remainingText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hebrew_speed_remaining.txt`;
      link.click();
      setIsProcessing(false);
    }, 100);
  }, [allWords]);

  // עיבוד טקסט מהיר עם Loader
  const handleUpdateContent = useCallback(() => {
    if (!draftText.trim()) return;
    setIsProcessing(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
    currentIndexRef.current = 0;

    // השהיה קלה כדי לאפשר ל-Loader להופיע
    setTimeout(() => {
      // נירמול טקסט אופטימלי (Fast Path)
      const normalized = draftText
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/([.,!?;:])(?=[^\s])/g, '$1 ')
        .replace(/\s+/g, ' ')
        .trim();

      const wordsArray = normalized.split(' ');
      
      setAllWords(wordsArray);
      setWpm(400);
      wpmRef.current = 400;
      setIsProcessing(false);

      if (rsvpRef.current) rsvpRef.current.innerText = wordsArray[0] || "";
    }, 200);
  }, [draftText]);

  // מנוע קצב High-Precision (Direct DOM)
  const animate = useCallback((time) => {
    if (!isPlayingRef.current) return;

    const msPerWord = 60000 / wpmRef.current;
    if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = time;
    const deltaTime = time - lastUpdateTimeRef.current;

    if (deltaTime >= msPerWord) {
      const oldIdx = currentIndexRef.current;
      const newIdx = oldIdx + 1;

      if (newIdx >= allWords.length) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        return;
      }

      currentIndexRef.current = newIdx;

      // עדכון ה-DOM ישירות (עוקף את React לביצועי על)
      const oldEl = document.getElementById(`word-${oldIdx}`);
      const newEl = document.getElementById(`word-${newIdx}`);
      
      if (oldEl) {
        oldEl.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
        oldEl.classList.add('text-gray-600');
      }
      if (newEl) {
        newEl.classList.remove('text-gray-200', 'text-gray-600');
        newEl.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
        
        if (containerRef.current && !isFocusMode) {
          // גלילה חלקה מבוססת פוקוס עליון
          containerRef.current.scrollTo({ top: newEl.offsetTop - 80, behavior: 'auto' });
        }
      }

      if (rsvpRef.current) rsvpRef.current.innerText = allWords[newIdx] || "";
      if (statsRemainingRef.current) statsRemainingRef.current.innerText = (allWords.length - newIdx).toLocaleString();

      lastUpdateTimeRef.current = time - (deltaTime % msPerWord);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [allWords, isFocusMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    wpmRef.current = wpm;
    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate, wpm]);

  // "חלון רינדור דינמי" - מציג רק 3,000 מילים בכל רגע כדי למנוע איטיות
  const blockContentView = useMemo(() => {
    const windowSize = 3000;
    const start = Math.max(0, currentIndexRef.current - 500);
    const end = Math.min(allWords.length, start + windowSize);
    const slice = allWords.slice(start, end);

    return (
      <div className="flex flex-wrap leading-tight text-justify" style={{ direction: 'rtl' }}>
        {start > 0 && <div className="w-full text-gray-800 text-[10px] mb-4 text-center italic">--- חלק מהטקסט הוסתר כדי לשמור על מהירות האתר ---</div>}
        {slice.map((word, i) => (
          <Word key={start + i} word={word} index={start + i} />
        ))}
      </div>
    );
  }, [allWords, isPlaying]); // מתעדכן בנגינה כדי להזיז את החלון במידת הצורך

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Assistant',_sans-serif] select-none flex flex-col" dir="rtl">
      
      {/* מסך טעינה (Loader) */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-in fade-in">
           <Loader2 size={48} className="text-blue-500 animate-spin" />
           <p className="text-xl font-black tracking-widest text-white uppercase">מעבד נתונים...</p>
        </div>
      )}

      {/* Focus Mode */}
      {isFocusMode && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in overflow-hidden">
          <div className="p-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center shrink-0">
            <ControlGroup 
              wpm={wpm} setWpm={setWpm} fontSize={fontSize} setFontSize={setFontSize} 
              isPlaying={isPlaying} setIsPlaying={setIsPlaying} 
              totalWords={allWords.length} statsRef={statsRemainingRef}
              onExport={handleExportRemaining}
            />
            <button onClick={() => setIsFocusMode(false)} className="p-3 text-gray-500 hover:text-white transition-colors"><X size={28}/></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 md:px-24 py-10 pb-[50vh] custom-scrollbar" style={{ fontSize: `${fontSize}px` }}>
            {activeTab === 'pacer' ? blockContentView : (
               <div className="h-full flex items-center justify-center">
                  <div ref={rsvpRef} className="text-7xl md:text-9xl font-black italic text-white tracking-tighter uppercase">
                    {allWords[currentIndexRef.current] || "מוכן"}
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="text-lg md:text-xl font-black text-blue-500 tracking-tighter italic uppercase">HebrewSpeed PRO</div>
          <div className="flex gap-1 bg-black p-1 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('pacer')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pacer' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>PACER</button>
            <button onClick={() => setActiveTab('reader')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'reader' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>RSVP</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full p-3 md:p-6 space-y-4 flex-1">
        
        {/* פאנל בקרה */}
        <div className="sticky top-[56px] md:top-20 z-40 bg-gray-900/95 p-3 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
          <ControlGroup 
            wpm={wpm} setWpm={setWpm} fontSize={fontSize} setFontSize={setFontSize} 
            isPlaying={isPlaying} setIsPlaying={setIsPlaying} 
            totalWords={allWords.length} statsRef={statsRemainingRef}
            onExport={handleExportRemaining}
          />
          <div className="flex items-center gap-2">
            <button onClick={() => { currentIndexRef.current = 0; setIsPlaying(false); }} className="p-2 text-gray-500 hover:text-white"><RotateCcw size={16}/></button>
            <button onClick={() => setIsFocusMode(true)} className="p-2 text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold"><Maximize size={16}/> מסך מלא</button>
          </div>
        </div>

        {/* תצוגה */}
        <div 
          ref={containerRef}
          className="bg-gray-900/30 rounded-3xl border border-gray-800 p-8 md:p-12 h-[50vh] md:h-[550px] overflow-y-auto shadow-inner relative custom-scrollbar pb-[45vh]"
          style={{ fontSize: `${fontSize}px` }}
        >
          {allWords.length > 0 ? (
            activeTab === 'pacer' ? blockContentView : (
              <div className="h-full flex items-center justify-center">
                <div ref={rsvpRef} className="text-7xl md:text-9xl font-black italic text-white tracking-tighter">
                   {allWords[currentIndexRef.current] || "מוכן"}
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-800 italic font-bold">
              העלה קובץ TXT או הדבק טקסט למטה
            </div>
          )}
        </div>

        {/* הזנה */}
        <div className="bg-gray-900 p-4 md:p-6 rounded-3xl border border-gray-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center px-1">
             <label className="text-[10px] text-blue-400 cursor-pointer hover:underline flex items-center gap-1 font-bold uppercase">
                <Upload size={12}/> טען קובץ
                <input type="file" className="hidden" accept=".txt" onChange={(e) => {
                   const file = e.target.files[0];
                   if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setDraftText(ev.target.result);
                      reader.readAsText(file);
                   }
                }} />
             </label>
             <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">מילים בטיוטה: {draftText.split(/\s+/).filter(w => w).length}</span>
          </div>
          <textarea 
            className="w-full h-44 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-blue-600 outline-none resize-none transition-all text-gray-200"
            placeholder="הדבק כאן תוכן חדש..."
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          ></textarea>
          <button onClick={handleUpdateContent} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-md shadow-lg active:scale-95 transition-all uppercase tracking-widest">
            עדכן טקסט והתחל
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        @media (max-width: 768px) { .custom-scrollbar { scrollbar-width: none; } }
      `}} />
    </div>
  );
}

function ControlGroup({ wpm, setWpm, fontSize, setFontSize, isPlaying, setIsPlaying, totalWords, statsRef, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-6 justify-center md:justify-start">
      <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs transition-all shrink-0 ${isPlaying ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white shadow-md'}`}>
        {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
        <span>{isPlaying ? 'השהה' : 'נגן'}</span>
      </button>

      <div className="flex items-center gap-2 border-r border-gray-800 pr-3 shrink-0">
        <span className="text-[9px] font-black text-gray-600 uppercase">מהירות</span>
        <div className="flex items-center bg-black rounded-lg border border-gray-800">
          <button onClick={() => setWpm(p => Math.max(50, p - 50))} className="p-2 md:p-1.5 hover:text-red-400 transition-colors"><Minus size={14}/></button>
          <span className="w-10 md:w-12 text-center font-bold text-xs text-blue-400">{wpm}</span>
          <button onClick={() => setWpm(p => p + 50)} className="p-2 md:p-1.5 hover:text-green-400 transition-colors"><Plus size={14}/></button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-r border-gray-800 pr-3 shrink-0">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">גופן</span>
        <div className="flex items-center bg-black rounded-lg border border-gray-800">
          <button onClick={() => setFontSize(p => Math.max(8, p - 1))} className="p-2 md:p-1.5 hover:text-blue-400 transition-colors"><ZoomOut size={14}/></button>
          <span className="w-8 md:w-10 text-center font-bold text-xs">{fontSize}</span>
          <button onClick={() => setFontSize(p => Math.min(100, p + 1))} className="p-2 md:p-1.5 hover:text-blue-400 transition-colors"><ZoomIn size={14}/></button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-r border-gray-800 pr-4 text-[10px] font-bold">
         <div className="flex flex-col">
            <span className="text-gray-600 text-[8px] uppercase font-bold tracking-tighter">סה"כ</span>
            <span className="text-white tracking-tighter">{totalWords.toLocaleString()}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-gray-600 text-[8px] uppercase font-bold tracking-tighter">נותרו</span>
            <span ref={statsRef} className="text-blue-400 tracking-tighter">0</span>
         </div>
         <button onClick={onExport} title="ייצא יתרה ל-TXT" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-green-400 transition-all">
            <Download size={14} />
         </button>
      </div>
    </div>
  );
}