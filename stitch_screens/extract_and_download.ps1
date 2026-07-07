# SwasthyaOps Stitch Screens - Extract & Download
# This script extracts HTML from cached content.md files AND downloads screenshots
# Run: powershell -ExecutionPolicy Bypass -File "extract_and_download.ps1"

$outputDir = "d:\4 year\SwasthyaOps\stitch_screens"
$stepsDir = "C:\Users\Admin\.gemini\antigravity-ide\brain\90da4453-add0-443c-a59c-74f147adb246\.system_generated\steps"

# Mapping: step number -> screen name (from the content.md files fetched by read_url_content)
$stepMappings = @{
    "54" = "01_ai_command_center_mobile"
    "55" = "02_medicine_inventory_desktop"
    "56" = "03_home_dashboard_desktop"
    "57" = "04_ai_situation_room_desktop"
    "58" = "05_ai_command_center_desktop"
    "59" = "06_health_intelligence_mobile"
    "60" = "07_home_dashboard_mobile"
    "61" = "08_ai_situation_room_mobile"
    "62" = "09_medicine_inventory_mobile"
    "63" = "10_health_intelligence_desktop"
    "64" = "11_home_dashboard_desktop_v2"
    "65" = "12_ai_command_center_desktop_v2"
    "66" = "13_ai_situation_room_desktop_v2"
    "67" = "14_home_dashboard_mobile_v2"
}

Write-Host "=== SwasthyaOps - Extracting HTML from cached content ===" -ForegroundColor Cyan

