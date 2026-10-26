import type { Story,Team } from '../contracts';
const words=['nil','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const number=(n:number)=>words[n] ?? String(n);
/** Short supported presentation only. Raw evidence and exact values stay in Proof Lens. */
export function commentaryCopy(story:Story,name:(team:Team)=>string,historical=false):string|null {
 if(!story.claim_ids.length || !story.overlay.references.length)return null;
 const metric=(key:string)=>story.overlay.metrics.find(m=>m.name===key&&story.claim_ids.includes(m.claim_id)&&Number.isFinite(m.value))?.value;
 const club=story.team?name(story.team):null;let line:string|null=null;
 if(story.type==='observed_shot'&&club)line=`A shot from ${club}.`;
 else if(story.type==='goal_context'&&club){const h=metric('NORTH_after'),a=metric('SOUTH_after');if(h!==undefined&&a!==undefined&&Number.isInteger(h)&&Number.isInteger(a)&&h>=0&&a>=0)line=`${club} have scored. It's ${number(h)}–${number(a)}.`;}
 else if(story.type==='observed_line_height_change'&&club){const change=metric('change');if(change!==undefined)line=`${club}'s three deepest outfielders were about ${number(Math.round(Math.abs(change)))} metres ${change>=0?'higher':'deeper'} in the recent comparable samples.`;}
 else if(story.type==='turnover_to_shot'&&club&&metric('elapsed')!==undefined)line=`A regain followed by a shot from ${club}, in the same recorded possession.`;
 else if(story.type==='match_boundary'&&story.source_seconds===0&&/start/i.test(story.narration.headline))line="We're under way.";
 return line ? `${historical?'Selected historical moment. ':''}${line}` : null;
}
/** Identity uses exact registered event references; never suppress distinct events by their minute. */
export function narrationIdentity(story:Story):string[] {const events=story.overlay.references.filter(r=>r.category==='event').map(r=>`${r.match_id}|${r.source_id}`);return events.length?events:[story.id]}
export const commentaryRank:Record<string,number>={goal_context:100,observed_line_height_change:70,turnover_to_shot:60,observed_shot:40,match_boundary:10};
