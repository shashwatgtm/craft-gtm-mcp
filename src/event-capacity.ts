/** Single format capacity decision. This source also supplies the local Site adapter. */
export function eventCapacity(a: any): any {
  const types=(a.types??[]).filter((t:any)=>!['analyst_day','analyst_programme'].includes(t.format));
  if(types.length!==1)return null;
  const t=types[0],keys=['events','contacts_per_event','relevant_share','first_stage_rate','accepted_rate'];
  const missing=keys.filter(k=>t[k]===undefined);
  if(a.target===undefined)missing.push('target');if(a.event_share===undefined)missing.push('event_share');
  const commitments=(a.timeline??[]).filter((x:any)=>! /\b(?:not|never|no|unconfirmed|proposed|tentative)\b/i.test(x.task??'') && /\b(?:maximum deliverable events|delivery capacity|event capacity)\s*:\s*\d+\b/i.test(x.task??''));
  const values=commitments.map((x:any)=>Number((x.task.match(/\b(?:maximum deliverable events|delivery capacity|event capacity)\s*:\s*(\d+)\b/i)||[])[1]));
  const maximum=values.length&&new Set(values).size===1?values[0]:null;
  const owner=commitments.length===1&&commitments[0].owner?.trim()?commitments[0].owner.trim():'Unknown; name the event delivery decision owner';
  if(missing.length)return {status:'COLLECT_MISSING_RATES',missing,maximum,owner,decision:'Collect missing figures: '+missing.map(k=>k.replaceAll('_',' ')).join(', ')+'. No event capacity decision is established.'};
  const per=t.contacts_per_event*t.relevant_share/100*t.first_stage_rate/100*t.accepted_rate/100,needed=a.target*a.event_share/100,planned=t.events*per,gap=needed-planned;
  if(!Number.isFinite(per)||!Number.isFinite(needed)||!Number.isFinite(planned))throw Error('Event capacity calculation exceeds the supported numeric range.');
  if(per===0&&needed>0)return {status:'REDUCE_TARGET_OR_REVIEW_RATES',per,needed,planned,gap,maximum,owner,decision:'The entered funnel yields zero accepted opportunities per event. No finite extra event count reaches '+needed+'. Reduce the target or investigate the supplied zero rate before committing spend.'};
  const required=needed===0?0:Math.ceil(Number((needed/per).toFixed(9))),extra=Math.max(0,required-t.events);
  if(!Number.isSafeInteger(required))throw Error('Required events exceed the supported whole number range.');
  const arithmetic=`${planned} planned accepted opportunities against ${needed} required; gap ${Math.max(0,gap)}. ${per} accepted per event implies ${required} total events, ${extra} extra.`;
  const status=maximum===null?'CONFIRM_CAPACITY':required<=maximum?'PROCEED_WITHIN_CONFIRMED_CAPACITY':'REDUCE_TARGET';
  const decision=arithmetic+' '+(maximum===null?'Confirm the maximum deliverable event count before committing spend.':required<=maximum?`Proceed with the delivery plan within the supplied capacity of ${maximum} events; confirm spend authority separately.`:`Reduce the event target to at most ${maximum*per} accepted opportunities, or obtain explicit capacity for ${required} events; the supplied maximum is ${maximum}.`)+` Decision owner: ${owner}.`;
  return {status,per,needed,planned,gap,required,extra,maximum,owner,arithmetic,decision};
}
