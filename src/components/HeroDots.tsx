import { useEffect, useRef } from "react";

type Hub = {
  lat: number;
  lon: number;
  tier: 1 | 2 | 3;
  phase: number;
};

type ScreenHub = Hub & {
  x: number;
  y: number;
};

type RoutePulse = {
  target: number;
  progress: number;
  speed: number;
  outward: boolean;
};

const globalHubs: Omit<Hub, "phase">[] = [
  { lat: 24.7136, lon: 46.6753, tier: 1 }, // Riyadh
  { lat: 21.4858, lon: 39.1925, tier: 2 }, // Jeddah
  { lat: 25.2048, lon: 55.2708, tier: 2 }, // Dubai
  { lat: 30.0444, lon: 31.2357, tier: 2 }, // Cairo
  { lat: 41.0082, lon: 28.9784, tier: 2 }, // Istanbul
  { lat: 51.5072, lon: -0.1276, tier: 2 }, // London
  { lat: 48.8566, lon: 2.3522, tier: 3 }, // Paris
  { lat: -1.2921, lon: 36.8219, tier: 3 }, // Nairobi
  { lat: 19.076, lon: 72.8777, tier: 2 }, // Mumbai
  { lat: 1.3521, lon: 103.8198, tier: 2 }, // Singapore
  { lat: 35.6762, lon: 139.6503, tier: 3 }, // Tokyo
  { lat: 40.7128, lon: -74.006, tier: 2 }, // New York
  { lat: -23.5505, lon: -46.6333, tier: 3 }, // Sao Paulo
];

// Simplified line-art geography keeps the hero light, legible, and responsive.
const continentPaths: Array<Array<[number, number]>> = [
  [[-168, 72], [-140, 70], [-125, 58], [-105, 52], [-95, 42], [-82, 25], [-98, 18], [-115, 28], [-130, 43], [-155, 52], [-168, 72]],
  [[-82, 12], [-62, 8], [-52, -8], [-58, -28], [-70, -55], [-79, -38], [-88, -10], [-82, 12]],
  [[-12, 36], [8, 58], [34, 70], [76, 67], [112, 56], [146, 48], [170, 35], [146, 18], [120, 8], [92, 22], [62, 8], [42, 28], [18, 12], [-2, 20], [-12, 36]],
  [[-18, 35], [4, 36], [28, 28], [42, 8], [32, -18], [16, -35], [-4, -30], [-17, -6], [-18, 35]],
  [[112, -10], [150, -12], [155, -28], [135, -40], [114, -30], [112, -10]],
];

const saudiOutline: Array<[number, number]> = [
  [34.6, 29.2], [39.0, 32.2], [46.8, 32.0], [50.2, 26.0], [55.7, 25.8], [55.2, 20.0], [51.0, 16.4], [47.0, 16.0], [42.8, 17.4], [39.2, 20.5], [36.5, 22.5], [34.6, 29.2],
];

