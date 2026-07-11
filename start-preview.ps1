# 玩天气 App · 本地预览启动脚本
# 用法: .\start-preview.ps1
# 功能: 自动杀掉占端口的残留进程，启动 serve，输出访问地址

param(
    [int]$Port = 3000
)

$projectDir = "C:\Users\xiangyu\.easyclaw\workspace\play-weather-app"

# 1. 检查 dist 是否存在
if (-not (Test-Path "$projectDir\dist")) {
    Write-Host "❌ dist 目录不存在，请先执行: npx expo export --platform web" -ForegroundColor Red
    exit 1
}

# 2. 杀掉所有占用端口 3000 的进程
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Sort-Object -Unique
    foreach ($pid in $pids) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "🔪 杀掉占用端口 $Port 的进程: $($proc.ProcessName) (PID $pid)" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force
            }
        } catch {
            Write-Host "⚠️ 无法杀掉 PID $pid : $_" -ForegroundColor DarkYellow
        }
    }
    Start-Sleep -Milliseconds 500
}

# 3. 启动 serve
Write-Host "🚀 启动 serve (端口 $Port)..." -ForegroundColor Green
Set-Location $projectDir
npx serve dist -l $Port --cors --no-clipboard
