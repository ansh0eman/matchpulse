// Web Speech has no quality/category field. Exclude known novelty effects by name;
// all remaining choices must still declare localService and English language.
const novelty = new Set(['bad news','bahh','bells','boing','bubbles','cellos','good news','jester','junior','organ','superstar','trinoids','whisper','wobble','zarvox']);
export function suitableVoices(voices:SpeechSynthesisVoice[]) {
  const preference=['Daniel','Samantha','Moira','Karen','Rishi'];
  const rank=(v:SpeechSynthesisVoice)=>{const i=preference.indexOf(v.name);return i<0?preference.length:i};
  return voices.filter(v=>v.localService && /^en(-|$)/i.test(v.lang) && !novelty.has(v.name.toLowerCase())).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name));
}
