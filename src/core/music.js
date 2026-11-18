// 배경음악(2026-11-18): 파일 없이 합성. 뿅뿅 소리(사각파) 대신 부드러운 바탕 화음·튕기는 소리·종소리·북.
// 곡마다 8마디를 반복한다. 마디 단위로 조금 앞서서 미리 예약해 두는 방식(끊김 없이).
//   town   마을·메뉴: 라장조, 느긋하게
//   battle 전투: 가단조, 북과 함께 힘차게
//   boss   보스·대전: 라단조, 더 무겁고 빠르게
//   summon 소환: 신비로운 화음 + 반짝이는 종
import { audioOut } from './sfx.js';

// 'D5' → 주파수
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function hz(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  const midi = (+m[3] + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

// ── 악기(모두 at 초에 시작) ──
function env(ctx, g, at, peak, attack, hold, release) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  return at + attack + hold + release;
}
// 바탕 화음: 살짝 어긋난 톱니파 두 겹을 부드럽게 거른다
function pad(ctx, out, notes, at, dur, vol = 0.05, cutoff = 1400) {
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.3;
  const g = ctx.createGain(); f.connect(g).connect(out);
  const end = env(ctx, g, at, vol, dur * 0.25, dur * 0.5, dur * 0.4);
  for (const n of notes) for (const det of [-7, 7]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det;
    const og = ctx.createGain(); og.gain.value = 1 / (notes.length * 2);
    o.connect(og).connect(f); o.start(at); o.stop(end + 0.05);
  }
}
// 튕기는 소리(하프·기타 같은): 삼각파가 빠르게 사라짐
function pluck(ctx, out, note, at, vol = 0.07, decay = 0.5) {
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(note);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, at); f.frequency.exponentialRampToValueAtTime(700, at + decay);
  const g = ctx.createGain(); o.connect(f).connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.005, 0, decay);
  o.start(at); o.stop(end + 0.05);
}
// 종소리: 기본음 + 어긋난 배음
function bell(ctx, out, note, at, vol = 0.05, decay = 1.6) {
  for (const [mul, v] of [[1, 1], [2.01, 0.4], [3.02, 0.18]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(note) * mul;
    const g = ctx.createGain(); o.connect(g).connect(out);
    const end = env(ctx, g, at, vol * v, 0.01, 0, decay / mul ** 0.4);
    o.start(at); o.stop(end + 0.05);
  }
}
// 낮은 소리
function bass(ctx, out, note, at, dur, vol = 0.11, grit = false) {
  const o = ctx.createOscillator(); o.type = grit ? 'sawtooth' : 'triangle'; o.frequency.value = hz(note);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = grit ? 420 : 900;
  const g = ctx.createGain(); o.connect(f).connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.01, dur * 0.55, dur * 0.35);
  o.start(at); o.stop(end + 0.05);
}
// 앞소리(금관 같은): 톱니파에 살짝 늦게 열리는 거르개
function lead(ctx, out, note, at, dur, vol = 0.045) {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(note);
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(note) * 2;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, at); f.frequency.linearRampToValueAtTime(2000, at + 0.08); f.Q.value = 1;
  const g = ctx.createGain(); o.connect(f); o2.connect(f); f.connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.03, dur * 0.6, dur * 0.35);
  o.start(at); o2.start(at); o.stop(end + 0.05); o2.stop(end + 0.05);
}
let noiseBuf = null;
function noise(ctx, out, at, { freq, type = 'highpass', vol, decay }) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = ctx.createGain(); src.connect(f).connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.002, 0, decay);
  src.start(at); src.stop(end + 0.05);
}
const kick = (ctx, out, at, vol = 0.32) => {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(130, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.18);
  const g = ctx.createGain(); o.connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.004, 0.02, 0.22);
  o.start(at); o.stop(end + 0.05);
};
const snare = (ctx, out, at, vol = 0.09) => { noise(ctx, out, at, { freq: 1800, type: 'bandpass', vol, decay: 0.16 }); };
const hat = (ctx, out, at, vol = 0.025) => { noise(ctx, out, at, { freq: 7000, vol, decay: 0.05 }); };
const tom = (ctx, out, at, note, vol = 0.14) => {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(hz(note) * 1.6, at); o.frequency.exponentialRampToValueAtTime(hz(note), at + 0.12);
  const g = ctx.createGain(); o.connect(g).connect(out);
  const end = env(ctx, g, at, vol, 0.004, 0.02, 0.3);
  o.start(at); o.stop(end + 0.05);
};

