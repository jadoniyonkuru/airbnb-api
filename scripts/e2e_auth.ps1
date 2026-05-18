$base='http://localhost:3000/api/v1'
$ts = [int](Get-Date -UFormat %s)
$regBody = @{ name='E2E Test'; email="e2e+${ts}@example.com"; username="e2e_test_${ts}"; password='Password123!'; phone='5550000000' }
Write-Output "Registering user: $($regBody.email)"
try {
  $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body ($regBody | ConvertTo-Json) -ContentType 'application/json' -TimeoutSec 30
  Write-Output "Register response:"
  $reg | ConvertTo-Json -Depth 5
} catch { Write-Output "Register failed: $($_.Exception.Message)"; exit 1 }

$loginBody = @{ email=$reg.email; password='Password123!' }
try {
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body ($loginBody | ConvertTo-Json) -ContentType 'application/json' -TimeoutSec 30
  Write-Output "Login response:"
  $login | ConvertTo-Json -Depth 5
} catch { Write-Output "Login failed: $($_.Exception.Message)"; exit 1 }

$token = $login.token
if (-not $token) { Write-Output 'No token returned'; exit 1 }
Write-Output "Token received (truncated): $($token.substring(0,20))..."

try {
  $me = Invoke-RestMethod -Uri "$base/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 30
  Write-Output "GET /auth/me response:"
  $me | ConvertTo-Json -Depth 6
} catch { Write-Output "GET /auth/me failed: $($_.Exception.Message)"; exit 1 }
