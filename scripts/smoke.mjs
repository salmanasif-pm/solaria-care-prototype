// End-to-end walkthrough of both experiences against a running preview (npm run build && npm run preview).
// Needs Playwright: `npm i -D playwright` (or a global install). Screenshots land in smoke-shots/.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  const globalRoot = execSync('npm root -g').toString().trim();
  ({ chromium } = createRequire(globalRoot + '/')('playwright'));
}

const BASE = (process.env.BASE_URL ?? 'http://localhost:4173') + '/#';
const shots = new URL('../smoke-shots/', import.meta.url).pathname;
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: `${shots}/${n}.png` });
let failed = 0;
const step = async (name, fn) => {
  try { await fn(); console.log('✓', name); }
  catch (e) { failed++; console.log('✗', name, '-', e.message.split('\n')[0]); await shot('FAIL-' + name.replace(/\W+/g, '_')); }
};
const view = async (label) => { await page.selectOption('[data-tour="viewing-as"]', { label }); await page.waitForTimeout(250); };
const expectText = async (t, scope = 'body') => { await page.locator(scope).getByText(t, { exact: false }).first().waitFor({ timeout: 4000 }); };
const noText = async (t) => { if ((await page.locator('body').innerText()).includes(t)) throw new Error(`unexpected text: ${t}`); };

await step('start page and fresh demo', async () => {
  await page.goto(BASE + '/');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await expectText('Daily care documentation');
  await shot('01-start');
});

await step('admin sign-in with MFA; care staff blocked from Web Admin', async () => {
  await page.goto(BASE + '/admin/signin');
  await page.fill('input[autocomplete="username"]', 'SC-2014');
  await page.fill('input[type="password"]', 'demo');
  await page.click('button:has-text("Continue")');
  await expectText('does not have Web Admin access');
  await page.fill('input[autocomplete="username"]', 'dana.whitfield@solaria.example');
  await page.click('button:has-text("Continue")');
  await expectText('Verify it');
  await page.fill('.code-input', '111111');
  await page.click('button:has-text("Verify and sign in")');
  await expectText('incorrect or has expired');
  await page.fill('.code-input', '246810');
  await page.click('button:has-text("Verify and sign in")');
  await page.waitForSelector('[data-tour="client-table"]');
  await shot('02-admin-clients');
});

await step('admin creates a client (validation + duplicate check)', async () => {
  await page.click('a:has-text("New client")');
  await page.click('button:has-text("Create client")');
  await expectText('Check the highlighted fields');
  await page.click('button:has-text("Fill sample client")');
  await page.click('button:has-text("Create client")');
  await expectText('Olivia Grant');
  await expectText('now visible to Care Staff');
  await page.click('a:has-text("Edit client")');
  await page.click('button:has-text("Save changes")');
  await noText('Possible duplicate');
  await page.goto(BASE + '/admin/clients/new');
  await page.click('button:has-text("Fill sample client")');
  await page.click('button:has-text("Create client")');
  await expectText('Possible duplicate client');
  await page.click('.modal button:has-text("Cancel")');
});

await step('admin adds scheduled care for Olivia', async () => {
  await page.goto(BASE + '/admin/clients');
  await page.click('text=Grant, Olivia');
  await page.click('a.tab:has-text("Care Schedule")');
  await page.click('[data-tour="schedule-add"]');
  await page.fill('.modal input[placeholder="e.g. Toileting"]', 'Nebulizer check');
  await page.fill('.modal input[type="time"]', '10:30');
  await page.click('.modal button:has-text("Every day")');
  await page.click('.modal button:has-text("Add to schedule")');
  await expectText('Nebulizer check');
  await shot('03-admin-schedule');
});

await step('admin adds a medication for Emily', async () => {
  await page.goto(BASE + '/admin/clients/c_emily/medications');
  await page.click('button:has-text("Add medication")');
  await page.locator('.modal .field:has(label:has-text("Medication")) input').first().fill('Vitamin D drops');
  await page.locator('.modal .field:has(label:has-text("Dose")) input').fill('400 IU');
  await page.locator('.modal input[type="time"]').first().fill('10:45');
  await page.click('.modal button:has-text("Every day")');
  await page.click('.modal button:has-text("Add medication")');
  await expectText('Vitamin D drops');
});

