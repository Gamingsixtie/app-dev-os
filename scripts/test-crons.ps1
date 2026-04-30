[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$CommandCentreDir = Join-Path $RepoRoot "projects\briefs\command-centre"

Push-Location $CommandCentreDir
try {
    npm run test:cron -- @Arguments
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
