$file = "src/pages/Invoices/NewInvoice/NewInvoice.jsx"

# Dosyayı olduğu gibi oku
$content = Get-Content $file -Raw

# CP1252 olarak yanlış yorumlanan UTF-8'i geri çevir
$bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($content)
$fixed = [System.Text.Encoding]::UTF8.GetString($bytes)

# UTF-8 (BOM'suz) kaydet
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $file), $fixed, $utf8)

Write-Host "OK: UTF-8 onarıldı."