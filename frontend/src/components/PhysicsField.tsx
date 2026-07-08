'use client';

/**
 * PhysicsField — ambient particle physics on <canvas> (no external engine).
 * Each node carries velocity, integrates simple forces per frame (drift,
 * cursor repulsion with inverse-square falloff, damping, soft wall bounce)
 * and links to near neighbours with distance-faded springs drawn as lines.
 * Theme-aware (reads MUI palette), DPR-scaled, honours prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';
import { useTheme, alpha } from '@mui/material/styles';

interface PhysicsFieldProps {
  /** Particles per 10,000 px² — 0.8 is a full hero, 0.4 a subtle ambient. */
  density?: number;
  /** Overall layer opacity (keep low behind content). */
  opacity?: number;
  /** React to cursor movement (repulsion field). */
  interactive?: boolean;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const LINK_DIST = 120;
const MOUSE_RADIUS = 140;
const MAX_SPEED = 0.6;

export default function PhysicsField({
  density = 0.6,
  opacity = 0.5,
  interactive = true,
}: PhysicsFieldProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotColor = theme.palette.primary.main;
  const linkColor = theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      const target = Math.round(((width * height) / 10_000) * density);
      nodes = Array.from({ length: Math.min(target, 160) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * MAX_SPEED,
        vy: (Math.random() - 0.5) * MAX_SPEED,
        r: 1 + Math.random() * 1.8,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduceMotion) draw(); // static single frame
    };

    const step = () => {
      for (const n of nodes) {
        // Cursor repulsion — inverse-square, clamped so nodes glide, not jump.
        if (interactive) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const force = Math.min(12 / d2, 0.08);
            n.vx += (dx / d) * force * d;
            n.vy += (dy / d) * force * d;
          }
        }

        n.x += n.vx;
        n.y += n.vy;

        // Soft wall bounce keeps the field filled edge-to-edge.
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));

        // Damping toward cruise speed so repulsion energy bleeds off.
        const speed = Math.hypot(n.vx, n.vy);
        if (speed > MAX_SPEED) {
          n.vx *= 0.96;
          n.vy *= 0.96;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Links first (under the dots), alpha faded by distance.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const t = 1 - Math.sqrt(d2) / LINK_DIST;
            ctx.strokeStyle = alpha(linkColor, t * 0.28);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = alpha(dotColor, 0.7);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    if (!reduceMotion) {
      raf = requestAnimationFrame(loop);
      if (interactive) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerleave', onPointerLeave);
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [density, interactive, dotColor, linkColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}
