# Knock the black canvas out of the logo by flooding in from the border.
#
# A global colour key cannot do this: the monogram's tower and outlines are
# near-black themselves, so keying every dark pixel punches holes through the
# artwork. Flooding from the edge only reaches the background region that is
# actually connected to the border, so interior darks survive untouched.
#
# Two thresholds give a feathered edge rather than a hard dark rim:
#   lum <= HARD  -> fully transparent, keep expanding
#   lum <= SOFT  -> partial alpha, stop (this is the antialiased fringe)

param(
  [string]$In  = 'D:\Claude\Tajweed\public\rahmah-logo.png',
  [string]$Out = 'D:\Claude\Tajweed\public\rahmah-logo.png',
  [int]$Hard = 42,
  [int]$Soft = 95
)

Add-Type -AssemblyName System.Drawing

$src = New-Object System.Drawing.Bitmap $In
$w = $src.Width; $h = $src.Height

$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
                      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

# Precompute luminance once; BGRA in memory.
$lum = New-Object int[] ($w * $h)
for ($y = 0; $y -lt $h; $y++) {
  $row = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $row + $x * 4
    $lum[$y * $w + $x] = [int](0.299 * $bytes[$i + 2] + 0.587 * $bytes[$i + 1] + 0.114 * $bytes[$i])
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

$cleared = 0; $feathered = 0
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
    # Antialiased fringe: fade it out instead of leaving a dark halo.
    $bytes[$i + 3] = [byte][math]::Round(255.0 * ($l - $Hard) / ($Soft - $Hard))
    $feathered++
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$src.UnlockBits($data)
$src.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()

"cleared $cleared px, feathered $feathered px of $($w * $h) -> $Out"
