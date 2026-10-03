/**
 * End-to-end API smoke test.
 *
 *   npm run test:api                       # against http://127.0.0.1:$PORT
 *   API_BASE=http://localhost:3003 npm run test:api
 *
 * Exercises create / read / update / delete across the main resources AND
 * asserts with direct SQL that rows are actually written, updated and removed —
 * an HTTP 200 alone does not prove persistence.
 *
 * It seeds its own admin user (API access needs a token, and the admin-creation
 * endpoint is itself behind the guard) and removes everything it created on the
 * way out. Point it at a disposable database, never production.
 *
 * Exit code 0 = all checks passed.
 */
'use strict';

require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const BASE = process.env.API_BASE || `http://127.0.0.1:${process.env.PORT || 3000}`;
const EMAIL = 'apismoke.admin@example.test';
const EMP_EMAIL = 'apismoke.emp@example.test';
const PASSWORD = 'SmokeTest123!';

const results = [];
let TOKEN = null;
let headerPrinted = false;

/** Print one result row as soon as it is known. */
function record(r) {
  if (!headerPrinted) {
    console.log(`\nAPI smoke test \u2014 ${BASE}\n`);
    console.log('KIND  METHOD   TARGET                                              RESULT  STATUS');
    headerPrinted = true;
  }
  results.push(r);
  console.log(
    `${r.kind.padEnd(5)} ${r.method.padEnd(8)} ${String(r.target).slice(0, 51).padEnd(52)} ` +
    `${(r.ok ? 'PASS' : 'FAIL').padEnd(7)} ${r.status}${r.note ? '  ' + r.note : ''}`,
  );
}

const db = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

/** Call an endpoint and record whether the status matched expectations. */
async function api(method, path, { body, auth = true, expect } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  let res;
  let text;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    text = await res.text();
  } catch (e) {
    record({ kind: 'API', method, target: path, status: 'ERR', ok: false, note: e.message });
    return { status: 0, data: null };
  }
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON response is fine for status-only checks */
  }
  const expected = Array.isArray(expect) ? expect : [expect];
  const ok = expect ? expected.includes(res.status) : res.status < 400;
  record({
    kind: 'API',
    method,
    target: path,
    status: res.status,
    ok,
    note: ok ? '' : String(data?.message ?? text).slice(0, 70),
  });
  return { status: res.status, data };
}

/** Assert a single value in the database. */
async function expectDb(label, sql, params, want) {
  let got = null;
  try {
    const r = await db.query(sql, params);
    got = r.rows[0] ? Object.values(r.rows[0])[0] : null;
  } catch (e) {
    record({ kind: 'DB', method: 'VERIFY', target: label, status: 'ERR', ok: false, note: e.message });
    return;
  }
  const ok = String(got) === String(want);
  record({
    kind: 'DB',
    method: 'VERIFY',
    target: label,
    status: String(got),
    ok,
    note: ok ? '' : `expected ${want}`,
  });
}

/** Remove anything a previous run left behind, plus our own admin. */
async function cleanup() {
  for (const email of [EMP_EMAIL, EMAIL]) {
    const u = await db.query('select id from "user" where email=$1', [email]);
    for (const row of u.rows) {
      await db.query(
        'delete from employee_locations_location where "employeeId" in (select id from employee where "authUserId"=$1)',
        [row.id],
      );
      await db.query('delete from employee where "authUserId"=$1', [row.id]);
      await db.query('delete from admin where "authUserId"=$1', [row.id]);
      await db.query('delete from "user" where id=$1', [row.id]);
    }
  }
  await db.query("delete from location where name like 'apismoke%'");
  await db.query("delete from departments where name like 'apismoke%'");
  await db.query("delete from group_policy where name like 'apismoke%'");
  await db.query("delete from version_manager where \"iosVersion\"='0.0.99'");
}

