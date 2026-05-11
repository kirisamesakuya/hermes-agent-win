$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$vendor = Join-Path $root "vendor"
New-Item -ItemType Directory -Force -Path $vendor | Out-Null

function Remove-InWorkspace($path) {
  if (-not (Test-Path -LiteralPath $path)) { return }
  $resolved = (Resolve-Path -LiteralPath $path).Path
  if (-not $resolved.StartsWith($root.Path)) {
    throw "Refusing to remove outside workspace: $resolved"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}

function Sync-ZipRepo($name, $url, $expandedName) {
  $zip = Join-Path $vendor "$name.zip"
  $target = Join-Path $vendor $name
  $expanded = Join-Path $vendor $expandedName

  Write-Host "Downloading $name..."
  Invoke-WebRequest -Uri $url -OutFile $zip
  Remove-InWorkspace $target
  Remove-InWorkspace $expanded
  Expand-Archive -LiteralPath $zip -DestinationPath $vendor -Force
  Move-Item -LiteralPath $expanded -Destination $target
}

Sync-ZipRepo "hermes-webui" "https://codeload.github.com/nesquena/hermes-webui/zip/refs/heads/master" "hermes-webui-master"
Sync-ZipRepo "hermes-agent" "https://codeload.github.com/NousResearch/hermes-agent/zip/refs/heads/main" "hermes-agent-main"

Write-Host "Vendor sources are ready."
