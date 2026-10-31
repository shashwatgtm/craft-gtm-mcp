import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
type Row=Record<string,any>;
type Schema={type:string;properties?:Record<string,Schema>;items?:Schema;required?:string[];enum?:string[];minItems?:number;maxItems?:number;maxLength?:number;minimum?:number;additionalProperties?:boolean};
const text:Schema={type:'string',maxLength:20000};
const num:Schema={type:'number',minimum:0};
const choice=(...values:string[]):Schema=>({...text,enum:values});
const object=(properties:Record<string,Schema>,required=Object.keys(properties)):Schema=>({type:'object',properties,required,additionalProperties:false});
const array=(items:Schema,minItems=0):Schema=>({type:'array',items,minItems,maxItems:200});
const count=(s:string)=>s.trim().split(/\s+/).filter(Boolean).length;
const tokens=(s:string)=>s.match(/\b\d[\d,]*(?:\.\d+)?%?/g)??[];
const iso=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(+new Date(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const day=(s:string)=>iso(s)?new Date(s+'T00:00:00Z').toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'}):'invalid';
const safeUrl=(s:string)=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u:null;}catch{return null;}};
const escaped=(s:string)=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/[&<>"'|`\[\]]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','|':'&#124;','`':'&#96;','[':'&#91;',']':'&#93;'}[c]!));
const escapeDeep=(v:any):any=>typeof v==='string'?escaped(v):Array.isArray(v)?v.map(escapeDeep):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[escaped(k),escapeDeep(x)])):v;
function validate(s:Schema,v:any,path='$'):string[]{
 const issues:string[]=[];
 if(s.type==='object'){
  if(!v||typeof v!=='object'||Array.isArray(v))return [`${path}: object required`];
  for(const k of s.required??[])if(!Object.prototype.hasOwnProperty.call(v,k)||(typeof v[k]==='string'&&!v[k].trim()))issues.push(`${path}.${k}: required`);
  for(const [k,x]of Object.entries(v)){if(!Object.prototype.hasOwnProperty.call(s.properties??{},k))issues.push(`${path}: unknown property`);else issues.push(...validate(s.properties![k],x,`${path}.${k}`));}
 }else if(s.type==='array'){
  if(!Array.isArray(v))return [`${path}: array required`];if(v.length<(s.minItems??0)||v.length>(s.maxItems??200))return [`${path}: row count outside allowed bounds`];v.forEach((x,i)=>issues.push(...validate(s.items!,x,`${path}[${i+1}]`)));
 }else if(s.type==='string'){if(typeof v!=='string')return [`${path}: text required`];if(v.length>(s.maxLength??20000))issues.push(`${path}: text too long`);if(s.enum&&!s.enum.includes(v))issues.push(`${path}: unsupported choice`);
 }else if(s.type==='number'){if(typeof v!=='number'||!Number.isFinite(v)||(s.minimum!==undefined&&v<s.minimum))issues.push(`${path}: finite number in range required`);}
 return issues;
}
const registry:Record<string,{tool:Tool,run:(a:Row)=>Row}>={};
function define(name:string,description:string,schema:Schema,run:(a:Row)=>Row){registry[name]={tool:{name,description,inputSchema:schema as Tool['inputSchema'],annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},run};}
const evidence=object({id:text,claim:text,source:text,source_date:text,excerpt:text,status:choice('user_supplied','unverified','conflicting')},['id','claim','source','source_date','excerpt','status']);
const evidenceIssues=(rows:Row[])=>rows.flatMap((r,i)=>{const out:string[]=[];if(!safeUrl(r.source))out.push(`Evidence ${i+1}: source must be an HTTP(S) URL`);if(!iso(r.source_date))out.push(`Evidence ${i+1}: source date invalid`);if(r.status!=='user_supplied')out.push(`Evidence ${i+1}: ${r.status}`);if(!r.excerpt.trim())out.push(`Evidence ${i+1}: excerpt missing`);return out;});
const unique=(rows:Row[],key:string)=>{const seen=new Set<string>();return rows.flatMap((r,i)=>{const k=String(r[key]).trim().toLowerCase();if(seen.has(k))return [`Row ${i+1}: duplicate ${key}`];seen.add(k);return [];});};
const report=(issues:string[],data:Row,limitations:string[])=>({status:issues.length?'CHECKS_FOUND':'NO_MECHANICAL_ISSUES',issues,...data,limitations:['Only supplied data was checked. No page was fetched, model called, message sent or truth independently verified.',...limitations]});

define('prompt_structure_check','Takes supplied CRAFT prompt components and success criteria, then returns missing context, component coverage and measurable output constraint findings. It checks structure without executing or rewriting the prompt.',object({character:text,result:text,artifact:text,frame:text,timeline:text,success_criteria:array(text)},[]),a=>{
 const order=['character','result','frame','artifact','timeline'];const missing=order.filter(k=>!a[k]?.trim());const issues=missing.map(k=>`Missing CRAFT component: ${k}`);
 if(!a.success_criteria?.length)issues.push('No explicit success criteria supplied');
 const counts=Object.fromEntries(order.map(k=>[k,{present:!!a[k]?.trim(),words:count(a[k]??'')} ]));
 return report(issues,{components:counts,priority:missing,successCriteriaCount:a.success_criteria?.length??0},['Presence and length checks do not judge prompt quality. Timeline can be omitted deliberately for a one-off question. No arbitrary quality score is assigned.']);
});

export const waveTools:Tool[]=Object.values(registry).map(x=>x.tool);
export const isWaveTool=(name:string)=>Object.prototype.hasOwnProperty.call(registry,name);
export function callWaveTool(name:string,args:unknown):CallToolResult{
 if(!isWaveTool(name))return {isError:true,content:[{type:'text',text:'Unknown wave tool.'}]};
 const entry=registry[name];const schema=entry.tool.inputSchema as Schema;const record=args as Row|undefined;const missing=(schema.required??[]).filter(k=>schema.properties?.[k].type==='string'&&!schema.properties[k].enum&&(!record||typeof record[k]!=='string'||!record[k].trim()));if(missing.length)return {isError:true,content:[{type:'text',text:`Missing required input for ${name}: ${missing.join(', ')}. INVALID_INPUT: provide the missing text fields.`}]};const problems=validate(schema,args);
 if(problems.length)return {isError:true,content:[{type:'text',text:JSON.stringify({status:'INVALID_INPUT',issues:problems},null,2)}]};
 try{const result=escapeDeep(entry.run(args as Row));return {content:[{type:'text',text:JSON.stringify(result,null,2)}],structuredContent:result};}catch{return {isError:true,content:[{type:'text',text:'Input could not be checked. No external action occurred.'}]};}
}
