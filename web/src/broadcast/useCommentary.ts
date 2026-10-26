import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Story } from '../contracts';
import { useClubs } from '../clubs/Clubs';
import { suitableVoices } from './voiceChoices';
import { commentaryCopy, narrationIdentity, commentaryRank } from './commentaryCopy';

const voiceKey = (voice: SpeechSynthesisVoice) => voice.voiceURI || `${voice.name}|${voice.lang}`;

/** Local voices only. One replaceable utterance; callbacks are generation guarded. */
export function useCommentary(scope: string, seekRevision: number) {
  const clubs = useClubs();
  const [commentary, setCommentary] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [caption, setCaption] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [rate, setRateState] = useState(1);
  const [status, setStatus] = useState<'idle' | 'speaking' | 'failed'>('idle');
  const generation = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const seen = useRef(new Map<string, number>());
  const api = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  const voice = useMemo(() => voices.find(v => voiceKey(v) === voiceId) ?? voices[0] ?? null, [voices, voiceId]);

  const cancel = useCallback(() => {
    generation.current++;
    utterance.current = null;
    api?.cancel();
    setStatus('idle');
  }, [api]);

  useEffect(() => {
    const refresh = () => setVoices(suitableVoices(api?.getVoices() ?? []));
    refresh();
    if (api?.addEventListener) api.addEventListener('voiceschanged', refresh);
    else if (api) api.onvoiceschanged = refresh;
    return () => {
      api?.removeEventListener?.('voiceschanged', refresh);
      if (api?.onvoiceschanged === refresh) api.onvoiceschanged = null;
    };
  }, [api]);
  useEffect(() => { if (!voice) { setCommentary(false); cancel(); } }, [voice, cancel]);
  useEffect(() => { cancel(); setCaption(''); }, [scope, seekRevision, clubs.revision, cancel]);
  useEffect(() => { seen.current.clear(); }, [seekRevision, clubs.revision]);
  useEffect(() => () => {
    generation.current++;
    utterance.current = null;
    api?.cancel();
  }, [api]);

  const speak = useCallback((text: string) => {
    setCaption(text);
    cancel();
    if (!api || !voice || !text.trim()) return false;
    const own = generation.current;
    const item = new SpeechSynthesisUtterance(text);
    item.voice = voice;
    item.lang = voice.lang;
    item.rate = rate;
    item.pitch = 1;
    item.onend = () => {
      if (generation.current === own) { utterance.current = null; setStatus('idle'); }
    };
    item.onerror = () => {
      if (generation.current === own) { utterance.current = null; setStatus('failed'); }
    };
    utterance.current = item;
    setStatus('speaking');
    try { api.speak(item); return true; }
    catch {
      if (generation.current === own) { utterance.current = null; setStatus('failed'); }
      return false;
    }
  }, [api, voice, rate, cancel]);

  const onArrival = useCallback((story: Story) => {
    const line = commentaryCopy(story, clubs.name);
    if (!line) return;
    const ids = narrationIdentity(story);
    const rank = commentaryRank[story.type] ?? 0;
    if (ids.some(id => (seen.current.get(id) ?? -1) >= rank)) return;
    ids.forEach(id => seen.current.set(id, rank));
    if (seen.current.size > 100) seen.current = new Map([...seen.current].slice(-50));
    setCaption(line);
    if (commentary) speak(line);
  }, [clubs.name, commentary, speak]);

  const preview = useCallback((story: Story | undefined, _fallback: string, historical = false) => {
    const line = story ? commentaryCopy(story, clubs.name, historical) : null;
    if (!line) {
      cancel();
      setCaption('No supported spoken summary for this moment. Explore its source explanation.');
      return false;
    }
    return speak(line);
  }, [clubs.name, speak, cancel]);
  const toggleCommentary = useCallback(() => {
    cancel();
    setCommentary(enabled => !enabled && !!voice);
  }, [cancel, voice]);

  return {
    commentary: commentary && !!voice, captions, caption, voiceAvailable: !!voice,
    voices, voiceId: voice ? voiceKey(voice) : '', rate, status,
    toggleCommentary, setCaptions, onArrival, preview, cancel,
    stop: () => { setCommentary(false); cancel(); },
    selectVoice: (id: string) => { cancel(); setVoiceId(id); },
    setRate: (value: number) => {
      if (Number.isFinite(value) && value >= .85 && value <= 1.15) { cancel(); setRateState(value); }
    },
    previewVoice: () => speak('Welcome to Turn of Play. Explore the recorded moments, and check the evidence.'),
    voiceKey,
  };
}
