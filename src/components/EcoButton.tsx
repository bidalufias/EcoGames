import { Button } from '@mui/material';
import { motion } from 'framer-motion';
import { MGTC_GREEN, MGTC_BLUE } from '../theme/ecoTheme';

interface EcoButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const sizeMap = {
  small: { py: 0.75, px: 2, fontSize: '0.85rem', minWidth: 80 },
  medium: { py: 1.25, px: 3, fontSize: '1rem', minWidth: 120 },
  large: { py: 1.5, px: 4, fontSize: '1.1rem', minWidth: 160 },
};

export default function EcoButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  startIcon,
  endIcon,
}: EcoButtonProps) {
  const sz = sizeMap[size];

  const getStyles = (): object => {
    if (disabled) {
      return {
        background: '#E8EDF2',
        color: '#A0AABB',
        border: '1px solid #D0D8E2',
        cursor: 'not-allowed',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${MGTC_GREEN} 0%, ${MGTC_BLUE} 100%)`,
          color: '#fff',
          border: 'none',
          boxShadow: `0 4px 16px rgba(139, 197, 63, 0.25)`,
          '&:hover': {
            background: `linear-gradient(135deg, #A8D86E 0%, #3DA1E0 100%)`,
            boxShadow: `0 6px 24px rgba(139, 197, 63, 0.35)`,
            transform: 'translateY(-1px)',
          },
        };
      case 'secondary':
        return {
          background: '#fff',
          color: MGTC_GREEN,
          border: `1px solid ${MGTC_GREEN}50`,
          '&:hover': {
            background: `${MGTC_GREEN}10`,
            borderColor: MGTC_GREEN,
            boxShadow: `0 0 16px ${MGTC_GREEN}15`,
            transform: 'translateY(-1px)',
          },
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#5A6A7E',
          border: '1px solid transparent',
          '&:hover': {
            background: '#F0F3F7',
            color: MGTC_GREEN,
          },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div whileTap={!disabled ? { scale: 0.97 } : undefined} style={{ display: 'inline-block' }}>
      <Button
        onClick={onClick}
        disabled={disabled}
        startIcon={startIcon}
        endIcon={endIcon}
        sx={{
          py: sz.py,
          px: sz.px,
          fontSize: sz.fontSize,
          minWidth: sz.minWidth,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          ...getStyles(),
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
}
