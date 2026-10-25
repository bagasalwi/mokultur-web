// @ts-nocheck -- vendored Moku renderer, typed by renderer.d.ts
// Moku 2.5D renderer (three.js), from the moku-integrasi package (widget/src/moku-renderer.js).
// Local additions: loadMoku() and Moku#dispose(), so the chat panel can load
// the model on demand and free the GPU context when it closes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const EXPRESSIONS = {
  netral:   { eyes: 'open',    brows: 'normal',  mouth: 'smirk', blush: null },
  senang:   { eyes: 'happy',   brows: 'raised',  mouth: 'smile', blush: 'light' },
  berbinar: { eyes: 'sparkle', brows: 'raised',  mouth: 'smile', blush: 'light' },
  wink:     { eyes: 'wink',    brows: 'normal',  mouth: 'cat',   blush: 'light' },
  bangga:   { eyes: 'half',    brows: 'normal',  mouth: 'smirk', blush: null },
  tsundere: { eyes: 'side',    brows: 'angry',   mouth: 'pout',  blush: 'strong' },
  malu:     { eyes: 'down',    brows: 'worried', mouth: 'wavy',  blush: 'strong' },
  kaget:    { eyes: 'wide',    brows: 'raised',  mouth: 'o',     blush: null },
  berpikir: { eyes: 'up',      brows: 'think',   mouth: 'flat',  blush: null },
  kesal:    { eyes: 'glare',   brows: 'angry',   mouth: 'frown', blush: null },
  sedih:    { eyes: 'sad',     brows: 'worried', mouth: 'frown', blush: null },
  lega:     { eyes: 'closed',  brows: 'normal',  mouth: 'smile', blush: 'light' },
};
const BLINKABLE = new Set(['open', 'half', 'wide', 'side', 'down', 'up', 'sad', 'glare', 'sparkle']);
const LAYER = { neck: 0, body: 1, face: 2, blush: 3, mouth: 4, eyes: 5, glass29: 6, hair: 7, lines: 8, brows: 9, hand: 10 };
const DEPTH = { face: 0.85, blush: 0.95, mouth: 1.0, eyes: 1.0, glass29: 1.05, hair: 0.7, lines: 0.95, brows: 1.0 };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = `
uniform vec2 uAngle; uniform float uSway; uniform float uBreath; uniform float uTime;
uniform float uDepth; uniform float uKind; uniform float uSwayAmt;
uniform vec2 uFace; uniform float uChin; uniform float uBodyBottom; uniform float uBodyH;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 px = vec2(wp.x, -wp.y) * 1000.0;
  if (uKind < 0.5) {
    float k = clamp((uBodyBottom - px.y) / uBodyH, 0.0, 1.0);
    wp.y += uBreath * k * 0.0032;
  } else if (uKind < 1.5) {
    vec2 d = px - uFace;
    float f = exp(-dot(d, d) / (340.0 * 340.0));
    vec2 off = uAngle * uDepth * f * 10.0;
    float h = clamp((px.y - (uChin - 225.0)) / 480.0, 0.0, 1.0);
    float side = smoothstep(170.0, 260.0, abs(px.x - (uFace.x - 10.0)));
    off.x += uSwayAmt * side * pow(h, 1.4) * (uSway * 14.0 + sin(uTime * 1.3 + px.y * 0.012) * 1.4);
    wp.x += off.x * 0.001; wp.y += off.y * 0.001;
  }
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = `
uniform sampler2D uMap; varying vec2 vUv;
void main(){ vec4 c = texture2D(uMap, vUv); if (c.a < 0.003) discard; gl_FragColor = c;
#include <colorspace_fragment>
}`;

export class Moku {
  constructor(canvas, gltf, frame) {
    this.canvas = canvas; this.frame = frame;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    const [x0, y0, x1, y1] = frame;
    this.camera = new THREE.OrthographicCamera(x0 / 1000, x1 / 1000, -y0 / 1000, -y1 / 1000, -10, 10);
    this.root = gltf.scene; this.scene.add(this.root);
    const meta = (gltf.scene.getObjectByName('Moku') || gltf.scene).userData || {};
    const sh = meta.shader || { faceCenter: [925, 640], chinY: 985, bodyBottom: 1338, bodyTop: 682 };
    this.u = { uAngle: { value: new THREE.Vector2() }, uSway: { value: 0 }, uBreath: { value: 0 }, uTime: { value: 0 },
      uFace: { value: new THREE.Vector2(...sh.faceCenter) }, uChin: { value: sh.chinY }, uBodyBottom: { value: sh.bodyBottom }, uBodyH: { value: sh.bodyBottom - sh.bodyTop } };
    this.face = this.root.getObjectByName('Face');
    this.head = this.root.getObjectByName('Head_Pivot');
    this.hand = this.root.getObjectByName('Hand_Pivot');
    this.body = this.root.getObjectByName('Body_Pivot');
    this.rest = {};
    for (const n of [this.head, this.hand, this.body]) this.rest[n.name] = { p: n.position.clone(), q: n.quaternion.clone(), s: n.scale.clone() };
    this.root.traverse((o) => {
      if (!o.isMesh) return;
      const key = o.name.split('_')[0];
      const layer = LAYER[key] ?? LAYER[o.name] ?? 5;
      const kind = (key === 'body' || key === 'neck') ? 0 : key === 'hand' ? 3 : 1;
      o.material = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...this.u, uMap: { value: o.material.map }, uDepth: { value: DEPTH[key] ?? DEPTH[o.name] ?? 1 }, uKind: { value: kind },
          uSwayAmt: { value: (key === 'hair' || key === 'lines') ? 1 : 0 } },
      });
      o.renderOrder = layer * 10; o.frustumCulled = false;
    });
    for (const m of this.face.children) m.scale.setScalar(1);
    this.mixer = new THREE.AnimationMixer(this.root);
    this.clips = {};
    for (const c of gltf.animations) {
      const body = c.tracks.filter((t) => /^(Head_Pivot|Hand_Pivot|Body_Pivot)\./.test(t.name));
      this.clips[c.name] = new THREE.AnimationClip(c.name, c.duration, body);
    }
    this.expr = 'netral'; this.blinkEyes = null; this.talkMouth = null; this.tempExpr = null;
    this.angle = new THREE.Vector2(); this.target = new THREE.Vector2(); this.sway = 0; this.swayV = 0;
    this.nextBlink = 1.5 + Math.random() * 2; this.talkUntil = 0; this.nextMouth = 0;
    this.t = 0; this.follow = true;
    this.applyFace();
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    const [x0, y0, x1, y1] = this.frame;
    const fw = x1 - x0, fh = y1 - y0, ca = r.width / r.height, fa = fw / fh;
    let L = x0, R = x1, T = y0, B = y1;
    if (ca > fa) { const w = fh * ca, cx = (x0 + x1) / 2; L = cx - w / 2; R = cx + w / 2; }
    else { const h = fw / ca; T = y1 - h; }
    Object.assign(this.camera, { left: L / 1000, right: R / 1000, top: -T / 1000, bottom: -B / 1000 });
    this.camera.updateProjectionMatrix();
  }
  setExpression(name) { this.expr = name; this.tempExpr = null; this.applyFace(); }
  flash(name, seconds) { this.tempExpr = { name, until: this.t + seconds }; this.applyFace(); }
  current() { return this.tempExpr ? this.tempExpr.name : this.expr; }
  applyFace() {
    const ex = EXPRESSIONS[this.current()];
    const st = { eyes: this.blinkEyes || ex.eyes, brows: ex.brows, mouth: this.talkMouth || ex.mouth, blush: ex.blush };
    for (const m of this.face.children) {
      const [cat, ...rest] = m.name.split('_'); const s = rest.join('_');
      m.visible = st[cat] === s;
    }
  }
  play(name) {
    if (name === 'Blink') { this.blink(); return; }
    if (name === 'Talk') { this.talk(2.2); return; }
    const clip = this.clips[name]; if (!clip) return;
    const a = this.mixer.clipAction(clip);
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.play();
    if (name === 'Wave' || name === 'FingerHeart') this.flash(name === 'Wave' ? 'senang' : 'wink', clip.duration - 0.2);
  }
  talk(seconds) { this.talkUntil = this.t + seconds; }
  blink() { this.blinkStart = this.t; }
  update(dt) {
    this.t += dt; const t = this.t;
    // expression timers
    if (this.tempExpr && t > this.tempExpr.until) { this.tempExpr = null; }
    // blink: half -> closed -> half
    const eyes = EXPRESSIONS[this.current()].eyes;
    if (t > this.nextBlink && this.blinkStart === undefined) { this.blinkStart = t; this.nextBlink = t + 2.4 + Math.random() * 3.6; }
    let be = null;
    if (this.blinkStart !== undefined) {
      const k = t - this.blinkStart;
      if (BLINKABLE.has(eyes)) be = k < 0.05 ? 'half' : k < 0.13 ? 'closed' : k < 0.19 ? 'half' : null;
      if (k >= 0.19) this.blinkStart = undefined;
    }
    this.blinkEyes = be;
    // talking mouth flaps
    if (t < this.talkUntil) {
      if (t > this.nextMouth) {
        const opts = ['talk_a', 'talk_e', 'talk_o', 'talk_a', 'smirk'];
        let m; do { m = opts[(Math.random() * opts.length) | 0]; } while (m === this.talkMouth);
        this.talkMouth = m; this.nextMouth = t + 0.08 + Math.random() * 0.1;
      }
    } else this.talkMouth = null;
    this.applyFace();
    // head angle: pointer target + idle drift
    const drift = reduceMotion ? new THREE.Vector2() : new THREE.Vector2(Math.sin(t * 0.37) * 0.22 + Math.sin(t * 0.91) * 0.06, Math.cos(t * 0.29) * 0.14);
    const tgt = (this.follow && !reduceMotion ? this.target.clone() : new THREE.Vector2()).add(drift);
    if (t < this.talkUntil) tgt.y += Math.sin(t * 9) * 0.08;
    const prevX = this.angle.x;
    this.angle.lerp(tgt, Math.min(1, dt * 3.5));
    // hair sway: damped spring driven by head motion
    const force = -(this.angle.x - prevX) / Math.max(dt, 1e-3) * 0.35;
    this.swayV += (-28 * this.sway - 5 * this.swayV + force * 28) * dt;
    this.sway += this.swayV * dt;
    this.sway = Math.max(-1.2, Math.min(1.2, this.sway));
    const breath = reduceMotion ? 0 : (Math.sin(t * Math.PI * 2 / 4.2) * 0.5 + 0.5);
    this.u.uAngle.value.copy(this.angle); this.u.uSway.value = this.sway; this.u.uBreath.value = breath; this.u.uTime.value = t;
    // node transforms: rest -> clips -> procedural extras
    // undo last frame's procedural extras so the mixer (which only writes changed values) stays authoritative
    if (this.base) { this.head.position.copy(this.base.p); this.head.quaternion.copy(this.base.q); }
    this.mixer.update(dt);
    this.base = { p: this.head.position.clone(), q: this.head.quaternion.clone() };
    this.head.position.y += breath * 0.0035;
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -this.angle.x * 0.035 + this.sway * 0.004);
    this.head.quaternion.multiply(roll);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.mixer.stopAllAction();
    this.root.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry?.dispose();
      o.material?.uniforms?.uMap?.value?.dispose();
      o.material?.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

/** Fetches the .glb and puts Moku on `canvas`, framed on `frame` ([x0, y0, x1, y1] in illustration px). */
export async function loadMoku(canvas, url, frame) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Moku model: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const gltf = await new Promise((ok, fail) => new GLTFLoader().parse(buf, '', ok, fail));
  return new Moku(canvas, gltf, frame);
}

