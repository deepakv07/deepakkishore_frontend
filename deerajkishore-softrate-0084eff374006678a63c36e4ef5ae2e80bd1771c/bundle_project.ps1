# SkillBuilder Bundler Script

# Set project root
$ProjectRoot = Get-Location
$BundleName = "SkillBuilder_App_v1.zip"
$ZipPath = Join-Path $ProjectRoot.Path $BundleName

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SkillBuilder Project Bundler" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Clean up old bundle
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath
}

# 2. Define source files (excluding heavy folders)
$Exclusions = @(
    "node_modules",
    "venv",
    "__pycache__",
    ".git",
    "dist",
    "*.zip",
    ".gemini"
)

Write-Host "Packaging project into $BundleName..." -ForegroundColor Green
Write-Host "This will exclude node_modules, venv, and cache files to keep it small." -ForegroundColor Gray

# Create a temporary staging folder to avoid zipping the zip itself
$StagingDir = Join-Path $env:TEMP "SkillBuilder_Staging"
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

# Copy project files to staging excluding heavy folders
Get-ChildItem -Path $ProjectRoot.Path -Exclude $Exclusions | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $StagingDir -Recurse -Force
}

# 3. Zip the staging folder
Compress-Archive -Path "$StagingDir\*" -DestinationPath $ZipPath -Force

# 4. Cleanup
Remove-Item -Recurse -Force $StagingDir

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Success! Bundle created at:" -ForegroundColor Cyan
Write-Host "   $ZipPath" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "You can now share this ZIP file. The receiver just needs to unzip and run 'start_app.cmd'." -ForegroundColor White