await step('admin invites staff; audit reflects actions', async () => {
  await page.goto(BASE + '/admin/staff');
  await page.click('button:has-text("Invite staff")');
  await page.locator('.modal .field:has(label:has-text("Full name")) input').fill('Rosa Linden');
  await page.locator('.modal .field:has(label:has-text("Employee ID")) input').fill('SC-2077');
  await page.locator('.modal .field:has(label:has-text("Email")) input').fill('rosa.linden@solaria.example');
  await page.click('.modal button:has-text("Pediatric Area")');
  await page.click('.modal button:has-text("Send invitation")');
  await expectText('Invitation created for');
  await page.goto(BASE + '/admin/audit');
  await expectText('Created client record: Olivia Grant');
  await expectText('Added scheduled care: Olivia Grant');
  await expectText('Invitation sent: Rosa Linden');
  await shot('04-admin-audit');
});

await step('switch to Care Staff: admin changes visible on iPad', async () => {
  await view('Care Staff - Sarah Mitchell, LVN · iPad');
  await page.waitForSelector('[data-tour="client-board"]');
  await expectText('Olivia Grant');
  await page.click('a.client-card:has-text("Olivia Grant")');
  await expectText('Nebulizer check');
  await page.goto(BASE + '/care/clients/c_emily');
  await expectText('Vitamin D drops 400 IU');
  await shot('05-care-workspace');
});

await step('care: access scope - James cannot see Ava (Infant & Toddler)', async () => {
  await view('Care Staff - James Rivera, PCA · iPad');
  await page.waitForSelector('[data-tour="client-board"]');
  await noText('Ava Morales');
  await page.goto(BASE + '/care/clients/c_ava');
  await expectText('Not in your care areas');
  await view('Care Staff - Sarah Mitchell, LVN · iPad');
});

