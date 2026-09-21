# Build the installed-app icons from the high-resolution logo artwork.
#
# WHY NOT JUST RESIZE famico.png
# ------------------------------
# `public/famico.png` is already the right *shape* — the monogram sitting on a
# green badge — but it is 114 x 117. A home-screen icon is asked for at 512,
# and Android renders the adaptive one larger still; upscaling 4.5x turns the
# gold rim to mush on exactly the surface where the icon is biggest.
#
# `rahmah-logo-light-source.png` carries the same monogram at ~650px, so the
# badge is re-drawn here at full size instead: vector-crisp rounded rect, gold
# hairline, and the monogram composited over it at native resolution.
#
# FINDING THE MONOGRAM
# --------------------
# Its right-hand edge is not hardcoded. There is no blank column to split on —
# the export carries drop shadows, so ink runs continuously from the mark into
# the wordmark — but there is a clear *minimum*: the gutter column holds ~17
# inked pixels where its neighbours hold 300-400. The script takes the thinnest
# column in the quarter-to-two-fifths band where that gutter falls. A crop box
# measured from the file survives a re-export at another size; a magic number
# does not.
#
# TWO PURPOSES, TWO PADDINGS
# --------------------------
#   any       — the badge is the icon. Rounded corners are drawn in, because
#               this is what Windows and desktop Chrome show verbatim.
#   maskable  — full-bleed square, monogram pulled in to ~56% so that the
#               circle Android crops to never clips the artwork. Drawing the
#               rounded badge here instead would leave the corners doubly
#               rounded and the mark too small inside its own safe zone.

param(
  [string]$Source = 'D:\Claude\Tajweed\public\rahmah-logo-light-source.png',
  [string]$OutDir = 'D:\Claude\Tajweed\public',
  # Luminance (measured down from white) at or below which a pixel counts as
  # the white canvas. The artwork's own highlights run close to white, so the
  # fill spreads inward from the border only — never a global colour key.
  [int]$Hard = 30,
  [int]$Soft = 90
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

# --- brand -----------------------------------------------------------------
# Sampled from the badge in famico.png so the generated icons and the favicon
# read as the same mark rather than two greens that nearly match.
$GreenTop = [System.Drawing.Color]::FromArgb(255, 20, 105, 63)
$GreenBot = [System.Drawing.Color]::FromArgb(255, 5, 48, 28)
$Gold = [System.Drawing.Color]::FromArgb(255, 201, 162, 62)

function New-Graphics([System.Drawing.Bitmap]$bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return $g
}

# ---------------------------------------------------------------------------
# 1. Read the source and knock out the white canvas.
# ---------------------------------------------------------------------------
$src = New-Object System.Drawing.Bitmap $Source
$w = $src.Width; $h = $src.Height

$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
                      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

# Distance from white, so every threshold below reads "how much background is
# this pixel" in one direction. BGRA in memory.
$lum = New-Object int[] ($w * $h)
for ($y = 0; $y -lt $h; $y++) {
  $row = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $row + $x * 4
    $lum[$y * $w + $x] = 255 - [int](0.299 * $bytes[$i + 2] + 0.587 * $bytes[$i + 1] + 0.114 * $bytes[$i])
  }
}

$seen = New-Object bool[] ($w * $h)
$queue = New-Object 'System.Collections.Generic.Queue[int]'
function Push-Seed([int]$x, [int]$y) {
  $k = $y * $w + $x
  if (-not $seen[$k] -and $lum[$k] -le $Soft) { $seen[$k] = $true; $queue.Enqueue($k) }
}
for ($x = 0; $x -lt $w; $x++) { Push-Seed $x 0; Push-Seed $x ($h - 1) }
for ($y = 0; $y -lt $h; $y++) { Push-Seed 0 $y; Push-Seed ($w - 1) $y }

