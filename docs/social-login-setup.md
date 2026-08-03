# 社交登录配置指南（Apple + Google）

> 本文档说明如何在 Supabase 和原生端配置 Apple Sign-In 与 Google Sign-In。
> 代码侧已完成（`components/auth/SocialLoginButtons.jsx`、`stores/userStore.js`），**只需配置后台 + 安装依赖**即可启用。

---

## 前置步骤：安装依赖

```bash
cd C:\Users\xiangyu\.easyclaw\workspace\play-weather-app
npm install --legacy-peer-deps expo-apple-authentication expo-auth-session expo-web-browser
```

---

## 一、Apple Sign-In 配置

### 1.1 前提条件

- **Apple Developer 账号**（$99/年）——老朱还没注册，这是 S0.7 阻塞项
- iOS 14+ 设备或模拟器（Android 不支持原生 Apple Sign-In）

### 1.2 Apple Developer 后台配置

1. 登录 [Apple Developer](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Identifiers → 找到 `com.playweather.app`
3. 勾选 **Sign In with Apple** Capability
4. Keys → 创建新 Key：
   - Key Name: `PlayWeather Auth Key`
   - 勾选 **Sign In with Apple**
   - 下载 `.p8` 私钥文件（**只能下载一次，保存好**）
   - 记录 **Key ID**（如 `ABC123DEFG`）
   - 记录 **Team ID**（如 `XYZ1234567`）

### 1.3 Supabase 后台配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 项目 `play-weather` → Authentication → Providers → Apple
3. 填写：
   - **Client ID**: `com.playweather.app`
   - **Secret Key**: 把下载的 `.p8` 文件内容完整粘贴进来
   - **Key ID**: 上一步记录的 Key ID
   - **Team ID**: 上一步记录的 Team ID
4. 保存

### 1.4 Expo 配置（app.json）

已在 `app.json` 中预设，确认 `bundleIdentifier` 正确即可：

```json
{
  "ios": {
    "bundleIdentifier": "com.playweather.app"
  }
}
```

---

## 二、Google Sign-In 配置

### 2.1 前提条件

- Google 账号（免费）
- **不需要** Google Play 开发者账号（$25）即可配置 OAuth

### 2.2 Google Cloud Console 配置

1. 登录 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目（或选择现有项目）→ 比如叫 `play-weather-app`
3. APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**
4. Application type: **iOS**
   - Bundle ID: `com.playweather.app`
   - 保存后得到 **Client ID**（如 `123456789-xxx.apps.googleusercontent.com`）
5. 再创建一个 **Web** 类型的 OAuth Client ID：
   - Authorized redirect URIs: `https://rcrbqeebrffqifaofuou.supabase.co/auth/v1/callback`
   - 保存后得到 **Web Client ID** 和 **Web Client Secret**

### 2.3 Supabase 后台配置

1. Supabase Dashboard → Authentication → Providers → Google
2. 填写：
   - **Client ID**: Web 类型的 Client ID（不是 iOS 那个）
   - **Client Secret**: Web 类型的 Client Secret
3. 保存

### 2.4 Expo 配置

在 `app.json` 中确认 scheme 配置：

```json
{
  "scheme": "playweather"
}
```

Google OAuth 回调会回到 `playweather://` 这个 scheme，代码里已用 `makeRedirectUri({ scheme: 'playweather' })` 处理。

---

## 三、验证清单

| 检查项 | Apple | Google |
|--------|-------|--------|
| 依赖已安装 | `expo-apple-authentication` | `expo-auth-session` + `expo-web-browser` |
| Supabase Provider 已启用 | ✅ | ✅ |
| Client ID/Secret 已填入 | Team ID + Key ID + .p8 | Web Client ID + Secret |
| Expo scheme/bundle ID 正确 | `com.playweather.app` | `playweather` |

---

## 四、常见问题

**Q: 为什么 Apple Sign-In 在 Android 上不显示？**
A: `expo-apple-authentication` 只在 iOS/macOS 上可用，Android 会自动隐藏 Apple 按钮。这是预期行为。

**Q: Google 登录在 iOS 模拟器上测试不了？**
A: Google OAuth 需要在真机或配置好 bundle ID 的模拟器上测试。开发阶段可以先用邮箱 OTP。

**Q: Apple 登录第一次会弹窗要求输入姓名？**
A: 是的，Apple 只在**首次登录**时返回姓名，之后只返回匿名邮箱。代码里已处理：首次登录会把姓名写入 profile 表。

---

> 配置完成后，在 `profile.jsx` 页面未登录状态下即可看到三个登录方式：Apple（iOS）/ Google（全平台）/ 邮箱 OTP（全平台）。
