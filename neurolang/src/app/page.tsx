"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Profile {
  id: string;
  name: string;
  totalXP: number;
  streakCount: number;
  lastPracticeDate?: string;
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
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "assignments" | "phrase" | "profile">("home");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [activePair, setActivePair] = useState<LanguagePair | null>(null);
  
  // Vocabulary States
  const [words, setWords] = useState<Word[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newTranslate, setNewTranslate] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [showAddWord, setShowAddWord] = useState(false);
  const [showPairSelector, setShowPairSelector] = useState(false);

  // Active Practice Session
  const [practiceWords, setPracticeWords] = useState<Word[]>([]);
  const [currentPracticeIdx, setCurrentPracticeIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Phrase Builder States
  const [phraseTarget, setPhraseTarget] = useState("The weather is nice today");
  const [phraseOptions, setPhraseOptions] = useState<string[]>(["The", "weather", "is", "nice", "today", "yesterday", "rainy", "beautiful"]);
  const [phraseSelected, setPhraseSelected] = useState<string[]>([]);
  const [phraseStatus, setPhraseStatus] = useState<"building" | "correct" | "incorrect">("building");

  // Load Initial Data
  useEffect(() => {
    fetchProfile();
    fetchLanguages();
    fetchWords();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const res = await fetch("/api/languages");
      const data = await res.json();
      setLanguagePairs(data);
      const active = data.find((p: LanguagePair) => p.isActive);
      setActivePair(active || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWords = async () => {
    try {
      const res = await fetch("/api/words");
      const data = await res.json();
      setWords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectLanguagePair = async (pairId: string) => {
    try {
      const res = await fetch("/api/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pairId, isActive: true }),
      });
      if (res.ok) {
        setShowPairSelector(false);
        fetchLanguages();
        fetchWords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createLanguagePair = async (source: string, target: string) => {
    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceLanguage: source, targetLanguage: target, isActive: true }),
      });
      if (res.ok) {
        fetchLanguages();
        fetchWords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;
    try {
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
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (wordId: string, mistakes: number) => {
    try {
      const res = await fetch("/api/words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wordId, mistakes }),
      });
      if (res.ok) {
        // Increment XP in UI
        if (profile) {
          const updatedXp = profile.totalXP + (mistakes === 0 ? 10 : 2);
          setProfile({ ...profile, totalXP: updatedXp });
          // Save updated XP back
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalXP: updatedXp }),
          });
        }
        
        // Progress practice index or finish
        if (currentPracticeIdx + 1 < practiceWords.length) {
          setCurrentPracticeIdx(currentPracticeIdx + 1);
          setIsFlipped(false);
        } else {
          // Finished Practice Session
          setPracticeWords([]);
          setCurrentPracticeIdx(0);
          setIsFlipped(false);
          fetchWords();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startPractice = (filteredWords: Word[]) => {
    if (filteredWords.length === 0) return;
    setPracticeWords(filteredWords);
    setCurrentPracticeIdx(0);
    setIsFlipped(false);
  };

  // Compute stats
  const dueWords = words.filter(w => {
    if (!w.whenRepeat) return true;
    return new Date(w.whenRepeat) <= new Date();
  });

  const categories = ["All", ...Array.from(new Set(words.map(w => w.category)))];

  const filteredWords = words.filter(w => {
    const matchesCategory = categoryFilter === "All" || w.category === categoryFilter;
    const matchesSearch = w.origin.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.translate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFlag = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "russian": return "🇷🇺";
      case "english": return "🇬🇧";
      case "spanish": return "🇪🇸";
      case "french": return "🇫🇷";
      case "german": return "🇩🇪";
      default: return "🌐";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 text-teal-400 p-2 rounded-xl border border-teal-500/20 font-bold tracking-tight text-lg">
            🧠 NeuroLang
          </div>
          {activePair && (
            <button 
              onClick={() => setShowPairSelector(true)}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 transition px-3 py-1.5 rounded-lg border border-slate-800 text-sm font-medium"
            >
              <span>{getFlag(activePair.sourceLanguage)}</span>
              <span className="text-slate-400">→</span>
              <span>{getFlag(activePair.targetLanguage)}</span>
            </button>
          )}
        </div>

        {profile && (
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5 text-orange-400 text-sm font-semibold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
              🔥 <span className="text-orange-300">{profile.streakCount} days</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
              ⚡ <span className="text-yellow-300">{profile.totalXP} XP</span>
            </div>
          </div>
        )}
      </header>

      {/* Main content grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* Practice Modal / Overlay */}
        {practiceWords.length > 0 && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl relative">
              <button 
                onClick={() => setPracticeWords([])}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition text-lg"
              >
                ✕
              </button>

              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold tracking-wider uppercase">
                <span>Card Review</span>
                <span>{currentPracticeIdx + 1} / {practiceWords.length}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full transition-all duration-300"
                  style={{ width: `${((currentPracticeIdx + 1) / practiceWords.length) * 100}%` }}
                />
              </div>

              {/* Flashcard container */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-slate-950 hover:border-slate-800 border border-slate-900 cursor-pointer rounded-2xl p-10 h-64 flex flex-col items-center justify-center text-center transition relative overflow-hidden"
              >
                <div className="absolute top-2 right-3 text-xs text-slate-600 font-semibold uppercase">
                  Click to Flip
                </div>
                {!isFlipped ? (
                  <div className="text-2xl font-semibold text-slate-200">
                    {practiceWords[currentPracticeIdx].origin}
                  </div>
                ) : (
                  <div className="text-2xl font-semibold text-teal-400">
                    {practiceWords[currentPracticeIdx].translate}
                  </div>
                )}
              </div>

              {/* Grade buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => submitReview(practiceWords[currentPracticeIdx].id, 1)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold py-3 px-4 rounded-xl transition"
                >
                  🔴 Again (12h)
                </button>
                <button
                  onClick={() => submitReview(practiceWords[currentPracticeIdx].id, 0)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 px-4 rounded-xl transition"
                >
                  🟢 Got it!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Word Modal */}
        {showAddWord && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <form 
              onSubmit={handleAddWord}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-100">Add New Word</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Foreign Word (Origin)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. солнце"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Translation (Native)</label>
                <input
                  type="text"
                  placeholder="e.g. Sun"
                  value={newTranslate}
                  onChange={(e) => setNewTranslate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="General">General</option>
                  <option value="Verbs">Verbs</option>
                  <option value="Nouns">Nouns</option>
                  <option value="Adjectives">Adjectives</option>
                  <option value="Phrases">Phrases</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWord(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-2 px-4 rounded-xl text-sm transition"
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Language Selector Modal */}
        {showPairSelector && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100">Select Language Pair</h3>
              
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {languagePairs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectLanguagePair(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition ${
                      p.isActive 
                        ? "bg-teal-500/10 border-teal-500/40 text-teal-400" 
                        : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span>{getFlag(p.sourceLanguage)} {p.sourceLanguage} → {getFlag(p.targetLanguage)} {p.targetLanguage}</span>
                    {p.isActive && <span className="text-teal-400">✓</span>}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Create New Pair</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => createLanguagePair("English", "Spanish")}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2.5 rounded-lg text-xs font-semibold transition"
                  >
                    🇬🇧 → 🇪🇸 Spanish
                  </button>
                  <button
                    onClick={() => createLanguagePair("English", "Russian")}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2.5 rounded-lg text-xs font-semibold transition"
                  >
                    🇬🇧 → 🇷🇺 Russian
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowPairSelector(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab content renderer */}
        <main className="flex-1 flex flex-col gap-6">
          {activeTab === "home" && (
            <div className="flex flex-col gap-6">
              
              {/* Practice cards / Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SRS Review Banner */}
                <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/20 rounded-3xl p-6 flex flex-col justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">Spaced Repetition Review</span>
                    <h3 className="text-2xl font-bold text-slate-100">Review Flashcards</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      You have <span className="text-teal-400 font-semibold">{dueWords.length} words</span> waiting to be reviewed.
                    </p>
                  </div>
                  <button
                    disabled={dueWords.length === 0}
                    onClick={() => startPractice(dueWords)}
                    className="bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm transition"
                  >
                    Start Review ({dueWords.length})
                  </button>
                </div>

                {/* Add vocabulary cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Quick Actions</span>
                    <h3 className="text-2xl font-bold text-slate-100">Expand Vocabulary</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Add new custom words to practice lists and track them with smart intervals.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddWord(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-2xl text-sm border border-slate-700 transition"
                  >
                    + Add New Word
                  </button>
                </div>

              </div>

              {/* Dictionary and words lists */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-200">Word Feed</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search words..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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
                            ? "bg-teal-500/5 border-teal-500/10" 
                            : "bg-slate-900/40 border-slate-900"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-500 font-semibold bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                            {w.category}
                          </span>
                          {isDue && (
                            <span className="text-[10px] text-teal-400 font-bold uppercase bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                              Due
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-200">{w.origin}</span>
                          <span className="text-sm text-teal-400">{w.translate}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                          <span>Accuracy: {w.rightAnswer}/{w.rightAnswer + w.wrongAnswer}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {activeTab === "assignments" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-slate-100">Assignments &amp; Quests</h3>
              <p className="text-slate-400 text-sm">
                Complete daily assignments to earn extra XP booster points and level up!
              </p>

              <div className="flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-teal-400 font-bold uppercase tracking-wider">Daily Quest</span>
                    <h4 className="text-lg font-semibold text-slate-200">Practice 10 Words</h4>
                    <p className="text-xs text-slate-500">Practice new vocabulary words using flashcards</p>
                  </div>
                  <button 
                    onClick={() => startPractice(words.slice(0, 10))}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-4 py-2 rounded-xl text-sm transition"
                  >
                    Start
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Perfect Streak</span>
                    <h4 className="text-lg font-semibold text-slate-200">Review 5 Due Words</h4>
                    <p className="text-xs text-slate-500">Graduated SRS review items</p>
                  </div>
                  <button 
                    disabled={dueWords.length === 0}
                    onClick={() => startPractice(dueWords.slice(0, 5))}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 disabled:opacity-50 font-semibold px-4 py-2 rounded-xl text-sm transition"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "phrase" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-teal-400 font-bold uppercase tracking-wider">Interactive Game</span>
                <h3 className="text-2xl font-bold text-slate-100">Phrase Builder</h3>
                <p className="text-slate-400 text-sm">
                  Assemble target sentences from separate word tiles. Click tiles to arrange them correctly!
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 text-center min-h-[100px] justify-center">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assemble this sentence:</span>
                <span className="text-lg font-semibold text-slate-300">Солнечная погода сегодня очень приятная</span>
                <span className="text-xs text-slate-600">(Target: "{phraseTarget}")</span>
              </div>

              {/* Selected tiles */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-4 min-h-[60px] flex flex-wrap gap-2 items-center">
                {phraseSelected.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPhraseSelected(phraseSelected.filter((_, i) => i !== idx));
                      setPhraseStatus("building");
                    }}
                    className="bg-teal-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-sm transition hover:bg-teal-400"
                  >
                    {word} ✕
                  </button>
                ))}
              </div>

              {/* Pool of options */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {phraseOptions.map((word, idx) => {
                  const isUsed = phraseSelected.includes(word);
                  return (
                    <button
                      key={idx}
                      disabled={isUsed}
                      onClick={() => {
                        setPhraseSelected([...phraseSelected, word]);
                        setPhraseStatus("building");
                      }}
                      className={`font-semibold px-4 py-2 rounded-xl text-sm border transition ${
                        isUsed
                          ? "bg-slate-950 border-slate-950 text-slate-700 cursor-not-allowed"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {/* Control buttons */}
              <div className="flex gap-4 justify-between items-center mt-4">
                <button
                  onClick={() => {
                    setPhraseSelected([]);
                    setPhraseStatus("building");
                  }}
                  className="text-sm text-slate-400 hover:text-slate-200 transition font-semibold"
                >
                  Clear All
                </button>

                <div className="flex gap-3">
                  {phraseStatus === "correct" && (
                    <span className="text-teal-400 font-semibold text-sm flex items-center">✓ Correct! +10 XP</span>
                  )}
                  {phraseStatus === "incorrect" && (
                    <span className="text-red-400 font-semibold text-sm flex items-center">✕ Try again!</span>
                  )}
                  <button
                    onClick={() => {
                      const joined = phraseSelected.join(" ");
                      if (joined.toLowerCase() === phraseTarget.toLowerCase()) {
                        setPhraseStatus("correct");
                      } else {
                        setPhraseStatus("incorrect");
                      }
                    }}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
                  >
                    Check Answer
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && profile && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-slate-100">Student Profile</h3>

              <div className="flex gap-6 items-center flex-wrap">
                <div className="w-20 h-20 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-4xl border border-teal-500/30">
                  🧑‍🎓
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xl font-bold text-slate-100">{profile.name}</h4>
                  <p className="text-xs text-slate-500">Joined NeuroLang on {new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total XP</span>
                  <span className="text-2xl font-bold text-yellow-400">{profile.totalXP}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Streak</span>
                  <span className="text-2xl font-bold text-orange-400">{profile.streakCount} days</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Words</span>
                  <span className="text-2xl font-bold text-slate-100">{words.length}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Proficiency</span>
                  <span className="text-2xl font-bold text-teal-400">{activePair?.proficiencyLevel || "A1"}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 bg-slate-950 border-t border-slate-900 py-3 px-6 flex justify-around items-center">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
            activeTab === "home" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
            activeTab === "assignments" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">📋</span>
          <span>Quests</span>
        </button>

        <button
          onClick={() => setActiveTab("phrase")}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
            activeTab === "phrase" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">✨</span>
          <span>Phrase Builder</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
            activeTab === "profile" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-xl">👤</span>
          <span>Profile</span>
        </button>
      </footer>

    </div>
  );
}
