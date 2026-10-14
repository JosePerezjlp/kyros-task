# Builds the API, uploads the bundle to S3 and deploys it to Elastic Beanstalk.
# Usage: powershell -File infra/deploy-backend.ps1
. "$PSScriptRoot\config.ps1"

$label = 'v' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$backend = Join-Path $RootDir 'backend'

Write-Host "Building backend..."
Push-Location $backend
Invoke-Checked { npm run build } | Out-Null

# The bundle contains the compiled code, Prisma schema/migrations and the Procfile;
# Elastic Beanstalk runs `npm install` on the instance (which also runs `prisma generate`)
New-Item -ItemType Directory -Force $BuildDir | Out-Null
$zip = Join-Path $BuildDir "backend-$label.zip"
# tar (bsdtar) writes forward-slash paths, which Linux needs; Compress-Archive does not
Invoke-Checked { & $Tar -a -c -f $zip dist prisma/schema.prisma prisma/migrations package.json Procfile } | Out-Null
Pop-Location

Write-Host "Uploading $label..."
Invoke-Checked { & $Aws s3 cp $zip "s3://$DeployBucket/backend/backend-$label.zip" --only-show-errors } | Out-Null
Invoke-Checked {
  & $Aws elasticbeanstalk create-application-version --application-name $AppName --version-label $label `
    --source-bundle "S3Bucket=$DeployBucket,S3Key=backend/backend-$label.zip" --process
} | Out-Null

Write-Host "Deploying $label to $EnvName..."
Invoke-Checked { & $Aws elasticbeanstalk update-environment --environment-name $EnvName --version-label $label } | Out-Null
Invoke-Checked { & $Aws elasticbeanstalk wait environment-updated --environment-names $EnvName } | Out-Null

& $Aws elasticbeanstalk describe-environments --environment-names $EnvName `
  --query 'Environments[0].[VersionLabel,Status,Health,CNAME]' --output text
