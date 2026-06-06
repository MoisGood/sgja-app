# Kiro CLI Installation Script for Windows
# Usage: irm https://cli.kiro.dev/install.ps1 | iex

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$BinaryName = "kiro-cli"
$BaseUrl = "https://prod.download.cli.kiro.dev/stable"
$ManifestUrl = "$BaseUrl/latest/manifest.json"
$Filename = "kiro-cli-x86_64-pc-windows-msvc.msi"
$DownloadUrl = "$BaseUrl/latest/$Filename"

function Write-Step($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "  $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "Kiro CLI Installer" -ForegroundColor Magenta
Write-Host "=================="
Write-Host ""

# Fetch manifest for version and checksum
Write-Step "Fetching latest version..."
try {
    $manifest = Invoke-RestMethod -Uri $ManifestUrl
} catch {
    Write-Err "Failed to fetch manifest: $_"
    exit 1
}

$version = $manifest.version
Write-Ok "Latest version: $version"

# Find checksum from manifest
$artifact = $manifest.packages | Where-Object { $_.os -eq "windows" -and $_.architecture -eq "x86_64" -and $_.kind -eq "msi" } | Select-Object -First 1
if (-not $artifact) {
    Write-Err "No Windows installer found in manifest"
    exit 1
}

$expectedSha = $artifact.sha256
$sizeMB = [math]::Round($artifact.size / 1048576, 1)
$msiPath = Join-Path $env:TEMP "kiro-cli-installer-$version.msi"

# Download MSI
Write-Step "Downloading installer ($sizeMB MB)..."
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $msiPath -UseBasicParsing
} catch {
    Write-Err "Download failed: $_"
    exit 1
}
Write-Ok "Downloaded"

# Verify checksum
Write-Step "Verifying checksum..."
$actualSha = (Get-FileHash -Algorithm SHA256 $msiPath).Hash.ToLower()
if ($actualSha -ne $expectedSha.ToLower()) {
    Remove-Item $msiPath -Force -ErrorAction SilentlyContinue
    Write-Err "Checksum mismatch! Expected: $expectedSha, Got: $actualSha"
    exit 1
}
Write-Ok "Checksum verified"

# Install MSI
Write-Step "Installing Kiro CLI..."
$msiArgs = "/i `"$msiPath`" /quiet /norestart"
$process = Start-Process msiexec -ArgumentList $msiArgs -Wait -PassThru -NoNewWindow
if ($process.ExitCode -ne 0) {
    Write-Err "Installation failed with exit code $($process.ExitCode)"
    Write-Host "  You can try installing manually: $msiPath"
    exit 1
}
Write-Ok "Installed successfully"

# Cleanup
Remove-Item $msiPath -Force -ErrorAction SilentlyContinue

# Verify
Write-Host ""
Write-Host "  Kiro CLI $version installed to C:\Program Files\Kiro-Cli\" -ForegroundColor Green
Write-Host "  Open a new terminal and run: $BinaryName" -ForegroundColor Yellow
Write-Host ""