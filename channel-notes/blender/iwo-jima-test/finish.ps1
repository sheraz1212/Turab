# Combines rendered frames + voice + one-word captions + SFX into the final short.
$ErrorActionPreference = "Stop"
$W = "C:\Users\Turab\Downloads\video\test_iwojima"
$bin = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\*\bin" -Directory | Select-Object -First 1).FullName
$ff = "$bin\ffmpeg.exe"; $fp = "$bin\ffprobe.exe"
$tmp = "$W\tmp"; New-Item -ItemType Directory -Force $tmp | Out-Null

$lines = @(
  @{t=0.15; s="You dig a hole in the black sand, to hide from the bombs."},
  @{t=3.40; s="Planes roar right over your hideout."},
  @{t=5.55; s="So you cover it with rocks and ash. From the sky, it's invisible."},
  @{t=9.75; s="But a bomb hits nearby, and the sand walls collapse."},
  @{t=12.90; s="So you mix volcanic ash into cement. It dries as hard as stone."},
  @{t=17.30; s="Now, you dig sideways."}
)
$tempo = 1.15
$dur = 485 / 24

# --- voice: speed up each line, trim silence, place at its start time
$vin = @(); $vf = @(); $k = 0
foreach ($l in $lines) {
  $src = "$W\voice\s$k.wav"; $dst = "$tmp\v$k.wav"
  & $ff -v error -y -i $src -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=$tempo" $dst
  $l.d = [double](& $fp -v error -show_entries format=duration -of csv=p=0 $dst)
  $vin += "-i"; $vin += $dst
  $ms = [int]($l.t * 1000)
  $vf += "[$($k)]adelay=$ms|$ms,volume=1.6[v$k]"
  $k++
}

# --- captions: one word at a time, timing proportional to word length
$draw = @()
$font = "/Windows/Fonts/seguibl.ttf"
foreach ($l in $lines) {
  $words = ($l.s -replace "[,\.]", "").Split(" ") | Where-Object { $_ }
  $tot = ($words | ForEach-Object { $_.Length + 2 } | Measure-Object -Sum).Sum
  $acc = 0
  foreach ($wd in $words) {
    $a = $l.t + $l.d * $acc / $tot; $acc += $wd.Length + 2; $b = $l.t + $l.d * $acc / $tot
    $txt = ($wd.Substring(0,1).ToUpper() + $wd.Substring(1)) -replace "'", ""
    $draw += "drawtext=fontfile='$font':text='$txt':fontsize=46:fontcolor=white:borderw=3:bordercolor=black@0.85:shadowx=2:shadowy=3:shadowcolor=black@0.6:x=(w-text_w)/2:y=h*0.36:enable='between(t,$([math]::Round($a,3)),$([math]::Round($b,3)))'"
  }
}
($draw -join ",") | Out-File -Encoding ascii "$tmp\captions.txt"

# --- SFX (synthesised)
& $ff -v error -y -f lavfi -i "anoisesrc=color=brown:d=3:a=1" -f lavfi -i "anoisesrc=color=white:d=0.25:a=0.8" -filter_complex "[0]lowpass=f=160,afade=t=out:st=0.2:d=2.8,volume=6[a];[1]lowpass=f=2500,afade=t=out:st=0:d=0.25[b];[a][b]amix=inputs=2:normalize=0" "$tmp\boom.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=brown:d=3.6:a=1" -af "lowpass=f=500,highpass=f=60,afade=t=in:d=1.4,afade=t=out:st=2.0:d=1.6,volume=3" "$tmp\plane.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=pink:d=${dur}:a=1" -af "lowpass=f=700,volume=0.05" "$tmp\wind.wav"
& $ff -v error -y -f lavfi -i "anoisesrc=color=white:d=0.12:a=1" -af "highpass=f=400,lowpass=f=3000,afade=t=out:d=0.12,volume=0.8" "$tmp\scrape.wav"

$sfx = @(
  @{f="boom.wav"; t=0.33; v=1.0}, @{f="plane.wav"; t=3.1; v=0.9}, @{f="plane.wav"; t=3.5; v=0.6},
  @{f="boom.wav"; t=4.92; v=0.45}, @{f="boom.wav"; t=9.83; v=1.1}, @{f="wind.wav"; t=0; v=1.0}
)
foreach ($s in 2.0, 2.3, 2.6, 13.6, 13.9, 14.2, 14.5, 17.7, 18.0, 18.3, 18.6, 18.9) { $sfx += @{f="scrape.wav"; t=$s; v=0.5} }
foreach ($s in 7.4, 7.5, 7.6, 7.7, 7.8, 7.9) { $sfx += @{f="scrape.wav"; t=$s; v=0.35} }

$ain = @() + $vin; $n = $lines.Count
foreach ($s in $sfx) {
  $ain += "-i"; $ain += "$tmp\$($s.f)"
  $ms = [int]($s.t * 1000)
  $vf += "[$n]adelay=$ms|$ms,volume=$($s.v)[x$n]"; $n++
}
$labels = (0..($lines.Count-1) | ForEach-Object { "[v$_]" }) + ($lines.Count..($n-1) | ForEach-Object { "[x$_]" })
$fc = ($vf -join ";") + ";" + ($labels -join "") + "amix=inputs=$n`:normalize=0,alimiter=limit=0.9,apad[aout]"
$fc | Out-File -Encoding ascii "$tmp\audio_fc.txt"
& $ff -v error -y @ain "-/filter_complex" "$tmp\audio_fc.txt" -map "[aout]" -t $dur -ar 48000 "$tmp\mix.wav"

# --- final video
& $ff -v error -y -framerate 24 -i "$W\frames\f_%04d.png" -i "$tmp\mix.wav" "-/vf" "$tmp\captions.txt" -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest "$W\Iwo_Jima_Hook_TEST.mp4"
Write-Output "DONE $W\Iwo_Jima_Hook_TEST.mp4"