foreach ($entry in $stepMappings.GetEnumerator() | Sort-Object Value) {
    $stepNum = $entry.Key
    $screenName = $entry.Value
    $contentFile = Join-Path $stepsDir "$stepNum\content.md"
    $outputFile = Join-Path $outputDir "$screenName.html"
    
    if (Test-Path $contentFile) {
        $content = Get-Content -Path $contentFile -Raw
        # Extract everything after the "---" separator (the HTML portion)
        $htmlStart = $content.IndexOf("<!DOCTYPE html>")
        if ($htmlStart -ge 0) {
            $htmlContent = $content.Substring($htmlStart).Trim()
            Set-Content -Path $outputFile -Value $htmlContent -Encoding UTF8
            Write-Host "  [OK] $screenName.html" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] No HTML found in step $stepNum" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [SKIP] $contentFile not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Downloading Screenshots ===" -ForegroundColor Cyan

$screenshots = @{
    "01_ai_command_center_mobile" = "https://lh3.googleusercontent.com/aida/AP1WRLu-TmO6Vq9Oz1Ya6wDEDYy0UnHUAJ3FVPEDUIKleWuD9Wl099EAZk7ot5idDwDH-6UlonNE3BA_fOksiB4RdfySp6ua8HZqwYMr_BD0Z-j6qFVKWWTfgX4AKxnrFMxn9vUwzOtiiBVLeqpRlE8caIlj3hIMriWOTR3f9fxkGRZin8edZ_KCZBh84OipAzJlUvm8n6X-xkmNzpC1h7UqLXwfyTSCaBpsfco32ce7ch6ite32tBS0rx6Dhgl2"
    "02_medicine_inventory_desktop" = "https://lh3.googleusercontent.com/aida/AP1WRLvsPMbsIkTkTJBRYla6wNCK4Gx4e9ZsWsmG_J6SkjfsmUCHnpSt7SZS6h9RBXwGhHpW5nv-8_NtSD3YR6_Jrlgk4xLj24m-IAL9Q4gfW50MfVlXln2XZPZSZpE3dWXlIYUkVBd3QMwB49eCioYUSDLpQ-XoC5ZF_Rkmc7dKjBMF9U_Sa6Z9hcwvDQ3A3itmrdNejjtxDknJYFR7OAw8XQ3ISto778VLokmtPoy2YmmYHKzHwUEblBiZSdRx"
    "03_home_dashboard_desktop" = "https://lh3.googleusercontent.com/aida/AP1WRLuZqpdwTZoFjtA2rOdMbGmUBUpFnJfNEa7yP-YwqqlQ5SAtlP3PJvVKiOHe03mi_8gYH1r1d2zNe57zgNr2ifYG-3SDDTQBTOXeCCVTQDY81TXzE9nI_SMEyHXnI8gQuuXyZlsZ4KsyggWXBX3hOXBX77iPMR_0Eu0-ZaurVc2xDhmyjNENYVXtzSsO7KS7OXMllEHaj1Pr9ekdIjhskdgtUB0pDPtQqBzp3pzoH_spEdi-S_uwy4n_sSdb"
    "04_ai_situation_room_desktop" = "https://lh3.googleusercontent.com/aida/AP1WRLso9GS-G7O4AW85sG_N2vmsc22jlmuNulQ_TDhrg54HCnQdaRaDwD9Tvd1tjP5xEtpbOxQBue86Wri99tl53wxo2Hwjrbz8O8zVqEwQ0Y-wmzSk46FrAPcl-N5DCg3tvAsKYiuskkZ2bI2_r7YYiTUGxhAVx4N1pAaib_9PYvDtM_iR3RQVUCvgNgWhC5y7gV3EHteIz3U0M59Kz1FxSKkGmmWc2h3hBu0Vbu6pRBJFd_53em65qdnk_Lg"
    "05_ai_command_center_desktop" = "https://lh3.googleusercontent.com/aida/AP1WRLvd7oRwlBz_aDVrYDIRHeogZqscEnxZD2cQb4IKNw7VUTTVUIh3kKPraMneLslN0tbuC3ZtIgDTm-qRckXGlPGPF6Vtva8hs74QTH9o5jnjArO9n2PZBCd87HEugfC5mszIwUDqLBLw3VVGQqFkHCvtEAFLO8ta4RMjdMqKq_qNgpjdyjATd9CBoOACp0Yzf8dhquzm0BmKNnBN2bYUUNTWiNY1o-EUk0GzP3-q1ONugseCAZTeawXhqxE"
    "06_health_intelligence_mobile" = "https://lh3.googleusercontent.com/aida/AP1WRLs_b68VBCN3cVXDM8brFtx4Llrl7D6DbVxKgymR7f1UxY2QE9TY9kt4cj85jMt4PL_cCo53aIyvg0f77VUDTa6eMcZ344b1uN9AbmVcJ1hWnIeht-tySu9R8D19v37flygbSqqUM3s02Y7qQgzw5Qa7W9jSP-sEhoBY2CPEcpoNCztgx_ivyWyUIsfzjSY6OC3L5Er1WugLDvF4Td-cxeQuJ42TUvmlOiqIhhEVKSwMcU_VMYP64AsdYwBc"
    "07_home_dashboard_mobile" = "https://lh3.googleusercontent.com/aida/AP1WRLvF99y_njJU_BIZoo68k0bjPkQpC5sFzEY6QOnxjGCPAZZty9_iYFWjEzUPHFFutoN-YcxSUB79GQD4T0jmlJ2mVmk8716W10bykxflnrtkTFHB5O8UBGcaHZAhj0kcha2GJhAzm88SSP0XMJ3q3IFIZcwT1fNDYPpbREbWiWyGdmKaRwR0-NY3ybFtNCf9dbiLuYPY4dK_uq5YZ1MMnK2bpkb6p3D-NvIJKK2Geznv5nZ_iZ57OGWtGuAO"
    "08_ai_situation_room_mobile" = "https://lh3.googleusercontent.com/aida/AP1WRLsHrKFPaBI05koPgxEbbQliKz0uL-HL4w62bsaIZe8To5UnsI8_AdAp61reg3i8WqCfXlVDixxzm4vibmVGTlfqtKRWIMiyEsnyEbtehDDaV3HLPhBh50K_6ekw5ZfvTOFjmRY6E3IMRQiiUNfMpa0MEVFtr9-7ywQkNYD24cUNaElViGGtYrP49kPDkejwJnRJ8fD_gqioU2y1bp0PuU-c1N_ZjjQ-_ihS5GtDBDtO5lYRMbMXquSOqJNN"
    "09_medicine_inventory_mobile" = "https://lh3.googleusercontent.com/aida/AP1WRLuRKeA0DxHlcDBPfTGXtYIyg11JAnkf26wToJupPczwWxDNXHlRGC6LX3d_n8O2-Yfkyp6e-gpYfvMNMUWBb0tIymfxrA6CLjiwdoDcgnC9GDWIshobfh8bG6nhEP-Pi6SxRub82Uz7AHFIhQuuBOWu2sEa93QlV3vycIpMIGq7iMXMmDj1iBBJXq-Vn1L3h_q-9nuFXtIkTgmdyG5BDN0SV9FsFqQ72Ve6G4YuZ5rSvJKuXcp2OC9HF_Pg"
    "10_health_intelligence_desktop" = "https://lh3.googleusercontent.com/aida/AP1WRLtiZ0NkybHycrip6kczKKgkNrrEuriK0yQirLNC4p-S6_UcFj90rhHJHwkCqXjIaIl-VU52SKSs8vURKYJ5TqSGudkxN1Uga8Sj0r5oleSNqTapU12wGx_Q2mI4ZiDeqzQYpLSMQjLI89To2nxHYNXUj7tGSqF1rUZw5ruxU77FU5MATDV8KsBb58kGzYaPYll2Zt8fNa3HK7-FAfglU9SaDZn9_y63gCOdnpfG8w8UwqbI10wLJ_szM9I"
    "11_home_dashboard_desktop_v2" = "https://lh3.googleusercontent.com/aida/AP1WRLvvDRycZ1l_vpQaO2BBFS7kF_9GeA0al4JmehTyl-1ULaF-sOgyHT5Ziukm1JhdivovGwrm8F_uShgFwex1guRYKW-XD9TWOrWGZjxRaEEUx70GE8lpK32Z03lkExRlxMpcrOdsSouEMWgS2RnbPTvUAmpV5U2j0CJrE24_3-RSSuZM2rM8bSJQ54Zy-kOQN_qxDLnMzAY51xCodvC-UCzCJA_u0uXYI0TQ1TWnrHdYEsrTeJmM9G-jLx3S"
    "12_ai_command_center_desktop_v2" = "https://lh3.googleusercontent.com/aida/AP1WRLumn7McgngZwvsQlqzwrB7VKoNbDgWIq-lZbeyzrr83F-avtkEyaMpbka6gEN4S7n9y-tgUlGWAPQquEbbxrT_F2UmY4iHOdFF8LXo6YL7cyYCdTNTT047BBhT5oSGEYuIt1qnjLPOA6iPwJA7x4mkioTisbsv-6kUoAHrwEpia1JqkSqVXeLLH8FRqY0lmvvIGV_XSi7-qChNR2NzMOXEmdNdevRsZigyGGQ0h8IcNGL7ozn1ttHG9m6zZ"
    "13_ai_situation_room_desktop_v2" = "https://lh3.googleusercontent.com/aida/AP1WRLsoBFb77O50k4NFjDVkagQXkl41rUHQG39zf3QVHxmzhrQaXAJAQoPnmw_HbhlUdqSuZ75fC_fsTkdNClUZDBbizMCkY_oUUHmXIiIafXdpxvpTeRIm8mMvk_m9EAf8lmmAa3BLJTuUVQDcSjo9SbVtmll3P6ZyEL67oLht_7sXHAT0uGE6KgOtDP-a95mKbZjXwru3LhrMbigXaZbvsA1V1zJjj62uRA9DCBrI42CH4g_CzrlZnQ0bBulz"
    "14_home_dashboard_mobile_v2" = "https://lh3.googleusercontent.com/aida/AP1WRLtCilPdeUJ1I61tQQtCgBgJBga4CwkhG-VWplk9JNYyJeAHCuFU2WlkYKm_0qwlRogHWUkY2GyMO2u4iHV7bNai_gyGUumJG-zlHvwb_wgk6jptxHjJZRuCCOLOfiHLsJIQfxbhqvadxHjwkAVl-2VAwLbIlseNQMqKy7UFyeaJEp_3gcKCDOJkp5S99Pa8U__eQNQAhMYTCfo8K4hVstl3CWlRl-o1VD44MV8yhryD9RRpM43peAIi2Rc"
}

foreach ($entry in $screenshots.GetEnumerator() | Sort-Object Name) {
    $name = $entry.Key
    $url = $entry.Value
    $outputFile = Join-Path $outputDir "$name`_screenshot.png"
    
    try {
        curl.exe -L -s -o $outputFile $url
        Write-Host "  [OK] $name`_screenshot.png" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] $name`_screenshot.png" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== All Done ===" -ForegroundColor Cyan
Write-Host "Output directory: $outputDir"
Get-ChildItem $outputDir -File | Where-Object { $_.Name -notmatch '\.(ps1|gitkeep)$' } | Format-Table Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,1)}} -AutoSize
