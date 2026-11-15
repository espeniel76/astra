// 합성 효과음(파일 없음). 사각파 삐뽀 대신 잡음·필터·종소리 배음으로 만든다.
let ctx = null, master = null, on = true;

function audio() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(dur, { freq = 1200, q = 0.8, type = 'bandpass', gain = 0.5, at = 0, decay = dur } = {}) {
  const c = ctx, t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur);
}

// 종소리: 기본음 + 어긋난 배음, 천천히 사라짐
function bell(freq, { gain = 0.25, at = 0, decay = 1.2 } = {}) {
  const c = ctx, t = c.currentTime + at;
  for (const [mul, g0] of [[1, 1], [2.01, 0.45], [3.02, 0.22], [4.17, 0.12]]) {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * mul;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * g0, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay / mul ** 0.3);
    o.connect(g).connect(master); o.start(t); o.stop(t + decay + 0.1);
  }
}

function thump(freq = 110, { gain = 0.6, at = 0, decay = 0.25 } = {}) {
  const c = ctx, t = c.currentTime + at;
  const o = c.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(freq * 2, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + decay);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  o.connect(g).connect(master); o.start(t); o.stop(t + decay + 0.05);
}

const SOUNDS = {
  click: () => noise(0.05, { freq: 2600, q: 2, gain: 0.25 }),
  hit: () => { thump(140, { gain: 0.45, decay: 0.12 }); noise(0.12, { freq: 1800, gain: 0.35, decay: 0.1 }); },
  crit: () => { thump(90, { gain: 0.7, decay: 0.2 }); noise(0.2, { freq: 3200, q: 1.5, gain: 0.45 }); bell(1320, { gain: 0.08, decay: 0.4 }); },
  skill: () => { noise(0.5, { freq: 800, q: 0.6, type: 'lowpass', gain: 0.35, decay: 0.45 }); bell(660, { gain: 0.12, decay: 0.7 }); },
  heal: () => { bell(880, { gain: 0.12 }); bell(1320, { gain: 0.08, at: 0.08 }); },
  death: () => noise(0.4, { freq: 400, type: 'lowpass', gain: 0.4, decay: 0.35 }),
  win: () => [523, 659, 784, 1046].forEach((f, i) => bell(f, { gain: 0.16, at: i * 0.11, decay: 1.4 })),
  lose: () => [392, 330, 262].forEach((f, i) => bell(f, { gain: 0.14, at: i * 0.18, decay: 1.2 })),
  summon: () => { noise(1.2, { freq: 600, q: 0.5, type: 'lowpass', gain: 0.25, decay: 1.1 }); bell(392, { gain: 0.1, decay: 1.6 }); },
  reveal: () => bell(1046, { gain: 0.12, decay: 0.6 }),
  star6: () => { thump(70, { gain: 0.7, decay: 0.6 }); [523, 784, 1046, 1568].forEach((f, i) => bell(f, { gain: 0.14, at: 0.15 + i * 0.09, decay: 2 })); },
  star7: () => { thump(55, { gain: 0.8, decay: 0.9 }); [392, 523, 659, 784, 1046, 1318, 1568].forEach((f, i) => bell(f, { gain: 0.13, at: 0.2 + i * 0.1, decay: 2.6 })); },
};

// 앱이 뒤로 갈 때 소리 장치를 쉬게 한다(src/core/appBridge.js)
export const suspendAudio = () => { try { ctx?.suspend(); } catch { /* 없어도 됨 */ } };
export const resumeAudio = () => { try { if (on) ctx?.resume(); } catch { /* 없어도 됨 */ } };

export const sfx = {
  setOn(v) { on = v; },
  play(name) {
    if (!on) return;
    try { if (audio()) SOUNDS[name]?.(); } catch { /* 소리가 안 나도 게임은 계속 */ }
  },
};
