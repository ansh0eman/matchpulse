import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CheckIcon, CaretDownIcon } from "@phosphor-icons/react";
import type { Audience, Team } from "../contracts";
import { useClubs } from "../clubs/Clubs";
export function ViewModeControl({ value, onChange }: { value: Audience; onChange: (mode: Audience) => void }) {
  return <div className="view-mode-control" aria-label="Audience">{(["fan", "analyst"] as const).map((mode) => <button key={mode} aria-pressed={value === mode} onClick={() => onChange(mode)}>{mode === "fan" ? "Fan view" : "Analyst view"}</button>)}</div>;
}
export function FollowingControl({ value, onChange }: { value: Team | ""; onChange: (team: Team | "") => void }) {
 const clubs=useClubs(); const [open,setOpen]=useState(false); const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const initialFocus=useRef(0);
 const options=(["","NORTH","SOUTH"] as const);const label=(side:Team|"")=>side?clubs.name(side):"Both teams";
 const focus=(index:number)=>root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[index]?.focus();
 useLayoutEffect(()=>{if(open)focus(initialFocus.current)},[open]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
 return <div className="following-control" ref={root} onKeyDown={e=>{if(e.key==='Escape'&&open){e.stopPropagation();setOpen(false);trigger.current?.focus()}}}><span>Following</span><button ref={trigger} aria-label={`Favorite team: ${label(value)}`} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(!open)} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();initialFocus.current=e.key==='ArrowUp'?2:0;setOpen(true)}}}>{value&&<i className="club-dot" style={{background:clubs.marker(value).fill}}/>}<span>{label(value)}</span><CaretDownIcon size={12} aria-hidden="true"/></button>{open&&<div role="menu" aria-label="Follow a club" className="following-menu">{options.map((side,index)=><button key={side} role="menuitemradio" aria-checked={side===value} onClick={()=>{onChange(side);setOpen(false);trigger.current?.focus()}} onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();focus(e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowDown'?1:2))%3)}}}>{side&&<i className="club-dot" style={{background:clubs.marker(side).fill}}/>}<span>{label(side)}</span>{side===value&&<CheckIcon size={14} aria-label="Selected"/>}</button>)}</div>}</div>;
}
