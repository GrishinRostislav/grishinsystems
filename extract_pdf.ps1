$bytes = [System.IO.File]::ReadAllBytes('c:\Users\Ross\Documents\Projects\grishinsystems\Resume.pdf')
$raw = [System.Text.Encoding]::UTF8.GetString($bytes)

# Extract readable text fragments from PDF
$lines = @()
$buffer = ""
foreach ($char in $raw.ToCharArray()) {
    $code = [int]$char
    if (($code -ge 32 -and $code -le 126) -or $char -eq "`n" -or $char -eq "`r") {
        $buffer += $char
    } else {
        if ($buffer.Trim().Length -gt 3) {
            $lines += $buffer.Trim()
        }
        $buffer = ""
    }
}
if ($buffer.Trim().Length -gt 3) { $lines += $buffer.Trim() }

$lines | Out-File 'c:\Users\Ross\Documents\Projects\grishinsystems\resume_text.txt' -Encoding UTF8
Write-Host "Done - extracted $($lines.Count) fragments"
