var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/suncalc/suncalc.js
var require_suncalc = __commonJS({
  "node_modules/suncalc/suncalc.js"(exports2, module2) {
    (function() {
      "use strict";
      var PI = Math.PI, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, atan = Math.atan2, acos = Math.acos, rad = PI / 180;
      var dayMs = 1e3 * 60 * 60 * 24, J1970 = 2440588, J2000 = 2451545;
      function toJulian(date) {
        return date.valueOf() / dayMs - 0.5 + J1970;
      }
      function fromJulian(j) {
        return new Date((j + 0.5 - J1970) * dayMs);
      }
      function toDays(date) {
        return toJulian(date) - J2000;
      }
      var e = rad * 23.4397;
      function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
      }
      function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
      }
      function azimuth(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
      }
      function altitude(H, phi, dec) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
      }
      function siderealTime(d, lw) {
        return rad * (280.16 + 360.9856235 * d) - lw;
      }
      function astroRefraction(h) {
        if (h < 0)
          h = 0;
        return 2967e-7 / Math.tan(h + 312536e-8 / (h + 0.08901179));
      }
      function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
      }
      function eclipticLongitude(M) {
        var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 3e-4 * sin(3 * M)), P = rad * 102.9372;
        return M + C + P + PI;
      }
      function sunCoords(d) {
        var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
        return {
          dec: declination(L, 0),
          ra: rightAscension(L, 0)
        };
      }
      var SunCalc2 = {};
      SunCalc2.getPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d), H = siderealTime(d, lw) - c.ra;
        return {
          azimuth: azimuth(H, phi, c.dec),
          altitude: altitude(H, phi, c.dec)
        };
      };
      var times = SunCalc2.times = [
        [-0.833, "sunrise", "sunset"],
        [-0.3, "sunriseEnd", "sunsetStart"],
        [-6, "dawn", "dusk"],
        [-12, "nauticalDawn", "nauticalDusk"],
        [-18, "nightEnd", "night"],
        [6, "goldenHourEnd", "goldenHour"]
      ];
      SunCalc2.addTime = function(angle, riseName, setName) {
        times.push([angle, riseName, setName]);
      };
      var J0 = 9e-4;
      function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * PI));
      }
      function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * PI) + n;
      }
      function solarTransitJ(ds, M, L) {
        return J2000 + ds + 53e-4 * sin(M) - 69e-4 * sin(2 * L);
      }
      function hourAngle(h, phi, d) {
        return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
      }
      function observerAngle(height) {
        return -2.076 * Math.sqrt(height) / 60;
      }
      function getSetJ(h, lw, phi, dec, n, M, L) {
        var w = hourAngle(h, phi, dec), a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
      }
      SunCalc2.getTimes = function(date, lat, lng, height) {
        height = height || 0;
        var lw = rad * -lng, phi = rad * lat, dh = observerAngle(height), d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n), M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0), Jnoon = solarTransitJ(ds, M, L), i, len, time, h0, Jset, Jrise;
        var result = {
          solarNoon: fromJulian(Jnoon),
          nadir: fromJulian(Jnoon - 0.5)
        };
        for (i = 0, len = times.length; i < len; i += 1) {
          time = times[i];
          h0 = (time[0] + dh) * rad;
          Jset = getSetJ(h0, lw, phi, dec, n, M, L);
          Jrise = Jnoon - (Jset - Jnoon);
          result[time[1]] = fromJulian(Jrise);
          result[time[2]] = fromJulian(Jset);
        }
        return result;
      };
      function moonCoords(d) {
        var L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.22935 * d), l = L + rad * 6.289 * sin(M), b = rad * 5.128 * sin(F), dt = 385001 - 20905 * cos(M);
        return {
          ra: rightAscension(l, b),
          dec: declination(l, b),
          dist: dt
        };
      }
      SunCalc2.getMoonPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra, h = altitude(H, phi, c.dec), pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
        h = h + astroRefraction(h);
        return {
          azimuth: azimuth(H, phi, c.dec),
          altitude: h,
          distance: c.dist,
          parallacticAngle: pa
        };
      };
      SunCalc2.getMoonIllumination = function(date) {
        var d = toDays(date || /* @__PURE__ */ new Date()), s = sunCoords(d), m = moonCoords(d), sdist = 149598e3, phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)), inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)), angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
        return {
          fraction: (1 + cos(inc)) / 2,
          phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
          angle
        };
      };
      function hoursLater(date, h) {
        return new Date(date.valueOf() + h * dayMs / 24);
      }
      SunCalc2.getMoonTimes = function(date, lat, lng, inUTC) {
        var t = new Date(date);
        if (inUTC) t.setUTCHours(0, 0, 0, 0);
        else t.setHours(0, 0, 0, 0);
        var hc = 0.133 * rad, h0 = SunCalc2.getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
        for (var i = 1; i <= 24; i += 2) {
          h1 = SunCalc2.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
          h2 = SunCalc2.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;
          a = (h0 + h2) / 2 - h1;
          b = (h2 - h0) / 2;
          xe = -b / (2 * a);
          ye = (a * xe + b) * xe + h1;
          d = b * b - 4 * a * h1;
          roots = 0;
          if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
          }
          if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;
          } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
          }
          if (rise && set) break;
          h0 = h2;
        }
        var result = {};
        if (rise) result.rise = hoursLater(t, rise);
        if (set) result.set = hoursLater(t, set);
        if (!rise && !set) result[ye > 0 ? "alwaysUp" : "alwaysDown"] = true;
        return result;
      };
      if (typeof exports2 === "object" && typeof module2 !== "undefined") module2.exports = SunCalc2;
      else if (typeof define === "function" && define.amd) define(SunCalc2);
      else window.SunCalc = SunCalc2;
    })();
  }
});