$cleared = 0
while ($queue.Count -gt 0) {
  $k = $queue.Dequeue()
  $x = $k % $w; $y = [math]::Floor($k / $w)
  $i = $y * $stride + $x * 4
  $l = $lum[$k]
  if ($l -le $Hard) {
    $bytes[$i + 3] = 0
    $cleared++
    foreach ($d in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) {
      $nx = $x + $d[0]; $ny = $y + $d[1]
      if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) { Push-Seed $nx $ny }
    }
  }
  else {
    $bytes[$i + 3] = [byte][math]::Round(255.0 * ($l - $Hard) / ($Soft - $Hard))
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$src.UnlockBits($data)

# ---------------------------------------------------------------------------
# 2. Measure the monogram: content columns, then the first real gutter.
# ---------------------------------------------------------------------------
$colInk = New-Object int[] $w
for ($x = 0; $x -lt $w; $x++) {
  $c = 0
  for ($y = 0; $y -lt $h; $y++) {
    if ($bytes[$y * $stride + $x * 4 + 3] -gt 24) { $c++ }
  }
  $colInk[$x] = $c
}

$startX = 0
while ($startX -lt $w -and $colInk[$startX] -eq 0) { $startX++ }

$bandFrom = [int]($w * 0.25)
$bandTo = [int]($w * 0.40)
$endX = $bandFrom
for ($x = $bandFrom; $x -le $bandTo; $x++) {
  if ($colInk[$x] -lt $colInk[$endX]) { $endX = $x }
}

$minY = $h; $maxY = -1
for ($y = 0; $y -lt $h; $y++) {
  for ($x = $startX; $x -le $endX; $x++) {
    if ($bytes[$y * $stride + $x * 4 + 3] -gt 24) {
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
      break
    }
  }
}

$mw = $endX - $startX + 1
$mh = $maxY - $minY + 1
$mark = New-Object System.Drawing.Bitmap $mw, $mh
$mg = New-Graphics $mark
$mg.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $mw, $mh),
              (New-Object System.Drawing.Rectangle $startX, $minY, $mw, $mh),
              [System.Drawing.GraphicsUnit]::Pixel)
$mg.Dispose()

"keyed $cleared px of $($w * $h); monogram = ${mw}x${mh} at ($startX,$minY)"

# ---------------------------------------------------------------------------
# 3. Draw the badge and composite.
# ---------------------------------------------------------------------------
function Write-Icon([int]$size, [double]$inset, [bool]$rounded, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = New-Graphics $bmp

  $full = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush `
    $full, $GreenTop, $GreenBot, ([System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)

  if ($rounded) {
    $r = [int]($size * 0.22)
    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path2.AddArc(0, 0, $d, $d, 180, 90)
    $path2.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path2.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path2.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path2.CloseFigure()
    $g.FillPath($brush, $path2)

    # The gold rim is what makes the green-on-green monogram read as a badge
    # rather than a smudge, so it is drawn inside the edge where no rounding
    # of the OS mask can shave it off.
    $pw = [math]::Max(2.0, $size * 0.028)
    $pen = New-Object System.Drawing.Pen $Gold, $pw
    $pen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
    $g.DrawPath($pen, $path2)
    $pen.Dispose()
    $path2.Dispose()
  }
  else {
    $g.FillRectangle($brush, $full)
  }
  $brush.Dispose()

  # Fit the mark into the inset box, preserving its aspect.
  $box = $size * $inset
  $scale = [math]::Min($box / $mw, $box / $mh)
  $dw = [int][math]::Round($mw * $scale)
  $dh = [int][math]::Round($mh * $scale)
  $g.DrawImage($mark, [int](($size - $dw) / 2), [int](($size - $dh) / 2), $dw, $dh)

  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "  -> $path (${size}x${size})"
}

Write-Icon 192 0.74 $true  (Join-Path $OutDir 'icon-192.png')
Write-Icon 512 0.74 $true  (Join-Path $OutDir 'icon-512.png')
# 0.56 keeps every pixel of the mark inside the 80%-diameter circle Android
# and iOS crop adaptive icons to.
Write-Icon 512 0.56 $false (Join-Path $OutDir 'icon-maskable-512.png')

$mark.Dispose()
$src.Dispose()
