# =============================================================================
# Agentic OS - Test install-centre-alias.ps1
# =============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Installer = Join-Path $ScriptDir "install-centre-alias.ps1"
$CentreScript = Join-Path $ScriptDir "centre.ps1"
$BlockStart = "# >>> Agentic OS - command centre launcher >>>"
$BlockEnd = "# <<< Agentic OS - command centre launcher <<<"
$LegacyMarker = "# Agentic OS - command centre launcher"

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Assert-Equal {
    param(
        [AllowNull()]$Expected,
        [AllowNull()]$Actual,
        [string]$Message
    )

    if ($Expected -ne $Actual) {
        throw "$Message`nExpected: $Expected`nActual:   $Actual"
    }
}

function Assert-Contains {
    param(
        [string]$Text,
        [string]$ExpectedText,
        [string]$Message
    )

    if (-not $Text.Contains($ExpectedText)) {
        throw "$Message`nMissing: $ExpectedText"
    }
}

function Get-TargetPaths {
    param(
        [string]$DocumentsRoot
    )

    return [pscustomobject]@{
        WindowsPowerShell = Join-Path $DocumentsRoot "WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
        PowerShell7 = Join-Path $DocumentsRoot "PowerShell\Microsoft.PowerShell_profile.ps1"
    }
}