await step('care: record intake from scheduled item → timeline + I/O', async () => {
  await page.goto(BASE + '/care/clients/c_emily/document/intakeOutput');
  await page.fill('.sheet input[placeholder="120"]', '');
  await page.click('.sheet button[type="submit"]');
  await expectText('Choose the intake type');
  await page.click('.sheet button:has-text("Formula")');
  await page.fill('.sheet input[placeholder="120"]', '60');
  await page.click('.sheet .choice button:has-text("G-tube")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await expectText('60 mL Formula via G-tube');
  await expectText('180', '.io-row');
});

await step('care: medication Given → dose completed', async () => {
  await page.goto(BASE + '/care/clients/c_emily');
  await page.click('.care-item:has-text("Glycopyrrolate") .ci-main');
  await page.click('.sheet .choice button:has-text("Held")');
  await page.click('.sheet button[type="submit"]');
  await expectText('A note is required');
  await page.click('.sheet .choice button:has-text("Given")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await page.locator('.care-item.s-completed:has-text("Glycopyrrolate")').waitFor();
});

await step('care: observations + assessment + device care', async () => {
  await page.goto(BASE + '/care/clients/c_emily/document/observations');
  await page.fill('.sheet input[placeholder="98.6"]', '120');
  await page.click('.sheet button[type="submit"]');
  await expectText('Temperature must be between');
  await page.fill('.sheet input[placeholder="98.6"]', '98.7');
  await page.click('.sheet button:has-text("Upright 30°+")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await page.goto(BASE + '/care/clients/c_emily/document/assessment');
  await page.click('.sheet button:has-text("Mark within normal limits")');
  await page.click('.sheet .acc-head:has-text("COVID-19")');
  await page.click('.sheet button[role="radio"]:has-text("No")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await expectText('COVID-19 and Pain assessment documented');
  await page.click('.care-item:has-text("G-tube site care") .ci-main');
  await expectText('Current device record');
  await page.click('.sheet button:has-text("Clean / dry / intact")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await page.locator('.care-item.s-completed:has-text("G-tube site care")').waitFor();
});

await step('care: PIN quick switch → James documents brief change with output', async () => {
  await page.click('.care-user-btn');
  await page.click('text=Lock & switch user');
  await page.click('.pin-person:has-text("James Rivera")');
  for (const d of '2031') await page.click(`.pin-pad button[aria-label="${d}"]`);
  await page.waitForSelector('[data-tour="client-board"]');
  await page.goto(BASE + '/care/clients/c_emily/document/activity');
  await page.click('.sheet button:has-text("Diaper / Brief Change")');
  await page.click('.sheet .field:has(label:has-text("Urine")) button:has-text("Wet - small")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await page.goto(BASE + '/care/clients/c_emily/flow-sheet');
  await expectText('Urine: Wet - small');
  const chips = await page.locator('[data-tour="timeline"] .staff-chip:has-text("James")').count();
  if (chips < 3) throw new Error('expected James attribution on several entries');
  await shot('06-flow-sheet');
});

await step('care: mark not done, correction keeps original', async () => {
  await page.goto(BASE + '/care/clients/c_emily');
  await page.click('.care-item:has-text("Position change / ROM") .ci-nd');
  await page.click('.modal button:has-text("Client asleep")');
  await page.click('.modal button:has-text("Save")');
  await page.locator('.care-item.s-not-done:has-text("Position change")').waitFor();
  await page.goto(BASE + '/care/clients/c_emily/flow-sheet');
  await page.click('.tl-main:has-text("60 mL Formula")');
  await page.click('button:has-text("Record a correction")');
  await page.fill('.modal textarea', 'Amount was 70 mL');
  await page.click('.modal button:has-text("Save correction")');
  await expectText('Corrected - see correction');
  await expectText('Corrects intake entry: Amount was 70 mL');
});

await step('care: review, sign-off, parent copy, complete', async () => {
  await view('Care Staff - Sarah Mitchell, LVN · iPad');
  await page.goto(BASE + '/care/clients/c_emily/complete');
  if (!(await page.locator('button:has-text("Complete flow sheet")').isDisabled())) throw new Error('complete should be disabled before sign-off');
  await page.click('.signoff:has-text("PCA signature") button');
  await page.click('.signoff:has-text("Licensed Nurse signature") button');
  await page.click('.card:has-text("Parent copy") .field:has(label:has-text("offered")) button:has-text("Yes")');
  await page.click('.card:has-text("Parent copy") button:has-text("Accepted")');
  await shot('07-signoff');
  await page.click('button:has-text("Complete flow sheet")');
  await expectText('The record is read-only');
  await page.goto(BASE + '/care/clients');
  await page.locator('a.client-card:has-text("Emily Carter") >> text=Flow sheet completed').waitFor();
});

await step('care: addendum after completion', async () => {
  await page.goto(BASE + '/care/clients/c_emily/document/activity');
  await expectText('saved as an attributed addendum');
  await page.click('.sheet button:has-text("Enrichment")');
  await page.click('.sheet button[type="submit"]');
  await page.goto(BASE + '/care/clients/c_emily/flow-sheet');
  await expectText('Addendum');
});

await step('care: records by date range and authorization period, read-only view', async () => {
  await page.goto(BASE + '/care/records?client=c_emily');
  await page.waitForSelector('[data-tour="records"] table');
  const before = await page.locator('[data-tour="records"] tbody tr').count();
  await page.click('.toggle:has-text("Current")');
  await page.waitForTimeout(200);
  const after = await page.locator('[data-tour="records"] tbody tr').count();
  if (after < before) throw new Error('authorization period should include at least the last 14 days');
  await page.locator('[data-tour="records"] tbody tr').nth(1).locator('a:has-text("Open")').click();
  await expectText('Daily Flow Sheet');
  await expectText('Licensed Nurse');
  await shot('08-record');
});

await step("today's care across clients", async () => {
  await page.goto(BASE + '/care/today');
  await expectText("Today's care");
  await page.locator('.care-item').first().waitFor();
});

await step('logout ends session; protected route redirects', async () => {
  await page.click('.care-user-btn');
  await page.click('.menu >> text=Log out');
  await expectText('session was ended');
  await page.goto(BASE + '/care/clients/c_emily');
  await page.waitForSelector('[data-tour="signin"]');
});

await step('account activation from invitation, then terms acceptance', async () => {
  await page.goto(BASE + '/care/activate');
  await page.click('.proto-note button:has-text("Fill")');
  await page.click('button:has-text("Activate account")');
  await expectText('Account activated');
  await page.goto(BASE + '/care/signin');
  await page.fill('input[autocomplete="username"]', 'nina.park@solaria.example');
  await page.fill('input[type="password"]', 'demo');
  await page.click('button:has-text("Continue")');
  await page.fill('.code-input', '246810');
  await page.click('button:has-text("Verify and sign in")');
  await expectText('Terms of use');
  await page.click('.check');
  await page.click('button:has-text("Accept and continue")');
  await page.waitForSelector('[data-tour="client-board"]');
  await expectText('Liam Foster');
  await noText('Emily Carter');
});

await step('scope: leanest version still completes the core journey', async () => {
  await page.click('.demo-bar button[title*="smaller Phase 1"]');
  await page.click('.scope-preset:has-text("Leanest version")');
  await page.click('.modal button:has-text("Done")');
  await view('Care Staff - James Rivera, PCA · iPad');
  await noText("Today's Care");
  await noText('Records');
  await page.click('a.client-card:has-text("Liam Foster")');
  await page.click('a:has-text("Add documentation")');
  const types = await page.locator('.doc-type').count();
  if (types !== 1) throw new Error(`expected only Care Activity, got ${types}`);
  await page.click('.doc-type');
  await page.click('.sheet button:has-text("Toileting")');
  await page.click('.sheet button[type="submit"]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await expectText('Toileting', '[data-tour="timeline"]');
  await page.goto(BASE + '/care/records');
  await expectText('not in the current scope');
  await page.goto(BASE + '/care/clients/c_emily/document/medication');
  await expectText('not in the current scope');
  await shot('09-lean');
});

await step('scope: admin removed → Web Admin option disabled; intermediate scope works', async () => {
  const disabled = await page.locator('[data-tour="viewing-as"] option:has-text("Dana")').evaluate((o) => o.disabled);
  if (!disabled) throw new Error('Web Admin should be unavailable in lean scope');
  await page.click('.demo-bar button[title*="smaller Phase 1"]');
  await page.click('.scope-preset:has-text("Core care documentation")');
  await page.click('.modal button:has-text("Done")');
  await page.goto(BASE + '/care/clients/c_noah');
  await page.click('a:has-text("Add documentation")');
  const types = await page.locator('.doc-type').count();
  if (types !== 4) throw new Error(`expected 4 core types, got ${types}`);
  if ((await page.locator('.doc-picker').innerText()).includes('Medication')) throw new Error('medication should be out of scope');
  await page.goto(BASE + '/care/clients/c_noah/document/specializedCare?ref=' + encodeURIComponent('s_no_trach@08:30'));
  await expectText('recorded as a care activity');
  await page.goto(BASE + '/care/clients/c_noah');
  // a scheduled device-care item with its module out of scope falls back to a care activity
  await page.click('.demo-bar button[title*="smaller Phase 1"]');
  await page.click('.scope-preset:has-text("Full roadmap scope")');
  await page.click('.modal button:has-text("Done")');
});

await step('walkthroughs A, B and C step through without dead ends', async () => {
  for (const [label, count] of [['A · Administrative setup', 9], ['B · Care Staff daily documentation', 12], ['C · Lean Phase 1', 5]]) {
    await page.click('.demo-bar button[title="Walkthroughs"]');
    await page.click(`.demo-menu button:has-text("${label}")`);
    for (let i = 1; i < count; i++) {
      await page.waitForTimeout(350);
      const body = await page.locator('.app-body').innerText();
      if (body.trim().length < 20) throw new Error(`${label} step ${i} rendered blank`);
      await page.click('.walk button:has-text("Next")');
    }
    await page.waitForTimeout(300);
    await page.click('.walk button:has-text("Finish")');
  }
  await page.click('.demo-bar button[title*="smaller Phase 1"]');
  await page.click('.scope-preset:has-text("Full roadmap scope")');
  await page.click('.modal button:has-text("Done")');
});

await step('iPad layout at 1024 x 768 without frame', async () => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await view('Care Staff - Sarah Mitchell, LVN · iPad');
  await page.goto(BASE + '/care/clients/c_noah');
  await shot('10-ipad-1024');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error('horizontal overflow at 1024px');
});

await step('reset demo restores the seed', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click('.demo-bar button[title="Reset demo"]');
  await page.click('.modal button:has-text("Reset")');
  await expectText('Daily care documentation');
  await view('Administrative User - Dana Whitfield · Web Admin');
  await noText('Olivia');
});

if (errors.length) { console.log('\nBrowser errors:\n' + errors.join('\n')); failed++; }
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nAll smoke checks passed');
process.exit(failed ? 1 : 0);