export function HeroDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const hubs: Hub[] = globalHubs.map((hub) => ({ ...hub, phase: Math.random() * Math.PI * 2 }));
    const pointer = { x: 0, y: 0, active: false, strength: 0, type: "mouse" };
    let width = 0;
    let height = 0;
    let screenHubs: ScreenHub[] = [];
    let pulses: RoutePulse[] = [];
    let raf = 0;
    let lastTime = performance.now();
    let nextPulse = 0;
    let hovered = -1;

    const project = (hub: Hub, time = 0): ScreenHub => {
      const worldX = (hub.lon + 180) / 360;
      const worldY = (90 - hub.lat) / 180;
      const mobile = width < 600;
      const left = mobile ? 0.02 : 0.12;
      const usableWidth = mobile ? 0.96 : 0.86;
      const x = width * (left + worldX * usableWidth);
      const y = height * (0.05 + worldY * 0.9);
      const drift = reducedMotion ? 0 : hub.tier === 1 ? 0 : 1.8;
      return {
        ...hub,
        x: x + Math.sin(time * 0.00032 + hub.phase) * drift,
        y: y + Math.cos(time * 0.00027 + hub.phase) * drift,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      screenHubs = hubs.map((hub) => project(hub));
    };

    const controlPoint = (from: ScreenHub, to: ScreenHub, targetIndex: number) => {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const direction = targetIndex % 2 === 0 ? 1 : -1;
      const arc = Math.min(82, distance * 0.19) * direction;
      let x = midX - (dy / distance) * arc;
      let y = midY + (dx / distance) * arc;

      if (pointer.active && targetIndex === hovered && pointer.type === "mouse") {
        x += (pointer.x - x) * 0.22 * pointer.strength;
        y += (pointer.y - y) * 0.22 * pointer.strength;
      }
      return { x, y };
    };

    const bezierPoint = (from: ScreenHub, control: { x: number; y: number }, to: ScreenHub, t: number) => {
      const inv = 1 - t;
      return {
        x: inv * inv * from.x + 2 * inv * t * control.x + t * t * to.x,
        y: inv * inv * from.y + 2 * inv * t * control.y + t * t * to.y,
      };
    };

    const spawnPulse = (target?: number, outward = true) => {
      const destination = target && target > 0 ? target : 1 + Math.floor(Math.random() * (hubs.length - 1));
      if (pulses.length < (width < 600 ? 7 : 12)) {
        pulses.push({
          target: destination,
          progress: 0,
          speed: 0.00028 + Math.random() * 0.0002,
          outward,
        });
      }
    };

    const pointFromEvent = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointFromEvent(event);
      const inside = point.x >= 0 && point.x <= point.rect.width && point.y >= 0 && point.y <= point.rect.height;
      if (!inside) {
        if (event.pointerType === "mouse") pointer.active = false;
        return;
      }
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.type = event.pointerType;
      pointer.active = true;
      pointer.strength = event.pointerType === "mouse" ? 1 : 0.7;
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = pointFromEvent(event);
      if (point.x < 0 || point.x > point.rect.width || point.y < 0 || point.y > point.rect.height) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.type = event.pointerType;
      pointer.active = true;
      pointer.strength = 1;
      const target = hovered > 0 ? hovered : 1 + Math.floor(Math.random() * (hubs.length - 1));
      spawnPulse(target, Math.random() > 0.2);
      if (event.pointerType !== "mouse") spawnPulse(undefined, true);
    };

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = "rgba(245, 128, 37, 0.035)";
      ctx.lineWidth = 0.7;
      for (let index = 1; index < 6; index++) {
        const y = (height / 6) * index;
        ctx.beginPath();
        ctx.moveTo(width * 0.04, y);
        ctx.bezierCurveTo(width * 0.3, y - 12, width * 0.7, y + 12, width * 0.98, y);
        ctx.stroke();
      }
      for (let index = 1; index < 8; index++) {
        const x = (width / 8) * index;
        ctx.beginPath();
        ctx.moveTo(x, height * 0.03);
        ctx.bezierCurveTo(x - 18, height * 0.3, x + 18, height * 0.7, x, height * 0.97);
        ctx.stroke();
      }
      ctx.restore();
    };

    const projectLonLat = (lon: number, lat: number) => {
      const mobile = width < 600;
      const left = mobile ? 0.02 : 0.12;
      const usableWidth = mobile ? 0.96 : 0.86;
      return {
        x: width * (left + ((lon + 180) / 360) * usableWidth),
        y: height * (0.05 + ((90 - lat) / 180) * 0.9),
      };
    };

    const drawWorldMap = () => {
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(245, 128, 37, 0.18)";
      ctx.lineWidth = 1;
      continentPaths.forEach((path) => {
        ctx.beginPath();
        path.forEach(([lon, lat], index) => {
          const point = projectLonLat(lon, lat);
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      });
      ctx.beginPath();
      saudiOutline.forEach(([lon, lat], index) => {
        const point = projectLonLat(lon, lat);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = "rgba(255, 177, 91, 0.95)";
      ctx.lineWidth = width < 600 ? 2 : 2.8;
      ctx.stroke();
      ctx.restore();
    };

    const drawSaudiBeacon = (riyadh: ScreenHub, time: number) => {
      // A small, abstract Saudi gateway marker keeps the story anchored locally
      // while the routes radiate outward to the international hubs.
      const pulse = reducedMotion ? 0 : Math.sin(time * 0.0018) * 0.5 + 0.5;
      const outer = 18 + pulse * 7;
      ctx.save();
      ctx.translate(riyadh.x, riyadh.y);
      ctx.rotate(-Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(0, -outer);
      ctx.lineTo(outer * 0.58, -outer * 0.18);
      ctx.lineTo(outer * 0.42, outer * 0.62);
      ctx.lineTo(0, outer * 0.9);
      ctx.lineTo(-outer * 0.42, outer * 0.62);
      ctx.lineTo(-outer * 0.58, -outer * 0.18);
      ctx.closePath();
      ctx.strokeStyle = `rgba(245, 128, 37, ${0.16 + pulse * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 8 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 128, 37, ${0.08 + pulse * 0.06})`;
      ctx.fill();
      ctx.restore();
    };

    const draw = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      drawGrid();
      screenHubs = hubs.map((hub) => project(hub, time));
      const riyadh = screenHubs[0];
      drawWorldMap();
      drawSaudiBeacon(riyadh, time);

      hovered = -1;
      if (pointer.active) {
        let best = width < 600 ? 72 : 96;
        screenHubs.forEach((hub, index) => {
          const distance = Math.hypot(hub.x - pointer.x, hub.y - pointer.y);
          if (distance < best) {
            best = distance;
            hovered = index;
          }
        });
        pointer.strength *= pointer.type === "mouse" ? 0.996 : 0.972;
        if (pointer.strength < 0.025) pointer.active = false;
      }

      if (!reducedMotion) {
        nextPulse -= delta;
        if (nextPulse <= 0) {
          spawnPulse(undefined, Math.random() > 0.18);
          nextPulse = width < 600 ? 680 : 420;
        }
      }

      screenHubs.slice(1).forEach((hub, offset) => {
        const index = offset + 1;
        const control = controlPoint(riyadh, hub, index);
        const highlighted = hovered === index || hovered === 0;
        const gradient = ctx.createLinearGradient(riyadh.x, riyadh.y, hub.x, hub.y);
        gradient.addColorStop(0, `rgba(224, 106, 18, ${highlighted ? 0.52 : 0.28})`);
        gradient.addColorStop(0.58, `rgba(245, 128, 37, ${highlighted ? 0.34 : 0.15})`);
        gradient.addColorStop(1, `rgba(245, 128, 37, ${highlighted ? 0.2 : 0.08})`);
        ctx.beginPath();
        ctx.moveTo(riyadh.x, riyadh.y);
        ctx.quadraticCurveTo(control.x, control.y, hub.x, hub.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = highlighted ? 1.5 : 0.8;
        ctx.stroke();
      });

      pulses = pulses.filter((pulse) => {
        const target = screenHubs[pulse.target];
        if (!target) return false;
        if (!reducedMotion) pulse.progress += pulse.speed * delta;
        const progress = pulse.outward ? pulse.progress : 1 - pulse.progress;
        const control = controlPoint(riyadh, target, pulse.target);
        const point = bezierPoint(riyadh, control, target, progress);
        const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12);
        glow.addColorStop(0, "rgba(255, 170, 91, 1)");
        glow.addColorStop(0.26, "rgba(245, 128, 37, 0.68)");
        glow.addColorStop(1, "rgba(245, 128, 37, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
        ctx.fill();
        return pulse.progress < 1;
      });

      screenHubs.forEach((hub, index) => {
        const active = index === hovered || index === 0;
        const radius = index === 0 ? 5.2 : hub.tier === 2 ? 2.8 : 2.1;
        const breathing = reducedMotion ? 0 : Math.sin(time * 0.002 + hub.phase) * 0.5;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, radius + (active ? 7 : 3) + breathing, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? "rgba(245, 128, 37, 0.14)" : "rgba(245, 128, 37, 0.055)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, radius + breathing * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? "rgba(224, 106, 18, 0.95)" : active ? "rgba(245, 128, 37, 0.78)" : "rgba(245, 128, 37, 0.42)";
        ctx.fill();
      });

      if (!reducedMotion) {
        const wave = (time % 2200) / 2200;
        ctx.beginPath();
        ctx.arc(riyadh.x, riyadh.y, 10 + wave * (width < 600 ? 48 : 72), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 128, 37, ${0.22 * (1 - wave)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        raf = window.requestAnimationFrame(draw);
      }
    };

    resize();
    if (reducedMotion) draw(performance.now());
    else raf = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-dots" aria-hidden="true" />;
}
