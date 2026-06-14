/**
 * EXIF 元数据脱敏工具
 * 
 * 安全策略：
 * - 客户端上传前自动清除 GPS 位置信息
 * - 防止用户精确位置通过照片泄露
 * - Web 端通过 Canvas 重绘清除 EXIF
 * - 原生端通过 expo-image-manipulator 重新保存
 * 
 * ⚠️ 生产环境补充：服务端应二次校验，使用 exiftool 扫描残留 EXIF
 */

import { Platform } from 'react-native';

/**
 * 清除图片 EXIF 元数据（主要是 GPS 坐标）
 * 
 * @param {string} fileUri - 图片 URI (本地文件路径或 data URI)
 * @returns {Promise<{uri: string, blob?: Blob, width: number, height: number}>}
 *   处理后不含 EXIF 的图片
 */
export async function stripExif(fileUri) {
  // Web 端：Canvas 重绘自动丢失 EXIF
  if (Platform.OS === 'web') {
    return stripExifWeb(fileUri);
  }
  // 原生端：使用 expo-image-manipulator
  return stripExifNative(fileUri);
}

/**
 * Web 端 EXIF 脱敏：通过 Canvas 重绘图片
 * Canvas 导出的图片不含任何 EXIF 元数据
 */
async function stripExifWeb(fileUri) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas 导出失败'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({
            uri: url,
            blob,
            width: img.width,
            height: img.height,
          });
        },
        'image/jpeg',
        0.92 // 高质量压缩，避免画质损失
      );
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = fileUri;
  });
}

/**
 * 原生端 EXIF 脱敏：通过 expo-image-manipulator 重新保存
 * 
 * 🔒 安全策略：
 * - 优先使用 expo-image-manipulator 重编码（自动剥离 EXIF）
 * - 回退方案：读取文件为 ArrayBuffer，移除 JPEG APP1 段后返回
 * - 绝不返回原始文件作为降级结果（防止 GPS 泄露）
 */
async function stripExifNative(fileUri) {
  try {
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

    const result = await manipulateAsync(
      fileUri,
      [], // 不做裁剪/旋转操作
      {
        format: SaveFormat.JPEG,
        compress: 0.92,
        base64: false,
      }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.warn('[exifStripper] expo-image-manipulator 不可用，尝试手动剥离 EXIF:', error.message);
    
    // 回退：手动移除 JPEG APP1 (EXIF) 段，不直接返回原图
    try {
      return await stripExifManual(fileUri);
    } catch (manualError) {
      console.error('[exifStripper] 手动 EXIF 剥离也失败，阻止上传:', manualError.message);
      throw new Error('图片脱敏失败，无法安全上传。请重试或使用其他图片。');
    }
  }
}

/**
 * 手动移除 JPEG EXIF 段（APP1 marker 0xFFE1）
 * 
 * JPEG 结构：SOI | APP1(EXIF) | APP0(JFIF) | DQT | SOF | SOS | EOI
 * 移除 APP1 段后，图片结构仍然有效，只是丢失 EXIF 元数据
 */
async function stripExifManual(fileUri) {
  // 获取原始文件数据
  const response = await fetch(fileUri);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // 确认是 JPEG (SOI marker 0xFFD8)
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    throw new Error('文件不是有效的 JPEG 格式');
  }
  
  // 扫描并移除所有 APP1 段
  const cleaned = [];
  let i = 2; // 跳过 SOI
  
  while (i < bytes.length - 1) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
      // 找到 APP1 段，读取段长度后跳过
      if (i + 4 <= bytes.length) {
        const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
        i += 2 + segmentLength; // 跳过整个 APP1 段
        console.log('[exifStripper] 手动移除 APP1 EXIF 段, 长度:', segmentLength);
      } else {
        i = bytes.length; // 数据损坏，安全退出
      }
    } else {
      cleaned.push(bytes[i]);
      i++;
    }
  }
  
  // 重新组装为 Blob
  const cleanedArray = new Uint8Array(cleaned);
  const blob = new Blob([cleanedArray], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  
  return {
    uri: url,
    blob,
    width: 0, // 无法从 EXIF 段读取尺寸
    height: 0,
  };
}

/**
 * 检查图片是否包含 GPS 信息（仅 Web 端）
 * 通过解析 JPEG EXIF 标记来检测
 * 
 * @param {File|Blob} file - 图片文件
 * @returns {Promise<boolean>} 是否包含 GPS 信息
 */
export async function hasGPSInfo(file) {
  if (Platform.OS !== 'web') return false;
  
  try {
    const buffer = await file.slice(0, 65536).arrayBuffer();
    const view = new DataView(buffer);

    // 检查 JPEG SOI 标记
    if (view.getUint16(0) !== 0xFFD8) return false;

    // 搜索 EXIF IFD
    let offset = 2;
    while (offset < view.byteLength) {
      if (view.getUint16(offset) === 0xFFE1) {
        // APP1 标记，检查是否是 EXIF
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (exifHeader === 'Exif') {
          // 搜索 GPS IFD 标记 (0x8825)
          // 简化实现：检查是否包含 GPS 相关字符串
          const chunk = new Uint8Array(buffer.slice(offset, offset + 1024));
          const text = String.fromCharCode(...chunk);
          return /GPS|GPSInfo|GPSTag/i.test(text);
        }
      }
      offset += 1;
    }
    return false;
  } catch {
    return false;
  }
}

export default { stripExif, hasGPSInfo };
