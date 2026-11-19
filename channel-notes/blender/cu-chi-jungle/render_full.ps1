$exe = "$env:LOCALAPPDATA\BlenderPortable\blender-4.2.23-windows-x64\blender.exe"
$W   = "C:\Users\Turab\AppData\Local\Temp\claude\3649cd6e6add4177\38384067-f947-44f5-9298-d100460bea54\scratchpad\jungle"
& $exe -b -P "$W\build_jungle.py" 2>&1 | Out-File -Encoding utf8 "$W\build_log.txt"
Remove-Item "$W\frames\*.png" -ErrorAction SilentlyContinue
Remove-Item "$W\test" -Recurse -Force -ErrorAction SilentlyContinue
& $exe -b "$W\jungle_hook.blend" -a 2>&1 | Select-String "Saved:" | Measure-Object | Select-Object -ExpandProperty Count
