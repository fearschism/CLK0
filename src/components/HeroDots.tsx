import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  anchor: boolean;
};

type Pulse = {
  from: number;
  to: number;
  progress: number;
  speed: number;
};

export function HeroDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: 0, y: 0, active: false, strength: 0 };
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let lastTime = performance.now();
    let nextPulse = 0;

    const nodeCount = () => {
      if (width < 600) return 28;
      if (width < 980) return 40;
      return Math.min(66, Math.max(46, Math.round((width * height) / 14500)));
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = nodeCount();
      nodes = Array.from({ length: count }, (_, index) => {
        const anchor = index % 11 === 0;
        return {
          x: width * (0.04 + Math.random() * 0.92),
          y: height * (0.08 + Math.random() * 0.84),
          vx: (Math.random() - 0.5) * (anchor ? 0.012 : 0.028),
          vy: (Math.random() - 0.5) * (anchor ? 0.012 : 0.028),
          radius: anchor ? 3.2 : 1.4 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          anchor,
        };
      });
      pulses = [];
    };

    const relativePoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top, rect };
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = relativePoint(event.clientX, event.clientY);
      const inside =
        point.x >= 0 && point.x <= point.rect.width && point.y >= 0 && point.y <= point.rect.height;
      if (!inside) {
        if (event.pointerType === "mouse") pointer.active = false;
        return;
      }
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.active = true;
      pointer.strength = event.pointerType === "mouse" ? 1 : 0.72;
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = relativePoint(event.clientX, event.clientY);
      if (point.x < 0 || point.x > point.rect.width || point.y < 0 || point.y > point.rect.height) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.active = true;
      pointer.strength = event.pointerType === "mouse" ? 1.25 : 1;
      spawnPulse(true);
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") pointer.active = false;
    };

    const nearestNeighbour = (from: number) => {
      let nearest = -1;
      let best = Infinity;
      for (let index = 0; index < nodes.length; index++) {
        if (index === from) continue;
        const dx = nodes[index].x - nodes[from].x;
        const dy = nodes[index].y - nodes[from].y;
        const distance = dx * dx + dy * dy;
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      }
      return nearest;
    };

    function spawnPulse(fromPointer = false) {
      if (nodes.length < 2) return;
      let from = Math.floor(Math.random() * nodes.length);
      if (fromPointer && pointer.active) {
        let best = Infinity;
        nodes.forEach((node, index) => {
          const distance = (node.x - pointer.x) ** 2 + (node.y - pointer.y) ** 2;
          if (distance < best) {
            best = distance;
            from = index;
          }
        });
      }
      const to = nearestNeighbour(from);
      if (to >= 0 && pulses.length < 10) {
        pulses.push({ from, to, progress: 0, speed: 0.00038 + Math.random() * 0.00028 });
      }
    }

    const draw = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        nextPulse -= delta;
        if (nextPulse <= 0) {
          spawnPulse();
          nextPulse = width < 600 ? 760 : 470;
        }
      }

      if (pointer.active && pointer.strength > 0.02) {
        pointer.strength *= width < 600 ? 0.978 : 0.995;
      } else if (pointer.strength <= 0.02) {
        pointer.active = false;
      }

      for (const node of nodes) {
        if (!reducedMotion) {
          node.phase += 0.006 * delta;
          node.x += node.vx * delta + Math.sin(node.phase) * 0.012 * delta;
          node.y += node.vy * delta + Math.cos(node.phase * 0.83) * 0.009 * delta;

          if (pointer.active) {
            const dx = pointer.x - node.x;
            const dy = pointer.y - node.y;
            const distance = Math.hypot(dx, dy) || 1;
            const range = width < 600 ? 115 : 175;
            if (distance < range) {
              const force = (1 - distance / range) * 0.00016 * pointer.strength * delta;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }

          node.vx *= 0.985;
          node.vy *= 0.985;
          const margin = 18;
          if (node.x < margin || node.x > width - margin) node.vx *= -1;
          if (node.y < margin || node.y > height - margin) node.vy *= -1;
          node.x = Math.max(margin, Math.min(width - margin, node.x));
          node.y = Math.max(margin, Math.min(height - margin, node.y));
        }
      }

      const connectionRange = width < 600 ? 118 : 155;
      const maxConnections = width < 600 ? 2 : 3;
      const drawnEdges = new Set<string>();

      nodes.forEach((node, from) => {
        const nearby = nodes
          .map((other, to) => ({ to, distance: Math.hypot(other.x - node.x, other.y - node.y) }))
          .filter(({ to, distance }) => to !== from && distance < connectionRange)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxConnections);

        nearby.forEach(({ to, distance }) => {
          const key = from < to ? `${from}-${to}` : `${to}-${from}`;
          if (drawnEdges.has(key)) return;
          drawnEdges.add(key);
          const other = nodes[to];
          const proximity = 1 - distance / connectionRange;
          const pointerBoost = pointer.active
            ? Math.max(0, 1 - Math.min(
                Math.hypot(node.x - pointer.x, node.y - pointer.y),
                Math.hypot(other.x - pointer.x, other.y - pointer.y),
              ) / 190)
            : 0;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(245, 128, 37, ${0.07 + proximity * 0.16 + pointerBoost * 0.16})`;
          ctx.lineWidth = 0.7 + pointerBoost * 0.65;
          ctx.stroke();
        });
      });

      pulses = pulses.filter((pulse) => {
        const from = nodes[pulse.from];
        const to = nodes[pulse.to];
        if (!from || !to) return false;
        if (!reducedMotion) pulse.progress += pulse.speed * delta;
        const eased = pulse.progress * pulse.progress * (3 - 2 * pulse.progress);
        const x = from.x + (to.x - from.x) * eased;
        const y = from.y + (to.y - from.y) * eased;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        glow.addColorStop(0, "rgba(245, 128, 37, 0.95)");
        glow.addColorStop(0.35, "rgba(245, 128, 37, 0.45)");
        glow.addColorStop(1, "rgba(245, 128, 37, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        return pulse.progress < 1;
      });

      nodes.forEach((node) => {
        const pulse = node.anchor ? 0.6 + Math.sin(node.phase) * 0.25 : 0;
        if (node.anchor) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5 + pulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(245, 128, 37, 0.06)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = node.anchor ? "rgba(224, 106, 18, 0.72)" : "rgba(245, 128, 37, 0.38)";
        ctx.fill();
      });

      if (!reducedMotion) raf = window.requestAnimationFrame(draw);
    };

    build();
    if (reducedMotion) draw(performance.now());
    else raf = window.requestAnimationFrame(draw);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", build);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", build);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-dots" aria-hidden="true" />;
}
