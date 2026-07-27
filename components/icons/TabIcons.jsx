import React from 'react';
import Svg, { Circle, Path, Line } from 'react-native-svg';

const svgBaseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** EarthIcon — 首页：圆形地球轮廓 + 经纬线弧线 */
export function EarthIcon({ size = 24, color = 'white' }) {
  return (
    <Svg width={size} height={size} {...svgBaseProps} stroke={color}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <Path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
      <Line x1="2" y1="12" x2="22" y2="12" />
      <Line x1="4.93" y1="7.5" x2="19.07" y2="7.5" />
      <Line x1="4.93" y1="16.5" x2="19.07" y2="16.5" />
    </Svg>
  );
}

/** PartlySunnyIcon — 预报：太阳 + 云 */
export function PartlySunnyIcon({ size = 24, color = 'white' }) {
  return (
    <Svg width={size} height={size} {...svgBaseProps} stroke={color}>
      <Circle cx="8" cy="8" r="4" />
      <Line x1="8" y1="1" x2="8" y2="3" />
      <Line x1="8" y1="13" x2="8" y2="15" />
      <Line x1="1" y1="8" x2="3" y2="8" />
      <Line x1="13" y1="8" x2="15" y2="8" />
      <Line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
      <Line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
      <Line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
      <Line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
      <Path d="M18 18a4 4 0 0 0-1.18-7.82A5 5 0 0 0 7 13.5 3.5 3.5 0 0 0 7.5 20.5H18" />
    </Svg>
  );
}

/** CameraIcon — 社区：相机轮廓 */
export function CameraIcon({ size = 24, color = 'white' }) {
  return (
    <Svg width={size} height={size} {...svgBaseProps} stroke={color}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

/** PersonIcon — 我的：人形轮廓 */
export function PersonIcon({ size = 24, color = 'white' }) {
  return (
    <Svg width={size} height={size} {...svgBaseProps} stroke={color}>
      <Circle cx="12" cy="7" r="4" />
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </Svg>
  );
}
