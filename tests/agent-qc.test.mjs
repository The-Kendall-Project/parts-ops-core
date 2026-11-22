import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=mkdtempSync(path.join(root,'node_modules/.qc-test-'));
after(()=>rmSync(temp,{recursive:true,force:true}));
const source=readFileSync(new URL('../src/agentBuilder.ts',import.meta.url),'utf8');
writeFileSync(path.join(temp,'agentBuilder.mjs'),ts.transpileModule(source,{fileName:'agentBuilder.ts',compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {agentPackageInputSchema}=await import(pathToFileURL(path.join(temp,'agentBuilder.mjs')).href);

const qc=agentPackageInputSchema.shape.qualityControlAgent;
test('an independently issued numeric agent can occupy the QC role',()=>{
 assert.equal(qc.safeParse({partNumber:'KF-AGT-013',name:'Website output QA'}).success,true);
});
test('existing legacy paired QC identifiers remain compatible',()=>{
 assert.equal(qc.safeParse({partNumber:'KF-AGT-Q11',name:'Legacy QC'}).success,true);
});
test('a future issued sequence does not require a numbering format change',()=>{
 assert.equal(qc.safeParse({partNumber:'KF-AGT-1000',name:'Future QA'}).success,true);
});
test('malformed, personal and missing identifiers are refused',()=>{
 for(const partNumber of ['KWA-13','KF-AGT-13','KF-AGT-Q1','','KF-MOD-013']) {
  assert.equal(qc.safeParse({partNumber,name:'Invalid'}).success,false,partNumber);
 }
 assert.equal(qc.safeParse(undefined).success,false);
});
