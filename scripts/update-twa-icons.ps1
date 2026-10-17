$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$project = Join-Path $root 'bubblewrap-twa'
$source = [System.Drawing.Image]::FromFile((Join-Path $root 'assets/Whimsical Forest Village App Icon.png'))
function Write-Icon($path, [int]$size, [bool]$adaptive) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        # 108dp adaptive layer; keep the artwork in the central 66dp region.
        $content = if ($adaptive) { [int][Math]::Round($size * 66 / 108) } else { $size }
        $offset = [int][Math]::Floor(($size - $content) / 2)
        $graphics.DrawImage($source, $offset, $offset, $content, $content)
        $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
try {
    foreach ($density in @(@('mdpi',1), @('hdpi',1.5), @('xhdpi',2), @('xxhdpi',3), @('xxxhdpi',4))) {
        $folder = Join-Path $project ('app/src/main/res/mipmap-' + $density[0])
        Write-Icon (Join-Path $folder 'ic_launcher.png') (48 * $density[1]) $false
        Write-Icon (Join-Path $folder 'ic_maskable.png') (108 * $density[1]) $true
    }
    Write-Icon (Join-Path $project 'store_icon.png') 512 $false
    $xml = Join-Path $project 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'
    $text = [IO.File]::ReadAllText($xml)
    $text = $text -replace '<color android:color="#[0-9A-Fa-f]+"\s*/>', '<color android:color="#FFFFFF" />'
    [IO.File]::WriteAllText($xml, $text)
} finally { $source.Dispose() }
Write-Output 'Bubblewrap launcher icons updated (legacy and adaptive).'