// services/astronomyService.ts
var import_suncalc = __toESM(require_suncalc());
function getSunTimes(date, lat, lng) {
  try {
    const cacheKey = `astro:sun:${date.toISOString().split("T")[0]}:${lat}:${lng}`;
    const times = import_suncalc.default.getTimes(date, lat, lng);
    return times;
  } catch (error) {
    console.error("\u8BA1\u7B97\u65E5\u51FA\u65E5\u843D\u5931\u8D25:", error);
    throw error;
  }
}
function getSunPosition(date, lat, lng) {
  try {
    const position = import_suncalc.default.getPosition(date, lat, lng);
    return {
      azimuth: position.azimuth,
      altitude: position.altitude
    };
  } catch (error) {
    console.error("\u8BA1\u7B97\u592A\u9633\u4F4D\u7F6E\u5931\u8D25:", error);
    throw error;
  }
}
function getMoonPhase(date) {
  try {
    const phaseData = import_suncalc.default.getMoonIllumination(date);
    const moonAge = phaseData.phase * 29.53;
    const phaseName = getMoonPhaseName(phaseData.phase);
    let distance = 384400;
    try {
      const moonPos = import_suncalc.default.getMoonPosition(date, 0, 0);
      if (moonPos && moonPos.distance) {
        distance = Math.round(moonPos.distance);
      }
    } catch (_) {
    }
    return {
      phase: phaseData.phase,
      phaseName,
      illumination: phaseData.fraction * 100,
      // fraction 是照亮比例 (0-1)
      age: Math.round(moonAge),
      distance,
      angularDiameter: 9e-3
      // 约 0.5 度
    };
  } catch (error) {
    console.error("\u8BA1\u7B97\u6708\u76F8\u5931\u8D25:", error);
    return {
      phase: 0,
      phaseName: "\u65B0\u6708",
      illumination: 0,
      age: 0,
      distance: 384400,
      angularDiameter: 9e-3
    };
  }
}
function getPhotographyTimes(date, lat, lng) {
  try {
    const sunTimes = getSunTimes(date, lat, lng);
    const safeGet = (field, fallbackMs) => field instanceof Date && !isNaN(field.getTime()) ? field : new Date(Date.now() + fallbackMs);
    const goldenHourEnd = safeGet(sunTimes.goldenHourEnd, 36e5);
    const goldenHourStart = safeGet(sunTimes.goldenHour, -36e5);
    const sunrise = safeGet(sunTimes.sunrise, 0);
    const sunset = safeGet(sunTimes.sunset, 432e5);
    const civilDawn = safeGet(sunTimes.civilDawn, -72e5);
    const civilDusk = safeGet(sunTimes.civilDusk, 72e5);
    const goldenHourMorning = {
      start: sunrise,
      end: goldenHourEnd,
      duration: Math.round((goldenHourEnd.getTime() - sunrise.getTime()) / 6e4)
    };
    const goldenHourEvening = {
      start: goldenHourStart,
      end: sunset,
      duration: Math.round((sunset.getTime() - goldenHourStart.getTime()) / 6e4)
    };
    const blueHourMorning = {
      start: civilDawn,
      end: sunrise,
      duration: Math.round((sunrise.getTime() - civilDawn.getTime()) / 6e4)
    };
    const blueHourEvening = {
      start: sunset,
      end: civilDusk,
      duration: Math.round((civilDusk.getTime() - sunset.getTime()) / 6e4)
    };
    return {
      goldenHourMorning,
      goldenHourEvening,
      blueHourMorning,
      blueHourEvening
    };
  } catch (error) {
    console.error("\u8BA1\u7B97\u6444\u5F71\u65F6\u673A\u5931\u8D25:", error);
    throw error;
  }
}
function getMoonPhaseName(phase) {
  if (phase < 0.03) return "\u65B0\u6708";
  if (phase < 0.22) return "\u86FE\u7709\u6708";
  if (phase < 0.28) return "\u4E0A\u5F26\u6708";
  if (phase < 0.47) return "\u76C8\u51F8\u6708";
  if (phase < 0.53) return "\u6EE1\u6708";
  if (phase < 0.72) return "\u4E8F\u51F8\u6708";
  if (phase < 0.78) return "\u4E0B\u5F26\u6708";
  if (phase < 0.97) return "\u6B8B\u6708";
  return "\u65B0\u6708";
}
function formatTime(date) {
  if (!date) return "--:--";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// styles/designTokens.js
var Brand = {
  Gold: "#DAA520",
  GoldLight: "#F5D06F",
  GoldDark: "#B8860B"
};
var Surface = {
  Base: "#0A0E17",
  Surface1: "#12182A",
  Surface2: "#1A2238",
  Surface3: "#243050",
  Elevated: "#1E2A45"
};
function goldAlpha(alpha = 1) {
  return `rgba(218, 165, 32, ${alpha})`;
}
function whiteAlpha(alpha = 1) {
  return `rgba(255, 255, 255, ${alpha})`;
}
var Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48
};
var Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999
};
var FontSize = {
  display: 48,
  // 当前温度
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  caption: 13,
  micro: 11
};
var Shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8
  },
  /** 金色焦点卡片光晕 */
  goldGlow: {
    shadowColor: Brand.Gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  }
};
var CardStyle = {
  backgroundColor: Surface.Surface1,
  borderRadius: Radius.lg,
  padding: Spacing.lg,
  borderWidth: 1,
  borderColor: whiteAlpha(0.06),
  ...Shadow.card
};
var GlassCardStyle = {
  backgroundColor: "rgba(18, 24, 42, 0.75)",
  // Surface1 75% 透明度
  borderRadius: Radius.lg,
  borderWidth: 0.5,
  borderColor: whiteAlpha(0.1),
  padding: Spacing.md
};
var ButtonStyle = {
  primary: {
    backgroundColor: Brand.Gold,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 24
  }
};

