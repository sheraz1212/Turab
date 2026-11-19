# Downloads portable Blender 4.2 LTS (if missing), builds the scene, renders 6 test frames.
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$root = "$env:LOCALAPPDATA\BlenderPortable"
$exe  = "$root\blender-4.2.23-windows-x64\blender.exe"
$W    = "C:\Users\Turab\Downloads\video\test_iwojima"
if (-not (Test-Path $exe)) {
    New-Item -ItemType Directory -Force $root | Out-Null
    Write-Host "Downloading Blender 4.2.23 LTS (~350 MB)..."
    Invoke-WebRequest "https://download.blender.org/release/Blender4.2/blender-4.2.23-windows-x64.zip" -OutFile "$root\b42.zip"
    Write-Host "Extracting..."
    Expand-Archive "$root\b42.zip" -DestinationPath $root -Force
    Remove-Item "$root\b42.zip"
}
& $exe -b --version | Select-Object -First 1
Write-Host "Building scene..."
& $exe -b -P "$W\build_hook.py" 2>&1 | Out-File -Encoding utf8 "$W\build_log.txt"
Select-String -Path "$W\build_log.txt" -Pattern "BUILD_OK|Error|Traceback" | Select-Object -First 10
Write-Host "Rendering test frames..."
New-Item -ItemType Directory -Force "$W\testframes" | Out-Null
& $exe -b "$W\iwojima_hook.blend" -o "$W\testframes\t_####" -F PNG -f 15,100,190,250,370,470 2>&1 | Out-File -Encoding utf8 "$W\render_log.txt"
Select-String -Path "$W\render_log.txt" -Pattern "Saved|Error|Time:" | Select-Object -Last 12
Write-Host "TEST_DONE"
