$ErrorActionPreference = "Stop"
$W = "C:\Users\Turab\AppData\Local\Temp\claude\3649cd6e6add4177\38384067-f947-44f5-9298-d100460bea54\scratchpad\jungle"
$bin = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\*\bin" -Directory | Select-Object -First 1).FullName
$ff = "$bin\ffmpeg.exe"; $fp = "$bin\ffprobe.exe"; $tmp = "$W\tmp"
$lines = @(
  @{t=0.15; s="You dig a hole in the jungle, to hide from the bombs."},
  @{t=3.00; s="Enemy soldiers walk right past your hideout."},
  @{t=5.60; s="So you cover it with a wooden lid and fresh leaves. Every patrol walks straight over it."},
  @{t=10.30; s="A bomb lands nearby."},
  @{t=11.80; s="But the red clay walls hold. When it dries, it's as hard as concrete."},
  @{t=16.30; s="So you dig sideways."},
  @{t=18.00; s="But fresh dirt outside would give you away. So at night, you carry it out, and scatter it."},
  @{t=24.20; s="Deep down, the air runs out. So you drill thin air holes, and hide them inside termite mounds."},
  @{t=30.00; s="But smoke from your kitchen would give you away. So you send it through long tunnels, until it leaks out far away, low, like morning mist."},
  @{t=37.40; s="Then the enemy finds an entrance, and pumps in gas."},
  @{t=40.40; s="So you dig a U-bend, and fill it with water. The gas stops right there."},
  @{t=45.00; s="You keep digging. More levels. Kitchens. A hospital. Bedrooms."},
  @{t=51.00; s="Until the tunnels stretch over a hundred kilometers."},
  @{t=54.20; s="They send a soldier in. But the tunnels were dug for tiny people. He gets stuck."},
  @{t=59.40; s="Congratulations. You have built the Cu Chi tunnels."}
)
$dur = 1524 / 24
$vin = @(); $vf = @(); $k = 0
foreach ($l in $lines) {
  $l.d = [double](& $fp -v error -show_entries format=duration -of csv=p=0 "$tmp\v$k.wav")
  $vin += "-i"; $vin += "$tmp\v$k.wav"; $ms = [int]($l.t * 1000)
  $vf += "[$($k)]adelay=$ms|$ms,volume=1.6[v$k]"; $k++
}
$draw = @(); $font = "/Windows/Fonts/seguibl.ttf"
foreach ($l in $lines) {
  $words = ($l.s -replace "[,\.]", "").Split(" ") | Where-Object { $_ }
  $tot = ($words | ForEach-Object { $_.Length + 2 } | Measure-Object -Sum).Sum; $acc = 0
  foreach ($wd in $words) {
    $a = $l.t + $l.d * $acc / $tot; $acc += $wd.Length + 2; $b = $l.t + $l.d * $acc / $tot
    $txt = ($wd.Substring(0,1).ToUpper() + $wd.Substring(1)) -replace "'", ""
    $draw += "drawtext=fontfile='$font':text='$txt':fontsize=44:fontcolor=white:borderw=3:bordercolor=black@0.8:shadowx=2:shadowy=3:shadowcolor=black@0.5:x=(w-text_w)/2:y=h*0.455:enable='between(t,$([math]::Round($a,3)),$([math]::Round($b,3)))'"
  }
}
$draw += "drawtext=fontfile='$font':text='100+ KM':fontsize=78:fontcolor=0xFFD21E:borderw=4:bordercolor=black@0.85:x=(w-text_w)/2:y=h*0.16:enable='between(t,51.4,53.9)'"
($draw -join ",") | Out-File -Encoding ascii "$tmp\captions.txt"

& $ff -v error -y -f lavfi -i "anoisesrc=color=brown:d=3:a=1" -f lavfi -i "anoisesrc=color=white:d=0.25:a=0.8" -filter_complex "[0]lowpass=f=160,afade=t=out:st=0.2:d=2.8,volume=6[a];[1]lowpass=f=2500,afade=t=out:st=0:d=0.25[b];[a][b]amix=inputs=2:normalize=0" "$tmp\boom.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=pink:d=${dur}:a=1" -af "lowpass=f=900,volume=0.045" "$tmp\bed.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=white:d=0.12:a=1" -af "highpass=f=400,lowpass=f=3000,afade=t=out:d=0.12,volume=0.8" "$tmp\scrape.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=brown:d=0.09:a=1" -af "lowpass=f=300,afade=t=out:d=0.09,volume=2.2" "$tmp\step.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=brown:d=0.35:a=1" -af "lowpass=f=220,afade=t=out:d=0.35,volume=4" "$tmp\thud.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=white:d=0.9:a=1" -af "highpass=f=1500,afade=t=in:d=0.2,afade=t=out:st=0.4:d=0.5,volume=0.25" "$tmp\rustle.wav"
& $ff -v error -y -f lavfi -i "sine=f=4200:d=5.0" -af "tremolo=f=28:d=1,volume=0.05,afade=t=in:d=0.8" "$tmp\crickets.wav"

