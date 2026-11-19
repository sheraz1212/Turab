# Rebuilds the scene and renders all 485 frames (~35 min on this laptop).
$exe = "$env:LOCALAPPDATA\BlenderPortable\blender-4.2.23-windows-x64\blender.exe"
$W   = "C:\Users\Turab\Downloads\video\test_iwojima"
& $exe -b -P "$W\build_hook.py" 2>&1 | Out-File -Encoding utf8 "$W\build_log.txt"
Select-String -Path "$W\build_log.txt" -Pattern "BUILD_OK|Error|Traceback" | Select-Object -First 5
New-Item -ItemType Directory -Force "$W\frames" | Out-Null
& $exe -b "$W\iwojima_hook.blend" -a 2>&1 | Select-String "Saved:"
Write-Host "RENDER_DONE"
