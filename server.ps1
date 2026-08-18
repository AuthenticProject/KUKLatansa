$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "Listening on http://127.0.0.1:8080/..."

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $req = $context.Request
            $res = $context.Response
            $path = $req.Url.LocalPath
            if ($path -eq "/") { 
                $path = "/index.html" 
            } elseif ($path.EndsWith("/")) {
                $path = $path + "index.html"
            } else {
                $localFolder = Join-Path "d:\00. Me\Code Project\KUK" $path.TrimStart('/').Replace('/', '\')
                if (Test-Path $localFolder -PathType Container) {
                    $res.Redirect($path + "/")
                    $res.Close()
                    continue
                }
            }
            
            $filePath = Join-Path "d:\00. Me\Code Project\KUK" $path.TrimStart('/').Replace('/', '\')
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentLength64 = $bytes.Length
                if ($filePath.EndsWith(".html")) { $res.ContentType = "text/html" }
                elseif ($filePath.EndsWith(".js")) { $res.ContentType = "application/javascript" }
                elseif ($filePath.EndsWith(".css")) { $res.ContentType = "text/css" }
                elseif ($filePath.EndsWith(".json")) { $res.ContentType = "application/json" }
                elseif ($filePath.EndsWith(".png")) { $res.ContentType = "image/png" }
                elseif ($filePath.EndsWith(".jpeg") -or $filePath.EndsWith(".jpg")) { $res.ContentType = "image/jpeg" }
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
            }
            $res.Close()
        } catch {
            # Catch request/connection abort exceptions and continue serving
        }
    }
} catch {
    Write-Host "Server error: $_"
} finally {
    $listener.Stop()
}
