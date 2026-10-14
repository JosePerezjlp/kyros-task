# Builds the React SPA, syncs it to S3 and invalidates the CloudFront cache.
# Usage: powershell -File infra/deploy-frontend.ps1 -DistributionId <id>
param([Parameter(Mandatory = $true)][string]$DistributionId)
. "$PSScriptRoot\config.ps1"

$frontend = Join-Path $RootDir 'frontend'

Write-Host "Building frontend..."
Push-Location $frontend
Invoke-Checked { npm run build } | Out-Null
Pop-Location

Write-Host "Uploading to s3://$WebBucket ..."
# Hashed assets can be cached forever; index.html must always be revalidated
Invoke-Checked {
  & $Aws s3 sync (Join-Path $frontend 'dist') "s3://$WebBucket" --delete --exclude index.html `
    --cache-control 'public,max-age=31536000,immutable' --only-show-errors
} | Out-Null
Invoke-Checked {
  & $Aws s3 cp (Join-Path $frontend 'dist\index.html') "s3://$WebBucket/index.html" `
    --cache-control 'no-cache' --content-type 'text/html; charset=utf-8' --only-show-errors
} | Out-Null

Write-Host "Invalidating CloudFront cache..."
Invoke-Checked { & $Aws cloudfront create-invalidation --distribution-id $DistributionId --paths '/index.html' '/' } | Out-Null
Write-Host "Done."
