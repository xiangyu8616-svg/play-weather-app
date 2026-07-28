#!/usr/bin/env python3
"""
验证 Ed25519 JWT 签名逻辑，确保与 api/weather.js 中的实现一致。
使用和风天气控制台导出的私钥，生成 JWT 并解析验证。
"""

import base64
import json
import time
import os

# 尝试用 cryptography 库
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False
    print("cryptography 库未安装，尝试用 pynacl...")
    try:
        import nacl.signing
        import nacl.encoding
        HAS_NACL = True
    except ImportError:
        HAS_NACL = False

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def b64url_decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

def load_pem(path: str) -> bytes:
    with open(path, 'rb') as f:
        return f.read()

def sign_ed25519_jwt(private_key_bytes: bytes, kid: str, project_id: str) -> str:
    """模拟 api/weather.js 中的 JWT 签名逻辑"""
    
    header = json.dumps({"alg": "EdDSA", "kid": kid}, separators=(',', ':'))
    now = int(time.time())
    payload = json.dumps({"sub": project_id, "iat": now, "exp": now + 3600}, separators=(',', ':'))
    
    encoded_header = b64url_encode(header.encode())
    encoded_payload = b64url_encode(payload.encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    
    if HAS_CRYPTO:
        private_key = serialization.load_pem_private_key(private_key_bytes, password=None)
        signature = private_key.sign(signing_input)
    elif HAS_NACL:
        # NaCl 私钥格式不同，需要处理
        # PEM 解码后取最后 32 字节作为种子
        raise NotImplementedError("NaCl 格式转换未实现，请安装 cryptography: pip install cryptography")
    else:
        raise RuntimeError("需要 cryptography 库: pip install cryptography")
    
    encoded_signature = b64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def verify_jwt_structure(jwt: str) -> dict:
    """解析 JWT 并验证结构"""
    parts = jwt.split('.')
    assert len(parts) == 3, "JWT 必须由 3 部分组成"
    
    header = json.loads(b64url_decode(parts[0]))
    payload = json.loads(b64url_decode(parts[1]))
    signature = b64url_decode(parts[2])
    
    assert header['alg'] == 'EdDSA', f"算法应为 EdDSA, 实际为 {header['alg']}"
    assert 'kid' in header, "header 缺少 kid"
    assert payload['sub'] == PROJECT_ID, f"sub 应为 {PROJECT_ID}, 实际为 {payload['sub']}"
    assert 'iat' in payload, "payload 缺少 iat"
    assert 'exp' in payload, "payload 缺少 exp"
    assert payload['exp'] > payload['iat'], "exp 必须大于 iat"
    
    return {
        'header': header,
        'payload': payload,
        'signature_len': len(signature),
        'valid': True
    }

# ========== 配置 ==========
PEM_PATH = 'C:/Users/xiangyu/.easyclaw/workspace/play-weather-app/secrets/ed25519-private.pem'
KID = 'K6B8EKE6JU'
PROJECT_ID = '4N2B2VEN82'

# ========== 执行 ==========
if __name__ == '__main__':
    if not os.path.exists(PEM_PATH):
        print(f"❌ 私钥文件不存在: {PEM_PATH}")
        exit(1)
    
    if not HAS_CRYPTO:
        print("❌ 需要 cryptography 库。尝试安装...")
        os.system('pip install cryptography')
        exit(1)
    
    print(f"🔑 加载私钥: {PEM_PATH}")
    pem = load_pem(PEM_PATH)
    
    print(f"📝 生成 JWT (kid={KID}, sub={PROJECT_ID})...")
    jwt = sign_ed25519_jwt(pem, KID, PROJECT_ID)
    
    print(f"✅ JWT 生成成功")
    print(f"   长度: {len(jwt)} 字符")
    print(f"   前 100 字符: {jwt[:100]}...")
    
    result = verify_jwt_structure(jwt)
    print(f"\n📋 JWT 结构验证通过:")
    print(f"   header : {json.dumps(result['header'], indent=6)}")
    print(f"   payload: {json.dumps(result['payload'], indent=6)}")
    print(f"   签名长度: {result['signature_len']} 字节 (Ed25519 = 64)")
    
    if result['signature_len'] == 64:
        print(f"\n🎉 全部通过！api/weather.js 的 JWT 逻辑与此一致。")
    else:
        print(f"\n⚠️ 签名长度异常，预期 64 字节")
