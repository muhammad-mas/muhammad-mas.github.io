# Daily on this PC (Windows Task Scheduler): refresh the commit counts and publish them if they changed.
#
#   1. npm run sync         reads Azure DevOps + GitHub with the tokens in .env (never leaves this PC)
#   2. privacy check        public/data/contributions.json may hold dates and counts only
#   3. commit + push        only that one file; GitHub Actions then tests, builds and deploys
#
# Log: tools/contrib-sync/cache/publish-daily.log (gitignored; may name repos, so it stays local).

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$data = 'public/data/contributions.json'
$log = Join-Path $repo 'tools/contrib-sync/cache/publish-daily.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function Write-Log([string]$message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message" | Add-Content -Path $log -Encoding utf8
}

function Invoke-Logged([string]$what, [scriptblock]$command) {
  # Collected and written as UTF-8 (Windows PowerShell's >> redirection would write UTF-16).
  $output = & $command 2>&1 | Out-String
  $code = $LASTEXITCODE
  Add-Content -Path $log -Value $output.TrimEnd() -Encoding utf8
  if ($code -ne 0) { throw "$what failed (exit code $code)" }
}

try {
  Write-Log 'Sync started'
  Invoke-Logged 'Sync' { npm run sync }

  # "generatedAt" and "to" change on every run; only publish when the counts themselves changed.
  git diff --quiet -I '"generatedAt":' -I '"to":' -- $data
  if ($LASTEXITCODE -eq 0) { Write-Log 'No new commits to publish'; exit 0 }

  git remote get-url origin *> $null
  if ($LASTEXITCODE -ne 0) { Write-Log 'No GitHub remote yet: counts refreshed locally, nothing pushed'; exit 0 }

  Invoke-Logged 'Privacy check' { npx vitest run tools/contrib-sync/published-file.test.ts }

  # Commit only the data file, even if other work is in progress in this folder.
  Invoke-Logged 'Commit' { git commit -m "Update activity $(Get-Date -Format 'yyyy-MM-dd')" -- $data }
  # We've just synced, so the pre-push hook can skip its own sync (its secret scan and tests still run).
  $env:SKIP_PREPUSH_SYNC = '1'
  Invoke-Logged 'Push' { git push origin main }
  Write-Log 'Published'
}
catch {
  Write-Log "FAILED: $_"
  exit 1
}
