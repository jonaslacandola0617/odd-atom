// TRANSFERS Ep1: the 2D pictures in the episode, drawn as small pixel canvases (PS1-era UI look):
// the PC (Lumang Tape dashboard, capture window, search result, upload), the paper inserts (waybill,
// card), the wedding on the CRT, and the phone's screen. All deterministic per frame.
import {prng} from '../../psx';

export type Ctx = CanvasRenderingContext2D;

const px = (g: Ctx, size: number) => {
	g.font = `${size}px monospace`;
	g.textBaseline = 'top';
};
const text = (g: Ctx, s: string, x: number, y: number, c: string, size = 8, bold = false) => {
	g.font = `${bold ? 'bold ' : ''}${size}px monospace`;
	g.textBaseline = 'top';
	g.fillStyle = c;
	g.fillText(s, x, y);
};
const win = (g: Ctx, x: number, y: number, w: number, h: number, title: string) => {
	g.fillStyle = '#c3c3bd';
	g.fillRect(x, y, w, h);
	g.fillStyle = '#1d3f7a';
	g.fillRect(x + 1, y + 1, w - 2, 10);
	text(g, title, x + 3, y + 2, '#ffffff', 7, true);
	g.fillStyle = '#c3c3bd';
	g.fillRect(x + w - 10, y + 2, 8, 7);
	g.fillStyle = '#ffffff';
	g.fillRect(x + 1, y + 12, w - 2, h - 13);
};
const desktop = (g: Ctx, W: number, H: number) => {
	g.fillStyle = '#2b5a6a';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#c3c3bd';
	g.fillRect(0, H - 11, W, 11);
	text(g, 'Start', 3, H - 9, '#111', 7, true);
	text(g, '8:14 PM', W - 34, H - 9, '#111', 7);
};
/** CRT-ish finish: scanlines, a little vignette. */
export const crtFinish = (g: Ctx, W: number, H: number, glow = 0.06) => {
	for (let y = 0; y < H; y += 2) {
		g.fillStyle = 'rgba(0,0,0,0.12)';
		g.fillRect(0, y, W, 1);
	}
	const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
	v.addColorStop(0, `rgba(255,255,255,${glow})`);
	v.addColorStop(1, 'rgba(0,0,0,0.45)');
	g.fillStyle = v;
	g.fillRect(0, 0, W, H);
};

