$exe = "$env:LOCALAPPDATA\BlenderPortable\blender-4.2.23-windows-x64\blender.exe"
$W   = "C:\Users\Turab\AppData\Local\Temp\claude\3649cd6e6add4177\38384067-f947-44f5-9298-d100460bea54\scratchpad\jungle"
& $exe -b -P "$W\build_jungle.py" 2>&1 | Out-File -Encoding utf8 "$W\build_log.txt"
New-Item -ItemType Directory -Force "$W\test" | Out-Null
& $exe -b "$W\jungle_hook.blend" -o "$W\test\t_####" -F PNG -f 300,700,785,850,940,1050,1200,1260,1360,1470 2>&1 | Out-File -Encoding utf8 "$W\render_log.txt"
"TEST_DONE" | Out-File -Encoding utf8 "$W\test_done.txt"
