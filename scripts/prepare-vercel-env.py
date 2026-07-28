#!/usr/bin/env python3
"""
把 PEM 私钥转成单行格式（\n 分隔），用于 Vercel 环境变量。
Vercel 环境变量支持多行值，但单行更方便粘贴。
"""

import os

PEM_PATH = 'C:/Users/xiangyu/.easyclaw/workspace/play-weather-app/secrets/ed25519-private.pem'

with open(PEM_PATH, 'r') as f:
    pem = f.read().strip()

# 转成单行，\n 分隔
single_line = pem.replace('\n', '\\n')

print("=" * 60)
print("Vercel 环境变量配置清单")
print("=" * 60)
print()
print("登录 Vercel Dashboard 后：")
print("1. 打开项目 play-weather-app")
print("2. Settings → Environment Variables")
print("3. 逐个添加以下变量：")
print()
print("---")
print("Name:  QWEATHER_ED25519_PRIVATE_KEY")
print("Value: " + single_line)
print("---")
print("Name:  QWEATHER_KID")
print("Value: K6B8EKE6JU")
print("---")
print("Name:  QWEATHER_PROJECT_ID")
print("Value: 4N2B2VEN82")
print("---")
print()
print("添加完成后，重新部署项目（Redeploy）")
print("=" * 60)
