param(
    [Parameter(Mandatory=$true, ValueFromRemainingArguments=$true)]
    [string[]]$ConnArgs
)

function Test-TcpPort {
    param(
        [string]$Host,
        [int]$Port
    )
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect($Host, $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(1000)
        if (-not $ok) { $tcp.Close(); return $false }
        $tcp.EndConnect($iar)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

if (-not $ConnArgs -or $ConnArgs.Count -eq 0) {
    Write-Host "Usage: ./wait-for-pg.ps1 host:port [host:port]..."
    exit 1
}

foreach ($arg in $ConnArgs) {
    $parts = $arg -split ':'
    if ($parts.Length -ne 2) {
        Write-Error "Connection argument must be host:port"
        exit 1
    }
    $host = $parts[0]
    $port = [int]$parts[1]

    Write-Host "waiting for $host:$port"

    while (-not (Test-TcpPort -Host $host -Port $port)) {
        Write-Host "Postgres is unavailable - sleeping"
        Start-Sleep -Seconds 1
    }

    Write-Host "Postgres is up - continuing"
}
