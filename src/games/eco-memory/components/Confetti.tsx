import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  /** Number of pieces. ~36 reads as a celebration without choking the GPU. */
  count?: number;
  /** Auto-clear after this many ms. */
  duration?: number;
  onDone?: () => void;
}

interface Piece {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  color: string;
  size: number;
  delay: number;
}

const COLORS = ['#0D9B4A', '#9B59B6', '#F39C12', '#3498DB', '#E74C3C', '#1ABC9C', '#F59E0B'];

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 90 + Math.random() * 110; // px
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 40, // bias upward for a fountain feel
      rot: (Math.random() - 0.5) * 540,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.08,
    };
  });
}

/**
 * Lightweight confetti burst rendered inside the board's positioning context.
 * Each piece is a small absolutely-positioned div with a randomised vector and
 * spin; framer-motion handles the tween. No external lib, no canvas — just a
 * one-shot celebration that tears itself down via `onDone`.
 */
export default function Confetti({ count = 36, duration = 1600, onDone }: ConfettiProps) {
  // Generate pieces in an effect so the impure `Math.random` calls happen
  // outside the render phase (satisfies react-hooks/purity).
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    setPieces(generatePieces(count));
  }, [count]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{
            x: p.dx,
            y: p.dy,
            opacity: [1, 1, 0],
            rotate: p.rot,
            scale: [0.4, 1, 1],
          }}
          transition={{
            duration: duration / 1000,
            delay: p.delay,
            ease: 'easeOut',
            times: [0, 0.7, 1],
          }}
          onAnimationComplete={p.id === 0 ? onDone : undefined}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}
