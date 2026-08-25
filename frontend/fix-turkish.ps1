
$file = "src/pages/Invoices/NewInvoice/NewInvoice.jsx"

$content = Get-Content $file -Raw

$map = @{
  "SatÄ±ÅŸ"="Satış"
  "satÄ±ÅŸ"="satış"
  "AlÄ±ÅŸ"="Alış"
  "alÄ±ÅŸ"="alış"
  "FaturasÄ±"="Faturası"
  "MÃ¼ÅŸteri"="Müşteri"
  "mÃ¼ÅŸteri"="müşteri"
  "ÃœrÃ¼n"="Ürün"
  "Ã¼rÃ¼n"="ürün"
  "Ã–deme"="Ödeme"
  "Ã¶deme"="ödeme"
  "Ä°"="İ"
  "Ä±"="ı"
  "ÅŸ"="ş"
  "Åž"="Ş"
  "Ã§"="ç"
  "Ã‡"="Ç"
  "Ã¼"="ü"
  "Ãœ"="Ü"
  "Ã¶"="ö"
  "Ã–"="Ö"
  "ÄŸ"="ğ"
  "Äž"="Ğ"
}

foreach ($k in $map.Keys) {
    $content = $content.Replace($k, $map[$k])
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $file), $content, $utf8NoBom)

Write-Host "✓ Türkçe karakterler düzeltildi."