/** AuthService.login() dereferences an employee record, so the admin needs one. */
async function seedAdmin() {
  const hash = bcrypt.hashSync(PASSWORD, bcrypt.genSaltSync());
  const ins = await db.query(
    `insert into "user"(email,type,status,username,password,company,"profileId")
     values($1,'admin','Active',$2,$3,'SMOKE',0) returning id`,
    [EMAIL, 'apismoke_admin', hash],
  );
  const id = ins.rows[0].id;
  await db.query('insert into admin("authUserId") values($1)', [id]);
  await db.query('insert into employee("authUserId","checkInRowId") values($1,\'\')', [id]);
  return id;
}

(async () => {
  await db.connect();
  await cleanup();
  await seedAdmin();

  // ---------- AUTH ----------
  const login = await api('POST', '/auth/login', {
    auth: false,
    expect: 201,
    body: {
      email: EMAIL, password: PASSWORD, deviceId: 'apismoke-device',
      deviceType: 'web', version: '1.0.0', osVersion: '1',
    },
  });
  TOKEN = login.data?.access_token;
  if (!TOKEN) console.error('!! no token acquired — auth-required checks will fail\n');
  await api('GET', '/me/me/me', { expect: 200 });

  // ---------- DEPARTMENTS: create → verify → update → verify → delete ----------
  const dep = await api('POST', '/departments', {
    expect: 201, body: { name: 'apismoke-dept', isActive: true },
  });
  const depId = dep.data?.id;
  await expectDb('department row persisted', 'select name from departments where id=$1', [depId], 'apismoke-dept');
  await expectDb('department isActive saved', 'select "isActive" from departments where id=$1', [depId], 'true');
  await api('GET', `/departments/${depId}`, { expect: 200 });
  await api('GET', '/departments/search/apismoke', { expect: 200 });
  await api('PATCH', `/departments/${depId}`, {
    expect: 200, body: { name: 'apismoke-dept-upd', isActive: false },
  });
  await expectDb('department UPDATE persisted', 'select name from departments where id=$1', [depId], 'apismoke-dept-upd');
  await expectDb('department isActive updated', 'select "isActive" from departments where id=$1', [depId], 'false');

  // ---------- LOCATIONS ----------
  const loc = await api('POST', '/locations', {
    expect: 201, body: { name: 'apismoke-loc', qrCode: 'APISMOKE-QR', lat: 24.7, long: 46.6 },
  });
  const locId = loc.data?.id;
  await expectDb('location row persisted', 'select name from location where id=$1', [locId], 'apismoke-loc');
  await expectDb('location qrCode saved', 'select "qrCode" from location where id=$1', [locId], 'APISMOKE-QR');
  await api('GET', `/locations/${locId}`, { expect: 200 });
  await api('PATCH', `/locations/${locId}`, {
    expect: 200, body: { name: 'apismoke-loc-upd', qrCode: 'APISMOKE-QR2', lat: 24.8, long: 46.7 },
  });
  await expectDb('location UPDATE persisted', 'select name from location where id=$1', [locId], 'apismoke-loc-upd');

  // ---------- GROUP POLICIES ----------
  const gp = await api('POST', '/groupPolicies', {
    expect: [200, 201],
    body: { name: 'apismoke-policy', checkinTime: '09:00', checkoutTime: '17:00', employees: [], tags: 't' },
  });
  const gpId = gp.data?.id;
  if (gpId) {
    await expectDb('groupPolicy row persisted', 'select name from group_policy where id=$1', [gpId], 'apismoke-policy');
    await api('GET', `/groupPolicies/${gpId}`, { expect: 200 });
    await api('PATCH', `/groupPolicies/${gpId}`, {
      expect: 200,
      body: { name: 'apismoke-policy-upd', checkinTime: '08:00', checkoutTime: '16:00', employees: [], tags: 't' },
    });
    await expectDb('groupPolicy UPDATE persisted', 'select name from group_policy where id=$1', [gpId], 'apismoke-policy-upd');
  }

  // ---------- VERSION MANAGER (public) ----------
  await api('POST', '/versionManager', {
    auth: false, expect: 201, body: { iosVersion: '0.0.99', androidVersion: '0.0.99' },
  });
  await api('GET', '/versionManager/get-active-version', { auth: false, expect: 200 });
  await expectDb(
    'versionManager persisted and active',
    'select "iosVersion" from version_manager where "isActive"=true order by id desc limit 1',
    [], '0.0.99',
  );

  // ---------- EMPLOYEES ----------
  const emp = await api('POST', '/employees/signup', {
    auth: false, expect: [200, 201],
    body: {
      email: EMP_EMAIL, firstName: 'Api', lastName: 'Smoke', userName: 'apismoke_emp',
      isMac: false, macAddress: '00:00:00:00:00:01', locations: locId ? [locId] : [],
      departmentId: depId, password: PASSWORD, deviceId: 'apismoke-emp-device',
    },
  });
  const empId = emp.data?.id;
  await expectDb('employee user row created', 'select email from "user" where email=$1', [EMP_EMAIL], EMP_EMAIL);
  await expectDb(
    'employee password stored as bcrypt hash',
    'select substring(password,1,4) from "user" where email=$1', [EMP_EMAIL], '$2b$',
  );
  if (empId) {
    await api('GET', `/employees/${empId}`, { expect: 200 });
    await api('PATCH', `/employees/${empId}`, { expect: 200, body: { attendanceRadius: 175 } });
    await expectDb('employee UPDATE persisted', 'select "attendanceRadius" from employee where id=$1', [empId], '175');
  }

  // ---------- READ-ONLY SURFACE ----------
  for (const path of [
    '/departments', '/locations', '/groupPolicies', '/admins',
    '/attendances', '/attendances/current-time', '/attendances/with-data/10/0',
    '/attendances/get/all/of/different/device/ids/10/0',
    '/employees/10/0', '/employees/search?query=apismoke',
    '/deviceIdTracking/10/0', '/departments/10/0',
  ]) {
    await api('GET', path, { expect: 200 });
  }

  // ---------- AUTH BOUNDARY ----------
  const saved = TOKEN;
  TOKEN = null;
  await api('GET', '/attendances', { expect: 401 });          // no token → rejected
  // A structurally valid but unsigned JWT. NOTE: a *malformed* (non-JWT) bearer
  // token makes the request hang forever instead of returning 401 — see
  // docs/DEPENDENCY-REMEDIATION.md §5 finding #11. Pre-existing; not exercised
  // here because it would stall the suite.
  TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im5vYm9keSJ9.invalidsignature';
  await api('GET', '/attendances', { expect: 401 });          // forged token → rejected
  TOKEN = saved;

  // ---------- DELETES → verify rows removed ----------
  if (gpId) {
    await api('DELETE', `/groupPolicies/${gpId}`, { expect: 200 });
    await expectDb('groupPolicy DELETE removed row', 'select count(*) from group_policy where id=$1', [gpId], '0');
  }
  if (locId) {
    await api('DELETE', `/locations/${locId}`, { expect: 200 });
    await expectDb('location DELETE removed row', 'select count(*) from location where id=$1', [locId], '0');
  }
  if (depId) await api('DELETE', `/departments/${depId}`, { expect: 200 });

  await cleanup();
  await db.end();

  // ---------- REPORT ----------
  const passed = results.filter((r) => r.ok).length;
  console.log(`\nAPI smoke test — ${BASE}\n`);
  console.log('KIND  METHOD   TARGET                                              RESULT  STATUS');
  for (const r of results) {
    console.log(
      `${r.kind.padEnd(5)} ${r.method.padEnd(8)} ${String(r.target).slice(0, 51).padEnd(52)} ` +
      `${(r.ok ? 'PASS' : 'FAIL').padEnd(7)} ${r.status}${r.note ? '  ' + r.note : ''}`,
    );
  }
  const apiCount = results.filter((r) => r.kind === 'API').length;
  const dbCount = results.filter((r) => r.kind === 'DB').length;
  console.log(`\n${passed}/${results.length} passed   (${apiCount} API calls, ${dbCount} DB assertions)`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(async (e) => {
  console.error('HARNESS ERROR:', e.message);
  try { await db.end(); } catch { /* already closed */ }
  process.exit(2);
});
