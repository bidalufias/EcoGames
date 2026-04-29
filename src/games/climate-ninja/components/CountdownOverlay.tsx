import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const steps = ['3', '2', '1', 'GO!'];

export default function CountdownOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length) { onComplete(); return; }
    const timer = setTimeout(() => setStep(s => s + 1), 800);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  return (
    <Box sx={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(250,251,252,0.92)',
    }}>
      <AnimatePresence mode="wait">
        {step < steps.length && (
          <motion.div key={step}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography sx={{
              fontSize: 120, fontWeight: 800,
              color: step === 3 ? '#8BC53F' : '#1A2332',
              textShadow: step === 3 ? '0 0 40px rgba(13,155,74,0.5)' : 'none',
            }}>
              {steps[step]}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
