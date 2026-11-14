#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {auditProvenance} from './audit.mjs';
const source=process.argv[2];
if(!source){console.error('Usage: node src/cli.mjs citations.json');process.exitCode=1;}
else try{
 const content=await readFile(source,'utf8');
 if(content.length>1048576)throw Error('Input exceeds 1 MiB.');
 const r=auditProvenance(content);console.log(JSON.stringify(r,null,2));
 process.exitCode=r.status==='INVALID_REFERENCES'?2:r.status==='REVIEW_REQUIRED'?3:0;
}catch(e){console.error('Input error: '+e.message);process.exitCode=1;}
