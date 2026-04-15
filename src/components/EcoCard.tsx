import { Box } from '@mui/material';
import { motion } from 'framer-motion';

interface EcoCardProps {
  children: React.ReactNode;
  sx?: object;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function EcoCard({ children, sx, onClick, hoverable = false }: EcoCardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ height: '100%' }}
    >
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          background: '#FFFFFF',
          border: '1px solid #E8EDF2',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          ...(hoverable && {
            '&:hover': {
              borderColor: '#8BC53F50',
              boxShadow: '0 4px 20px rgba(139, 197, 63, 0.12), 0 8px 32px rgba(0,0,0,0.06)',
            },
          }),
          ...sx,
        }}
      >
        {children}
      </Box>
    </motion.div>
  );
}
