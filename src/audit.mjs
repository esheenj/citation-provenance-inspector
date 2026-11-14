// No network requests. This is a structural audit of user-supplied citation data,
// NOT evidence that a source is authentic, current or supports a claim.
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const idRe=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const goodId=(v,name)=>{if(typeof v!=='string'||!idRe.test(v))throw Error(name+' must be 1–128 identifier characters');return v;};
const date=(v)=>{
 if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v))return null;
 const parsed=Date.parse(v);return Number.isFinite(parsed)?parsed:null;
};
const normalized=s=>s.replace(/\s+/gu,' ').trim();
function urlCheck(v){
 if(typeof v!=='string')return false;
 try{
   const u=new URL(v);
   return u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password&&u.hostname.length<=250&&v.length<=2048;
 }catch{return false;}
}
export function auditProvenance(input){
 const data=typeof input==='string'?JSON.parse(input):input;
 if(!isObj(data)||!Array.isArray(data.sources)||!Array.isArray(data.claims))
   throw Error('Expected {asOf,maxAgeDays,sources:[],claims:[]}');
 const asOf=date(data.asOf);
 if(asOf===null)throw Error('asOf must be an ISO timestamp with explicit timezone');
 if(!Number.isSafeInteger(data.maxAgeDays)||data.maxAgeDays<1||data.maxAgeDays>3650)
   throw Error('maxAgeDays must be a whole number between 1 and 3650');
 if(data.sources.length>100||data.claims.length>200)throw Error('Maximum 100 sources and 200 claims');
 const sources=new Map(),seenClaims=new Set(),findings=[],claimRows=[];
 const add=(level,code,path,message)=>findings.push({level,code,path,message});
 for(const [index,s] of data.sources.entries()){
   if(!isObj(s))throw Error('Source at index '+index+' must be an object');
   const id=goodId(s.id,'source.id');
   if(sources.has(id))throw Error('Duplicate source ID: '+id);
   if(typeof s.excerpt!=='string'||s.excerpt.length>15000)throw Error('source.excerpt must be a string up to 15000 characters');
   if(typeof s.title!=='string'||s.title.length>300)throw Error('source.title must be a string up to 300 characters');
   sources.set(id,s);
   if(!s.title.trim())add('review','MISSING_TITLE','source:'+id,'Source has no descriptive title.');
   if(!urlCheck(s.url))add('error','INVALID_SOURCE_URL','source:'+id,'Source link must be valid HTTPS with no embedded user credentials.');
   if(!s.excerpt.trim())add('review','EMPTY_EXCERPT','source:'+id,'Only a URL is supplied; no excerpt is available for local quote checks.');
   if(s.publishedAt!==undefined&&s.publishedAt!==null){
     const t=date(s.publishedAt);
     if(t===null)add('error','INVALID_PUBLISHED_AT','source:'+id,'publishedAt is not an offset-aware ISO timestamp.');
     else if(t>asOf)add('review','FUTURE_PUBLICATION','source:'+id,'Source publication date is after the assessment reference time.');
     else if(asOf-t>data.maxAgeDays*86400000)add('review','OLDER_THAN_POLICY','source:'+id,'Publication date exceeds the chosen age threshold; review relevance.');
   }else add('review','PUBLICATION_DATE_UNKNOWN','source:'+id,'No publication date supplied; freshness cannot be evaluated.');
   if(s.retrievedAt!==undefined&&s.retrievedAt!==null){
     const t=date(s.retrievedAt);
     if(t===null)add('error','INVALID_RETRIEVED_AT','source:'+id,'retrievedAt must be ISO time with timezone.');
     else if(t>asOf)add('review','FUTURE_RETRIEVAL','source:'+id,'Retrieval time is after the assessment reference time.');
   } else add('info','RETRIEVAL_NOT_RECORDED','source:'+id,'Record a retrieval time for stronger provenance bookkeeping.');
 }
 const sourceFindingById=new Map();
 for(const sourceId of sources.keys())sourceFindingById.set(sourceId,
   findings.filter(f=>f.path==='source:'+sourceId));
 const citedIds=new Set();
 let citationCount=0;
 for(const [index,c] of data.claims.entries()){
   if(!isObj(c))throw Error('Claim at index '+index+' must be an object');
   const id=goodId(c.id,'claim.id');
   if(seenClaims.has(id))throw Error('Duplicate claim ID: '+id);
   seenClaims.add(id);
   if(typeof c.text!=='string'||!c.text.trim()||c.text.length>4000)throw Error('claim.text must be nonempty and at most 4000 characters');
   if(!Array.isArray(c.citations))throw Error('claim.citations must be an array');
   if(c.citations.length>10)throw Error('At most 10 citations per claim');
   citationCount+=c.citations.length;if(citationCount>400)throw Error('Maximum 400 citation records');
   const before=findings.length,seenLocal=new Set(),referencedSourceFindings=[];
   if(c.citations.length===0)add('review','UNCITED_CLAIM','claim:'+id,'This claim has no provided source link.');
   for(const citation of c.citations){
     if(!isObj(citation))throw Error('Citation must be an object for claim '+id);
     const sourceId=goodId(citation.sourceId,'citation.sourceId');
     const quote=citation.quote;
     if(typeof quote!=='string'||quote.length>1000)throw Error('citation.quote must be a string of up to 1000 characters');
     if(seenLocal.has(sourceId))add('info','REPEATED_SOURCE_REFERENCE','claim:'+id,'Same source cited more than once in this claim.');
     seenLocal.add(sourceId);
     const src=sources.get(sourceId);
     if(!src){
       add('error','BROKEN_SOURCE_LINK','claim:'+id,'Citation references missing source ID '+sourceId+'.');continue;
     }
     citedIds.add(sourceId);
     referencedSourceFindings.push(...sourceFindingById.get(sourceId));
     if(!quote.trim()){
       add('review','MISSING_QUOTE','claim:'+id,'Source '+sourceId+' has no supporting passage recorded.');
     }else if(!normalized(src.excerpt).includes(normalized(quote))){
       add('review','QUOTE_NOT_IN_EXCERPT','claim:'+id,'Quoted passage for '+sourceId+' is not found in the supplied excerpt (which may be incomplete).');
     }
   }
   const ownFindings=[...findings.slice(before),...referencedSourceFindings];
   claimRows.push({id,text:c.text,citationCount:c.citations.length,structuralIssues:ownFindings.filter(x=>x.level==='error'||x.level==='review').length,
      traceability:ownFindings.some(x=>x.level==='error')?'BROKEN_LINKS':ownFindings.some(x=>x.level==='review')?'REVIEW_REQUIRED':'LINKS_PRESENT_NOT_VERIFIED'});
 }
 for(const sourceId of sources.keys())if(!citedIds.has(sourceId))
   add('info','UNUSED_SOURCE','source:'+sourceId,'Source is present but no claim refers to it.');
 const totals={error:0,review:0,info:0};
 for(const f of findings)totals[f.level]++;
 const status=totals.error?'INVALID_REFERENCES':totals.review?'REVIEW_REQUIRED':'STRUCTURALLY_TRACEABLE';
 return {status,summary:{...totals,sources:sources.size,claims:claimRows.length,citations:citationCount},claims:claimRows,findings,
   limitations:'Offline structural inspection of supplied metadata and excerpt text only. Does not visit URLs, verify source authenticity, evaluate whether passages entail claims, detect fabricated sources, prove author identity or fact-check content.'};
}
