---
name: rn-devops-apply-kit
description: >-
  Apply the RN DevOps kit / pipeline CI to the current React Native app
  (template-pipeline-react-native): user says e.g. "apply the RN DevOps kit",
  "add GitHub Actions from the pipeline template", "copy RN CI workflows here",
  "set up pipeline template CI", plus PATH to the template clone. Low-token,
  shell-first: optional one-message skill-first rsync, then rsync
  .github/.semgrep/.cursor, Gemfile/Fastfile when missing or with explicit
  overwrite, merge .gitignore, align package.json CI scripts, bootstrap
  workflow IDs, secrets checklist, optional Expo native-dir assert. Use for
  one-shot pipeline reuse, CURSOR_RN_DEVOPS_ONE_SHOT, or copying RN CI from the
  template.
---

# RN DevOps kit — apply into this repo

Phased playbook for the **target** app (workspace root has `package.json`). Full narrative: [`docs/RN_WORKFLOW_REUSE.md`](../../../docs/RN_WORKFLOW_REUSE.md). Human paste fallback: [`CURSOR_RN_DEVOPS_ONE_SHOT_APPLY.txt`](../../../CURSOR_RN_DEVOPS_ONE_SHOT_APPLY.txt) at the template repo root.

**Minimal user message:** a short intent line plus **`PATH: /absolute/path/to/template-pipeline-react-native`** (no trailing slash). Treat **`PATH:`** the same as **`TEMPLATE_ROOT`** for all commands below. Legacy **`TEMPLATE_ROOT=/…`** and env **`TEMPLATE_ROOT`** or **`RN_PIPELINE_TEMPLATE_ROOT`** are also accepted.

**Prefer this skill** when `.cursor/` is already in the workspace or will be synced by rsync (so routing stays stable). Use the one-shot `.txt` only when the agent cannot load repo skills.

## Single session (one user message)

Use when the user wants **no second chat**: copy this skill (and Cursor rules) from `TEMPLATE_ROOT` onto disk first, optionally load this file into context, then continue **Phase 1** through **Phase 8** in the **same** agent turn.

**Phase 0 — Skill and rules on disk** (from target repo root, `TEMPLATE_ROOT` set):

```bash
mkdir -p .cursor/skills .cursor/rules
rsync -a "${TEMPLATE_ROOT}/.cursor/skills/rn-devops-apply-kit/" "./.cursor/skills/rn-devops-apply-kit/"
rsync -a "${TEMPLATE_ROOT}/.cursor/rules/" "./.cursor/rules/"
```

**Optional (recommended):** `read_file` **`./.cursor/skills/rn-devops-apply-kit/SKILL.md`** once so the phase list is in context. Do **not** bulk-read `.github/workflows/`.

**Then:** run **Phase 1** onward. **Phase 2** must still run the full **`rsync "${TEMPLATE_ROOT}/.cursor/" "./.cursor/"`** (and `.github/`, `.semgrep/`) per [`SETUP_RN_DEVOPS_KIT.md`](../../../SETUP_RN_DEVOPS_KIT.md) — it is idempotent and keeps the whole `.cursor/` tree aligned with the template.

---

## User inputs (paste in chat before or at start)

| Input | Required | Notes |
| --- | --- | --- |
| Template path | Yes | **`PATH: /absolute/.../template-pipeline-react-native`** (canonical) or **`TEMPLATE_ROOT=/…`** (legacy). Strip trailing slashes. |
| `TARGET_REMOTE_URL` | No | HTTPS/SSH of an empty GitHub repo if you want remote + push after commit. |
| Bootstrap CLI flags | No | Only if dry-run is wrong: `--workspace`, `--scheme`, `--bundle-id-dev`, `--bundle-id-dist`, `--gradle-task`, `--apk-glob` (see [`docs/RN_WORKFLOW_REUSE.md`](../../../docs/RN_WORKFLOW_REUSE.md)). |

**Resolve `TEMPLATE_ROOT` before preflight:** (1) If the user message contains **`PATH:`**, set `TEMPLATE_ROOT` to the trimmed path after `PATH:` (first line wins). (2) Else if **`TEMPLATE_ROOT=`** appears, use that value. (3) Else if env **`TEMPLATE_ROOT`** or **`RN_PIPELINE_TEMPLATE_ROOT`** is set, use it. (4) Else stop and ask once for **`PATH:`** or **`TEMPLATE_ROOT=`**.

Agent preflight: `test -d "${TEMPLATE_ROOT}/.github" && test -f "${TEMPLATE_ROOT}/SETUP_RN_DEVOPS_KIT.md"` (shell only; do not read the template tree into context).

---

## Token efficiency (read this first)

1. **Shell-first** — Use `rsync`, `cp`, `python3`, and small `node` / `jq` snippets. Do **not** bulk-`read_file` under `.github/workflows/`, template `.github/`, `node_modules/`, `ios/Pods/`, or coverage output.
2. **Bootstrap / secrets** — Treat **`python3 .github/scripts/bootstrap_rn_workflow_ids.py`** and **`list_workflow_secrets.py`** stdout as truth; do not open every modified YAML in the editor to “verify”.
3. **`.gitignore`** — Merge with a shell loop (below); do not paste the full `.gitignore` into chat unless the user asks for a review.
4. **`package.json` scripts** — Add missing CI script **names** with the embedded **`node` heredoc** below (local file only); do not read the template’s `package.json` into context. If **`yarn.lock`** exists and **`actions/setup-node`** cache fails later, see **Yarn-only** in [`docs/RN_WORKFLOW_REUSE.md`](../../../docs/RN_WORKFLOW_REUSE.md) (no need to grep all workflows up front).
5. **`src/`** — Never overwrite unless the user explicitly asks.

