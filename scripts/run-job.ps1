[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $RepoRoot "projects\briefs\command-centre\scripts\cron-daemon.cjs"

node $ScriptPath run-job @Arguments
