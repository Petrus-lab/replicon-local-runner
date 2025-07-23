# shutdown-all.ps1
$RunnerDir = "C:\replicon-industries\replicon-local-runner"

Write-Host "Scanning all processes for anything running from: $RunnerDir"
Write-Host ""

# Get all processes with a command line containing your runner directory
$procs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and $_.CommandLine -like "*$RunnerDir*"
}

if ($procs.Count -eq 0) {
    Write-Host "No processes found running from $RunnerDir."
} else {
    foreach ($proc in $procs) {
        Write-Host "Killing PID $($proc.ProcessId): $($proc.CommandLine)"
        try {
            Stop-Process -Id $proc.ProcessId -Force
        } catch {
            Write-Host "Failed to kill PID $($proc.ProcessId): $_"
        }
    }
    Write-Host ""
    Write-Host "All processes from $RunnerDir terminated."
}

Pause