export type PcState = 'dashboard' | 'desktop' | 'capture' | 'complete' | 'search' | 'upload' | 'uploaded' | 'off';
/** The PC at 320x180. `t` is seconds into the state, for progress bars and typing. */
export const drawPc = (g: Ctx, state: PcState, t: number, W = 320, H = 180) => {
	if (state === 'off') {
		g.fillStyle = '#050505';
		g.fillRect(0, 0, W, H);
		return;
	}
	desktop(g, W, H);
	if (state === 'dashboard') {
		win(g, 18, 12, 284, 150, 'Lumang Tape - Channel dashboard');
		text(g, 'LUMANG TAPE', 30, 32, '#7a1d1d', 14, true);
		text(g, 'found home videos', 30, 50, '#555', 8);
		g.fillStyle = '#efe9da';
		g.fillRect(30, 68, 120, 44);
		text(g, 'Kita ngayong buwan', 35, 73, '#333', 8);
		text(g, '₱1,840', 35, 87, '#1d5a1d', 16, true);
		g.fillStyle = '#efe9da';
		g.fillRect(160, 68, 128, 44);
		text(g, 'Subscribers', 165, 73, '#333', 8);
		text(g, '212', 165, 87, '#333', 16, true);
		for (let i = 0; i < 4; i++) {
			g.fillStyle = '#ddd';
			g.fillRect(30, 120 + i * 9, 258, 7);
			text(g, ['TAPE 14 - kasal 1996', 'TAPE 13 - binyag', 'TAPE 12 - piyesta', 'TAPE 11 - birthday 1994'][i], 33, 120 + i * 9, '#444', 6);
		}
	} else if (state === 'capture' || state === 'complete') {
		win(g, 26, 18, 268, 140, 'VidCap 2.1 - CAPTURE_001.avi');
		g.fillStyle = '#111';
		g.fillRect(36, 34, 160, 104);
		g.fillStyle = '#3d4a46';
		g.fillRect(40, 38, 152, 96);
		g.fillStyle = '#0a0c0c';
		g.fillRect(58, 52, 22, 52);
		const p = state === 'complete' ? 1 : Math.min(0.98, t / 90);
		text(g, state === 'complete' ? 'COMPLETE' : (Math.floor(t * 2) % 2 ? '● REC' : '  REC'), 204, 38, state === 'complete' ? '#1d5a1d' : '#b01818', 10, true);
		text(g, 'CAPTURE_001', 204, 56, '#222', 8);
		text(g, `${String(Math.floor((t * 1) / 60)).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}`, 204, 70, '#222', 8);
		g.fillStyle = '#999';
		g.fillRect(204, 90, 80, 8);
		g.fillStyle = '#1d3f7a';
		g.fillRect(205, 91, 78 * p, 6);
	} else if (state === 'search') {
		win(g, 10, 8, 300, 158, 'NAWAWALA PA RIN - Group');
		g.fillStyle = '#e6e9ef';
		g.fillRect(14, 22, 292, 12);
		const q = 'Rudy despedida 1991 nawawala';
		text(g, q.slice(0, Math.min(q.length, Math.floor(t * 9))), 18, 24, '#222', 8);
		if (t > 3.5) {
			text(g, 'NAWAWALA PA RIN', 18, 40, '#1d3f7a', 10, true);
			g.fillStyle = '#b8a888';
			g.fillRect(18, 56, 60, 72);
			g.fillStyle = '#5a4a3a';
			g.fillRect(34, 64, 28, 26);
			g.fillStyle = '#b02a2a';
			g.fillRect(28, 92, 40, 30);
			g.fillStyle = '#fff';
			g.fillRect(62, 96, 5, 3); // the price tag on the sleeve
			text(g, 'Rodolfo "Rudy" - hindi nakasakay', 84, 58, '#222', 8, true);
			text(g, 'sa flight niya. Hunyo 1991.', 84, 68, '#222', 8, true);
			text(g, 'Naka-lock ang bahay mula sa loob.', 84, 82, '#333', 8);
			text(g, 'Walang nakakita.', 84, 92, '#333', 8);
			if (t > 6) {
				g.fillStyle = '#f0f2f5';
				g.fillRect(84, 112, 200, 26);
				text(g, 'JoJo  ·  2019', 88, 114, '#1d3f7a', 7, true);
				text(g, 'Tay, uwi ka na.', 88, 125, '#222', 8);
			}
		}
	} else if (state === 'upload' || state === 'uploaded') {
		win(g, 30, 18, 260, 140, 'Lumang Tape - Upload');
		g.fillStyle = '#efe9da';
		g.fillRect(42, 34, 236, 30);
		text(g, 'CAPTURE_001.avi', 50, 44, '#222', 9);
		text(g, 'Title:', 42, 74, '#333', 8);
		g.fillStyle = '#fff';
		g.strokeStyle = '#888';
		g.strokeRect(80, 72, 196, 12);
		const title = 'TAPE 01';
		text(g, title.slice(0, Math.min(title.length, Math.floor(t * 4))), 83, 74, '#111', 8);
		if (state === 'upload') {
			g.fillStyle = '#c3c3bd';
			g.fillRect(196, 120, 80, 18);
			g.strokeStyle = '#333';
			g.strokeRect(196, 120, 80, 18);
			text(g, 'UPLOAD', 214, 124, '#111', 9, true);
			// the cursor hovering over UPLOAD
			const cx = 236 + Math.sin(t * 2) * 2, cy = 130;
			g.fillStyle = '#fff';
			g.beginPath();
			g.moveTo(cx, cy);
			g.lineTo(cx, cy + 10);
			g.lineTo(cx + 3, cy + 7);
			g.lineTo(cx + 7, cy + 7);
			g.closePath();
			g.fill();
			g.strokeStyle = '#000';
			g.stroke();
		} else {
			const p = Math.min(1, t / 2.5);
			g.fillStyle = '#999';
			g.fillRect(42, 100, 236, 8);
			g.fillStyle = '#1d5a1d';
			g.fillRect(43, 101, 234 * p, 6);
			if (p >= 1) {
				text(g, 'Na-upload na', 42, 116, '#1d5a1d', 10, true);
				text(g, `views: ${t > 4 ? 1 : 0}`, 200, 118, '#333', 8);
			}
		}
	} else {
		text(g, 'Recycle Bin', 6, 6, '#fff', 6);
		text(g, 'CAPTURE', 6, 30, '#fff', 6);
	}
	crtFinish(g, W, H);
};

