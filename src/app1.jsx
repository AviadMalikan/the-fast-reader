// import React, { useState, useEffect, useMemo } from 'react';
// import { Play, Pause, RotateCcw, BarChart3, Info, Type, Settings, Upload, Plus, Minus, BookOpen, Maximize, Minimize, X } from 'lucide-react';

// const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
//   const base = "px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 justify-center";
//   const variants = {
//     primary: "bg-blue-600 hover:bg-blue-700 text-white",
//     secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200",
//     danger: "bg-red-600 hover:bg-red-700 text-white",
//     outline: "border border-gray-600 hover:bg-gray-800 text-gray-300",
//     active: "bg-blue-500 text-white"
//   };
//   return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
// };

// export default function HebrewSpeed() {
//   const [activeTab, setActiveTab] = useState('reader');
//   const [text, setText] = useState("");
//   const [allWords, setAllWords] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [wpm, setWpm] = useState(300);
//   const [chunkSize, setChunkSize] = useState(1);
//   const [remainingOnPause, setRemainingOnPause] = useState(0);
//   const [isFocusMode, setIsFocusMode] = useState(false);

//   // חישוב סטטיסטיקה
//   const charCount = useMemo(() => allWords.join('').length, [allWords]);

//   // עדכון מילים שנותרו בעת עצירה
//   useEffect(() => {
//     if (!isPlaying) setRemainingOnPause(allWords.length - currentIndex);
//   }, [isPlaying, allWords, currentIndex]);

//   // מנוע RSVP
//   useEffect(() => {
//     let interval;
//     if (isPlaying && currentIndex < allWords.length) {
//       const delay = (60000 / wpm) * chunkSize;
//       interval = setInterval(() => {
//         setCurrentIndex((prev) => {
//           const nextIndex = prev + chunkSize;
//           if (nextIndex >= allWords.length) {
//             setIsPlaying(false);
//             return prev;
//           }
//           return nextIndex;
//         });
//       }, delay);
//     }
//     return () => clearInterval(interval);
//   }, [isPlaying, wpm, chunkSize, allWords]);

//   // האזנה למקשים (Escape ליציאה, Space לנגינה)
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.code === 'Escape' && isFocusMode) setIsFocusMode(false);
//       if (e.code === 'Space' && activeTab === 'reader') {
//         e.preventDefault(); // מניעת גלילה של הדף
//         setIsPlaying(!isPlaying);
//       }
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [isFocusMode, isPlaying, activeTab]);

//   const processText = (rawText) => {
//     if (!rawText) return;

//     // שלב הניקוי:
//     let cleanedText = rawText
//       // 1. מצמיד סימני פיסוק למילה שלפניהם (מוחק רווח שנמצא לפני פסיק/נקודה וכו')
//       .replace(/\s+([.,!?;:])/g, '$1')
//       // 2. מוודא שיש רווח אחרי סימן פיסוק (כדי שהפיצול למילים יעבוד טוב)
//       .replace(/([.,!?;:])(?=[^\s])/g, '$1 ')
//       // 3. מחליף ירידות שורה ברווחים
//       .replace(/\n/g, ' ')
//       .trim();

//     // פיצול למילים
//     const wordsArray = cleanedText.split(/\s+/).filter(w => w.length > 0);

//     setAllWords(wordsArray);
//     setCurrentIndex(0);
//     setIsPlaying(false);
//   };
//   return (
//     <div className={`min-h-screen bg-gray-950 text-gray-100 font-['Assistant',_sans-serif] ${isFocusMode ? 'overflow-hidden' : ''}`} dir="rtl">

//       {/* מסך מיקוד (Focus Mode Overlay) */}
//       {isFocusMode && (
//         <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
//           {/* כפתור יציאה */}
//           <button
//             onClick={() => setIsFocusMode(false)}
//             className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2"
//           >
//             <X size={40} />
//           </button>

//           {/* מחוון מהירות קטן למעלה */}
//           <div className="absolute top-10 left-10 text-gray-600 font-mono text-xl tracking-widest uppercase">
//             {wpm} WPM | {chunkSize} WORDS
//           </div>

//           {/* תצוגת RSVP ענקית */}
//           <div className="relative w-full max-w-4xl h-96 flex items-center justify-center">
//             <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-red-600/20 -translate-x-1/2"></div>
//             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-red-600 rounded-full"></div>
//             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-red-600 rounded-full"></div>

//             <div className="text-7xl md:text-9xl font-black text-center text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
//               {allWords.length > 0 ? (
//                 allWords.slice(currentIndex, currentIndex + chunkSize).join(' ')
//               ) : "אין טקסט"}
//             </div>
//           </div>

//           {/* פאנל שליטה מינימליסטי בתחתית */}
//           <div className="absolute bottom-20 flex items-center gap-12">
//             <button onClick={() => setWpm(p => Math.max(50, p - 50))} className="text-gray-600 hover:text-white transition-all"><Minus size={32} /></button>
//             <button
//               onClick={() => setIsPlaying(!isPlaying)}
//               className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center hover:scale-105 transition-transform"
//             >
//               {isPlaying ? <Pause size={48} /> : <Play size={48} className="mr-1" />}
//             </button>
//             <button onClick={() => setWpm(p => p + 50)} className="text-gray-600 hover:text-white transition-all"><Plus size={32} /></button>
//           </div>

//           <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-900">
//             <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentIndex / allWords.length) * 100}%` }}></div>
//           </div>
//         </div>
//       )}

