# CI/CD Pipeline Implementation Documentation


## Pipeline Architecture


### Job Descriptions

#### **1. Lint**
- **Purpose:** Validate code style and catch syntax errors early
- **Tool:** ESLint
- **Failure Impact:** Blocks all downstream jobs
- **Runtime:** ~20-30 seconds

#### **2. Test & Coverage**
- **Purpose:** Run unit tests with coverage analysis
- **Dependencies:** Requires lint to pass
- **Secret Used:** `DEMO_API_KEY` for config-check endpoint validation
- **Artifacts Generated:** `coverage/` - Full coverage report
- **Failure Impact:** Blocks build job

#### **3. Security - CodeQL**
- **Purpose:** Detect security vulnerabilities and code quality issues
- **Tool:** GitHub CodeQL
- **Languages:** JavaScript
- **Dependencies:** Requires lint to pass
- **Results:** Published to GitHub Security tab
- **Failure Impact:** Blocks build job

#### **4. Build**
- **Purpose:** Create deployable build artifact with metadata
- **Dependencies:** Requires test + security jobs to pass
- **Artifacts Generated:** `dist/build-info.json` containing:
  ```json
  {
    "name": "pds-devops-ci-demo",
    "version": "0.1.0",
    "sha": "abc123...",
    "builtAt": "2026-03-11T01:53:00.000Z"
  }
  ```
- **Runtime:** ~20-30 seconds

---

## Why These Changes

### 1. **Separated Lint Job**
**Reason:** Fail-fast principle - linting is the cheapest validation and should run first to provide immediate feedback on code quality issues.

### 2. **Job Dependencies (needs:)**
**Reason:** Prevent wasted CI resources. If linting fails, there's no point running expensive tests or security scans.

### 3. **Parallel Test & Security Jobs**
**Reason:** Testing and CodeQL analysis are independent - running them in parallel reduces total pipeline time.

### 4. **Dependency Caching**
**Reason:** `cache: 'npm'` reduces npm install time from ~30s to ~5s on subsequent runs, improving developer experience.

### 5. **Artifact Uploads**
**Reason:** 
- **Coverage reports** - Debug test failures, track coverage trends
- **Security reports** - Audit trail for compliance
- **Build artifacts** - Traceability and deployment readiness

### 6. **npm ci vs npm install**
**Reason:** `npm ci` is deterministic, faster, and removes node_modules before install - critical for reproducible builds.


### 8. **if: always() for Artifact Uploads**
**Reason:** Upload coverage/test results even if tests fail - crucial for debugging.

---

## How to Run

### Prerequisites

#### 1. Configure Repository Secret
Navigate to: `Settings → Secrets and variables → Actions → New repository secret`

**Secret Name:** `DEMO_API_KEY`  
**Secret Value:** Any test value (e.g., `test-secret-value-123`)

> **Note:** This secret is required for the `/config-check` endpoint test to pass.

#### 2. Enable CodeQL (If Private Repo)
Navigate to: `Settings → Code security and analysis → Enable CodeQL`

For public repos, CodeQL is enabled by default.

---

### Running the Pipeline

#### **Automated Triggers**
The pipeline runs automatically on:
- Any push to main branch
- Any pull request to main branch


### Viewing Results




## Testing Scenarios

### Scenario 1: ✅ Successful Build (Happy Path)

**Steps:**
```bash
# Ensure code is clean
npm run lint
npm run test:ci
```

**Expected Results:**
- All 4 jobs complete successfully
- Coverage artifacts uploaded (viewable HTML report)
- CodeQL security scan passes
- Build artifact generated with correct metadata
- Total pipeline time: ~2-3 minutes

**Validation:**
```bash
# Download build-artifact and verify
cat dist/build-info.json
# Should contain: name, version, sha, builtAt
```

---

### Scenario 2: ❌ Lint Failure

**Steps:**
```bash
# Introduce linting error
echo "var unused = 1;" >> src/app.js
git add . && git commit -m "test: lint failure"
git push
```

**Expected Results:**
- ❌ Lint job fails with ESLint error
- ⚪ Test, security, and build jobs skipped (dependency failed)
- Pipeline status: FAILED
- Red X visible in PR/commit status

**Fix:**
```bash
git revert HEAD
git push
```

---

### Scenario 3: ❌ Test Failure

**Steps:**
```bash
# Break a test
# In src/app.js, change line 8:
# res.status(200) → res.status(500)
git add . && git commit -m "test: break health check"
git push
```

**Expected Results:**
- ✅ Lint job passes
- ❌ Test job fails (health check test expects 200, got 500)
- ⚪ Build job skipped
- ✅ Security job completes (independent from test)
- Coverage artifacts still uploaded (for debugging)

**Debugging:**
1. Download `coverage-report` artifact
2. Open `index.html` to see coverage
3. Check test output in job logs

---

### Scenario 4: ❌ Missing Secret

**Steps:**
```bash
# Remove DEMO_API_KEY from repository secrets
# Settings → Secrets → Delete DEMO_API_KEY
# Trigger workflow (push or manual run)
```

**Expected Results:**
- ✅ Lint passes
- ❌ Test job fails on `/config-check` test
- Error message: Test expects `DEMO_API_KEY` to be set
- Specific failing test: "GET /config-check succeeds when DEMO_API_KEY is set"

**Fix:**
Re-add secret: `Settings → Secrets → New secret`

---

### Scenario 5: 🔄 Pull Request

**Steps:**
```bash
git checkout -b feature/new-endpoint
# Make changes
git add . && git commit -m "feat: add new endpoint"
git push -u origin feature/new-endpoint
# Create PR on GitHub
```

**Expected Results:**
- Pipeline runs automatically on PR creation
- Status checks appear in PR conversation
- All checks must pass before merge allowed (if branch protection enabled)
- Artifacts available for review
- PR shows:
  - ✅ Lint passed
  - ✅ Test passed  
  - ✅ Security passed
  - ✅ Build passed

---

## Local Testing (Pre-Commit)

Run these commands before pushing to catch issues early:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests with coverage
export DEMO_API_KEY="test-secret-value"
npm run test:ci

# Generate build artifact
npm run package:artifact
ls -la dist/build-info.json
```

**Expected Output:**
```
✓ ESLint: no errors
✓ Tests: 3 passed (3 total)
✓ Coverage: statements 100%, branches 100%, functions 100%, lines 100%
✓ Artifact: dist/build-info.json created
```

---

## Troubleshooting

### Issue: "npm ci can clean install a project"

**Cause:** `package-lock.json` out of sync  
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate lockfile"
```

### Issue: CodeQL job failing with permissions error

**Cause:** Missing security-events write permission  
**Fix:** Already configured in workflow with:
```yaml
permissions:
  security-events: write
```
Ensure repository settings allow Actions to write security events.

### Issue: Artifacts not uploading

**Cause:** Path doesn't exist or job failed before upload  
**Fix:** Check that coverage/dist directories are created. Note `if: always()` ensures upload even on test failure.

### Issue: Tests pass locally but fail in CI

**Possible Causes:**
1. Missing `DEMO_API_KEY` secret in repository settings
2. Different Node.js version (workflow uses Node 20)
3. Timing issues (use `--ci` flag in jest for deterministic runs)

**Debug Steps:**
1. Check workflow logs for exact error
2. Run locally with: `npm ci && npm run test:ci`
3. Verify secret is set in repo settings

---

