# GutSense Android asset sync
# 1) www3 -> android assets (capacitor, junction 제외 자동 처리됨)
# 2) video junction 대신 실제 파일 복사 (capacitor가 junction 복사 불가)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }
robocopy "$root\video" "$root\android\app\src\main\assets\public\video" /E /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) { throw "robocopy failed" }
Write-Host "Android sync complete (www3 + video)"
