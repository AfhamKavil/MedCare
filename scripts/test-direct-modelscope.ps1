$envPath = Join-Path $PWD ".env.local"
$envText = Get-Content -Path $envPath -Raw
$keyMatch = [regex]::Match($envText, "(?m)^MODEL_API_KEY=(.*)$")

if (-not $keyMatch.Success) {
    Write-Error "Key not found in .env.local"
    exit 1
}

$apiKey = $keyMatch.Groups[1].Value.Trim()
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type"  = "application/json"
}

$bodyObj = @{
    model = "Qwen-Ambassador/Qwen3.8-27B"
    messages = @(
        @{
            role = "user"
            content = "Reply with exactly MODEL_OK"
        }
    )
}
$bodyJson = $bodyObj | ConvertTo-Json -Depth 5

$url = "https://api-inference.modelscope.ai/v1/chat/completions"

Write-Host "Endpoint: $url"
Write-Host "MODEL_API_KEY exists: True"

try {
    $res = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $bodyJson -ErrorAction Stop
    Write-Host "HTTP STATUS: 200 (OK)"
    Write-Host "Response Body:"
    $res | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    $ex = $_.Exception
    $response = $ex.Response
    
    if ($response) {
        $statusCode = $response.StatusCode
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errBody = $reader.ReadToEnd()
        
        Write-Host "HTTP STATUS: $([int]$statusCode) ($statusCode)"
        Write-Host "Response Body: $errBody"
    } else {
        Write-Host "Error: $($ex.Message)"
    }
}
