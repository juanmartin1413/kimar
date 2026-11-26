param([Parameter(Mandatory=$true)][string]$Csv)
$ErrorActionPreference = 'Stop'
function Clean([string]$value) {
    if ([string]::IsNullOrWhiteSpace($value) -or $value.Trim() -eq '-') { return $null }
    return $value.Trim()
}
$rows = @(Import-Csv -Encoding UTF8 -LiteralPath $Csv)
if ($rows.Count -ne 63) { throw 'Se esperaban los 63 clientes de la planilla aprobada.' }
$data = @($rows | ForEach-Object {
    $original = Clean $_.'Dirección (Calle y Nº)'
    $calle = $original; $altura = $null; $cp = $null
    if ($calle -match '\b([A-Z]\d{4}(?:[A-Z]{3})?)\b') {
        $cp = $Matches[1]
        $calle = ($calle -replace "\b$cp\b", '').Trim(' ', ',', '.')
    }
    switch ($_.Nombre.Trim()) {
        'Sushi Club - Nordelta' { $calle = 'Del Mirador (Bahia Grande Av. Buenos Aires)'; $altura = '2030' }
        'La Toscana' { $calle = 'Los sauces, Local 32, Puerto de Frutos' }
        'The Fish Company' { $calle = 'Panamerica ramal Pilar 47.5 Colectora Este, Complejo Diarco Local 3, La Lonja' }
        'Moncada' { $calle = 'Av. Mitre'; $altura = '2683' }
        default {
            if ($calle -match '^(.*?)\s+(\d+(?:/\d+)?)$') {
                $calle = $Matches[1]; $altura = $Matches[2]
            }
        }
    }
    [pscustomobject][ordered]@{
        Nombre = $_.Nombre.Trim(); Vendedor = $_.Vendedor.Trim()
        Calle = $calle; Altura = $altura; CodigoPostal = $cp
        Localidad = (Clean $_.Localidad); Provincia = (Clean $_.Provincia).TrimEnd('.')
        Telefono1 = (Clean $_.'Teléfono 1'); Telefono2 = (Clean $_.'Teléfono 2 (opcional)')
        Email = (Clean $_.Email); Cuit = (Clean $_.CUIT)
        DireccionOriginal = $original
    }
})
if (($data | Group-Object Nombre | Where-Object Count -gt 1)) { throw 'Nombres duplicados.' }
$dest = Join-Path $PSScriptRoot '../KimarApi/Data/Seed/clientes-2026-11-26.json'
[IO.File]::WriteAllText($dest, ($data | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
Write-Output "Preparados $($data.Count) clientes en $dest"