/** The waybill on the soaked box, and the card in the envelope (paper inserts, 320x180). */
export const drawPaper = (g: Ctx, which: 'waybill' | 'card' | 'money', t: number, W = 320, H = 180) => {
	const r = prng(which === 'waybill' ? 3 : 4);
	if (which === 'waybill') {
		g.fillStyle = '#6b4a2c'; // wet cardboard
		g.fillRect(0, 0, W, H);
		for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(30,18,8,${r() * 0.25})`; g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 2, 1); }
		g.fillStyle = '#e8e4d8';
		g.fillRect(60, 30, 200, 120);
		g.fillStyle = 'rgba(200,220,240,0.25)'; // plastic sleeve
		g.fillRect(54, 24, 212, 132);
		text(g, 'PREPAID', 72, 40, '#b01818', 14, true);
		text(g, '9 TAPES - FOR TRANSFER', 72, 62, '#111', 10, true);
		text(g, "TO: NICO'S VIDEO TRANSFER", 72, 86, '#111', 9);
		text(g, 'FROM:', 72, 106, '#111', 9);
		g.fillStyle = '#ccc';
		g.fillRect(110, 116, 120, 1);
		for (let i = 0; i < 30; i++) { // rain beads on the sleeve
			const x = 56 + r() * 206, y = 26 + r() * 128;
			g.fillStyle = 'rgba(255,255,255,0.55)';
			g.fillRect(Math.floor(x), Math.floor(y), 2, 2);
		}
	} else if (which === 'card') {
		g.fillStyle = '#1a1714';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#5b8fd0'; // the blue airmail envelope, red-and-blue border
		g.fillRect(40, 96, 240, 80);
		for (let x = 40; x < 280; x += 12) { g.fillStyle = (x / 12) % 2 ? '#c42424' : '#1d3f9a'; g.fillRect(x, 96, 8, 4); g.fillRect(x + 4, 172, 8, 4); }
		g.fillStyle = '#e9e2cc';
		g.fillRect(70, 22, 180, 86);
		text(g, 'PAKIKOPYA LAHAT.', 86, 42, '#111', 13, true);
		text(g, 'BAYAD NA.', 86, 66, '#111', 13, true);
	} else {
		g.fillStyle = '#2a2420';
		g.fillRect(0, 0, W, H);
		for (let i = 0; i < 9; i++) { // old peso notes, fanned
			const x = 40 + i * 22 + Math.min(1, t / 3) * i * 4, y = 50 + Math.sin(i) * 6;
			g.fillStyle = i % 2 ? '#b9a56a' : '#a99a6e';
			g.fillRect(x, y, 90, 46);
			g.fillStyle = '#6d6440';
			g.fillRect(x + 6, y + 6, 22, 30);
			text(g, '1000', x + 50, y + 6, '#4a4228', 8, true);
		}
	}
};

/** A stranger's wedding on the CRT (Scene 1), a tiny 48x36 picture. */
export const drawWedding = (g: Ctx, f: number) => {
	const r = prng(500 + Math.floor(f / 2));
	g.fillStyle = '#c9b48f';
	g.fillRect(0, 0, 48, 36);
	g.fillStyle = '#e8e2d6';
	g.fillRect(16 + Math.sin(f * 0.03) * 3, 8, 8, 22); // the bride
	g.fillStyle = '#2a2a33';
	g.fillRect(26 + Math.sin(f * 0.03) * 3, 9, 7, 21); // the groom
	g.fillStyle = '#7a5a3a';
	g.fillRect(0, 28, 48, 8);
	for (let i = 0; i < 60; i++) { const v = Math.floor(r() * 255); g.fillStyle = `rgba(${v},${v},${v},0.12)`; g.fillRect(Math.floor(r() * 48), Math.floor(r() * 36), 1, 1); }
	for (let y = 0; y < 36; y += 2) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, y, 48, 1); }
};

/** Blue "no signal" screen after the tape ends. */
export const drawBlue = (g: Ctx, W: number, H: number) => {
	g.fillStyle = '#1730c9';
	g.fillRect(0, 0, W, H);
	px(g, Math.max(6, Math.floor(H / 8)));
	g.fillStyle = '#e8e8f8';
	g.fillText('VIDEO 1', Math.floor(W * 0.08), Math.floor(H * 0.1));
};
