"use client";

import React, { useState, useEffect } from "react";

// --- Types ---
interface Profile {
  id: string;
  name: string;
  totalXP: number;
  streakCount: number;
  lastPracticeDate?: string;
  nativeLanguage: string;
  targetLanguage: string;
  createdAt: string;
}

interface LanguagePair {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  proficiencyLevel: string;
  isActive: boolean;
}

interface Word {
  id: string;
  origin: string;
  translate: string;
  category: string;
  whenRepeat?: string;
  wrongAnswer: number;
  rightAnswer: number;
  wordPoints: number;
  isLearning: boolean;
}

interface Quest {
  id: string;
  questTypeKey: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  targetAmount: number;
  currentAmount: number;
  isClaimed: boolean;
}

interface DailyStat {
  date: string;
  xpEarned: number;
  wordsMastered: number;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isHidden: boolean;
}

interface Deck {
  id: string;
  name: string;
  totalCards: number;
  dueCards: number;
}

interface Flashcard {
  id: string;
  frontText: string;
  backText: string;
  nextReviewDate: string;
}

export default function Home() {
  // Navigation & Screens
  const [activeTab, setActiveTab] = useState<"home" | "assignments" | "phrase" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  
  // Game states
  const [isBinaryGameOpen, setIsBinaryGameOpen] = useState(false);
  const [isPracticeActive, setIsPracticeActive] = useState(false);
  
  // Core Data States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [activePair, setActivePair] = useState<LanguagePair | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [translateOptions, setTranslateOptions] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Word Add form
  const [newOrigin, setNewOrigin] = useState("");
  const [newTranslate, setNewTranslate] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [showAddWord, setShowAddWord] = useState(false);

  // Profile Settings
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [srsBaseMinutes, setSrsBaseMinutes] = useState(120);
  const [srsComplexity, setSrsComplexity] = useState(5.0);

  // Category view sorting & filters
  const [sortOption, setSortOption] = useState<"name" | "points" | "due">("name");
  const [filterOnlyLearning, setFilterOnlyLearning] = useState(false);

  // Active Practice State (Write -> Listen -> Speak loop)
  const [practiceWords, setPracticeWords] = useState<Word[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [practiceStage, setPracticeStage] = useState<"write" | "listen" | "speak">("write");
  const [practiceInput, setPracticeInput] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<"correct" | "incorrect" | "none">("none");
  const [practiceCorrection, setPracticeCorrection] = useState("");
  const [speakingStatus, setSpeakingStatus] = useState<"idle" | "listening" | "success" | "fail">("idle");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [earnedXP, setEarnedXP] = useState(0);
  const [practiceMistakes, setPracticeMistakes] = useState<Record<string, number>>({});
  const [practiceShake, setPracticeShake] = useState(false);

  // Active Flashcards (Decks) State
  const [deckPracticeCards, setDeckPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Phrase Builder State
  const [phraseWord, setPhraseWord] = useState("");
  const [phraseSentence, setPhraseSentence] = useState("");
  const [phraseStep, setPhraseStep] = useState<"select" | "write" | "feedback" | "drill">("select");
  const [phraseAIResult, setPhraseAIResult] = useState<any>(null);
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [phrasePronounceScore, setPhrasePronounceScore] = useState<number | null>(null);

  // Binary Game State
  const [binaryHighScore, setBinaryHighScore] = useState(0);
  const [binaryScore, setBinaryScore] = useState(0);
  const [binaryLevel, setBinaryLevel] = useState(1);
  const [binaryRows, setBinaryRows] = useState<{ id: number; decimal: number; currentBinary: number[] }[]>([]);
  const [binaryActiveRowIdx, setBinaryActiveRowIdx] = useState(0);
  const [binaryInputVal, setBinaryInputVal] = useState("");
  const [binaryGameInterval, setBinaryGameInterval] = useState<any>(null);
  const [binaryGameOver, setBinaryGameOver] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchProfile();
    fetchLanguages();
    fetchWords();
    fetchCategories();
    fetchQuests();
    fetchStats();
    fetchDecks();
    
    // Load highscore
    const savedHighScore = localStorage.getItem("binaryHighScore");
    if (savedHighScore) setBinaryHighScore(parseInt(savedHighScore));
  }, []);

  // Sync state helpers
  const fetchProfile = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setEditNameValue(data.name);
    }
  };

  const fetchLanguages = async () => {
    const res = await fetch("/api/languages");
    if (res.ok) {
      const data = await res.json();
      setLanguagePairs(data);
      setActivePair(data.find((p: any) => p.isActive) || null);
    }
  };

  const fetchWords = async () => {
    const res = await fetch("/api/words");
    if (res.ok) setWords(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    // Standard mock list if empty
    setCategories([
      { id: "1", name: "General", sortOrder: -1, isHidden: false },
      { id: "2", name: "Survival Words", sortOrder: 0, isHidden: false },
      { id: "3", name: "Car & Road", sortOrder: 1, isHidden: false },
      { id: "4", name: "Health & Pharmacy", sortOrder: 2, isHidden: false },
      { id: "5", name: "Housing & Bills", sortOrder: 3, isHidden: false },
      { id: "6", name: "Bank & Docs", sortOrder: 4, isHidden: false },
      { id: "7", name: "Tools & Site", sortOrder: 5, isHidden: false },
      { id: "8", name: "Small Talk", sortOrder: 6, isHidden: false },
      { id: "9", name: "Soft Skills", sortOrder: 7, isHidden: false },
      { id: "10", name: "Time and Weather", sortOrder: 8, isHidden: false },
    ]);
  };

  const fetchQuests = async () => {
    const res = await fetch("/api/quests");
    if (res.ok) setQuests(await res.json());
  };

  const fetchStats = async () => {
    const res = await fetch("/api/stats?range=week");
    if (res.ok) setDailyStats(await res.json());
  };

  const fetchDecks = async () => {
    const res = await fetch("/api/decks");
    if (res.ok) setDecks(await res.json());
  };

  // --- Handlers ---
  const handleUpdateName = async () => {
    if (!editNameValue.trim()) return;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editNameValue }),
    });
    if (res.ok) {
      setIsEditingName(false);
      fetchProfile();
    }
  };

  const handleSearchTranslate = async () => {
    if (!searchQuery.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          text: searchQuery,
          sourceLanguage: activePair?.sourceLanguage || "English",
          targetLanguage: activePair?.targetLanguage || "Russian",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslateOptions(data.options);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveTranslation = async (selectedTrans: string) => {
    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: searchQuery,
        translate: selectedTrans,
        category: "General",
      }),
    });
    if (res.ok) {
      setSearchQuery("");
      setTranslateOptions([]);
      fetchWords();
      fetchQuests();
    }
  };

  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim() || !newTranslate.trim()) return;
    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: newOrigin,
        translate: newTranslate,
        category: newCategory,
      }),
    });
    if (res.ok) {
      setNewOrigin("");
      setNewTranslate("");
      setShowAddWord(false);
      fetchWords();
    }
  };

  const handleClaimQuest = async (questId: string, reward: number) => {
    const res = await fetch("/api/quests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId, claim: true }),
    });
    if (res.ok) {
      if (profile) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalXP: profile.totalXP + reward }),
        });
      }
      fetchQuests();
      fetchProfile();
      fetchStats();
    }
  };

  // --- Voice / Speech Synthesis & Recognition ---
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Set appropriate lang
    utterance.lang = activePair?.targetLanguage === "Russian" ? "ru-RU" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = activePair?.targetLanguage === "Russian" ? "ru-RU" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setSpeakingStatus("listening");
    recognition.start();

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setSpeechTranscript(resultText);
      
      const target = practiceWords[currentWordIdx].origin.toLowerCase().trim().replace(/[.,?!]/g, "");
      const cleanResult = resultText.toLowerCase().trim().replace(/[.,?!]/g, "");

      if (cleanResult === target) {
        setSpeakingStatus("success");
        setPracticeFeedback("correct");
        setEarnedXP(prev => prev + 5);
      } else {
        setSpeakingStatus("fail");
        setPracticeFeedback("incorrect");
        setPracticeCorrection(practiceWords[currentWordIdx].origin);
      }
    };

    recognition.onerror = () => {
      setSpeakingStatus("idle");
    };

    recognition.onend = () => {
      if (speakingStatus === "listening") {
        setSpeakingStatus("idle");
      }
    };
  };

  // --- Vocabulary Practice Engine ---
  const startVocabularyPractice = (categoryName: string) => {
    const dueList = words.filter(w => {
      const matchesCategory = w.category === categoryName;
      const isDue = !w.whenRepeat || new Date(w.whenRepeat) <= new Date();
      return matchesCategory && isDue;
    });

    const list = dueList.length > 0 
      ? dueList 
      : words.filter(w => w.category === categoryName).slice(0, 5);

    if (list.length === 0) {
      alert("No words to practice in this category! Try adding some first.");
      return;
    }

    setPracticeWords(list);
    setCurrentWordIdx(0);
    setPracticeStage("write");
    setPracticeInput("");
    setPracticeFeedback("none");
    setEarnedXP(0);
    setPracticeMistakes({});
    setIsPracticeActive(true);
  };

  const handleCheckAnswer = () => {
    const currentWord = practiceWords[currentWordIdx];
    const target = (practiceStage === "write" ? currentWord.origin : currentWord.origin)
      .toLowerCase()
      .trim();
    const input = practiceInput.toLowerCase().trim();

    if (input === target) {
      setPracticeFeedback("correct");
      setEarnedXP(prev => prev + 5);
      speakText(currentWord.origin);
    } else {
      setPracticeFeedback("incorrect");
      setPracticeCorrection(currentWord.origin);
      setPracticeMistakes(prev => ({
        ...prev,
        [currentWord.id]: (prev[currentWord.id] || 0) + 1,
      }));
      setPracticeShake(true);
      setTimeout(() => setPracticeShake(false), 500);
    }
  };

  const handleNextPracticeStep = async () => {
    setPracticeFeedback("none");
    setPracticeInput("");
    
    // Write -> Listen -> Speak flow per word
    if (practiceStage === "write") {
      setPracticeStage("listen");
      speakText(practiceWords[currentWordIdx].origin);
    } else if (practiceStage === "listen") {
      setPracticeStage("speak");
    } else {
      // Completed speak stage, move to next word or finish
      // Save results of review
      const currentWord = practiceWords[currentWordIdx];
      const mistakes = practiceMistakes[currentWord.id] || 0;

      await fetch("/api/words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentWord.id, mistakes }),
      });

      if (currentWordIdx + 1 < practiceWords.length) {
        setCurrentWordIdx(prev => prev + 1);
        setPracticeStage("write");
      } else {
        // Complete session
        setIsPracticeActive(false);
        // Save XP to user profile
        if (profile) {
          const finalXP = profile.totalXP + earnedXP;
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalXP: finalXP }),
          });

          // Log daily activity stat
          await fetch("/api/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ xpEarned: earnedXP, wordsReviewed: practiceWords.length }),
          });

          // Progress quests
          const learnQuest = quests.find(q => q.questTypeKey === "learnNewWords");
          if (learnQuest) {
            await fetch("/api/quests", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ questId: learnQuest.id, progressAmount: practiceWords.length }),
            });
          }
        }
        
        fetchProfile();
        fetchWords();
        fetchQuests();
        fetchStats();
      }
    }
  };

  // --- Decks Study Engine ---
  const startDeckPractice = async (deck: Deck) => {
    setActiveDeck(deck);
    const res = await fetch(`/api/decks/${deck.id}?due=true`);
    if (res.ok) {
      const list = await res.json();
      if (list.length === 0) {
        alert("This deck is completed for now! No cards are due.");
        return;
      }
      setDeckPracticeCards(list);
      setCurrentCardIdx(0);
      setIsCardFlipped(false);
    }
  };

  const handleRateCard = async (rating: number) => {
    const currentCard = deckPracticeCards[currentCardIdx];
    const res = await fetch("/api/decks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: currentCard.id, rating }),
    });
    if (res.ok) {
      if (currentCardIdx + 1 < deckPracticeCards.length) {
        setCurrentCardIdx(prev => prev + 1);
        setIsCardFlipped(false);
      } else {
        // Finished
        setDeckPracticeCards([]);
        setActiveDeck(null);
        fetchDecks();
      }
    }
  };

  // --- Phrase Builder Steps ---
  const handleAICheckSentence = async () => {
    if (!phraseSentence.trim()) return;
    setPhraseLoading(true);
    setPhraseStep("feedback");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          text: phraseWord,
          sentence: phraseSentence,
          sourceLanguage: activePair?.sourceLanguage || "English",
          targetLanguage: activePair?.targetLanguage || "Russian",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhraseAIResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPhraseLoading(false);
    }
  };

  const startPhraseDrill = () => {
    setPhraseStep("drill");
    setPhrasePronounceScore(null);
  };

  const handlePhrasePronounce = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = activePair?.targetLanguage === "Russian" ? "ru-RU" : "en-US";
    recognition.start();

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const target = phraseAIResult?.correctedSentence?.toLowerCase().trim().replace(/[.,?!]/g, "") || "";
      const input = text.toLowerCase().trim().replace(/[.,?!]/g, "");

      if (input === target) {
        setPhrasePronounceScore(10);
      } else {
        // Match percentage calculation
        setPhrasePronounceScore(6);
      }
    };
  };

  // --- Binary Game Loop ---
  const startBinaryGame = () => {
    setIsBinaryGameOpen(true);
    setBinaryScore(0);
    setBinaryLevel(1);
    setBinaryRows([{ id: 1, decimal: Math.floor(Math.random() * 255) + 1, currentBinary: [0,0,0,0,0,0,0,0] }]);
    setBinaryActiveRowIdx(0);
    setBinaryGameOver(false);

    // Row spawn interval
    const interval = setInterval(() => {
      setBinaryRows(prev => {
        if (prev.length >= 8) {
          clearInterval(interval);
          setBinaryGameOver(true);
          return prev;
        }
        return [
          ...prev,
          {
            id: Date.now(),
            decimal: Math.floor(Math.random() * 255) + 1,
            currentBinary: [0,0,0,0,0,0,0,0],
          },
        ];
      });
    }, 8000);

    setBinaryGameInterval(interval);
  };

  const stopBinaryGame = () => {
    clearInterval(binaryGameInterval);
    setBinaryRows([]);
    setIsBinaryGameOpen(false);
  };

  const handleToggleBit = (rowIdx: number, bitIdx: number) => {
    setBinaryRows(prev => {
      const copy = [...prev];
      const bits = [...copy[rowIdx].currentBinary];
      bits[bitIdx] = bits[bitIdx] === 1 ? 0 : 1;
      copy[rowIdx].currentBinary = bits;

      // Verify row sum match
      const sum = bits.reduce((acc, bit, idx) => acc + bit * Math.pow(2, 7 - idx), 0);
      if (sum === copy[rowIdx].decimal) {
        // Clear row
        setBinaryScore(s => s + 100);
        return copy.filter((_, i) => i !== rowIdx);
      }
      return copy;
    });
  };

  // --- Computed fields ---
  const dueCount = words.filter(w => !w.whenRepeat || new Date(w.whenRepeat) <= new Date()).length;

  const getRank = (xp: number) => {
    if (xp >= 10000) return "Master 👑";
    if (xp >= 5000) return "Grandmaster 🧙";
    if (xp >= 2000) return "Expert 🦾";
    if (xp >= 500) return "Learner 📚";
    return "Novice 🌱";
  };

  // Sort and filter words inside selected category
  const filteredWords = words
    .filter(w => {
      if (selectedCategory && w.category !== selectedCategory) return false;
      if (filterOnlyLearning && !w.isLearning) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "points") return b.wordPoints - a.wordPoints;
      if (sortOption === "due") {
        const dateA = a.whenRepeat ? new Date(a.whenRepeat).getTime() : 0;
        const dateB = b.whenRepeat ? new Date(b.whenRepeat).getTime() : 0;
        return dateA - dateB;
      }
      return a.origin.localeCompare(b.origin);
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text font-black tracking-wider text-xl">
            🧠 NEUROLANG
          </div>
          {activePair && (
            <div className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-semibold">
              🇬🇧 {activePair.sourceLanguage} ➔ 🇷🇺 {activePair.targetLanguage} ({activePair.proficiencyLevel})
            </div>
          )}
        </div>

        {profile && (
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5 text-orange-400 text-sm font-bold bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
              🔥 <span>{profile.streakCount} days</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-bold bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
              ⚡ <span>{profile.totalXP} XP</span>
            </div>
          </div>
        )}
      </header>

      {/* Main content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* --- Easter Egg: Binary Game Overlay --- */}
        {isBinaryGameOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full flex flex-col gap-6 relative shadow-2xl">
              <button onClick={stopBinaryGame} className="absolute top-6 right-6 text-slate-500 hover:text-slate-200 text-xl font-bold">✕</button>
              
              <div className="text-center">
                <h3 className="text-3xl font-black text-indigo-400 tracking-wider">BINARY GAME</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Clearing rows by converting decimal targets</p>
              </div>

              {binaryGameOver ? (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="text-5xl font-black text-red-500">GAME OVER</div>
                  <div className="text-xl">Your score: <span className="text-yellow-400 font-bold">{binaryScore}</span></div>
                  {binaryScore > binaryHighScore && <div className="text-teal-400 font-bold">🏆 NEW HIGHSCORE!</div>}
                  <button
                    onClick={startBinaryGame}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-2xl transition mt-4"
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 border-b border-slate-800 pb-3">
                    <span>Score: <span className="text-yellow-400 font-bold">{binaryScore}</span></span>
                    <span>Active row target: <span className="text-indigo-400 font-bold">{binaryRows[binaryActiveRowIdx]?.decimal}</span></span>
                  </div>

                  {/* 8-bit board */}
                  <div className="flex flex-col gap-2.5 my-4">
                    {binaryRows.map((row, rIdx) => (
                      <div 
                        key={row.id} 
                        className={`flex justify-between items-center p-3.5 rounded-xl border transition ${
                          rIdx === binaryActiveRowIdx ? "bg-indigo-500/10 border-indigo-500/40" : "bg-slate-950 border-slate-900 opacity-60"
                        }`}
                      >
                        <span className="text-lg font-black tracking-wider text-slate-300 w-16">{row.decimal}</span>
                        <div className="flex gap-1.5">
                          {row.currentBinary.map((bit, bIdx) => (
                            <button
                              key={bIdx}
                              disabled={rIdx !== binaryActiveRowIdx}
                              onClick={() => handleToggleBit(rIdx, bIdx)}
                              className={`w-9 h-9 rounded-lg font-black transition text-sm flex items-center justify-center border ${
                                bit === 1 
                                  ? "bg-indigo-500 border-indigo-400 text-white" 
                                  : "bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700"
                              }`}
                            >
                              {bit}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider px-2">
                    <span>128</span>
                    <span>64</span>
                    <span>32</span>
                    <span>16</span>
                    <span>8</span>
                    <span>4</span>
                    <span>2</span>
                    <span>1</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Practice Loop Overlay --- */}
        {isPracticeActive && practiceWords.length > 0 && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 backdrop-blur-md">
            <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl relative transition-transform ${practiceShake ? "animate-bounce" : ""}`}>
              <button 
                onClick={() => setIsPracticeActive(false)} 
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>

              <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span>STAGE: {practiceStage}</span>
                <span>{currentWordIdx + 1} / {practiceWords.length}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${((currentWordIdx + 1) / practiceWords.length) * 100}%` }}
                />
              </div>

              {/* Question Card */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px]">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Translate this word</div>
                <div className="text-3xl font-black text-slate-200">
                  {practiceWords[currentWordIdx].translate}
                </div>
              </div>

              {/* Input Area */}
              <div className="flex flex-col gap-3">
                {practiceStage === "speak" ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <button
                      onClick={startListening}
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition border shadow-lg ${
                        speakingStatus === "listening" 
                          ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                          : "bg-indigo-500/10 border-indigo-500 text-indigo-400 hover:bg-indigo-500/20"
                      }`}
                    >
                      🎤
                    </button>
                    {speechTranscript && (
                      <p className="text-sm italic text-slate-400">"{speechTranscript}"</p>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={practiceInput}
                    onChange={(e) => setPracticeInput(e.target.value)}
                    placeholder={`Type in ${activePair?.targetLanguage || "Russian"}`}
                    disabled={practiceFeedback !== "none"}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-base text-slate-100 focus:outline-none focus:border-indigo-500 text-center font-semibold"
                  />
                )}

                {/* Feedback Messages */}
                {practiceFeedback === "correct" && (
                  <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl p-4 text-center font-bold">
                    ✓ Perfect! +5 XP
                  </div>
                )}
                {practiceFeedback === "incorrect" && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center font-semibold">
                    ✕ Incorrect. Correct answer: <span className="font-bold underline">{practiceCorrection}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {practiceFeedback === "none" ? (
                <button
                  disabled={practiceStage !== "speak" && !practiceInput.trim()}
                  onClick={handleCheckAnswer}
                  className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition"
                >
                  Verify
                </button>
              ) : (
                <button
                  onClick={handleNextPracticeStep}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 rounded-xl transition"
                >
                  Next Step ➔
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- Flashcard Practice Overlay --- */}
        {deckPracticeCards.length > 0 && activeDeck && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl relative">
              <button 
                onClick={() => setDeckPracticeCards([])} 
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>

              <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span>{activeDeck.name}</span>
                <span>{currentCardIdx + 1} / {deckPracticeCards.length}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentCardIdx + 1) / deckPracticeCards.length) * 100}%` }}
                />
              </div>

              {/* 3D Flashcard */}
              <div 
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="bg-slate-950 border border-slate-900 hover:border-slate-800 cursor-pointer rounded-2xl p-10 h-72 flex flex-col items-center justify-center text-center transition relative overflow-hidden"
              >
                <div className="absolute top-3 right-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  Click to flip
                </div>
                {!isCardFlipped ? (
                  <div className="text-3xl font-black text-slate-200">
                    {deckPracticeCards[currentCardIdx].frontText}
                  </div>
                ) : (
                  <div className="text-3xl font-black text-indigo-400">
                    {deckPracticeCards[currentCardIdx].backText}
                  </div>
                )}
              </div>

              {/* Grade buttons */}
              {isCardFlipped && (
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRateCard(1)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-3.5 rounded-xl text-xs transition"
                  >
                    Again
                  </button>
                  <button
                    onClick={() => handleRateCard(2)}
                    className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-bold py-3.5 rounded-xl text-xs transition"
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => handleRateCard(3)}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold py-3.5 rounded-xl text-xs transition"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleRateCard(4)}
                    className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 font-bold py-3.5 rounded-xl text-xs transition"
                  >
                    Easy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Add Word Modal --- */}
        {showAddWord && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-6 backdrop-blur-sm">
            <form 
              onSubmit={handleAddCustomWord}
              className="bg-slate-900 rounded-3xl border border-slate-800 p-8 max-w-sm w-full flex flex-col gap-4 shadow-2xl animate-fade-in"
            >
              <h3 className="text-xl font-black text-slate-100">Add New Word</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Foreign Word (Origin)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. солнце"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Translation (Native)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sun"
                  value={newTranslate}
                  onChange={(e) => setNewTranslate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddWord(false)}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- Tab Views --- */}
        {activeTab === "home" && !selectedCategory && (
          <div className="flex flex-col gap-6">
            
            {/* Search Translation Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Translate & add new word (e.g. apple)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-base text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                />
                <button
                  disabled={!searchQuery.trim() || isTranslating}
                  onClick={handleSearchTranslate}
                  className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-2xl transition text-sm"
                >
                  {isTranslating ? "Translating..." : "Translate"}
                </button>
              </div>

              {translateOptions.length > 0 && (
                <div className="flex flex-col gap-2 animate-fade-in">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select translation variant to save:</p>
                  <div className="flex flex-wrap gap-2">
                    {translateOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSaveTranslation(opt)}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-semibold py-2 px-4 rounded-xl text-sm transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SRS Quick Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between items-start gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Spaced Repetition</span>
                  <h3 className="text-2xl font-black text-slate-100">Review Due Words</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    You have <span className="text-indigo-400 font-bold">{dueCount} words</span> waiting to be reviewed.
                  </p>
                </div>
                <button
                  disabled={dueCount === 0}
                  onClick={() => startVocabularyPractice("Survival Words")}
                  className="bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-400 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg shadow-indigo-500/15"
                >
                  Practice Now ({dueCount})
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-start gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Decks practice</span>
                  <h3 className="text-2xl font-black text-slate-100">Flashcard Decks</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Practice with Anki-style flashcard decks generated from your categories.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (decks.length > 0) {
                      startDeckPractice(decks[0]);
                    } else {
                      alert("Please wait for deck sync to complete.");
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3.5 rounded-2xl text-sm border border-slate-700 transition"
                >
                  Study Decks
                </button>
              </div>
            </div>

            {/* Category Grid */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black tracking-wide text-slate-200">Categories</h3>
                <button
                  onClick={() => setShowAddWord(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-sm"
                >
                  + Create custom word
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const catWordCount = words.filter(w => w.category === cat.name).length;
                  const catDueCount = words.filter(w => w.category === cat.name && (!w.whenRepeat || new Date(w.whenRepeat) <= new Date())).length;
                  
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 cursor-pointer rounded-2xl p-5 flex flex-col gap-4 justify-between transition relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-3xl">📂</span>
                        {catDueCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                            {catDueCount}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 text-base">{cat.name}</span>
                        <span className="text-xs text-slate-500 font-semibold">{catWordCount} words</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* --- Category Detail view --- */}
        {selectedCategory && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-slate-400 hover:text-slate-200 font-bold text-sm"
                >
                  ← Categories
                </button>
                <h3 className="text-2xl font-black text-slate-200">{selectedCategory}</h3>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortOption}
                  onChange={(e: any) => setSortOption(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="name">Name A-Z</option>
                  <option value="points">XP Points</option>
                  <option value="due">Review Date</option>
                </select>
                <button
                  onClick={() => startVocabularyPractice(selectedCategory)}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-5 rounded-xl text-xs transition"
                >
                  Practice Category
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredWords.map(w => {
                const isDue = !w.whenRepeat || new Date(w.whenRepeat) <= new Date();
                return (
                  <div 
                    key={w.id} 
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${
                      isDue 
                        ? "bg-indigo-500/5 border-indigo-500/10" 
                        : "bg-slate-900/40 border-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 font-bold bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                        {w.wordPoints.toFixed(1)} XP
                      </span>
                      {isDue && (
                        <span className="text-[10px] text-indigo-400 font-bold uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          Due
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-slate-200">{w.origin}</span>
                      <span className="text-sm text-indigo-400">{w.translate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Assignments</span>
              <h3 className="text-2xl font-black text-slate-100">Daily Quests</h3>
              <p className="text-slate-400 text-sm">Complete daily challenges to earn bonus XP rewards!</p>
            </div>

            <div className="flex flex-col gap-4">
              {quests.map(quest => {
                const isDone = quest.currentAmount >= quest.targetAmount;
                return (
                  <div 
                    key={quest.id}
                    className={`p-5 rounded-2xl bg-slate-950 border border-slate-850 flex justify-between items-center gap-4 transition ${
                      quest.isClaimed ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{quest.icon}</span>
                        <h4 className="font-bold text-slate-200">{quest.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{quest.description}</p>
                      
                      {/* Quest progress bar */}
                      <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${(quest.currentAmount / quest.targetAmount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold mt-1">
                        {quest.currentAmount} / {quest.targetAmount}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-yellow-400 text-sm font-black">⚡ {quest.xpReward} XP</span>
                      {isDone && !quest.isClaimed && (
                        <button
                          onClick={() => handleClaimQuest(quest.id, quest.xpReward)}
                          className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition"
                        >
                          Claim
                        </button>
                      )}
                      {quest.isClaimed && (
                        <span className="text-teal-400 text-xs font-bold">Claimed ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "phrase" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">AI Interactive</span>
              <h3 className="text-2xl font-black text-slate-100">Phrase Builder</h3>
              <p className="text-slate-400 text-sm">Formulate and test target sentences with expert AI feedback.</p>
            </div>

            {/* Stepper Navigation */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase border-b border-slate-800 pb-3">
              <span className={phraseStep === "select" ? "text-indigo-400" : ""}>1. Select word</span>
              <span className={phraseStep === "write" ? "text-indigo-400" : ""}>2. Formulate</span>
              <span className={phraseStep === "feedback" ? "text-indigo-400" : ""}>3. AI Evaluation</span>
              <span className={phraseStep === "drill" ? "text-indigo-400" : ""}>4. Speaking drill</span>
            </div>

            {phraseStep === "select" && (
              <div className="flex flex-col gap-4 my-4 animate-fade-in">
                <p className="text-sm text-slate-400">Select a target word from your vocabulary to construct a sentence around:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {words.slice(0, 9).map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setPhraseWord(w.origin);
                        setPhraseStep("write");
                      }}
                      className="bg-slate-950 border border-slate-850 hover:border-indigo-500/40 p-4 rounded-xl text-sm font-bold text-slate-200 text-left transition"
                    >
                      {w.origin}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phraseStep === "write" && (
              <div className="flex flex-col gap-4 my-4 animate-fade-in">
                <p className="text-sm text-slate-400">Write a sentence in target language using: <span className="text-indigo-400 font-bold font-mono">"{phraseWord}"</span></p>
                <textarea
                  value={phraseSentence}
                  onChange={(e) => setPhraseSentence(e.target.value)}
                  placeholder="Type your sentence here..."
                  className="bg-slate-950 border border-slate-850 rounded-2xl p-4 min-h-[120px] text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                />
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={() => setPhraseStep("select")}
                    className="text-slate-500 hover:text-slate-300 font-bold text-sm"
                  >
                    Back
                  </button>
                  <button
                    disabled={!phraseSentence.trim()}
                    onClick={handleAICheckSentence}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl text-sm transition"
                  >
                    Verify with AI
                  </button>
                </div>
              </div>
            )}

            {phraseStep === "feedback" && (
              <div className="flex flex-col gap-5 my-4 animate-fade-in">
                {phraseLoading ? (
                  <div className="text-center py-10 text-slate-400 font-bold">Consulting expert AI tutor...</div>
                ) : phraseAIResult ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase">AI Evaluation Result</span>
                      <span className="text-yellow-400 font-black text-lg">Score: {phraseAIResult.score} / 10</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col gap-2">
                      <span className="text-xs text-slate-500 font-bold uppercase">Corrected Sentence</span>
                      <p className="text-xl font-bold text-teal-400">{phraseAIResult.correctedSentence}</p>
                      <span className="text-xs text-slate-600 italic">Translation: "{phraseAIResult.translation}"</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-xs text-slate-500 font-bold uppercase">Tutor Explanation</span>
                      <p className="text-sm text-slate-300">{phraseAIResult.explanation}</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 border-t border-slate-850 pt-4">
                      <button
                        onClick={() => setPhraseStep("write")}
                        className="text-slate-500 hover:text-slate-300 font-bold text-sm"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={startPhraseDrill}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl text-sm transition"
                      >
                        Practice Pronunciation ➔
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-400 py-10 font-bold">Failed to load AI evaluation.</div>
                )}
              </div>
            )}

            {phraseStep === "drill" && (
              <div className="flex flex-col gap-6 my-4 items-center text-center animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500 font-bold uppercase">Drill Target</span>
                  <p className="text-2xl font-black text-slate-200">{phraseAIResult?.correctedSentence}</p>
                </div>

                <div className="flex gap-4 my-2">
                  <button
                    onClick={() => speakText(phraseAIResult?.correctedSentence)}
                    className="bg-slate-950 border border-slate-850 hover:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition"
                  >
                    🔊
                  </button>
                  <button
                    onClick={handlePhrasePronounce}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition"
                  >
                    🎤
                  </button>
                </div>

                {phrasePronounceScore !== null && (
                  <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl p-4 text-center font-bold animate-fade-in w-full max-w-xs">
                    Pronunciation Score: {phrasePronounceScore}/10
                  </div>
                )}

                <button
                  onClick={() => {
                    setPhraseSentence("");
                    setPhraseStep("select");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-sm mt-4"
                >
                  Start new phrase
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && profile && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* User Profile Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="flex gap-6 items-center flex-wrap">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-4xl font-bold">
                  🧑‍🎓
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none"
                      />
                      <button
                        onClick={handleUpdateName}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="text-2xl font-black text-slate-100">{profile.name}</h4>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Rank: <span className="text-indigo-400 font-bold">{getRank(profile.totalXP)}</span>
                  </p>
                </div>
              </div>

              {/* Stats Summary Rows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-850 pt-6 mt-2">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total XP</span>
                  <span className="text-xl font-black text-yellow-400">{profile.totalXP}</span>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Streak</span>
                  <span className="text-xl font-black text-orange-400">{profile.streakCount} days</span>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Words</span>
                  <span className="text-xl font-black text-slate-200">{words.length}</span>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Proficiency</span>
                  <span className="text-xl font-black text-teal-400">{activePair?.proficiencyLevel || "A1"}</span>
                </div>
              </div>
            </div>

            {/* Swift Charts Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-lg text-slate-200">Activity chart</h4>
                <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                  <button className="bg-indigo-500 text-white text-xs font-bold py-1 px-3.5 rounded-lg">Week</button>
                </div>
              </div>

              {/* Graphical representation */}
              <div className="h-44 flex items-end gap-3 px-2 pt-4">
                {dailyStats.slice(-7).map((stat, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {stat.xpEarned}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(10, Math.min(130, stat.xpEarned * 0.8))}px` }}
                    />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {new Date(stat.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive sliders for SRS settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
              <h4 className="font-black text-lg text-slate-200">SRS Intervals Parameters</h4>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>Base repetition intervals (Minutes)</span>
                    <span className="text-indigo-400">{srsBaseMinutes} min</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="1440"
                    step="30"
                    value={srsBaseMinutes}
                    onChange={(e) => setSrsBaseMinutes(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>Complexity coefficient</span>
                    <span className="text-indigo-400">{srsComplexity}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={srsComplexity}
                    onChange={(e) => setSrsComplexity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Binary Game Easter Egg row */}
            <div 
              onClick={startBinaryGame}
              className="bg-gradient-to-r from-indigo-500/10 to-indigo-500/0 border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer rounded-2xl p-6 flex justify-between items-center transition"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Mini-game Easter Egg</span>
                <h4 className="font-black text-lg text-slate-200">Cisco Binary Game</h4>
                <p className="text-xs text-slate-400 mt-0.5">Test your decimal-binary conversion speed!</p>
              </div>
              <span className="text-2xl">⚡ ➔</span>
            </div>

          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 bg-slate-950 border-t border-slate-900 py-3 px-6 flex justify-around items-center">
        <button
          onClick={() => { setActiveTab("home"); setSelectedCategory(null); }}
          className={`flex flex-col items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "home" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => { setActiveTab("assignments"); setSelectedCategory(null); }}
          className={`flex flex-col items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "assignments" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="text-[10px]">Quests</span>
        </button>

        <button
          onClick={() => { setActiveTab("phrase"); setSelectedCategory(null); }}
          className={`flex flex-col items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "phrase" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">✨</span>
          <span className="text-[10px]">Phrases</span>
        </button>

        <button
          onClick={() => { setActiveTab("profile"); setSelectedCategory(null); }}
          className={`flex flex-col items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px]">Profile</span>
        </button>
      </footer>

    </div>
  );
}
