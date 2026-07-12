'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Volume2, Mic, Check, AlertCircle, ChevronLeft, Award, HelpCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Word {
  id: string;
  text: string;
  translation: string;
  context: string | null;
  state: number;
}

export default function PracticePage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // Audio / TTS state
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioCache = useRef<Record<string, string>>({}); // local cache for audio URLs

  // Voice recording / STT state
  const [isRecording, setIsRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttResult, setSttResult] = useState<{ score: number; recognizedText: string; passed: boolean } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Review status
  const [submittingReview, setSubmittingReview] = useState(false);
  const [xpMessage, setXpMessage] = useState('');

  // Load words
  useEffect(() => {
    async function loadWords() {
      try {
        // Try to get due words first
        let res = await fetch(`/neurolang/api/words?deckId=${deckId}&dueOnly=true`);
        let data = await res.json();
        
        if (res.ok && data.words.length > 0) {
          setWords(data.words);
        } else {
          // If no due words, fetch all words in the deck
          res = await fetch(`/neurolang/api/words?deckId=${deckId}`);
          data = await res.json();
          if (res.ok) {
            setWords(data.words);
          }
        }
      } catch (err) {
        console.error('Failed to load words:', err);
      } finally {
        setLoading(false);
      }
    }

    if (deckId) {
      loadWords();
    }
  }, [deckId]);

  const currentWord = words[currentIndex];

  // Preload audio for next word
  useEffect(() => {
    if (words.length > 0 && currentIndex + 1 < words.length) {
      const nextWord = words[currentIndex + 1];
      preloadAudio(nextWord.text);
    }
  }, [currentIndex, words]);

  const preloadAudio = async (text: string) => {
    if (audioCache.current[text]) return;

    try {
      const res = await fetch('/neurolang/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.audioUrl) {
        audioCache.current[text] = data.audioUrl;
      }
    } catch (err) {
      console.error('Preload audio error:', err);
    }
  };

  // Play Audio (TTS)
  const playAudio = async () => {
    if (!currentWord) return;
    setTtsLoading(true);

    try {
      let audioUrl = audioCache.current[currentWord.text];
      
      if (!audioUrl) {
        const res = await fetch('/neurolang/api/speech/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentWord.text }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        if (data.useBrowserSynthesis) {
          // Fallback to browser speech synthesis if no API key
          const utterance = new SpeechSynthesisUtterance(currentWord.text);
          window.speechSynthesis.speak(utterance);
          setTtsLoading(false);
          return;
        }

        audioUrl = data.audioUrl;
        audioCache.current[currentWord.text] = audioUrl;
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTtsLoading(false);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        submitPronunciation(audioBlob);
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSttResult(null);
    } catch (err) {
      console.error('Error starting microphone:', err);
      alert('Microphone access is required to verify pronunciation.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit recorded audio for STT evaluation
  const submitPronunciation = async (audioBlob: Blob) => {
    if (!currentWord) return;
    setSttLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('expectedText', currentWord.text);

      const res = await fetch('/neurolang/api/speech/stt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSttResult({
          score: data.score,
          recognizedText: data.recognizedText,
          passed: data.passed,
        });

        if (data.passed) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      } else {
        alert(data.error || 'Failed to analyze pronunciation.');
      }
    } catch (err) {
      console.error('STT submission error:', err);
    } finally {
      setSttLoading(false);
    }
  };

  // Submit FSRS review rating
  const handleReview = async (rating: number) => {
    if (!currentWord || submittingReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch('/neurolang/api/words/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.id, rating }),
      });
      const data = await res.json();

      if (res.ok) {
        setXpMessage(`+${data.xpEarned} XP!`);
        setTimeout(() => setXpMessage(''), 1500);

        // Progress to next word
        setIsFlipped(false);
        setSttResult(null);
        
        if (currentIndex + 1 < words.length) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished reviews
          setWords([]);
        }
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontWeight: 600 }}>Loading Cards...</h2>
        <div className="loading-shimmer" style={{ width: '200px', height: '8px', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
        <Link href="/neurolang" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'hsl(var(--muted-foreground))',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}>
          <ChevronLeft size={18} />
          Back to Dashboard
        </Link>

        {words.length > 0 && (
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
            Card {currentIndex + 1} of {words.length}
          </span>
        )}
      </div>

      {words.length === 0 ? (
        <div className="glass glow-primary" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 'var(--radius)' }}>
          <Award size={64} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Perfect Stack!</h2>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>
            No more words due in this deck. Come back later for reviews or add new words!
          </p>
          <Link href="/neurolang" style={{
            background: 'hsl(var(--primary))',
            color: '#fff',
            padding: '0.8rem 2rem',
            borderRadius: '0.6rem',
            fontWeight: 700,
          }}>
            Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, justifyContent: 'center' }}>
          
          {/* Card Container */}
          <div className="glass" style={{
            padding: '4rem 2rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            position: 'relative',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            transition: 'all 0.3s',
            border: isFlipped ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            
            {xpMessage && (
              <div style={{
                position: 'absolute',
                top: '1.5rem',
                right: '2rem',
                color: '#ffb020',
                fontWeight: 800,
                fontSize: '1.2rem',
                animation: 'pulse 1s infinite',
              }}>
                {xpMessage}
              </div>
            )}

            {!isFlipped ? (
              // Front of Card
              <>
                <h3 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {currentWord.text}
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  {/* Play TTS */}
                  <button onClick={playAudio} disabled={ttsLoading} className="glass-interactive" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    padding: '0.8rem 1.2rem',
                    borderRadius: '0.6rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#fff',
                  }}>
                    <Volume2 size={18} />
                    <span>{ttsLoading ? 'Playing...' : 'Listen'}</span>
                  </button>

                  {/* Micro record */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={sttLoading}
                    style={{
                      background: isRecording ? 'hsl(var(--destructive))' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      padding: '0.8rem 1.2rem',
                      borderRadius: '0.6rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#fff',
                      animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                    }}
                  >
                    <Mic size={18} />
                    <span>{isRecording ? 'Stop' : 'Speak'}</span>
                  </button>
                </div>

                {sttLoading && <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Analyzing speech...</div>}

                {/* Pronunciation Feedback */}
                {sttResult && (
                  <div className="glass" style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '0.6rem',
                    width: '100%',
                    maxWidth: '400px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.8rem',
                    background: sttResult.passed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: sttResult.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  }}>
                    {sttResult.passed ? (
                      <Check size={20} color="hsl(var(--success))" style={{ marginTop: '0.15rem' }} />
                    ) : (
                      <AlertCircle size={20} color="hsl(var(--destructive))" style={{ marginTop: '0.15rem' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Pronunciation Score: {sttResult.score}%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                        Heard: "{sttResult.recognizedText}"
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Back of Card
              <>
                <h3 style={{ fontSize: '1.4rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                  {currentWord.text}
                </h3>
                
                <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                  {currentWord.translation}
                </h2>

                {currentWord.context && (
                  <p style={{
                    fontSize: '1.1rem',
                    fontStyle: 'italic',
                    color: 'hsl(var(--muted-foreground))',
                    maxWidth: '500px',
                    marginTop: '0.5rem',
                  }}>
                    "{currentWord.context}"
                  </p>
                )}
              </>
            )}

          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {!isFlipped ? (
              <button onClick={() => setIsFlipped(true)} className="glass-interactive" style={{
                background: 'hsl(var(--primary))',
                color: '#fff',
                border: 'none',
                borderRadius: '0.8rem',
                padding: '1rem 3rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                width: '100%',
                maxWidth: '300px',
              }}>
                Show Answer
              </button>
            ) : (
              // FSRS Rating buttons
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>
                <button
                  onClick={() => handleReview(1)}
                  disabled={submittingReview}
                  style={{
                    background: '#ff4b4b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    padding: '1rem 0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Again
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '0.2rem' }}>Forgot</span>
                </button>
                
                <button
                  onClick={() => handleReview(2)}
                  disabled={submittingReview}
                  style={{
                    background: '#ffb020',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    padding: '1rem 0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Hard
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '0.2rem' }}>Struggled</span>
                </button>

                <button
                  onClick={() => handleReview(3)}
                  disabled={submittingReview}
                  style={{
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    padding: '1rem 0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'opacity 0.2s',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Good
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '0.2rem' }}>Remembered</span>
                </button>

                <button
                  onClick={() => handleReview(4)}
                  disabled={submittingReview}
                  style={{
                    background: 'hsl(var(--success))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    padding: '1rem 0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Easy
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '0.2rem' }}>Instant</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