// ── 곡 ── chords: 마디마다 [바탕 화음 음들, 낮은 음], mel: 마디마다 [[음, 박자 수]…](없으면 쉼)
const TRACKS = {
  town: {
    bpm: 88, vol: 1.3,
    chords: [
      [['D4', 'F#4', 'A4'], 'D2'], [['C#4', 'E4', 'A4'], 'A1'], [['B3', 'D4', 'F#4'], 'B1'], [['B3', 'D4', 'G4'], 'G1'],
      [['D4', 'F#4', 'A4'], 'D2'], [['B3', 'D4', 'G4'], 'G1'], [['B3', 'E4', 'G4'], 'E2'], [['C#4', 'E4', 'A4'], 'A1'],
    ],
    mel: [
      [['F#5', 2], ['E5', 1], ['D5', 1]], [['E5', 2], ['C#5', 1], ['A4', 1]], [['D5', 1], ['F#5', 1], ['B5', 2]], [['A5', 3], ['G5', 1]],
      [['F#5', 2], ['A5', 1], ['D6', 1]], [['B5', 2], ['G5', 1], ['B5', 1]], [['A5', 1], ['G5', 1], ['F#5', 1], ['E5', 1]], [['E5', 4]],
    ],
    bar(ctx, out, i, t, beat) {
      const [notes, low] = this.chords[i];
      pad(ctx, out, notes, t, beat * 4, 0.045);
      bass(ctx, out, low, t, beat * 2, 0.09); bass(ctx, out, low, t + beat * 2, beat * 2, 0.07);
      // 8분음표 펼친 화음(1-5-8-5-10-5-8-5)
      const arp = [notes[0], notes[2], up(notes[0]), notes[2], up(notes[1]), notes[2], up(notes[0]), notes[2]];
      arp.forEach((n, k) => pluck(ctx, out, n, t + k * beat / 2, k % 2 ? 0.035 : 0.05, 0.6));
      let b = 0;
      for (const [n, len] of this.mel[i]) { bell(ctx, out, n, t + b * beat, 0.05, Math.min(2.4, len * beat * 1.4)); b += len; }
    },
  },
  battle: {
    bpm: 126, vol: 0.9,
    chords: [
      [['A3', 'C4', 'E4'], 'A1'], [['A3', 'C4', 'F4'], 'F1'], [['G3', 'C4', 'E4'], 'C2'], [['G3', 'B3', 'D4'], 'G1'],
      [['A3', 'C4', 'E4'], 'A1'], [['A3', 'C4', 'F4'], 'F1'], [['G3', 'B3', 'D4'], 'G1'], [['G#3', 'B3', 'E4'], 'E1'],
    ],
    mel: [
      [['A4', 1], ['C5', 1], ['E5', 1.5], ['D5', 0.5]], [['C5', 2], ['A4', 2]], [['G4', 1], ['C5', 1], ['E5', 1], ['G5', 1]], [['F5', 2], ['D5', 2]],
      [['E5', 1], ['A5', 1], ['G5', 1.5], ['E5', 0.5]], [['F5', 1], ['E5', 1], ['C5', 2]], [['D5', 1], ['B4', 1], ['G4', 1], ['B4', 1]], [['E5', 3], ['G#4', 1]],
    ],
    bar(ctx, out, i, t, beat) {
      const [notes, low] = this.chords[i];
      pad(ctx, out, notes, t, beat * 4, 0.03, 1100);
      for (let k = 0; k < 8; k++) bass(ctx, out, k % 4 === 3 ? up(low) : low, t + k * beat / 2, beat / 2, 0.09, true);
      for (let k = 0; k < 4; k++) {
        kick(ctx, out, t + k * beat, k % 2 ? 0.2 : 0.3);
        if (k % 2) snare(ctx, out, t + k * beat);
      }
      for (let k = 0; k < 8; k++) hat(ctx, out, t + k * beat / 2, k % 2 ? 0.018 : 0.028);
      const arp = [notes[0], notes[1], notes[2], up(notes[0])];
      for (let k = 0; k < 8; k++) pluck(ctx, out, up(arp[k % 4]), t + k * beat / 2, 0.028, 0.25);
      if (i % 2 === 1 || i === 4) { let b = 0; for (const [n, len] of this.mel[i]) { lead(ctx, out, n, t + b * beat, len * beat); b += len; } }
      else { let b = 0; for (const [n, len] of this.mel[i]) { lead(ctx, out, n, t + b * beat, len * beat, 0.035); b += len; } }
    },
  },
  boss: {
    bpm: 132, vol: 0.9,
    chords: [
      [['D3', 'F3', 'A3'], 'D2'], [['D3', 'F3', 'Bb3'], 'Bb1'], [['D3', 'G3', 'Bb3'], 'G1'], [['C#3', 'E3', 'A3'], 'A1'],
      [['D3', 'F3', 'A3'], 'D2'], [['C3', 'F3', 'A3'], 'F1'], [['D3', 'G3', 'Bb3'], 'G1'], [['C#3', 'E3', 'A3'], 'A1'],
    ],
    mel: [
      [['D5', 1.5], ['F5', 0.5], ['A5', 2]], [['Bb5', 1], ['A5', 1], ['F5', 2]], [['G5', 1.5], ['Bb5', 0.5], ['D6', 2]], [['C#6', 2], ['A5', 2]],
      [['D6', 1], ['C6', 1], ['A5', 1], ['F5', 1]], [['C6', 1.5], ['A5', 0.5], ['F5', 2]], [['G5', 1], ['A5', 1], ['Bb5', 1], ['D6', 1]], [['C#6', 3], ['E5', 1]],
    ],
    bar(ctx, out, i, t, beat) {
      const [notes, low] = this.chords[i];
      pad(ctx, out, notes.map(up), t, beat * 4, 0.035, 900);
      for (let k = 0; k < 8; k++) bass(ctx, out, k % 2 ? up(low) : low, t + k * beat / 2, beat / 2, 0.1, true);
      for (let k = 0; k < 4; k++) { kick(ctx, out, t + k * beat, 0.32); if (k % 2) snare(ctx, out, t + k * beat, 0.11); }
      kick(ctx, out, t + 3.5 * beat, 0.22);
      for (let k = 0; k < 16; k++) hat(ctx, out, t + k * beat / 4, k % 4 === 2 ? 0.03 : 0.014);
      if (i === 3 || i === 7) ['A2', 'F2', 'D2', 'A1'].forEach((n, k) => tom(ctx, out, t + (2 + k * 0.5) * beat, n));
      let b = 0;
      for (const [n, len] of this.mel[i]) { lead(ctx, out, n, t + b * beat, len * beat, 0.04); b += len; }
    },
  },
  summon: {
    bpm: 72, vol: 1.2,
    chords: [
      [['F3', 'A3', 'C4', 'E4'], 'F1'], [['E3', 'G3', 'B3', 'D4'], 'E1'], [['D3', 'F3', 'A3', 'E4'], 'D1'], [['C3', 'E3', 'G3', 'B3'], 'C2'],
      [['F3', 'A3', 'C4', 'E4'], 'F1'], [['E3', 'G3', 'B3', 'D4'], 'E1'], [['D3', 'F3', 'A3', 'C4'], 'D1'], [['E3', 'G#3', 'B3', 'D4'], 'E1'],
    ],
    sparkle: ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'E6', 'G6'],
    bar(ctx, out, i, t, beat) {
      const [notes, low] = this.chords[i];
      pad(ctx, out, notes, t, beat * 4.2, 0.05, 1600);
      bass(ctx, out, low, t, beat * 4, 0.06);
      for (let k = 0; k < 4; k++) bell(ctx, out, this.sparkle[(i * 3 + k * 5) % this.sparkle.length], t + (k + (k % 2) * 0.5) * beat, 0.025, 2.2);
    },
  },
};
const up = n => n.replace(/-?\d$/, d => String(+d + 1)); // 한 옥타브 위

