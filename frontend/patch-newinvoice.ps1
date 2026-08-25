
$file = "src/pages/Invoices/NewInvoice/NewInvoice.jsx"

$content = Get-Content $file -Raw

# Import ekle
if ($content -notmatch 'import\s+\{\s*Finance\s*\}\s+from\s+"../../../lib/finance";') {
    $content = 'import { Finance } from "../../../lib/finance";' + "`r`n" + $content
}

# Finans bloğu
$financeBlock = @'

      // REN ERP Finans Senkronizasyonu
      const financeInvoice = {
        id: Date.now(),
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.unvan ||
          selectedCustomer.name ||
          selectedCustomer.firmaAdi ||
          "",
        total: Number(calculated.total),
        subtotal: Number(calculated.subtotal || 0),
        vat: Number(calculated.vat || 0),
        discount: Number(calculated.discount || 0),
        type: normalizedType,
        invoiceNo: invoiceNumber,
        date: invoiceDate,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.productName || item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice || item.price),
          total: Number(item.total),
        })),
      };

      Finance.saveInvoice(financeInvoice);
      window.dispatchEvent(new Event("ren-finance-updated"));
'@

# normalizedType satırının altına ekle
$pattern = 'const normalizedType\s*=\s*normalizeType\(\s*invoiceType\s*\);'

if ($content -match $pattern -and $content -notmatch 'Finance\.saveInvoice') {
    $content = [regex]::Replace(
        $content,
        $pattern,
        '$0' + $financeBlock,
        1
    )
}

Set-Content -Path $file -Value $content -Encoding UTF8

Write-Host ""
Write-Host "✅ NewInvoice.jsx güncellendi."