import { useClubs } from "../clubs/Clubs";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Audience, Story } from "../contracts";
import { clockText } from "../time";
import { momentCopy } from "./presentation";
import { timePercent } from "./timeAxis";

const labels: Record<string,string> = { goal_context:"Goal", observed_shot:"Shot", observed_line_height_change:"Line comparison", turnover_to_shot:"Regain to shot", match_boundary:"Match event", shot_outcome:"Shot outcome", recent_attacking_activity:"Attacking spell", high_turnover:"High regain", player_dismissal:"Red card", dismissal:"Red card" };
export function clusterMoments(moments: Story[], duration: number, minFraction = .015) {
  const groups: { id: string; start:number; end:number; stories:Story[] }[] = [];
  for (const story of [...moments].sort((a,b)=>a.source_seconds-b.source_seconds || a.id.localeCompare(b.id))) {
    if (timePercent(story.source_seconds,duration) === null) continue;
    const last=groups.at(-1);
    if (last && (story.source_seconds-last.start)/duration <= minFraction) { last.stories.push(story); last.end=story.source_seconds; }
    else groups.push({id:story.id,start:story.source_seconds,end:story.source_seconds,stories:[story]});
  }
  return groups;
}
export function MatchTimeline(p: { moments:Story[]; replayClock:number; duration:number; seekRevision:number; scenarioId?:string; audience:Audience; selected?:string; latest?:string; arrival?:string; arrivalRevision:number; select:(story:Story,reveal:boolean)=>void }) {
  const clubs=useClubs();
  const [openGroup,setOpenGroup]=useState<string|null>(null);
  const [peek,setPeek]=useState<string|null>(null);
  const pointerType=useRef<string|null>(null);
  const axisRef=useRef<HTMLDivElement>(null);
  const tooltipRef=useRef<HTMLDivElement>(null);
  const [axisWidth,setAxisWidth]=useState(600);
  const [tooltipPosition,setTooltipPosition]=useState({top:0,left:0});
  useEffect(()=>{setOpenGroup(null);setPeek(null)},[p.seekRevision,p.scenarioId]);
  useEffect(()=>{
    const close=(event:PointerEvent)=>{if(!axisRef.current?.contains(event.target as Node)){setOpenGroup(null);setPeek(null)}};
    document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);
  },[]);
  useEffect(()=>{const element=axisRef.current;if(!element)return;const observer=new ResizeObserver(()=>setAxisWidth(Math.max(1,element.clientWidth)));observer.observe(element);return()=>observer.disconnect()},[]);
  const moments=p.moments.filter(s=>Math.max(s.source_seconds,s.available_seconds,s.presented_seconds)<=p.replayClock);
  const groups=clusterMoments(moments,p.duration,48/axisWidth);
  const selected=moments.find(s=>s.id===p.selected);
  const peekGroup=!openGroup?groups.find(group=>group.id===peek):undefined;
  const peekIndex=groups.findIndex(group=>group.id===peekGroup?.id);
  useLayoutEffect(()=>{
    if(!peekGroup || !axisRef.current || !tooltipRef.current)return;
    const place=()=>{
      const axis=axisRef.current!.getBoundingClientRect(),tooltip=tooltipRef.current!.getBoundingClientRect();
      const header=document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0;
      const anchor=axis.left+(timePercent(peekGroup.start,p.duration)??0)*axis.width/100;
      setTooltipPosition({left:Math.max(8,Math.min(innerWidth-tooltip.width-8,anchor-tooltip.width/2)),top:Math.max(header+8,Math.min(innerHeight-tooltip.height-8,axis.top-tooltip.height-10))});
    };
    place();window.addEventListener('scroll',place,true);window.addEventListener('resize',place);
    return()=>{window.removeEventListener('scroll',place,true);window.removeEventListener('resize',place)};
  },[peekGroup?.id,peekGroup?.stories.length,axisWidth,clubs.revision,p.selected,p.duration]);

  // Labels may move within a collision-free lane; source anchors never move.
  const labelWidth=axisWidth>600?140:132;
  const occupied:{left:number;right:number}[]=[];
  const placements=new Map<string,number>();
  const candidates=[...groups].sort((a,b)=>Number(b.stories.some(s=>s.id===p.selected))-Number(a.stories.some(s=>s.id===p.selected))||b.start-a.start);
  for(const group of candidates){
    const x=(timePercent(group.start,p.duration)??0)*axisWidth/100;
    const left=Math.max(0,Math.min(axisWidth-labelWidth,x-labelWidth/2)),right=left+labelWidth;
    if(occupied.every(box=>right+10<=box.left || left>=box.right+10)){occupied.push({left,right});placements.set(group.id,left-x)}
  }
  const position=timePercent(p.replayClock,p.duration)??0;
  const kind=(story:Story)=>labels[story.type]??'Moment';
  const description=(story:Story)=>`${clockText(story.source_seconds)} · ${story.team?clubs.name(story.team)+' · ':''}${kind(story)}${p.selected===story.id?' · Selected history':''}`;
  const label=(story:Story)=>`${kind(story)}, incident ${clockText(story.source_seconds)}. ${clubs.text(momentCopy(story,p.audience).title)}${p.selected===story.id?'. Selected past moment':p.latest===story.id?'. Latest recorded':''}`;
  const focusTrigger=(index:number)=>document.querySelector<HTMLButtonElement>(`[aria-controls="incident-cluster-${index}"]`)?.focus();
  const dismiss=(index:number)=>{setOpenGroup(null);focusTrigger(index);setPeek(null)};
  const show=(id:string)=>setPeek(id);
  const select=(story:Story,event:React.MouseEvent<HTMLButtonElement>)=>{
    const reveal=event.detail>0 || pointerType.current==='touch' || pointerType.current==='pen';
    pointerType.current=null;setPeek(null);p.select(story,reveal);
  };
  const item=(story:Story,marker=false,groupId='',index=0)=><button key={story.id} className={marker?'incident-trigger':undefined} data-story-id={story.id} aria-label={label(story)} aria-current={p.selected===story.id?'true':undefined}
    aria-describedby={marker&&peekGroup?.id===groupId?`incident-context-${index}`:undefined}
    onPointerEnter={marker?()=>show(groupId):undefined} onPointerLeave={marker?event=>{if(document.activeElement!==event.currentTarget)setPeek(null)}:undefined}
    onFocus={marker?()=>show(groupId):undefined} onBlur={marker?()=>setPeek(null):undefined}
    onPointerDown={event=>{pointerType.current=event.pointerType}} onPointerCancel={()=>{pointerType.current=null}} onClick={event=>select(story,event)}>
    {marker?<i className="marker-dot" aria-hidden="true"/>:<><time>{clockText(story.source_seconds)}</time><span>{story.team?clubs.name(story.team)+' · ':''}{kind(story)}{story.type==='match_boundary'&&<small className="boundary-description">{clubs.text(story.narration.headline)}</small>}</span>{p.selected===story.id&&<em>Selected history</em>}</>}
  </button>;
  const ticks=Array.from({length:Math.floor(p.duration/900)+1},(_,i)=>i*900).filter(t=>p.duration-t>Math.max(180,p.duration*.075));
  if(p.duration>0)ticks.push(p.duration);
  return <section className="md-moments" aria-label="Key match moments">
    <div className="timeline-heading"><h2>Key moments</h2>{selected&&<span className="timeline-selection" data-testid="selected-incident-context">Selected history · {description(selected).replace(' · Selected history','')}</span>}<span>0–{clockText(p.duration)} · recorded incident time</span></div>
    <div ref={axisRef} className="time-axis" data-duration={p.duration} onKeyDown={event=>{
      if(event.key==='Escape'&&(openGroup||peek)){event.stopPropagation();if(openGroup)dismiss(groups.findIndex(group=>group.id===openGroup));else setPeek(null)}
    }}>
      <div className="time-axis-playhead" data-testid="timeline-playhead" data-clock={p.replayClock} data-time-percent={position} style={{left:`${position}%`}} aria-label={`Current replay ${clockText(p.replayClock)}`}><time style={{transform:position<8?'none':position>92?'translateX(-100%)':'translateX(-50%)'}}>{clockText(p.replayClock)}</time></div>
      {moments.map(story=><span key={story.id} data-source-story-id={story.id} data-source-seconds={story.source_seconds} data-time-percent={timePercent(story.source_seconds,p.duration)!} className={`incident-anchor ${p.selected===story.id?'is-selected':''} ${p.arrival===story.id?'is-arrival':''}`} style={{left:`${timePercent(story.source_seconds,p.duration)}%`}}><i key={p.arrival===story.id?p.arrivalRevision:0} className="timeline-point" data-arrival-revision={p.arrival===story.id?p.arrivalRevision:undefined}/></span>)}
      <ol className="timeline-events time-axis-track">{groups.map((group,index)=>{
        const percent=timePercent(group.start,p.duration)!;
        const representative=group.stories.find(story=>story.id===p.selected)??group.stories.at(-1)!;
        const types=new Set(group.stories.map(story=>story.type));
        return <li key={group.id} className={`axis-group ${group.stories.some(story=>story.id===p.selected)?'has-selected':''}`} style={{left:`${percent}%`,'--anchor-shift':percent<5?'0%':percent>95?'-100%':'-50%'} as CSSProperties}>
          {group.stories.length===1?item(group.stories[0],true,group.id,index):<button className="cluster-trigger" data-cluster-stories={JSON.stringify(group.stories.map(story=>story.id))} aria-expanded={openGroup===group.id} aria-controls={`incident-cluster-${index}`} aria-describedby={peekGroup?.id===group.id?`incident-context-${index}`:undefined}
            aria-label={`${group.stories.length} recorded moments, ${clockText(group.start)}${group.end!==group.start?' to '+clockText(group.end):''}`}
            onPointerEnter={()=>show(group.id)} onPointerLeave={event=>{if(document.activeElement!==event.currentTarget)setPeek(null)}} onFocus={()=>show(group.id)} onBlur={()=>setPeek(null)}
            onClick={()=>{setPeek(null);setOpenGroup(openGroup===group.id?null:group.id)}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setPeek(null);setOpenGroup(group.id);requestAnimationFrame(()=>document.getElementById(`incident-cluster-${index}`)?.querySelector('button')?.focus())}}}>
            <b className="cluster-count">{group.stories.length}</b><span className="sr-only"> recorded moments</span>
          </button>}
          {placements.has(group.id)&&<div className="incident-label" data-labelled-group={group.id} style={{left:placements.get(group.id),width:labelWidth}}><time>{clockText(group.start)}{group.start!==group.end?`–${clockText(group.end)}`:''}</time><span>{group.stories.length===1&&representative.team?clubs.club(representative.team).shortName+' · ':''}{kind(representative)}{types.size>1?' +more':''}</span></div>}
        </li>;
      })}</ol>
      <div className="time-axis-graduations" aria-hidden="true">{ticks.map(time=><time key={time} style={{left:`${timePercent(time,p.duration)}%`,transform:time===0?'none':time===p.duration?'translateX(-100%)':'translateX(-50%)'}}>{time===p.duration?clockText(time):`${Math.floor(time/60)}′`}</time>)}</div>
      {peekGroup&&<div ref={tooltipRef} id={`incident-context-${peekIndex}`} role="tooltip" className="incident-callout" style={tooltipPosition}>
        <strong>{peekGroup.stories.length===1?'Recorded incident':`${peekGroup.stories.length} recorded moments`}</strong>
        <ul>{peekGroup.stories.slice(0,2).map(story=><li key={story.id}>{description(story)}{story.type==='match_boundary'&&<small className="boundary-description">{clubs.text(story.narration.headline)}</small>}</li>)}</ul>
        {peekGroup.stories.length>1&&<small>{peekGroup.stories.length>2?`+${peekGroup.stories.length-2} more. `:''}Tap or press Enter for all original incidents.</small>}
      </div>}
      {groups.map((group,index)=>group.stories.length>1&&<div key={group.id} id={`incident-cluster-${index}`} className="axis-cluster-popup" hidden={openGroup!==group.id} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();dismiss(index)}}}><strong>Recorded at {clockText(group.start)}{group.end!==group.start?`–${clockText(group.end)}`:''}</strong><ul>{group.stories.map(story=><li key={story.id}>{item(story)}</li>)}</ul><button className="cluster-close" onClick={()=>dismiss(index)}>Close moments</button></div>)}
    </div>
    {!moments.length&&<p className="timeline-empty">No recorded moments available at this clock.</p>}
  </section>;
}
