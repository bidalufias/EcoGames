import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  type: 'orb' | 'leaf';
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    };
    sync();

    const observer = new ResizeObserver(sync);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    observer.observe(canvas);

    const isSmall = canvas.width < 900;
    const density = isSmall ? 60000 : 30000;
    const cap = isSmall ? 20 : 36;
    const count = Math.min(cap, Math.floor((canvas.width * canvas.height) / density));

    const colors = [
      'rgba(139, 197, 63,',
      'rgba(168, 216, 110,',
      'rgba(0, 125, 196,',
      'rgba(61, 161, 224,',
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const isLeaf = Math.random() < 0.3;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2 - 0.05,
        radius: isLeaf ? 2 + Math.random() * 3 : 1.5 + Math.random() * 4,
        opacity: 0.06 + Math.random() * 0.12,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: isLeaf ? 'leaf' : 'orb',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    const FRAME = 1000 / 30;
    let lastDraw = 0;
    let paused = document.visibilityState === 'hidden';

    const onVisibility = () => {
      paused = document.visibilityState === 'hidden';
      if (!paused) {
        lastDraw = 0;
        animRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const animate = (now: number = performance.now()) => {
      if (paused) return;
      if (now - lastDraw < FRAME) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      lastDraw = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.pulsePhase += 0.02;

        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        const pulse = 1 + Math.sin(p.pulsePhase) * 0.15;
        const r = p.radius * pulse;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity * pulse;

        if (p.type === 'orb') {
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
          gradient.addColorStop(0, p.color + (p.opacity * 0.8).toFixed(2) + ')');
          gradient.addColorStop(0.4, p.color + (p.opacity * 0.3).toFixed(2) + ')');
          gradient.addColorStop(1, p.color + '0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color + (p.opacity * 0.6).toFixed(2) + ')';
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo(r * 0.8, -r * 0.5, r * 0.8, r * 0.5, 0, r);
          ctx.bezierCurveTo(-r * 0.8, r * 0.5, -r * 0.8, -r * 0.5, 0, -r);
          ctx.fill();
        }

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