function New-ExpectedBlock {
    return (
        @(
            $BlockStart,
            "function centre {",
            "    & `"$CentreScript`" @Args",
            "}",
            $BlockEnd
        ) -join "`r`n"
    )
}

function New-TestDocumentsRoot {
    param(
        [string]$BaseRoot,
        [string]$Scenario
    )

    return Join-Path $BaseRoot (Join-Path $Scenario "OneDrive\Documents")
}

function Invoke-InstallerForTest {
    param(
        [string]$DocumentsRoot
    )

    & $Installer -DocumentsRoot $DocumentsRoot | Out-Null
}

function Write-ProfileContent {
    param(
        [string]$Path,
        [string]$Content
    )

    $parent = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Set-Content -LiteralPath $Path -Value $Content -NoNewline
}

function Assert-ManagedBlockCount {
    param(
        [string]$Content,
        [int]$ExpectedCount,
        [string]$Message
    )

    $actualCount = ([regex]::Matches($Content, [regex]::Escape($BlockStart))).Count
    Assert-Equal -Expected $ExpectedCount -Actual $actualCount -Message $Message
}

function Invoke-ProfileSmokeCheck {
    param(
        [string]$HostCommand,
        [string]$ProfilePath
    )

    $escapedProfilePath = $ProfilePath.Replace("'", "''")
    $command = ". '$escapedProfilePath'; (Get-Command centre).CommandType"
    $output = & $HostCommand -NoProfile -ExecutionPolicy Bypass -Command $command
    return ($output | Out-String).Trim()
}

$expectedBlock = New-ExpectedBlock
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("agentic-os-centre-alias-" + [guid]::NewGuid().ToString("N"))

try {
    # Fresh install
    $freshDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "fresh"
    $freshTargets = Get-TargetPaths -DocumentsRoot $freshDocsRoot
    Invoke-InstallerForTest -DocumentsRoot $freshDocsRoot

    foreach ($profilePath in @($freshTargets.WindowsPowerShell, $freshTargets.PowerShell7)) {
        Assert-True -Condition (Test-Path -LiteralPath $profilePath) -Message "Fresh install should create profile file: $profilePath"
        $content = Get-Content -LiteralPath $profilePath -Raw
        Assert-Contains -Text $content -ExpectedText $expectedBlock -Message "Fresh install should write the expected block."
        Assert-ManagedBlockCount -Content $content -ExpectedCount 1 -Message "Fresh install should create exactly one managed block."
    }

    # Mixed install
    $mixedDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "mixed"
    $mixedTargets = Get-TargetPaths -DocumentsRoot $mixedDocsRoot
    $currentMixedContent = "Write-Host 'keep me'`r`n`r`n$expectedBlock`r`n"
    Write-ProfileContent -Path $mixedTargets.PowerShell7 -Content $currentMixedContent
    $mixedOriginalContent = Get-Content -LiteralPath $mixedTargets.PowerShell7 -Raw
    Invoke-InstallerForTest -DocumentsRoot $mixedDocsRoot
    Assert-Equal -Expected $mixedOriginalContent -Actual (Get-Content -LiteralPath $mixedTargets.PowerShell7 -Raw) -Message "Mixed install should leave the current profile unchanged."
    Assert-True -Condition (Test-Path -LiteralPath $mixedTargets.WindowsPowerShell) -Message "Mixed install should create the missing Windows PowerShell profile."

    # Stale managed block
    $staleDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "stale-managed"
    $staleTargets = Get-TargetPaths -DocumentsRoot $staleDocsRoot
    $oldCentreScript = "C:\stale\repo\scripts\centre.ps1"
    $staleBlock = (
        @(
            $BlockStart,
            "function centre {",
            "    & `"$oldCentreScript`" @Args",
            "}",
            $BlockEnd
        ) -join "`r`n"
    )
    Write-ProfileContent -Path $staleTargets.PowerShell7 -Content ("# keep`r`n`r`n$staleBlock`r`n")
    Invoke-InstallerForTest -DocumentsRoot $staleDocsRoot
    $staleContent = Get-Content -LiteralPath $staleTargets.PowerShell7 -Raw
    Assert-Contains -Text $staleContent -ExpectedText $expectedBlock -Message "Stale managed block should be updated to the current repo path."
    Assert-True -Condition (-not $staleContent.Contains($oldCentreScript)) -Message "Stale managed block should remove the old repo path."

    # Legacy marker migration
    $legacyDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "legacy"
    $legacyTargets = Get-TargetPaths -DocumentsRoot $legacyDocsRoot
    $legacyContent = @"
$LegacyMarker
function centre {
    & "C:\legacy\repo\scripts\centre.ps1" @Args
}
"@
    Write-ProfileContent -Path $legacyTargets.WindowsPowerShell -Content $legacyContent
    Invoke-InstallerForTest -DocumentsRoot $legacyDocsRoot
    $migratedContent = Get-Content -LiteralPath $legacyTargets.WindowsPowerShell -Raw
    Assert-Contains -Text $migratedContent -ExpectedText $expectedBlock -Message "Legacy marker block should be migrated to the managed block."
    Assert-True -Condition (-not $migratedContent.Contains("C:\legacy\repo\scripts\centre.ps1")) -Message "Legacy marker migration should remove the old repo path."
    Assert-ManagedBlockCount -Content $migratedContent -ExpectedCount 1 -Message "Legacy marker migration should not duplicate the managed block."

    # Idempotency
    $idempotentDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "idempotent"
    $idempotentTargets = Get-TargetPaths -DocumentsRoot $idempotentDocsRoot
    Invoke-InstallerForTest -DocumentsRoot $idempotentDocsRoot
    $firstRunContent = Get-Content -LiteralPath $idempotentTargets.WindowsPowerShell -Raw
    Invoke-InstallerForTest -DocumentsRoot $idempotentDocsRoot
    $secondRunContent = Get-Content -LiteralPath $idempotentTargets.WindowsPowerShell -Raw
    Assert-Equal -Expected $firstRunContent -Actual $secondRunContent -Message "Running the installer twice should not rewrite the Windows PowerShell profile."
    Assert-ManagedBlockCount -Content $secondRunContent -ExpectedCount 1 -Message "Idempotent install should keep a single managed block."

    # Manual smoke check, simulated by dot-sourcing the generated profiles in each host.
    $smokeDocsRoot = New-TestDocumentsRoot -BaseRoot $testRoot -Scenario "smoke"
    $smokeTargets = Get-TargetPaths -DocumentsRoot $smokeDocsRoot
    Invoke-InstallerForTest -DocumentsRoot $smokeDocsRoot

    if (Get-Command powershell.exe -ErrorAction SilentlyContinue) {
        $ps51Result = Invoke-ProfileSmokeCheck -HostCommand "powershell.exe" -ProfilePath $smokeTargets.WindowsPowerShell
        Assert-Equal -Expected "Function" -Actual $ps51Result -Message "Windows PowerShell should load 'centre' as a function."
    }

    if (Get-Command pwsh -ErrorAction SilentlyContinue) {
        $pwshResult = Invoke-ProfileSmokeCheck -HostCommand "pwsh" -ProfilePath $smokeTargets.PowerShell7
        Assert-Equal -Expected "Function" -Actual $pwshResult -Message "PowerShell 7 should load 'centre' as a function."
    }

    Write-Host "  [OK] install-centre-alias.ps1 tests passed" -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $testRoot) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
