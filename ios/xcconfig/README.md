# iOS Build Flavors — Xcode Setup

The `.xcconfig` files in this directory define the **dev / qa / prod** flavors for iOS. Each file sets:
- `ENVFILE` — the `.env` file react-native-config will read for that flavor
- `PRODUCT_NAME` — the app display name shown on the device
- `PRODUCT_BUNDLE_IDENTIFIER` — the bundle ID (must be unique per flavor)

> **Note:** `<AppName>` below refers to the actual project name (the value that replaced the `CliTemplate` placeholder during scaffolding).

## Xcode setup notes

### 1–2. Build configurations and schemes (already in the template)

The Xcode project ships with **`Debug-Dev` / `Release-Dev` / `Debug-QA` / `Release-QA` / `Debug-Prod` / `Release-Prod`** on both the **project** and the **app target**, each using the matching file under `ios/xcconfig/`. Those files set **`PRODUCT_NAME`** and **`PRODUCT_BUNDLE_IDENTIFIER`** per flavor (so Dev / QA / Prod install as separate icons when bundle IDs differ).

The shared **Dev**, **QA**, and **Prod** schemes already select those configurations for Run / Test / Archive. After `pod install`, if anything drifts, confirm in **`<AppName>.xcodeproj` → Project → app target → Build settings** that flavor rows still use the right **.xcconfig**.

**react-native-config (iOS):** The **Config codegen** Pod script reads `ENV['ENVFILE']` or defaults to **`.env`**. App-target xcconfig alone does not set that for the Pod, so **`ios/Podfile`** `post_install` sets **`ENVFILE`** on the **`react-native-config`** target for each Xcode configuration (`Debug-QA` → `.env.qa`, etc.). After changing this, run **`pod install`** again.

**Prod** uses the same **display name + bundle id pattern** as the prod xcconfig (base bundle ID, no `.dist` suffix). The default **`npm run ios`** scheme still uses plain **Debug** / **Release** (template defaults), so it can differ from **Prod** until you align placeholders in `ios/xcconfig/Prod.*.xcconfig` with your shipping bundle id.

### CI (RN DevOps pipeline kit)

After applying [template-pipeline-react-native](https://github.com/codeandtheory/template-pipeline-react-native), CI uses:

| Variant | Scheme | Archive / release config | Bundle ID |
|---------|--------|--------------------------|-----------|
| dev | `Dev` | `Debug-Dev` | `{packageId}.dev` |
| prod / dist | `Prod` | `Release-Prod` | `{packageId}` (base) |

See `docs/CI_FLAVOR_CONTRACT.md` in the generator repo and the pipeline kit repo. Run `python3 .github/scripts/bootstrap_rn_workflow_ids.py` after copying workflows.

### 3. Add the env-selection Run Script Build Phase

In Xcode, select the **`<AppName>` target** → **Build Phases** → click **+** → **New Run Script Phase**.

- Rename the phase to `Select Env File`
- Move it **above** the `Bundle React Native code and images` phase
- Set the shell to `/bin/bash`
- Set the script to:

```bash
"${SRCROOT}/scripts/select-env.sh"
```

- Add an **Input File**: `$(SRCROOT)/$(ENVFILE)`
- Add an **Output File**: `$(SRCROOT)/../.env`

### Troubleshooting: `PhaseScriptExecution failed`

1. **Expand the failing phase in Xcode** (Report navigator → failed build → red **Run Script** row). Common phases: **Bundle React Native code and images**, **`[CP] Embed Pods Frameworks`**, **`Select Env File`**.

2. **Pods out of date** — After renaming the app or changing `Podfile` / flavor configs, run **`cd ios && pod install`**. If `Pods-<AppName>-frameworks-Debug-QA-input-files.xcfilelist` is missing, this step was skipped or used the wrong target name.

3. **`Select Env File`** — If you added this phase, the input path **`$(SRCROOT)/$(ENVFILE)`** must exist (e.g. **`../.env.qa`** from `ios/` for the QA scheme). Missing file → script exits non‑zero.

4. **Node for Xcode** — If **Bundle React Native** fails, set a real Node path in **`ios/.xcode.env.local`** (gitignored), e.g. `export NODE_BINARY=/usr/local/bin/node` (use `which node` in Terminal). The template only lists **`ios/.xcode.env`** as a required script input so a missing **`.xcode.env.local`** does not fail the build.

### 4. Run the app

```bash
yarn ios               # react-native run-ios --scheme <AppName>

# Dev / QA / Prod (flavor xcconfigs + schemes)
yarn ios:dev
yarn ios:qa
yarn ios:prod
```
