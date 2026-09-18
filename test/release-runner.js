'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { commandsFromWorkflow, runRelease } = require('../tools/run-release-tests.js');
assert.deepEqual(commandsFromWorkflow('  run: node test/smoke.js\n  - run: node test/editor/model.js'), ['test/smoke.js','test/editor/model.js']);
assert.deepEqual(commandsFromWorkflow('  run: git diff --exit-code -- js/a.gen.js\n  run: node tools/run-release-tests.js --out=x\n  run: node test/smoke.js'), ['test/smoke.js']);
for (const value of ['npm test', 'node test/../secret.js', 'node test/./a.js', 'node test//a.js', 'node test/a.js; echo pass', '|', '']) {
  for (const prefix of ['  run: ', '  - run: ']) assert.throws(() => commandsFromWorkflow('  run: node test/valid.js\n' + prefix + value));
}
assert.throws(() => commandsFromWorkflow('run: node test/a.js'), /No release/);
assert.throws(() => commandsFromWorkflow('  run: node test/a.js\n  - run: node test/a.js'), /Duplicate/);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-release-runner-'));
try {
  fs.mkdirSync(path.join(root,'.github/workflows'),{recursive:true});
  fs.mkdirSync(path.join(root,'test'));
  const workflow = path.join(root,'.github/workflows/tests.yml');
  fs.writeFileSync(workflow, '  run: node test/pass.js\n  - run: node test/fail.js\n  run: node test/hang.js\n');
  fs.writeFileSync(path.join(root,'test/pass.js'), 'console.log("pass fixture")');
  fs.writeFileSync(path.join(root,'test/fail.js'), 'process.exitCode=7');
  fs.writeFileSync(path.join(root,'test/hang.js'), 'setInterval(()=>{},100)');
  const out = path.join(root,'evidence');
  const report = runRelease({root,out,timeoutMs:500});
  assert.deepEqual(report.results.map(r=>r.status),['PASS','FAIL','FAIL']);
  assert.equal(report.results[1].exitCode,7);
  assert.ok(report.results[2].error);
  assert.equal(report.automatedNode,'FAIL');
  assert.equal(report.campaign,'NOT_RUN');
  assert.equal(report.human,'NOT_RUN');
  assert.ok(fs.readFileSync(path.join(out,report.results[0].log),'utf8').includes('pass fixture'));
  const original = fs.readFileSync(path.join(out,'report.json'),'utf8');
  assert.throws(()=>runRelease({root,out}),/EEXIST/);
  assert.equal(fs.readFileSync(path.join(out,'report.json'),'utf8'),original);
  assert.throws(()=>runRelease({root,out:out+'2',timeoutMs:0}),/timeoutMs/);
  fs.writeFileSync(workflow,'  - run: node test/missing.js\n');
  assert.throws(()=>runRelease({root,out:out+'3'}),/ENOENT/);
  assert.equal(fs.existsSync(out+'3'),false,'Preflight must fail before creating evidence');
  fs.writeFileSync(path.join(root,'outside.js'),'throw new Error("must not run")');
  fs.symlinkSync(path.join(root,'outside.js'),path.join(root,'test/escape.js'));
  fs.writeFileSync(workflow,'  run: node test/escape.js\n');
  assert.throws(()=>runRelease({root,out:out+'4'}),/escapes repository/);
  console.log('release-runner: parser, failure, timeout, evidence, missing-file and path-isolation contracts passed');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
