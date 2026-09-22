# Dependency & Security Remediation

**Repository:** `ozone-attendanceApp-be` · **Date:** 22 Sep 2026
**Branch:** `chore/dependency-security-upgrade` → PR #1

---

## 1. Context

A security review of the Ozone production estate audited six servers. This
repository was the **one server whose dependency scan could not complete**, so
the review carried no figures for it at all.

Every number in this document comes from `npm audit` run directly against this
tree — not from the review document.

---

## 2. Vulnerabilities: before and after

### Headline

| Scope | Before | After |
|---|---|---|
| **Production** (`--omit=dev`) | **87** — 8 critical, 32 high, 31 moderate, 16 low | **0** |
| **All dependencies** | **131** — 12 critical, 41 high, 58 moderate, 20 low | **0** |
| `node_modules` size | 995 MB | 586 MB (−41%) |

### How it came down

| Stage | Prod total | Critical | High |
|---|---|---|---|
| Baseline | 87 | 8 | 32 |
| A — remove never-imported packages | 61 | 6 | 27 |
| B — add scoped `overrides` | 57 | 5 | 23 |
| C — targeted minor bumps | 51 | 1 | 21 |
| D — **NestJS 7 → 12 / TypeORM 0.2 → 1.1** | 14 | 1 | 1 |
| E — bcrypt 6, jimp 1.x, eslint 8 | 6 | 0 | 0 |
| F — AWS SDK v3, `csv-stringify` | **0** | **0** | **0** |

Stages A–C were dependency-only. **Stage D onward required code changes** — the
remaining advisories were structurally gated behind the framework majors.

### Critical vulnerabilities resolved (production)

| Package | Advisory | Resolved by |
|---|---|---|
| `class-validator` <0.14 | SQL injection / XSS | bump to 0.14.x |
| `typeorm` <=0.3.30 | SQL injection | upgrade to 1.1 |
| `request` | SSRF (package deprecated) | removed — never imported |
| `form-data` | unsafe random boundary | removed with `request` |
| `vm2` (28 escapes) | sandbox breakout | removed with `node-mailjet` 3 |
| `tar` | path traversal / DoS | bcrypt 6 (drops `node-pre-gyp`) |
| `minimist` | prototype pollution | override |
| `@nestjs/mapped-types` | via `class-validator` | swagger 12 + override |

> **Note on exploitability.** Not every scanner "critical" was reachable here.
> `vm2` was only live behind a PAC proxy (never configured), `tar` was
> install-time only, and the TypeORM `orderBy` injection is **MySQL/MariaDB
> only** — this service runs PostgreSQL. These were fixed anyway, but the raw
> counts overstated real risk.

---

## 3. What changed

### Removed — 16 packages, never imported anywhere

`@aws-sdk/client-cloudwatch-logs` · `@sendgrid/mail` · `@tensorflow/tfjs-node` ·
`@types/nodemailer` · `@types/uuid` · `cache-manager-ioredis` · `canvas` ·
`csv-parse` · `face-api.js` · `nest-csv-parser` · `nest-winston` · `nodemailer` ·
`request` · `resize-image-buffer` · `uuid` · `winston-cloudwatch`

`@tensorflow/tfjs-node`, `face-api.js` and `canvas` accounted for most of the
409 MB saved — leftovers from an on-device face-match approach that AWS
Rekognition replaced.

### Framework upgrades

| | from | to |
|---|---|---|
| NestJS | 7.6 | 12.0 |
| TypeORM | 0.2 | 1.1 |
| Express | 4 | 5 |
| rxjs | 6 | 7 |
| TypeScript | 4 | 6 |
| AWS SDK | v2 (EOL) | v3 |

Plus `bcrypt` 6, `jimp` 1.6, `joi` 18, `passport` 0.7, `class-validator` 0.14,
`class-transformer` 0.5, `node-mailjet` 6.

### Replaced

- **`objects-to-csv` → `csv-stringify`.** Abandoned, and its `csv-parse`
  dependency had no compatible fix. Replaced behind a local helper that
  reproduces `toDisk(file, { append })`. Output verified **byte-identical**
  against the old library across the chunked header/append sequence —
  including embedded commas, escaped quotes, unicode, newlines, `null`
  values and the empty-array case.
