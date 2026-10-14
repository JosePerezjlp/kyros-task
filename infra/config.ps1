# Shared settings for the deployment scripts. Uses the "kyros" AWS CLI profile.
$ErrorActionPreference = 'Stop'

$env:AWS_PROFILE = 'kyros'
$Aws = 'C:\Program Files\Amazon\AWSCLIV2\aws.exe'
if (-not (Test-Path $Aws)) { $Aws = 'aws' }

# Windows' bsdtar can write .zip files with forward-slash paths (Git's GNU tar cannot)
$Tar = Join-Path $env:SystemRoot 'System32\tar.exe'

$Region        = 'us-east-2'
$AccountId     = '891376917236'
$AppName       = 'kyros-task-manager'
$EnvName       = 'kyros-api-prod'
$DeployBucket  = "kyros-deploy-$AccountId"     # Elastic Beanstalk application bundles
$WebBucket     = "kyros-frontend-$AccountId"   # Compiled React SPA
$RootDir       = Split-Path $PSScriptRoot -Parent
$BuildDir      = Join-Path $PSScriptRoot 'build'

# Fails the script when an AWS CLI / native call returns a non-zero exit code
function Invoke-Checked([scriptblock]$Block) {
  $out = & $Block
  if ($LASTEXITCODE -ne 0) { throw "Command failed (exit $LASTEXITCODE): $Block" }
  $out
}
