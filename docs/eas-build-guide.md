# EAS Build 双端构建指南（ROADMAP 2.6）

> 配置文件已就绪：`eas.json`（preview/production profile）+ `app.json`（bundle 标识 + 相册权限文案）。
> 以下步骤需要你本人账号操作，按顺序执行即可。

## 0. 账号前置（一次性）

| 账号 | 用途 | 费用 |
|------|------|------|
| Expo 账号（https://expo.dev） | EAS Build 构建平台 | 免费 tier 够用 |
| Apple Developer | iOS TestFlight / App Store | $99/年 |
| Google Play Console | Android 封闭测试 | $25 一次性 |

> ⚠️ Play 新号政策：个人开发者账号需 **12 名测试者连续 14 天封闭测试** 才能申请正式发布，所以 Android 封闭测试要尽早启动。

## 1. 登录并初始化项目（✅ 已完成 2026-08-06）

- eas-cli 21.6.0 已全局安装
- robot token 存于 `secrets/expo-token.txt`（gitignored）；本机所有 eas 命令前执行：
  `export EXPO_TOKEN=$(tr -d '[:space:]' < secrets/expo-token.txt)`（PowerShell：`$env:EXPO_TOKEN = (Get-Content secrets/expo-token.txt -Raw).Trim()`）
- 项目已创建并链接：`@stevenzhus-team/play-weather-app`（projectId `1015e517-11ad-469d-8b66-b8dec49c58c0`），见 `app.json` 的 `extra.eas`

## 2. Android 封闭测试（先启动，14 天计时）

```bash
# 出 AAB（商店格式）
eas build --profile production --platform android
```

构建完成后：
1. Play Console → 创建应用（包名 `com.playweather.app`）→ 填写商店资料（文案见 `docs/store-listing.md`，截图见 `store-assets/`，数据安全表单见 `docs/data-safety.md`）
2. 测试 → 封闭测试 → 创建轨道 → 上传 AAB → 添加测试者邮箱（≥12 人）→ 发布
3. 测试者通过邮件链接加入，开始 14 天计时

> 想先自己装真机调试可以用 `eas build --profile preview-android --platform android` 出 APK 直接安装。

## 3. iOS TestFlight

```bash
eas build --profile production --platform ios
# 首次会引导你登录 Apple ID 并自动创建证书/描述文件（全托管，无需手动操作钥匙串）

eas submit --platform ios      # 自动上传 App Store Connect → TestFlight
```

然后在 App Store Connect：
1. TestFlight → 添加内部测试者（你自己 + 同事，免审核）
2. 外部测试者需过一次 Beta 审核（通常 24 小时内）

## 4. 版本号管理

- `eas.json` 已设 `appVersionSource: "remote"` + `autoIncrement`：构建号由 EAS 远端自增，本地不用管
- 应用版本（用户可见的 1.0.0）改 `app.json` 的 `expo.version`

## 5. 合规检查单（提交前）

- [x] 隐私政策公开页：https://play-weather-app.vercel.app/privacy-policy.html
- [x] App 内删除账号入口（我的 → 关于）
- [x] 相册权限用途文案（`app.json` plugins 已配）
- [ ] W-8BEN 税务表（App Store Connect / Play Console 后台，需本人填）
- [ ] Play 数据安全表单（照抄 `docs/data-safety.md`）
- [ ] App Store 隐私标签（同上）

## 常见问题

- **构建失败提示 keystore**：Android 首次构建 EAS 会问是否生成新 keystore，选 Yes（云端托管，勿丢失访问权）
- **iOS 证书冲突**：选 "Let EAS handle it" 即可
- **构建排队**：免费 tier 高峰期可能排队 10–30 分钟，属正常
