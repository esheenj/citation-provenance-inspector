import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{force:true,recursive:true});await mkdir('dist',{recursive:true});
for(const f of ['index.html','style.css','app.mjs'])await copyFile('site/'+f,'dist/'+f);
await copyFile('src/audit.mjs','dist/audit.mjs');
console.log('Built provenance inspector playground in dist/');
