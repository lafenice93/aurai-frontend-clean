/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server regression harness. */
// No real API, credential, or user photo is used. Tests paid-request deduplication.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const sharp = require('sharp');

(async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'aurai-analysis-test-'));
  const image = await sharp({ create: { width: 640, height: 640, channels: 3, background: '#888888' } }).jpeg().toBuffer();
  const calls = { create: 0, upload: 0, download: 0 };
  let ambiguous = false;
  let providerError = false;
  const fakeClient = {
    auth: { getUser: async token => token === 'test' ? { data: { user: { id: 'owner' } } } : { data: {}, error: true } },
    storage: { from: () => ({ download: async () => { calls.download++; return { data: new Blob([image]), error: null }; }, getPublicUrl: () => ({ data: { publicUrl: 'https://storage.invalid/private.jpg' } }) }) },
  };
  const fetch = async (url, options) => {
    url = String(url);
    if (url.includes('storage.invalid')) return new Response(null, { status: 404 });
    if (url.includes('amazonaws.com')) { calls.upload++; return new Response('', { status: 200 }); }
    if (url.endsWith('/file')) return Response.json({ status: 200, data: { files: [{ file_id: 'file', requests: [{ method: 'PUT', url: 'https://test.s3.amazonaws.com/temporary', headers: {} }] }] } });
    if (options.method === 'POST') {
      calls.create++;
      if (ambiguous) throw new Error('ambiguous network response');
      return Response.json({ status: 200, data: { task_id: 'private-task' } });
    }
    return Response.json({ status: 200, data: providerError ? { task_status: 'error' } : { task_status: 'success', results: { output: [{ type: 'pore', ui_score: 72 }, { type: 'oiliness', raw_score: 51, region: 'whole' }] } } });
  };
  const routeModule = { exports: {} };
  const code = ts.transpileModule(await fs.readFile(path.join(__dirname, '../app/api/skin-analysis/route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, {
    exports: routeModule.exports, module: routeModule,
    require: name => name === '@supabase/supabase-js' ? { createClient: () => fakeClient } : require(name),
    process: { cwd: () => temporary, env: { NODE_ENV: 'development', PERFECT_CORP_ANALYSIS_ENABLED: 'true', PERFECT_CORP_API_KEY: 'fake-test-key', NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fake' } },
    Buffer, URL, Response, AbortSignal, fetch, Uint8Array, console,
  });
  const { POST, GET } = routeModule.exports;
  const post = storagePath => POST(new Request('http://localhost/api/skin-analysis', { method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify({ storagePath }) }));
  const get = storagePath => GET(new Request(`http://localhost/api/skin-analysis?storagePath=${encodeURIComponent(storagePath)}`, { headers: { Authorization: 'Bearer test' } }));
  try {
    const responses = await Promise.all(Array.from({ length: 8 }, () => post('owner/photo.jpg')));
    assert.equal(calls.create, 1, `parallel submissions create exactly one paid task: ${JSON.stringify(calls)} ${JSON.stringify(await responses[0].clone().json())}`);
    assert.ok(responses.every(response => response.status === 200));
    await post('owner/photo.jpg');
    assert.equal(calls.create, 1);
    const result = await (await get('owner/photo.jpg')).json();
    assert.equal(result.status, 'success');
    assert.deepEqual(result.metrics, [{ type: 'pore', ui_score: 72 }, { type: 'oiliness', raw_score: 51, region: 'whole' }]);
    assert.equal(result.taskId, undefined, 'provider task identifiers stay private');
    assert.equal((await post('someone-else/photo.jpg')).status, 401);
    assert.equal(calls.download, 1, 'foreign photos never downloaded');
    ambiguous = true;
    assert.equal((await (await post('owner/ambiguous.jpg')).json()).status, 'uncertain');
    await post('owner/ambiguous.jpg');
    await get('owner/ambiguous.jpg');
    assert.equal(calls.create, 2, 'uncertain paid creation never retried');
    ambiguous = false; providerError = true;
    await post('owner/failure.jpg');
    assert.equal((await (await get('owner/failure.jpg')).json()).status, 'error');
    const receipt = JSON.parse(await fs.readFile(path.join(temporary, '.data/perfect-skin', (await fs.readdir(path.join(temporary, '.data/perfect-skin')))[0], 'receipt.json'), 'utf8'));
    assert.ok(receipt.status, 'durable receipt saved');
    console.log('PASS: one paid creation per photo, ownership, real-only metrics, ambiguous response protection, provider failure, private durable receipts.');
  } finally { await fs.rm(temporary, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
