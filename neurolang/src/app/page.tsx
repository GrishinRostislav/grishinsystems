'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, Award, Zap, Plus, BookMarked, User } from 'lucide-react';

interface Deck {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    words: number;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  xp: number;
  streak: number;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New deck form state
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [deckError, setDeckError] = useState('');

  // New word form state
  const [newWordText, setNewWordText] = useState('');
  const [newWordTranslation, setNewWordTranslation] = useState('');
  const [newWordContext, setNewWordContext] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [addingWord, setAddingWord] = useState(false);
  const [wordError, setWordError] = useState('');
  const [wordSuccess, setWordSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const sessionRes = await fetch('/neurolang/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (!sessionRes.ok || !sessionData.authenticated) {
          router.push('/login');
          return;
        }

        setProfile(sessionData.user);

        const decksRes = await fetch('/neurolang/api/decks');
        const decksData = await decksRes.json();
        if (decksRes.ok) {
          setDecks(decksData.decks);
          if (decksData.decks.length > 0) {
            setSelectedDeckId(decksData.decks[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/neurolang/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    setCreatingDeck(true);
    setDeckError('');

    try {
      const res = await fetch('/neurolang/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeckName, description: newDeckDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        setDecks([data.deck, ...decks]);
        setNewDeckName('');
        setNewDeckDesc('');
        if (!selectedDeckId) setSelectedDeckId(data.deck.id);
      } else {
        setDeckError(data.error || 'Failed to create deck');
      }
    } catch (err) {
      setDeckError('Connection error.');
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim() || !newWordTranslation.trim() || !selectedDeckId) return;

    setAddingWord(true);
    setWordError('');
    setWordSuccess(false);

    try {
      const res = await fetch('/neurolang/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newWordText,
          translation: newWordTranslation,
          context: newWordContext,
          deckId: selectedDeckId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewWordText('');
        setNewWordTranslation('');
        setNewWordContext('');
        setWordSuccess(true);
        
        // Update deck count locally
        setDecks(decks.map(d => {
          if (d.id === selectedDeckId) {
            return {
              ...d,
              _count: { words: d._count.words + 1 }
            };
          }
          return d;
        }));

        setTimeout(() => setWordSuccess(false), 3000);
      } else {
        setWordError(data.error || 'Failed to add word');
      }
    } catch (err) {
      setWordError('Connection error.');
    } finally {
      setAddingWord(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontWeight: 600 }}>Loading Dashboard...</h2>
        <div className="loading-shimmer" style={{ width: '200px', height: '8px', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header className="glass" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.2rem 2rem',
        borderRadius: 'var(--radius)',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            padding: '0.6rem',
            borderRadius: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BookOpen size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>NeuroLang</h1>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Web Version v1.0</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffb020' }}>
                <Award size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.xp} XP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff4b4b' }}>
                <Zap size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.streak} Days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid hsl(var(--border))', paddingLeft: '1.2rem' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={16} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile.name || profile.email.split('@')[0]}</span>
              </div>
            </div>
          )}

          <button onClick={handleLogout} style={{
            background: 'transparent',
            border: 'none',
            color: 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'color 0.2s',
          }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        
        {/* Left Side: Decks list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Your Decks</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {decks.length === 0 ? (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius)', color: 'hsl(var(--muted-foreground))' }}>
                <BookMarked size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>You don't have any vocabulary decks yet.</p>
                <p style={{ fontSize: '0.85rem' }}>Create one below to start learning!</p>
              </div>
            ) : (
              decks.map(deck => (
                <div key={deck.id} className="glass glass-interactive" style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxWidth: '70%' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{deck.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                      {deck.description || 'No description provided'}
                    </p>
                    <span style={{
                      fontSize: '0.8rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: 'hsl(var(--primary))',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.4rem',
                      width: 'fit-content',
                      fontWeight: 600,
                      marginTop: '0.4rem',
                    }}>
                      {deck._count.words} words
                    </span>
                  </div>

                  <Link href={`/practice/${deck.id}`} className="glass-interactive" style={{
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '0.6rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                    transition: 'transform 0.2s',
                  }}>
                    Practice (FSRS)
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Create Deck Form */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} />
              Create New Deck
            </h3>
            <form onSubmit={handleCreateDeck} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Deck Name (e.g. Spanish Vocabulary)"
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  padding: '0.7rem 0.9rem',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
              <input
                type="text"
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
                placeholder="Short Description (e.g. Words from A1 Greetings)"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  padding: '0.7rem 0.9rem',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
              {deckError && <span style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem' }}>{deckError}</span>}
              <button
                type="submit"
                disabled={creatingDeck || !newDeckName.trim()}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid hsl(var(--border))',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  padding: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {creatingDeck ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Add word directly to active deck */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Add Card</h2>
          
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)' }}>
            <form onSubmit={handleAddWord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Deck</label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  style={{
                    background: '#18181b',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  {decks.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Word or Phrase (Target Language)</label>
                <input
                  type="text"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  placeholder="e.g. Bonjour"
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Translation</label>
                <input
                  type="text"
                  value={newWordTranslation}
                  onChange={(e) => setNewWordTranslation(e.target.value)}
                  placeholder="e.g. Hello / Good morning"
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Context Example (Optional)</label>
                <textarea
                  value={newWordContext}
                  onChange={(e) => setNewWordContext(e.target.value)}
                  placeholder="e.g. Bonjour, comment ça va?"
                  rows={3}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'none',
                  }}
                />
              </div>

              {wordError && <span style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem' }}>{wordError}</span>}
              {wordSuccess && (
                <span style={{
                  color: 'hsl(var(--success))',
                  fontSize: '0.85rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  textAlign: 'center',
                }}>
                  Word added successfully!
                </span>
              )}

              <button
                type="submit"
                disabled={addingWord || !newWordText.trim() || !newWordTranslation.trim() || !selectedDeckId}
                className="glass-interactive"
                style={{
                  background: 'hsl(var(--primary))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
                }}
              >
                {addingWord ? 'Adding Word...' : 'Add Word'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