---

## Optional AskQuestion (overwrite)

Run **only if** any of these exist: `./Gemfile`, `./Gemfile.lock`, `./fastlane/Fastfile`. If **none** exist, skip the question and use missing-only copies.

**Prompt:** Overwrite existing root `Gemfile` / `Gemfile.lock` or `fastlane/Fastfile` from the template?

- **Default (recommended):** No — copy `Gemfile`/`Gemfile.lock` only when at least one is missing (`if [ ! -f ./Gemfile ] || [ ! -f ./Gemfile.lock ]; then cp ...`); copy `Fastfile` only when `./fastlane/Fastfile` is missing.
- **Yes:** `cp "${TEMPLATE_ROOT}/Gemfile" "${TEMPLATE_ROOT}/Gemfile.lock" ./` and `mkdir -p fastlane && cp "${TEMPLATE_ROOT}/fastlane/Fastfile" ./fastlane/` unconditionally.

---

## Phase 1 — Preflight

1. Confirm cwd is the app root: `test -f ./package.json`.
2. Resolve and export **`TEMPLATE_ROOT`** per **User inputs** (from **`PATH:`**, **`TEMPLATE_ROOT=`**, or env). Confirm valid with the directory checks above.
3. Run **Optional AskQuestion** when applicable.

---

## Phase 2 — Sync kit

From the target root, same as [`SETUP_RN_DEVOPS_KIT.md`](../../../SETUP_RN_DEVOPS_KIT.md):

```bash
rsync -a --delete "${TEMPLATE_ROOT}/.github/" "./.github/"
rsync -a "${TEMPLATE_ROOT}/.semgrep/" "./.semgrep/"
rsync -a "${TEMPLATE_ROOT}/.cursor/" "./.cursor/"
```

Then **`Gemfile` / `Gemfile.lock`** and **`fastlane/Fastfile`** per the overwrite answer (see **Optional AskQuestion**).

---

## Phase 3 — Merge `.gitignore`

```bash
touch .gitignore
while IFS= read -r line || [ -n "$line" ]; do
  [ -z "$line" ] && continue
  grep -qxF "$line" .gitignore 2>/dev/null || echo "$line" >> .gitignore
done < "${TEMPLATE_ROOT}/GITIGNORE_APPEND.txt"
```

---

## Phase 4 — `package.json` CI scripts (if missing)

Run from target root (adds only missing keys; preserves existing commands):

```bash
node <<'NODE'
const fs = require('fs');
const path = 'package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
const add = {
  lint: 'eslint .',
  'format:check': 'prettier --check "src/**/*.{ts,tsx,js}"',
  typecheck: 'tsc --noEmit',
  'test:ci': 'jest --ci --coverage --maxWorkers=2',
};
let changed = false;
for (const [k, v] of Object.entries(add)) {
  if (pkg.scripts[k] == null) {
    pkg.scripts[k] = v;
    changed = true;
  }
}
if (changed) fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
NODE
```

If any script key was added, remind the user to install matching **devDependencies** (see the scripts table in [`docs/RN_WORKFLOW_REUSE.md`](../../../docs/RN_WORKFLOW_REUSE.md)) if not already present — check with `node -e` / `npm ls` in terminal, not by reading `node_modules/`.

---

## Phase 5 — Bootstrap workflow identifiers

```bash
python3 .github/scripts/bootstrap_rn_workflow_ids.py --dry-run
```

Review terminal output. Then:

```bash
python3 .github/scripts/bootstrap_rn_workflow_ids.py
```

Append any user-provided flags on both commands if detection is wrong. If there is **no `ios/`** or bootstrap cannot resolve the workspace, stop and tell the user to run **`npx expo prebuild --clean`** (Expo), commit **`ios/`** / **`android/`**, or pass documented flags.

**Note:** Bundle IDs are read from **`ios/xcconfig/`** (CT parity) then **`project.pbxproj`**, not from `app.config.ts` alone. CI expects **Dev** + **Debug-Dev** (dev) and **Prod** + **Release-Prod** (dist); prod bundle ID is the **base** id (no `.dist`). See **`docs/CI_FLAVOR_CONTRACT.md`**.

---

## Phase 6 — Secrets checklist

```bash
python3 .github/scripts/list_workflow_secrets.py --write GITHUB_SECRETS_CHECKLIST.md
```

Remind: secret **values** only in GitHub → Settings → Secrets and variables → Actions (never commit secrets).

---

## Phase 7 — Optional validate (Expo)

If `expo` is in `dependencies` or `devDependencies`, run **`assert_expo_native_dirs.sh`** (validates committed `android/` / `ios/` without reading those trees into context):

```bash
if node -e 'const p=require("./package.json");const d={...p.dependencies||{},...p.devDependencies||{}};process.exit("expo" in d?0:1)'; then
  bash .github/scripts/assert_expo_native_dirs.sh expo
fi
```

---

## Phase 8 — Git and handoff

- If **`TARGET_REMOTE_URL`** was provided: commit with a clear message, set `origin` / push current branch per **`.cursor/rules/git-rn-bootstrap.mdc`** and **`.cursor/rules/rn-devops-agent-playbook.mdc`**. Do not push unless the user supplied the URL and expects it.
- **Handoff:** List manual follow-ups separately: Firebase, keystores, App Store Connect API key, Play service account, **`EXPO_TOKEN`** only if optional EAS workflows are used. Keep signing separate from Git remote setup.
