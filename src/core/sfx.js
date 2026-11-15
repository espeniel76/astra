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

// 부드럽게 부풀었다 사라지는 화음(합창 같은 바탕음): 살짝 어긋난 톱니파 두 겹 + 저역 필터
function pad(freqs, { gain = 0.08, at = 0, attack = 1.2, hold = 1.5, release = 2, cutoff = 1800 } = {}) {
  const c = ctx, t = c.currentTime + at, end = t + attack + hold + release;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + attack + hold); g.gain.exponentialRampToValueAtTime(0.0001, end);
  f.connect(g).connect(master);
  for (const fr of freqs) {
    for (const det of [-8, 8]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det;
      const og = c.createGain(); og.gain.value = 1 / (freqs.length * 2);
      o.connect(og).connect(f); o.start(t); o.stop(end + 0.1);
    }
  }
}

// 휘이익 올라가는(또는 내려가는) 바람 소리
function sweep(dur, { from = 300, to = 4000, gain = 0.2, at = 0, q = 3 } = {}) {
  const c = ctx, t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur);
}

// 아스트라(근원) 전용 음계: 라(D) 장조 오음음계. 모든 별이 하나로 모이는 느낌으로 위로 쌓인다
const ORIGIN_NOTES = [587, 659, 740, 880, 988, 1175, 1319, 1480, 1760, 1976, 2349];

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

  // ── 아스트라(근원) 전용 효과음 ──
  // 빛 한 점의 고동: 아주 낮은 두근(쿵-쿵) + 숨결 같은 낮은 울림
  originHeart: () => {
    thump(46, { gain: 0.95, decay: 0.55 }); thump(52, { gain: 0.6, at: 0.24, decay: 0.45 });
    pad([73.4, 110], { gain: 0.12, attack: 0.3, hold: 0.2, release: 1.2, cutoff: 400 });
  },
  // 일곱 별 영웅의 그림자가 나타날 때: 깊고 넓게 깔리는 합창
  originDrone: () => pad([73.4, 110, 146.8, 220], { gain: 0.22, attack: 1.6, hold: 2.6, release: 2.4, cutoff: 900 }),
  // 그림자 하나가 빛이 되어 빨려 들 때: 휘익 + 점점 높아지는 맑은 종(i번째)
  originAbsorb: (i = 0) => {
    sweep(0.45, { from: 2600, to: 380, gain: 0.16, q: 4 });
    bell(ORIGIN_NOTES[Math.min(i, ORIGIN_NOTES.length - 1)], { gain: 0.13, at: 0.4, decay: 1.6 });
  },
  // 태초의 폭발: 땅이 울리는 큰 쿵 + 길게 구르는 울림 + 반짝이는 빛 소리 + 크게 부푸는 장조 화음
  originBang: () => {
    sweep(0.9, { from: 120, to: 3000, gain: 0.22, q: 1.2 });
    thump(38, { gain: 1, at: 0.85, decay: 1.8 });
    noise(3.2, { freq: 220, q: 0.4, type: 'lowpass', gain: 0.4, at: 0.85, decay: 3.1 });
    noise(2.4, { freq: 6000, q: 0.7, type: 'highpass', gain: 0.07, at: 0.9, decay: 2.3 });
    pad([146.8, 220, 293.7, 370, 440, 587], { gain: 0.11, at: 0.9, attack: 0.9, hold: 2.4, release: 3, cutoff: 2600 });
    [587, 880, 1175, 1760, 2349].forEach((f, i) => bell(f, { gain: 0.1, at: 1 + i * 0.06, decay: 3 }));
  },
  // 아스트라가 내려올 때: 아래에서 위로 쓸어 올리는 하프 같은 종소리 + 높은 합창
  originDescend: () => {
    ORIGIN_NOTES.forEach((f, i) => bell(f / 2, { gain: 0.09, at: i * 0.075, decay: 1.8 }));
    ORIGIN_NOTES.forEach((f, i) => bell(f, { gain: 0.06, at: 0.85 + i * 0.06, decay: 2.2 }));
    pad([293.7, 370, 440, 587, 740], { gain: 0.08, attack: 1.4, hold: 1.6, release: 2.4, cutoff: 3000 });
  },
  // ORIGIN 글자가 나올 때: 웅장한 마무리 화음(여러 옥타브 종 + 바탕 화음 + 낮은 쿵)
  originTitle: () => {
    thump(44, { gain: 0.8, decay: 1.2 });
    [146.8, 293.7, 440, 587, 740, 880, 1175, 1480].forEach((f, i) => bell(f, { gain: 0.11, at: i * 0.03, decay: 3.4 }));
    pad([73.4, 146.8, 220, 293.7, 370], { gain: 0.1, attack: 0.4, hold: 1.8, release: 3.2, cutoff: 2200 });
  },
  // 아스트라 카드가 뒤집힐 때(일반 ★7 대신)
  originCard: () => {
    thump(50, { gain: 0.85, decay: 1 });
    [587, 740, 880, 1175, 1480, 1760, 2349].forEach((f, i) => bell(f, { gain: 0.12, at: 0.15 + i * 0.08, decay: 2.8 }));
  },
};

// 앱이 뒤로 갈 때 소리 장치를 쉬게 한다(src/core/appBridge.js)
export const suspendAudio = () => { try { ctx?.suspend(); } catch { /* 없어도 됨 */ } };
export const resumeAudio = () => { try { if (on) ctx?.resume(); } catch { /* 없어도 됨 */ } };

export const sfx = {
  setOn(v) { on = v; },
  play(name, arg) {
    if (!on) return;
    try { if (audio()) SOUNDS[name]?.(arg); } catch { /* 소리가 안 나도 게임은 계속 */ }
  },
};