- **`aws-sdk` v2 → AWS SDK v3.** `@aws-sdk/client-s3` + `lib-storage` for S3,
  `@aws-sdk/client-rekognition` for face matching. Uses `Upload` rather than
  `PutObjectCommand` so the result still carries `Key`, which callers read.
- **`@nkaurelien/nest-bugsnag` → Bugsnag SDK directly.** Abandoned and
  peer-locked to Nest 6. `handleAnyErrors()` replicated verbatim.

### Phantom dependency fixed

`seeder/seeder.service.ts` imports `csv-parser`, which was **not declared in
`package.json`** — it resolved only transitively through `nest-csv-parser`.
Removing that package broke `npm run seed`. `csv-parser` is now explicit.

### Config

- `tsconfig.json`: `"strict": false` set **explicitly**. TypeScript 6 flipped the
  default on, surfacing 538 pre-existing strictness errors. This project was
  never strict; prior behaviour is preserved rather than rewriting every file.
- `.gitignore`: `.env` added (it was committable — only `.env.sample` was
  listed, a file that never existed), plus `.claude/worktrees/`.
- `.env.example` added, documenting all 28 environment variables.

---

## 4. Regressions found and fixed

Three bugs the compiler could **not** catch. All were found by running the API
against a live database — none would have been caught by type-checking or by
the test suite (which does not run, see §6).

### 4.1 Entity passed as a where-value — `500` on two endpoints

```ts
// TypeORM 0.2 matched on the relation's foreign key
findOne({ authUser })
// 1.x treats EVERY property of the entity as a condition
findOne({ where: { authUser } })   // ← throws on any NULL column
```

```
TypeORMError: Null value encountered in property
'Admin__Admin_authUser.initialData' of a where condition.
```

Broke `GET /me/me/me` and `PATCH /locations/:id` (both route through
`AdminService.findByAuthUserId`). Fixed to `where: { authUser: { id } }`.

Sites: `admin.service.ts`, `employee.service.ts`, and `file.service.ts` — the
last **pre-existing**, which would have broken file uploads.

### 4.2 Undefined id in a where-clause — `500` on employee update

0.2 tolerated `findOne({ id: undefined })`; 1.x throws. Broke
`PATCH /employees/:id`. Four sites now guarded so a missing optional id yields
`null`, matching the `?? fallback` the surrounding code already expected.

> Deliberately **not** fixed with the connection-level
> `invalidWhereValuesBehavior: { undefined: 'ignore' }`. That restores 0.2
> semantics by *dropping* the condition — silently returning an arbitrary row
> rather than none. That is a data-correctness hazard, not a fix.

### 4.3 `PassportModule` imported bare — app would not boot

In `@nestjs/passport` v12 the bare module is `@Module({})`; `AuthModuleOptions`
is only provided by `register()`. Guards without an explicit constructor
(`LocalAuthGuard`) failed to resolve:

```
Nest can't resolve dependencies of the LocalAuthGuard (?).
```

Fixed to `PassportModule.register({})`. `JwtAuthGuard` was unaffected — it
declares its own constructor taking `Reflector`.

**Without live testing this would have merged and failed on startup in
production.**

---

## 5. Issues identified but NOT fixed

Reported for visibility; **none are dependency problems** and all are out of
scope for this work. Ranked by real exploitability.

