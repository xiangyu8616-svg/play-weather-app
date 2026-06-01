# post-build.ps1 - Post-process Expo web export for Vercel deployment
# Run after: npx expo export --platform web
# Then deploy: cd dist; npx vercel --prod --yes

$distDir = Join-Path $PSScriptRoot "dist"
$bundleDir = Join-Path $distDir "_expo\static\js\web"

# 1. Move fonts from node_modules to /assets/fonts/
$fontsSrc = Join-Path $distDir "assets\node_modules\@expo\vector-icons\build\vendor\react-native-vector-icons\Fonts"
$fontsDst = Join-Path $distDir "assets\fonts"
if (Test-Path $fontsSrc) {
    New-Item -ItemType Directory -Force -Path $fontsDst | Out-Null
    Copy-Item "$fontsSrc\*.ttf" $fontsDst
    Write-Host "Fonts copied to assets/fonts/" -ForegroundColor Green
}

# 2. Move images from node_modules to /assets/images/
$imagesDst = Join-Path $distDir "assets\images"
New-Item -ItemType Directory -Force -Path $imagesDst | Out-Null
Get-ChildItem (Join-Path $distDir "assets\node_modules") -Recurse -Filter "*.png" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName $imagesDst
}
Write-Host "Images copied to assets/images/" -ForegroundColor Green

# 3. Update JS bundle to use new paths
$bundleFile = Get-ChildItem $bundleDir -Filter "entry-*.js" | Select-Object -First 1
if ($bundleFile) {
    $content = [System.IO.File]::ReadAllText($bundleFile.FullName)
    $content = $content.Replace("/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/", "/assets/fonts/")
    $content = $content.Replace("/assets/node_modules/@react-navigation/elements/lib/module/assets/", "/assets/images/")
    $content = $content.Replace("/assets/node_modules/expo-router/assets/", "/assets/images/")
    [System.IO.File]::WriteAllText($bundleFile.FullName, $content)
    Write-Host "Bundle paths updated" -ForegroundColor Green
}

# 4. Clean up old node_modules directory
$nodeModulesDir = Join-Path $distDir "assets\node_modules"
if (Test-Path $nodeModulesDir) {
    Remove-Item -Recurse -Force $nodeModulesDir
    Write-Host "Cleaned up assets/node_modules/" -ForegroundColor Green
}

# 5. Create vercel.json
$vercelJson = @{
    rewrites = @(@{ source = "/(.*)"; destination = "/index.html" })
    headers = @(
        @{
            source = "/assets/(.*)\\.ttf"
            headers = @(
                @{ key = "Content-Type"; value = "font/ttf" },
                @{ key = "Access-Control-Allow-Origin"; value = "*" },
                @{ key = "Cache-Control"; value = "public, max-age=31536000, immutable" }
            )
        },
        @{
            source = "/assets/(.*)\\.woff2"
            headers = @(
                @{ key = "Content-Type"; value = "font/woff2" },
                @{ key = "Access-Control-Allow-Origin"; value = "*" },
                @{ key = "Cache-Control"; value = "public, max-age=31536000, immutable" }
            )
        },
        @{
            source = "/assets/images/(.*)\\.png"
            headers = @(
                @{ key = "Content-Type"; value = "image/png" },
                @{ key = "Cache-Control"; value = "public, max-age=31536000, immutable" }
            )
        },
        @{
            source = "/_expo/static/(.*)\\.js"
            headers = @(@{ key = "Cache-Control"; value = "public, max-age=31536000, immutable" })
        }
    )
}
$vercelJson | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $distDir "vercel.json")
Write-Host "vercel.json created" -ForegroundColor Green

# 6. Add font preloads to index.html
$indexHtml = Join-Path $distDir "index.html"
$ioniconsFile = Get-ChildItem $fontsDst -Filter "Ionicons.*.ttf" | Select-Object -First 1
if ($ioniconsFile -and (Test-Path $indexHtml)) {
    $html = [System.IO.File]::ReadAllText($indexHtml)
    $preloadTag = "`n    <link rel=`"preload`" href=`"/assets/fonts/$($ioniconsFile.Name)`" as=`"font`" type=`"font/ttf`" crossorigin />"
    $html = $html.Replace("</head>", "$preloadTag`n  </head>")
    [System.IO.File]::WriteAllText($indexHtml, $html)
    Write-Host "Font preload added to index.html" -ForegroundColor Green
}

Write-Host "`nPost-build complete! Deploy with: cd dist; npx vercel --prod --yes" -ForegroundColor Cyan
