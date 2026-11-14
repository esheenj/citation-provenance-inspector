import {auditProvenance} from './audit.mjs';
const $=id=>document.getElementById(id);
const sample={
 asOf:'2026-11-14T12:00:00Z',maxAgeDays:365,
 sources:[
  {id:'spec',title:'Fictional API policy notes',url:'https://example.org/fictional/spec',publishedAt:'2026-10-01T12:00:00Z',retrievedAt:'2026-11-13T12:00:00Z',excerpt:'The sample integration records a unique request identifier and an outcome for each completed operation.'},
  {id:'audit',title:'Fictional audit workbook',url:'https://example.org/fictional/audit',publishedAt:'2026-09-01T12:00:00Z',retrievedAt:'2026-11-13T12:00:00Z',excerpt:'Each fictional event has a stable ID and an explicit status.'},
  {id:'unlinked',title:'Unused fictional note',url:'https://example.org/fictional/unlinked',publishedAt:'2026-10-10T12:00:00Z',excerpt:'This sample is not cited.'}
 ],
 claims:[
  {id:'c1',text:'The fictional integration tracks request IDs.',citations:[{sourceId:'spec',quote:'records a unique request identifier'}]},
  {id:'c2',text:'The fictional audit workbook records stable event IDs.',citations:[{sourceId:'audit',quote:'Each fictional event has a stable ID'}]},
  {id:'c3',text:'An uncited example claim needs further evidence.',citations:[]}
 ]
};
let report=null;
function reset(){$('scenario').value=JSON.stringify(sample,null,2);$('summary').textContent='Fictional example restored. Inspect to review traceability.';}
function inspect(){
 try{
  const source=$('scenario').value;if(!source.trim()||source.length>1048576)throw Error('Provide JSON up to 1 MiB.');
  report=auditProvenance(source);
  const s=report.summary;
  for(const [key,value] of Object.entries({claimCount:s.claims,sourceCount:s.sources,errors:s.error,reviews:s.review,notes:s.info}))$(key).textContent=String(value);
  $('status').textContent=report.status.replaceAll('_',' ');
  $('status').className='status '+(report.status==='INVALID_REFERENCES'?'fail':report.status==='REVIEW_REQUIRED'?'warn':'pass');
  $('summary').textContent=report.limitations;
  const list=$('claims');list.replaceChildren();
  if(!report.claims.length){const li=document.createElement('li');li.textContent='No claims in this scenario.';list.append(li);}
  for(const c of report.claims){
   const li=document.createElement('li'),name=document.createElement('div'),label=document.createElement('strong'),meta=document.createElement('small'),right=document.createElement('div'),text=document.createElement('p'),status=document.createElement('small');
   label.textContent=c.id;meta.textContent=c.citationCount+' citation(s)';name.append(label,meta);
   text.textContent=c.text;status.textContent=c.traceability.replaceAll('_',' ');right.append(text,status);li.append(name,right);list.append(li);
  }
  const findings=$('findings');findings.replaceChildren();
  if(!report.findings.length){const li=document.createElement('li');li.textContent='No structural issues in supported fields; truth and external sources still require verification.';findings.append(li);}
  for(const f of report.findings){
   const li=document.createElement('li'),level=document.createElement('span'),right=document.createElement('div'),head=document.createElement('strong'),message=document.createElement('p');
   level.className='level '+f.level;level.textContent=f.level.toUpperCase();
   head.textContent=f.code+' / '+f.path;message.textContent=f.message;right.append(head,message);li.append(level,right);findings.append(li);
  }
  $('export').disabled=false;
 }catch(e){
  report=null;$('status').textContent='INPUT ERROR';$('status').className='status fail';$('summary').textContent=e.message;
  $('claims').replaceChildren();$('findings').replaceChildren();$('export').disabled=true;
  for(const id of ['claimCount','sourceCount','errors','reviews','notes'])$(id).textContent='—';
 }
}
function save(){
 if(!report)return;
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='citation-provenance-structural-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('restore').addEventListener('click',reset);$('inspect').addEventListener('click',inspect);$('export').addEventListener('click',save);
reset();