//       {/* Navigation - מוסתר במצב מסך מלא */}
//       {!isFocusMode && (
//         <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
//           <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
//             <div className="text-2xl font-black bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
//               HEBREW SPEED
//             </div>
//             <div className="flex gap-4">
//               <button onClick={() => setActiveTab('reader')} className={`flex items-center gap-2 px-3 py-1 rounded-md ${activeTab === 'reader' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}>
//                 <BookOpen size={18} /> קורא
//               </button>
//               <button onClick={() => setActiveTab('about')} className={`flex items-center gap-2 px-3 py-1 rounded-md ${activeTab === 'about' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}>
//                 <Info size={18} /> אודות
//               </button>
//             </div>
//           </div>
//         </nav>
//       )}

//       <main className="max-w-4xl mx-auto p-6">
//         {activeTab === 'reader' && (
//           <div className="space-y-6">

//             {/* סטטיסטיקה */}
//             <div className="grid grid-cols-3 gap-4">
//               <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-xl text-center">
//                 <div className="text-gray-500 text-xs mb-1">מילים בטקסט</div>
//                 <div className="text-xl font-bold">{allWords.length}</div>
//               </div>
//               <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-xl text-center">
//                 <div className="text-gray-500 text-xs mb-1">תווים</div>
//                 <div className="text-xl font-bold">{charCount}</div>
//               </div>
//               <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-xl text-center ring-1 ring-blue-500/30">
//                 <div className="text-gray-500 text-xs mb-1">מילים שנותרו</div>
//                 <div className="text-xl font-bold text-blue-400">{Math.max(0, remainingOnPause)}</div>
//               </div>
//             </div>

//             {/* אזור התצוגה הרגיל */}
//             <div className="relative h-64 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl group">
//               <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500/10 -translate-x-1/2"></div>

//               <div className="text-5xl md:text-6xl font-bold text-center z-10 px-6" style={{ direction: 'rtl' }}>
//                 {allWords.length > 0 ? (
//                   // הוספת התו \u200F (RLM) לפני המילה מבטיחה שהפיסוק יישאר משמאל
//                   "\u200F" + allWords.slice(currentIndex, currentIndex + chunkSize).join(' ')
//                 ) : (
//                   <span className="text-gray-700 text-xl font-medium">הכנס טקסט למטה כדי להתחיל</span>
//                 )}
//               </div>

//               {/* כפתור כניסה למסך מלא (מופיע בריחוף) */}
//               <button
//                 onClick={() => setIsFocusMode(true)}
//                 className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
//                 title="מצב מיקוד"
//               >
//                 <Maximize size={20} />
//               </button>

//               <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
//                 <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(currentIndex / allWords.length) * 100}%` }}></div>
//               </div>
//             </div>

//             {/* פאנל בקרה */}
//             <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-8">
//               <div className="flex flex-wrap items-center justify-center gap-8">

//                 {/* מהירות */}
//                 <div className="flex flex-col items-center gap-3">
//                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">מהירות קריאה</span>
//                   <div className="flex items-center gap-3 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
//                     <button onClick={() => setWpm(prev => Math.max(50, prev - 50))} className="p-2 hover:bg-gray-800 rounded-lg text-red-400"><Minus size={24} /></button>
//                     <div className="w-20 text-center">
//                       <span className="text-2xl font-black text-white">{wpm}</span>
//                     </div>
//                     <button onClick={() => setWpm(prev => prev + 50)} className="p-2 hover:bg-gray-800 rounded-lg text-green-400"><Plus size={24} /></button>
//                   </div>
//                 </div>

//                 {/* נגן ומסך מלא */}
//                 <div className="flex items-center gap-6">
//                   <button
//                     onClick={() => setIsPlaying(!isPlaying)}
//                     className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white hover:scale-105 shadow-xl shadow-blue-900/30'}`}
//                   >
//                     {isPlaying ? <Pause size={32} /> : <Play size={32} className="mr-1" />}
//                   </button>
//                   <div className="flex flex-col gap-2">
//                     <Button onClick={() => { setCurrentIndex(0); setIsPlaying(false); }} variant="outline" className="w-12 h-12 rounded-full p-0">
//                       <RotateCcw size={20} />
//                     </Button>
//                     <Button onClick={() => setIsFocusMode(true)} variant="outline" className="w-12 h-12 rounded-full p-0 border-blue-500/30 text-blue-400">
//                       <Maximize size={20} />
//                     </Button>
//                   </div>
//                 </div>

//                 {/* מילים בכל פעם */}
//                 <div className="flex flex-col items-center gap-3">
//                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">מילים בכל פעם</span>
//                   <div className="flex gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
//                     {[1, 2, 3, 4, 5].map((num) => (
//                       <button
//                         key={num}
//                         onClick={() => setChunkSize(num)}
//                         className={`w-10 h-10 rounded-lg font-bold transition-all ${chunkSize === num ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'text-gray-500 hover:bg-gray-800'}`}
//                       >
//                         {num}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//               </div>
//             </div>

//             {/* הזנת טקסט */}
//             <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
//               <textarea
//                 className="w-full h-40 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
//                 placeholder="הדבק כאן טקסט..."
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//               ></textarea>
//               <Button onClick={() => processText(text)} className="w-full py-4 text-lg font-bold tracking-wide">טען טקסט והתחל לקרוא</Button>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }