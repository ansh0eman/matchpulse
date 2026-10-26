import { createContext, useContext, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Team } from "../contracts";
import { clubs, contrast, inkFor } from "./clubRegistry";
type Mapping = Record<Team,string>;
function useMapping() {
 const [mapping,setMapping]=useState<Mapping>({NORTH:"manchester-city",SOUTH:"manchester-united"});
 return useMemo(()=>{
  const north=clubs.find(c=>c.id===mapping.NORTH)!; const south=clubs.find(c=>c.id===mapping.SOUTH)!;
  const club=(team:Team)=>team==="NORTH"?north:south;
  const name=(team:string|null|undefined)=>team==="NORTH"||team==="SOUTH"?club(team).name:"The match";
  // Only approved presentation prose passes here. Never transform raw evidence/IDs.
  const text=(value:string)=>value.replace(/\b(NORTH|North|SOUTH|South)(?: FC)?\b/g,side=>name(/^north/i.test(side)?"NORTH":"SOUTH"));
  const marker=(team:Team)=>{const c=club(team);const paired=contrast(north.primary,south.primary)<1.7;const fill=team==="SOUTH"&&paired&&contrast(north.primary,south.secondary)>=2?south.secondary:c.primary;return {fill,ink:inkFor(fill),outline:team==="SOUTH"?"#FFFFFF":"#101820",dashed:team==="SOUTH"&&paired};};
  const style={"--club-north":marker("NORTH").fill,"--club-south":marker("SOUTH").fill} as CSSProperties;
  return {mapping,club,name,text,marker,style,revision:JSON.stringify(mapping),setClub:(team:Team,id:string)=>{if(clubs.some(c=>c.id===id))setMapping(prev=>({...prev,[team]:id}))},swap:()=>setMapping(prev=>({NORTH:prev.SOUTH,SOUTH:prev.NORTH}))};
 },[mapping]);
}
const Context=createContext<ReturnType<typeof useMapping>|null>(null);
export function ClubsProvider({children}:{children:ReactNode}) { const value=useMapping();return <Context.Provider value={value}>{children}</Context.Provider> }
export function useClubs(){const value=useContext(Context);if(!value)throw new Error("Club presentation provider missing");return value}
export function ClubChoices(){const c=useClubs();return <fieldset className="club-choices"><legend>Presentation clubs</legend><p>Real club labels on synthetic observations. These are not actual club performances. Selection changes labels, not the recorded game.</p>{(["NORTH","SOUTH"] as const).map((side,i)=><label key={side}>{i===0?"Home label":"Away label"}<select aria-label={i===0?"Home presentation club":"Away presentation club"} value={c.mapping[side]} onChange={e=>c.setClub(side,e.target.value)}>{clubs.map(club=><option key={club.id} value={club.id}>{club.name}</option>)}</select></label>)}<button onClick={c.swap}>Swap club labels</button><small>Canonical NORTH → {c.name("NORTH")}; SOUTH → {c.name("SOUTH")}. Colours are UI candidates from official assets; contrast treatments are not official away kits.</small></fieldset>}
export function MappingNote(){const c=useClubs();return <p className="club-mapping-note">Synthetic observations. Display labels: NORTH → {c.name("NORTH")}; SOUTH → {c.name("SOUTH")}. Raw evidence retains canonical source identities.</p>}