$sfx = @(@{f="boom.wav"; t=0.25; v=1.0}, @{f="boom.wav"; t=10.42; v=1.15}, @{f="bed.wav"; t=0; v=1.0},
         @{f="thud.wav"; t=7.1; v=1.0}, @{f="rustle.wav"; t=7.25; v=1.0}, @{f="crickets.wav"; t=18.2; v=1.0})
for ($s = 1.3; $s -lt 6.0; $s += 0.29) { $sfx += @{f="scrape.wav"; t=[math]::Round($s,2); v=0.45} }
for ($s = 11.9; $s -lt 15.4; $s += 0.29) { $sfx += @{f="scrape.wav"; t=[math]::Round($s,2); v=0.4} }
for ($s = 16.8; $s -lt 18.3; $s += 0.25) { $sfx += @{f="scrape.wav"; t=[math]::Round($s,2); v=0.4} }
for ($s = 2.45; $s -lt 7.2; $s += 0.25) { $sfx += @{f="step.wav"; t=[math]::Round($s,2); v=0.6} }
for ($s = 7.45; $s -lt 11.2; $s += 0.25) { $sfx += @{f="step.wav"; t=[math]::Round($s,2); v=0.7} }
for ($s = 19.6; $s -lt 22.7; $s += 0.25) { $sfx += @{f="step.wav"; t=[math]::Round($s,2); v=0.35} }
& $ff -v error -y -f lavfi -i "anoisesrc=color=pink:d=2.0:a=1" -af "bandpass=f=900:w=600,afade=t=in:d=0.4,afade=t=out:st=1.2:d=0.8,volume=0.8" "$tmp\whoosh.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=white:d=4.0:a=1" -af "highpass=f=2500,afade=t=in:d=0.6,afade=t=out:st=3.0:d=1.0,volume=0.18" "$tmp\hiss.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=pink:d=1.2:a=1" -af "lowpass=f=1200,tremolo=f=9:d=0.8,afade=t=out:st=0.4:d=0.8,volume=0.9" "$tmp\splash.wav"
& $ff -v error -y -f lavfi -i "sine=f=196:d=4" -f lavfi -i "sine=f=247:d=4" -f lavfi -i "sine=f=294:d=4" -filter_complex "amix=inputs=3,afade=t=in:d=0.3,afade=t=out:st=1.5:d=2.5,volume=0.5" "$tmp\chord.wav"
& $ff -v error -y -f lavfi -i "sine=f=110:d=2.5" -f lavfi -i "sine=f=165:d=2.5" -filter_complex "amix=inputs=2,afade=t=in:d=0.6,afade=t=out:st=1.2:d=1.3,volume=0.45" "$tmp\swell.wav"
$sfx += @{f="whoosh.wav"; t=28.3; v=1.0}, @{f="whoosh.wav"; t=29.0; v=0.8}, @{f="hiss.wav"; t=31.0; v=1.0},
        @{f="hiss.wav"; t=34.0; v=0.8}, @{f="hiss.wav"; t=37.7; v=1.2}, @{f="splash.wav"; t=41.9; v=1.0},
        @{f="whoosh.wav"; t=45.5; v=0.6}, @{f="swell.wav"; t=51.0; v=1.0}, @{f="thud.wav"; t=55.4; v=1.0},
        @{f="chord.wav"; t=59.4; v=1.0}
for ($s = 40.6; $s -lt 41.9; $s += 0.29) { $sfx += @{f="scrape.wav"; t=[math]::Round($s,2); v=0.4} }
for ($s = 45.2; $s -lt 50.0; $s += 0.6) { $sfx += @{f="scrape.wav"; t=[math]::Round($s,2); v=0.35} }
for ($s = 55.8; $s -lt 58.8; $s += 0.42) { $sfx += @{f="step.wav"; t=[math]::Round($s,2); v=0.8} }
for ($s = 59.2; $s -lt 63.3; $s += 0.25) { $sfx += @{f="step.wav"; t=[math]::Round($s,2); v=0.4} }

$ain = @() + $vin; $n = $lines.Count
foreach ($s in $sfx) { $ain += "-i"; $ain += "$tmp\$($s.f)"; $ms = [int]($s.t * 1000); $vf += "[$n]adelay=$ms|$ms,volume=$($s.v)[x$n]"; $n++ }
$labels = (0..($lines.Count-1) | ForEach-Object { "[v$_]" }) + ($lines.Count..($n-1) | ForEach-Object { "[x$_]" })
(($vf -join ";") + ";" + ($labels -join "") + "amix=inputs=$n`:normalize=0,alimiter=limit=0.9,apad[aout]") | Out-File -Encoding ascii "$tmp\audio_fc.txt"
& $ff -v error -y @ain "-/filter_complex" "$tmp\audio_fc.txt" -map "[aout]" -t $dur -ar 48000 "$tmp\mix.wav"
& $ff -v error -y -framerate 24 -i "$W\frames\f_%04d.png" -i "$tmp\mix.wav" "-/vf" "$tmp\captions.txt" -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest "$W\Cu_Chi_Tunnels_FULL.mp4"
Write-Output "DONE"