// ── 재생 ──
let on = true, want = null, cur = null, timer = null;
const MASTER = 0.42;

function start(name) {
  const a = audioOut();
  if (!a || a.ctx.state !== 'running') return false;
  const { ctx, out } = a;
  const tr = TRACKS[name];
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(MASTER * tr.vol, ctx.currentTime + 1.2); // 천천히 커짐
  gain.connect(out);
  cur = { name, tr, gain, ctx, bar: 0, next: ctx.currentTime + 0.1 };
  return true;
}
function stopCur() {
  if (!cur) return;
  const { gain, ctx } = cur;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9); // 천천히 작아짐
  setTimeout(() => gain.disconnect(), 1200);
  cur = null;
}
function tick() {
  if (!cur) { if (on && want) start(want); return; }
  const { ctx, tr } = cur;
  const beat = 60 / tr.bpm;
  while (cur.next < ctx.currentTime + 0.6) {
    if (cur.next < ctx.currentTime - 0.5) cur.next = ctx.currentTime + 0.05; // 오래 멈췄다 돌아오면 지금부터
    tr.bar(ctx, cur.gain, cur.bar, cur.next, beat);
    cur.next += beat * 4;
    cur.bar = (cur.bar + 1) % tr.chords.length;
  }
}

export const music = {
  // 이 곡을 틀어 둔다(같은 곡이면 그대로). 소리 장치가 아직 잠겨 있으면 처음 화면을 누를 때 시작
  play(name) {
    want = name;
    if (!on) return;
    if (cur?.name === name) return;
    stopCur();
    if (!timer) timer = setInterval(tick, 120);
    start(name);
  },
  setOn(v) {
    on = v;
    if (!on) stopCur();
    else if (want) music.play(want);
  },
};

// 브라우저는 누르기 전에는 소리를 못 낸다: 첫 터치에 시작
if (typeof window !== 'undefined') {
  const unlock = () => { audioOut(); if (on && want && !cur) start(want); };
  window.addEventListener('pointerdown', unlock, { passive: true });
  // 다른 탭·앱으로 가면 쉬고, 돌아오면 이어서(지난 마디는 건너뜀)
  document.addEventListener('visibilitychange', () => {
    const a = cur?.ctx;
    if (!a) return;
    if (document.hidden) a.suspend?.(); else a.resume?.();
  });
}
export const TRACK_NAMES = Object.keys(TRACKS);
// 검사용: 곡 하나를 주어진 오디오 장치에 처음부터 끝까지 예약(scripts/music-check)
export function renderTrack(ctx, out, name) {
  const tr = TRACKS[name], beat = 60 / tr.bpm;
  for (let i = 0; i < tr.chords.length; i++) tr.bar(ctx, out, i, 0.05 + i * beat * 4, beat);
  return 0.05 + tr.chords.length * beat * 4;
}
