$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8765/')
$listener.Start()
Write-Host 'Server started on http://localhost:8765'

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    $cleanPath = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    if ($cleanPath -eq '') { $cleanPath = 'index.html' }
    
    $basePath = Join-Path $PSScriptRoot '_site'
    $filePath = Join-Path $basePath $cleanPath
    
    if (Test-Path -Path $filePath -PathType Container) {
        $filePath = Join-Path $filePath 'index.html'
    }
    
    if (Test-Path $filePath) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        $ct = switch($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css' }
            '.js'   { 'application/javascript' }
            default { 'application/octet-stream' }
        }
        $ctx.Response.ContentType = $ct
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
