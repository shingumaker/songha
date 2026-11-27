const { chromium } = require('playwright'); const fs = require('fs');
const D = __dirname, SHOT = process.argv[2], CDN = `${D}/fbcdn/node_modules/firebase`;
const put = (p, f) => fetch(`http://127.0.0.1:8181/v1/projects/online-mission/databases/(default)/documents/${p}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) });
(async () => {
  await put('printStaff/mgr@x.com', { role: { stringValue: 'manager' }, name: { stringValue: '이근로' } });
  await put('printStaff/admin@x.com', { role: { stringValue: 'admin' }, name: { stringValue: '김담당' } });
  await put('printSettings/main', { capacity: { integerValue: '10' } });
  const b = await chromium.launch(), fails = [], ck = (c, m) => { if (!c) fails.push(m); };
  const mk = async (w) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route('https://www.gstatic.com/firebasejs/10.14.1/*', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(`${CDN}/${r.request().url().split('/').pop()}`, 'utf8') }));
    await ctx.route('https://fonts.**', r => r.abort());
    await ctx.route('http://localhost:8765/common.js', r => {
      let s = fs.readFileSync('/home/user/songha/print-app/common.js', 'utf8');
      s = s.replace('getAuth, onAuthStateChanged,', 'getAuth, connectAuthEmulator, signInWithCredential, onAuthStateChanged,').replace('writeBatch, runTransaction,', 'writeBatch, runTransaction, connectFirestoreEmulator,')
        .replace('export const auth = getAuth(app);', `export const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8181);
window.__login = (email) => signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })));`);
      r.fulfill({ contentType: 'text/javascript', body: s });
    });
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', w, m.text().slice(0,200)); }); p.on('dialog', d => d.accept(d.type() === 'prompt' ? '노즐' : undefined)); return p;
  };
  const W = (p, ms = 1200) => p.waitForTimeout(ms), shot = (p, n) => p.screenshot({ path: `${SHOT}/v2_${n}.png`, fullPage: true });
  const A = await mk(400);
  await A.goto('http://localhost:8765/'); await W(A, 2500); await shot(A, '1home');
  await A.goto('http://localhost:8765/#/new'); await W(A, 2000);
  await A.fill('[name=sn]', '20251234'); await A.fill('[name=name]', '홍길동'); await A.click('[data-cert="소지"]');
  await A.click('#finc'); await A.click('.tchip:not([disabled])'); await A.fill('[name=pin]', '1234'); await A.check('[name=agree]');
  await shot(A, '2booking'); await A.click('#sb'); await W(A, 2500);
  ck((await A.textContent('main')).includes('파일 2개'), '예약 후 내 현황판에 표시 안 됨'); await shot(A, '3my');
  const M = await mk(1280);
  await M.goto('http://localhost:8765/#/staff'); await W(M, 2000); await M.evaluate(() => window.__login('mgr@x.com')); await W(M, 2500);
  // 오늘 예약이 아닐 수 있으니 전체 현황에서 확인
  await M.goto('http://localhost:8765/#/staff/board'); await W(M, 2000);
  ck((await M.textContent('main')).includes('20251234'), '매니저 전체 현황에 예약 없음'); await shot(M, '4board');
  const id = await A.evaluate(() => location.hash.split('/')[2] || document.querySelector('.s-dhead small')?.textContent);
  await M.goto(`http://localhost:8765/#/staff/record/${id}`); await W(M, 2000);
  // booked 상태 → onsite로 (콘솔 대신 직접 처리)
  await M.evaluate(async (id) => { const c = await import('./common.js'); await c.fb.writeBatch(c.db).update(c.fb.doc(c.col.req, id), { status: 'onsite' }).commit(); }, id); await W(M, 1500);
  await M.fill('[name=title]', '캡스톤 케이스'); await M.selectOption('[name=purpose]', '캡스톤/졸업작품');
  await M.click('[data-no="1"]'); await W(M, 300); await M.click('[data-no="2"]'); await W(M, 300);
  await M.click('#startBtn'); await W(M, 2000);
  await M.goto('http://localhost:8765/#/staff/printers'); await W(M, 2000);
  const pt = await M.textContent('main'); ck(pt.includes('홍길동') && pt.includes('파일 1/2'), '프린터 자동 출력 중 안 됨'); await shot(M, '5printers');
  await M.goto(`http://localhost:8765/#/staff/record/${id}`); await W(M, 2000);
  await M.check('[name=result][value="성공"]'); await M.check('[name=signed]'); await M.setInputFiles('[name=photos]', `${SHOT}/v2_1home.png`);
  await shot(M, '6record'); await M.click('#rf button.primary:not(#startBtn)'); await W(M, 3000);
  await M.goto('http://localhost:8765/#/staff/printers'); await W(M, 1500);
  ck(!(await M.textContent('main')).includes('파일 1/2'), '완료 후 프린터 복귀 안 됨');
  await A.reload(); await W(A, 2500); console.log('FAILS-SO-FAR', fails.join(';')); console.log('A:', (await A.textContent('main')).slice(0,300)); console.log('M:', (await M.evaluate(async (id)=>{const c=await import('./common.js'); const s=await c.fb.getDoc(c.fb.doc(c.col.req,id)); return s.data().status;}, id))); await A.click('[data-a=receive]'); await W(A, 2000);
  await A.setInputFiles('#uf [name=files]', `${SHOT}/v2_1home.png`); await A.fill('#uf textarea', '발표 시연'); await A.check('#uf .check input');
  await A.click('#uf button.primary'); await W(A, 3000);
  await A.click('[data-star="5"]'); await A.click('#sf .pill:first-child'); await A.click('#sf button.primary'); await W(A, 2000);
  ck((await A.textContent('main')).includes('모든 과정이 완료'), '만족도 완료 안 됨'); await shot(A, '7done');
  const X = await mk(400); await X.goto('http://localhost:8765/#/find'); await W(X, 2000);
  await X.fill('[name=sn]', '20251234'); await X.fill('[name=pin]', '9999'); await X.click('#ff button'); await W(X, 1500);
  ck(!(await X.textContent('main')).includes('캡스톤'), '틀린 비번으로 열람');
  await X.fill('[name=pin]', '1234'); await X.click('#ff button'); await W(X, 2500);
  ck((await X.textContent('main')).includes('캡스톤'), '맞는 비번으로 열람 실패');
  await M.evaluate(() => document.getElementById('out').click()); await W(M, 1500);
  await M.goto('http://localhost:8765/#/staff'); await W(M, 1500); await M.evaluate(() => window.__login('admin@x.com')); await W(M, 2500);
  await M.goto('http://localhost:8765/#/staff/admin'); await W(M, 2500); await shot(M, '8admin');
  for (const p of [A, M, X]) if (p.errs.length) fails.push('JS: ' + p.errs.join(' | '));
  console.log(fails.length ? 'FAILS:\n' + fails.join('\n') : 'ALL V2 E2E PASSED'); await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