| # | Issue | Location |
|---|---|---|
| 🔴 1 | **Authentication bypass.** The incoming JWT is decoded with `jwtDecode` (no signature check), the user is looked up from the unverified payload, and the app then **mints itself a valid token**. `JWT_SECRET` is bypassed entirely; expired and old-secret tokens also pass. | `auth/jwt.strategy.ts:20-43` |
| 🔴 2 | **Unauthenticated account takeover.** The HOTP secret is the employee's **numeric row id**, and `POST /employees/set-password` is `@NoAuth()` taking `employeeId` from the body. The OTP is computable offline. Counters are in-memory, never invalidated after use, and duplicated across two controllers. | `auth.controller.ts:315`, `employee.controller.ts:701,758` |
| 🟠 3 | **Global `ValidationPipe` is dead code.** Registered *after* `app.listen()`; Nest binds pipes at route-registration inside `init()`. `whitelist`/`transform` have never been active. | `main.ts:82-84` |
| 🟠 4 | **Passwords and OTPs written to logs.** `body: req.body` is logged on every request, including `/auth/login` and `/reset-password`. | `middelwares/logger.middeleware.ts:17` |
| 🟠 5 | **Unauthenticated privileged endpoints.** `PATCH /employees/status/:batchNo/:status` (anyone can activate/deactivate any employee); version-manager `POST` (anyone can force an app-version lockout); public `signup`; secrets passed in URL paths where they land in access logs. | `employee.controller.ts`, `version_manager.controller.ts:33` |
| 🟠 6 | **`synchronize: true` against production.** TypeORM auto-alters the live schema on boot. The project has **no migrations** — see §7. | `app.module.ts:85` |
| 🟠 7 | **Admin check commented out** on employee delete — any authenticated employee can delete any employee. | `employee.controller.ts:790-795` |
| 🟡 8 | No `helmet`, no rate limiting, bare `enableCors()` (all origins), 200 MB body limit. | `main.ts:79-81` |
| 🟡 9 | Dead authorization branches: `req.user.role` is checked, but the entity field is `type` — supervisor logic never executes. | `attendance.controller.ts:462,509` |
| 🟡 10 | `forget-password` returns 404 vs 200 → user enumeration. `AWS_REIGION` misspelt vs `AWS_REGION` in the Joi schema. | `auth.controller.ts`, `faceMatch.helpers.ts:30` |
| 🔴 11 | **Unauthenticated DoS via malformed token.** `jwtDecode()` throws on a non-JWT bearer token inside the async `authenticate()` override; the rejection is unhandled, Passport never calls back, and **the request hangs forever** holding the connection open. Confirmed: `Bearer not-a-real-token` → no response after 12s, while a well-formed unsigned JWT correctly returns 401. Found by the API suite in §6. | `auth/jwt.strategy.ts:23` |

**Assessment:** #1, #2 and #11 are worth more to an attacker than all 131 dependency
findings combined. Both are unauthenticated and trivially exploitable. This
remediation should not be mistaken for having secured the service.

---

## 6. Verification

### Automated API suite — 40/40

`npm run test:api` (see [`test/api-smoke.js`](../test/api-smoke.js)) — **25 API
calls** covering create/read/update/delete plus **15 direct SQL assertions**
confirming rows are actually written, updated and deleted.

Covered: departments, locations, group policies, employees, version manager,
attendance, admins, device tracking, auth. Also asserts signup stores a
**bcrypt hash**, not plaintext.

### Other checks

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| Build | clean |
| App boot | all 14 controllers registered against live PostgreSQL 18 |
| `synchronize` schema build | 13 tables created correctly under TypeORM 1.1 |
| `npm run seed` | exit 0 — validates the `csv-parser` fix |
| CSV export | byte-identical to the old library |
| `forRoutes('*')` on Express 5 | verified via standalone Nest 12 app |

### Known gaps

- **The unit test suite does not run.** 7 suites fail to load — `jest.rootDir`
  is `src` with no mapping for the `src/…` absolute imports the entities use.
  **Pre-existing and unchanged**; it means there was no automated regression
  signal before or after this work.
- **Tested against an empty schema.** The API suite proves the code paths work;
  it does not prove real data migrates correctly. Run against a restored dump
  before trusting it.
- `npm start` needs `NODE_PATH=./dist` or `tsconfig-paths/register` — the
  `src/…` absolute imports don't resolve under plain Node. Pre-existing.

---

## 7. Follow-up recommendations

1. **Fix findings #1, #2 and #11 in §5.** Highest real risk in the service.
   All three stem from the same broken `authenticate()` override in
   `jwt.strategy.ts`; rewriting it addresses the bypass and the DoS together.
2. **Repair the jest config** so there is a regression signal at all.
3. **Introduce TypeORM migrations** and set `synchronize: false`. There is no
   `migration` script today; the schema is auto-synced on every boot.
4. **Deployment note:** production Node must be **≥ 20** for Nest 12. This
   upgrade also *fixes* the previous Node 22+ incompatibility — Nest 7 called
   `util.isObject` / `util.isNullOrUndefined`, both removed in Node 22.
5. **After pulling:** run `npm ci`. A plain `git pull` leaves Nest 7 modules
   against Nest 12 source. `overrides` is npm-only — do not use yarn.