// __tests__/runner.ts
var tests = [];
var passed = 0;
var failed = 0;
function test(name, fn) {
  tests.push({ name, fn });
}
function assert(condition, msg) {
  if (!condition) throw new Error(`\u274C ${msg}`);
}
function isDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}
test("getSunTimes: \u5317\u4EAC\u590F\u5B63\u8FD4\u56DE\u6709\u6548\u65F6\u95F4", () => {
  const times = getSunTimes(new Date(2026, 5, 15), 39.9042, 116.4074);
  assert(isDate(times.sunrise), "sunrise \u5E94\u662F Date");
  assert(isDate(times.sunset), "sunset \u5E94\u662F Date");
  assert(isDate(times.goldenHour), "goldenHour \u5E94\u662F Date");
  assert(isDate(times.goldenHourEnd), "goldenHourEnd \u5E94\u662F Date");
  assert(times.sunrise.getTime() < times.sunset.getTime(), "\u65E5\u51FA\u5E94\u65E9\u4E8E\u65E5\u843D");
});
test("getSunTimes: \u51AC\u5B63\u65E5\u51FA\u665A\u4E8E\u590F\u5B63", () => {
  const summer = getSunTimes(new Date(2026, 5, 1), 39.9, 116.4);
  const winter = getSunTimes(new Date(2026, 11, 1), 39.9, 116.4);
  assert(winter.sunrise.getTime() > summer.sunrise.getTime(), "\u51AC\u5B63\u65E5\u51FA\u5E94\u665A\u4E8E\u590F\u5B63");
});
test("getSunTimes: \u6781\u5730\u4E0D\u5D29\u6E83", () => {
  let threw = false;
  try {
    getSunTimes(/* @__PURE__ */ new Date(), 78.22, 15.65);
  } catch {
    threw = true;
  }
  assert(!threw, "\u6781\u5730\u4E0D\u5E94\u629B\u5F02\u5E38");
});
test("getSunPosition: \u8FD4\u56DE azimuth/altitude", () => {
  const pos = getSunPosition(/* @__PURE__ */ new Date(), 39.9, 116.4);
  assert(typeof pos.azimuth === "number", "azimuth \u5E94\u4E3A number");
  assert(typeof pos.altitude === "number", "altitude \u5E94\u4E3A number");
});
test("getMoonPhase: \u8FD4\u56DE\u5B8C\u6574\u6570\u636E", () => {
  const phase = getMoonPhase(/* @__PURE__ */ new Date());
  assert(phase.phase >= 0 && phase.phase <= 1, "phase \u5E94\u5728 0-1");
  assert(phase.illumination >= 0 && phase.illumination <= 100, "illumination \u5E94\u5728 0-100");
  assert(typeof phase.phaseName === "string", "phaseName \u5E94\u4E3A string");
});
test("getPhotographyTimes: \u56DB\u7EC4\u65F6\u673A", () => {
  const times = getPhotographyTimes(new Date(2026, 5, 15), 39.9, 116.4);
  assert(isDate(times.goldenHourMorning.start), "goldenHourMorning.start");
  assert(isDate(times.goldenHourMorning.end), "goldenHourMorning.end");
  assert(typeof times.goldenHourMorning.duration === "number", "duration");
  assert(times.goldenHourMorning.start.getTime() <= times.goldenHourMorning.end.getTime(), "start \u2264 end");
});
test("getPhotographyTimes: \u65E9\u665A\u4E0D\u91CD\u53E0", () => {
  let threw = false;
  try {
    const times = getPhotographyTimes(new Date(2026, 5, 15), 39.9, 116.4);
    const morningEnd = times.goldenHourMorning.end.getTime();
    const eveningStart = times.goldenHourEvening.start.getTime();
    assert(Math.abs(eveningStart - morningEnd) < 864e5, "\u65E9\u665A\u4E0D\u8DE8\u5929");
  } catch {
    threw = true;
  }
  assert(!threw, "getPhotographyTimes \u4E0D\u5E94\u629B\u5F02\u5E38");
});
test("getPhotographyTimes: \u6781\u5730\u4E0D\u5D29\u6E83", () => {
  expectDoesNotThrow(() => getPhotographyTimes(/* @__PURE__ */ new Date(), 89, 0));
});
test("formatTime: \u683C\u5F0F\u5316\u6B63\u786E", () => {
  assert(formatTime(new Date(2026, 5, 10, 14, 30)) === "14:30", "HH:MM");
  assert(formatTime(new Date(2026, 5, 10, 0, 5)) === "00:05", "midnight");
  assert(/^\d{2}:\d{2}$/.test(formatTime(/* @__PURE__ */ new Date())), "\u683C\u5F0F\u5339\u914D\u6B63\u5219");
});
test("Brand \u989C\u8272\u662F hex \u683C\u5F0F", () => {
  for (const key of Object.keys(Brand)) {
    assert(/^#[0-9A-Fa-f]{6}$/.test(Brand[key]), `Brand.${key} \u5E94\u662F hex`);
  }
});
test("goldAlpha \u8FD4\u56DE rgba", () => {
  assert(goldAlpha(0.5).includes("rgba(218, 165, 32"), "\u5305\u542B r,g,b");
});
test("\u95F4\u8DDD\u9012\u589E", () => {
  const keys = Object.keys(Spacing);
  for (let i = 1; i < keys.length; i++) {
    assert(Spacing[keys[i]] > Spacing[keys[i - 1]], `${keys[i]} > ${keys[i - 1]}`);
  }
});
test("FontSize display \u6700\u5927", () => {
  const max = Math.max(...Object.values(FontSize));
  assert(FontSize.display === max, "display \u5E94\u4E3A\u6700\u5927\u5B57\u53F7");
});
function expectDoesNotThrow(fn) {
  try {
    fn();
    return;
  } catch (e) {
    throw new Error(`\u671F\u671B\u4E0D\u629B\u5F02\u5E38\u4F46\u629B\u4E86: ${e}`);
  }
}
console.log("\n\u{1F9EA} play-weather-app \u6D4B\u8BD5\u5957\u4EF6\n" + "=".repeat(50));
for (const t of tests) {
  try {
    t.fn();
    passed++;
    console.log(`  \u2705 ${t.name}`);
  } catch (e) {
    failed++;
    console.log(`  \u274C ${t.name}`);
    console.log(`     ${e.message}`);
  }
}
console.log("=".repeat(50));
console.log(`
\u{1F4CA} \u7ED3\u679C: ${passed} \u901A\u8FC7 / ${failed} \u5931\u8D25 / ${tests.length} \u603B\u8BA1`);
if (failed > 0) process.exit(1);
