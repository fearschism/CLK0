import { useEffect, useRef } from "react";

type Dot = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export function HeroDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const spacing = 36;
    const influence = 130;
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];
    let raf = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const baseX = col * spacing + (row % 2 ? spacing / 2 : 0);
          const baseY = row * spacing;
          dots.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
            r: 1.4 + Math.random() * 1.6,
          });
        }
      }
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const resetPointer = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < influence * influence) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (1 - dist / influence) * 5.5;
          dot.vx += (dx / dist) * force;
          dot.vy += (dy / dist) * force;
        }
        dot.vx += (dot.baseX - dot.x) * 0.025;
        dot.vy += (dot.baseY - dot.y) * 0.025;
        dot.vx *= 0.86;
        dot.vy *= 0.86;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const shift = Math.hypot(dot.x - dot.baseX, dot.y - dot.baseY);
        const intensity = Math.min(1, shift / 26);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r + intensity * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 128, 37, ${0.16 + intensity * 0.55})`;
        ctx.fill();
      }
      raf = window.requestAnimationFrame(frame);
    };

    build();
    frame();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", resetPointer);
    window.addEventListener("resize", build);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", resetPointer);
      window.removeEventListener("resize", build);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-dots" aria-hidden="true" />;
}
