# SwasthyaOps AI Command Center - Stitch Screens Download Script
# Run this script in PowerShell to download all screenshots and HTML files

$outputDir = "d:\4 year\SwasthyaOps\stitch_screens"

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Write-Host "=== SwasthyaOps AI Command Center - Stitch Screen Downloader ===" -ForegroundColor Cyan
Write-Host ""

# Define all screens with their download URLs
$screens = @{
    "01_ai_command_center_mobile" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLu-TmO6Vq9Oz1Ya6wDEDYy0UnHUAJ3FVPEDUIKleWuD9Wl099EAZk7ot5idDwDH-6UlonNE3BA_fOksiB4RdfySp6ua8HZqwYMr_BD0Z-j6qFVKWWTfgX4AKxnrFMxn9vUwzOtiiBVLeqpRlE8caIlj3hIMriWOTR3f9fxkGRZin8edZ_KCZBh84OipAzJlUvm8n6X-xkmNzpC1h7UqLXwfyTSCaBpsfco32ce7ch6ite32tBS0rx6Dhgl2"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOGJlMzlhYTMwMWE2MzFjYTUzMTk2YTRlEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "1768"; Device = "MOBILE"
    }
    "02_medicine_inventory_desktop" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLvsPMbsIkTkTJBRYla6wNCK4Gx4e9ZsWsmG_J6SkjfsmUCHnpSt7SZS6h9RBXwGhHpW5nv-8_NtSD3YR6_Jrlgk4xLj24m-IAL9Q4gfW50MfVlXln2XZPZSZpE3dWXlIYUkVBd3QMwB49eCioYUSDLpQ-XoC5ZF_Rkmc7dKjBMF9U_Sa6Z9hcwvDQ3A3itmrdNejjtxDknJYFR7OAw8XQ3ISto778VLokmtPoy2YmmYHKzHwUEblBiZSdRx"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTEzYjJiOWYwOTI1YzFmNzU5MWI4ZTA1EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "03_home_dashboard_desktop" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLuZqpdwTZoFjtA2rOdMbGmUBUpFnJfNEa7yP-YwqqlQ5SAtlP3PJvVKiOHe03mi_8gYH1r1d2zNe57zgNr2ifYG-3SDDTQBTOXeCCVTQDY81TXzE9nI_SMEyHXnI8gQuuXyZlsZ4KsyggWXBX3hOXBX77iPMR_0Eu0-ZaurVc2xDhmyjNENYVXtzSsO7KS7OXMllEHaj1Pr9ekdIjhskdgtUB0pDPtQqBzp3pzoH_spEdi-S_uwy4n_sSdb"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTE0OWRhNjUwMzkyY2FhYTY5MzZhYzA5EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "04_ai_situation_room_desktop" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLso9GS-G7O4AW85sG_N2vmsc22jlmuNulQ_TDhrg54HCnQdaRaDwD9Tvd1tjP5xEtpbOxQBue86Wri99tl53wxo2Hwjrbz8O8zVqEwQ0Y-wmzSk46FrAPcl-N5DCg3tvAsKYiuskkZ2bI2_r7YYiTUGxhAVx4N1pAaib_9PYvDtM_iR3RQVUCvgNgWhC5y7gV3EHteIz3U0M59Kz1FxSKkGmmWc2h3hBu0Vbu6pRBJFd_53em65qdnk_Lg"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTRhNjdkODgwN2M0YzQ1MTc4M2E4ZmI5EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "05_ai_command_center_desktop" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLvd7oRwlBz_aDVrYDIRHeogZqscEnxZD2cQb4IKNw7VUTTVUIh3kKPraMneLslN0tbuC3ZtIgDTm-qRckXGlPGPF6Vtva8hs74QTH9o5jnjArO9n2PZBCd87HEugfC5mszIwUDqLBLw3VVGQqFkHCvtEAFLO8ta4RMjdMqKq_qNgpjdyjATd9CBoOACp0Yzf8dhquzm0BmKNnBN2bYUUNTWiNY1o-EUk0GzP3-q1ONugseCAZTeawXhqxE"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTAyZGIwNjUwN2M0YzQ1MTc4M2E4ZmI5EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "06_health_intelligence_mobile" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLs_b68VBCN3cVXDM8brFtx4Llrl7D6DbVxKgymR7f1UxY2QE9TY9kt4cj85jMt4PL_cCo53aIyvg0f77VUDTa6eMcZ344b1uN9AbmVcJ1hWnIeht-tySu9R8D19v37flygbSqqUM3s02Y7qQgzw5Qa7W9jSP-sEhoBY2CPEcpoNCztgx_ivyWyUIsfzjSY6OC3L5Er1WugLDvF4Td-cxeQuJ42TUvmlOiqIhhEVKSwMcU_VMYP64AsdYwBc"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOGMzYmQ0Y2EwODI5YmIzYWZiM2Q2MDRhEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "1768"; Device = "MOBILE"
    }
    "07_home_dashboard_mobile" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLvF99y_njJU_BIZoo68k0bjPkQpC5sFzEY6QOnxjGCPAZZty9_iYFWjEzUPHFFutoN-YcxSUB79GQD4T0jmlJ2mVmk8716W10bykxflnrtkTFHB5O8UBGcaHZAhj0kcha2GJhAzm88SSP0XMJ3q3IFIZcwT1fNDYPpbREbWiWyGdmKaRwR0-NY3ybFtNCf9dbiLuYPY4dK_uq5YZ1MMnK2bpkb6p3D-NvIJKK2Geznv5nZ_iZ57OGWtGuAO"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOGM5YzA1N2YwMWE2MzI3NTgxMzMzNjQyEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "4418"; Device = "MOBILE"
    }
    "08_ai_situation_room_mobile" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLsHrKFPaBI05koPgxEbbQliKz0uL-HL4w62bsaIZe8To5UnsI8_AdAp61reg3i8WqCfXlVDixxzm4vibmVGTlfqtKRWIMiyEsnyEbtehDDaV3HLPhBh50K_6ekw5ZfvTOFjmRY6E3IMRQiiUNfMpa0MEVFtr9-7ywQkNYD24cUNaElViGGtYrP49kPDkejwJnRJ8fD_gqioU2y1bp0PuU-c1N_ZjjQ-_ihS5GtDBDtO5lYRMbMXquSOqJNN"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTNmMWFiYTQwMWE2MjkxZDFhMTQxY2I2EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "2564"; Device = "MOBILE"
    }
    "09_medicine_inventory_mobile" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLuRKeA0DxHlcDBPfTGXtYIyg11JAnkf26wToJupPczwWxDNXHlRGC6LX3d_n8O2-Yfkyp6e-gpYfvMNMUWBb0tIymfxrA6CLjiwdoDcgnC9GDWIshobfh8bG6nhEP-Pi6SxRub82Uz7AHFIhQuuBOWu2sEa93QlV3vycIpMIGq7iMXMmDj1iBBJXq-Vn1L3h_q-9nuFXtIkTgmdyG5BDN0SV9FsFqQ72Ve6G4YuZ5rSvJKuXcp2OC9HF_Pg"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTBkMzJjM2MwN2UwMDQyNjNlMDRiODQ2EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "2730"; Device = "MOBILE"
    }
    "10_health_intelligence_desktop" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLtiZ0NkybHycrip6kczKKgkNrrEuriK0yQirLNC4p-S6_UcFj90rhHJHwkCqXjIaIl-VU52SKSs8vURKYJ5TqSGudkxN1Uga8Sj0r5oleSNqTapU12wGx_Q2mI4ZiDeqzQYpLSMQjLI89To2nxHYNXUj7tGSqF1rUZw5ruxU77FU5MATDV8KsBb58kGzYaPYll2Zt8fNa3HK7-FAfglU9SaDZn9_y63gCOdnpfG8w8UwqbI10wLJ_szM9I"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWVjOTA4ODA0N2QwN2UwMDQyNjNlMDRiODQ2EgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "11_home_dashboard_desktop_v2" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLvvDRycZ1l_vpQaO2BBFS7kF_9GeA0al4JmehTyl-1ULaF-sOgyHT5Ziukm1JhdivovGwrm8F_uShgFwex1guRYKW-XD9TWOrWGZjxRaEEUx70GE8lpK32Z03lkExRlxMpcrOdsSouEMWgS2RnbPTvUAmpV5U2j0CJrE24_3-RSSuZM2rM8bSJQ54Zy-kOQN_qxDLnMzAY51xCodvC-UCzCJA_u0uXYI0TQ1TWnrHdYEsrTeJmM9G-jLx3S"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWYzZGJkNGE1NDMwOTI1ZDE2ZDRiMDIxZDZlEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "12_ai_command_center_desktop_v2" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLumn7McgngZwvsQlqzwrB7VKoNbDgWIq-lZbeyzrr83F-avtkEyaMpbka6gEN4S7n9y-tgUlGWAPQquEbbxrT_F2UmY4iHOdFF8LXo6YL7cyYCdTNTT047BBhT5oSGEYuIt1qnjLPOA6iPwJA7x4mkioTisbsv-6kUoAHrwEpia1JqkSqVXeLLH8FRqY0lmvvIGV_XSi7-qChNR2NzMOXEmdNdevRsZigyGGQ0h8IcNGL7ozn1ttHG9m6zZ"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWYzZGIzM2IyNDUwMWE2MzI0NjMzMzI4NzJjEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "13_ai_situation_room_desktop_v2" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLsoBFb77O50k4NFjDVkagQXkl41rUHQG39zf3QVHxmzhrQaXAJAQoPnmw_HbhlUdqSuZ75fC_fsTkdNClUZDBbizMCkY_oUUHmXIiIafXdpxvpTeRIm8mMvk_m9EAf8lmmAa3BLJTuUVQDcSjo9SbVtmll3P6ZyEL67oLht_7sXHAT0uGE6KgOtDP-a95mKbZjXwru3LhrMbigXaZbvsA1V1zJjj62uRA9DCBrI42CH4g_CzrlZnQ0bBulz"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWYzZGJlMjc2YmQwOTM0ZjM2ZjRiMjM4NjdmEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "2560"; Height = "2048"; Device = "DESKTOP"
    }
    "14_home_dashboard_mobile_v2" = @{
        Screenshot = "https://lh3.googleusercontent.com/aida/AP1WRLtCilPdeUJ1I61tQQtCgBgJBga4CwkhG-VWplk9JNYyJeAHCuFU2WlkYKm_0qwlRogHWUkY2GyMO2u4iHV7bNai_gyGUumJG-zlHvwb_wgk6jptxHjJZRuCCOLOfiHLsJIQfxbhqvadxHjwkAVl-2VAwLbIlseNQMqKy7UFyeaJEp_3gcKCDOJkp5S99Pa8U__eQNQAhMYTCfo8K4hVstl3CWlRl-o1VD44MV8yhryD9RRpM43peAIi2Rc"
        Html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWYzZGI5NTgyN2YwN2M0ZDVjODA2MTAzOWFkEgsSBxDynfD-mxkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDE5NzI5NDIwMjg2MjQ3NDQ1OQ&filename=&opi=89354086"
        Width = "780"; Height = "3228"; Device = "MOBILE"
    }
}

$total = $screens.Count
$current = 0

foreach ($entry in $screens.GetEnumerator() | Sort-Object Name) {
    $current++
    $name = $entry.Key
    $data = $entry.Value
    
    Write-Host "[$current/$total] Downloading $name..." -ForegroundColor Yellow
    
    # Download screenshot
    $screenshotPath = Join-Path $outputDir "$name`_screenshot.png"
    try {
        curl.exe -L -s -o $screenshotPath $data.Screenshot
        Write-Host "  Screenshot: OK" -ForegroundColor Green
    } catch {
        Write-Host "  Screenshot: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Download HTML
    $htmlPath = Join-Path $outputDir "$name.html"
    try {
        curl.exe -L -s -o $htmlPath $data.Html
        Write-Host "  HTML: OK" -ForegroundColor Green
    } catch {
        Write-Host "  HTML: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Download Complete ===" -ForegroundColor Cyan
Write-Host "Files saved to: $outputDir"
Write-Host ""
Get-ChildItem $outputDir -File | Where-Object { $_.Name -ne "download_screens.ps1" -and $_.Name -ne ".gitkeep" } | Format-Table Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,1)}} -AutoSize
