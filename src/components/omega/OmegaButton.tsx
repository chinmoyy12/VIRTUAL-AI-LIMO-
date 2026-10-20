import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { calculateMagneticOffset, MOTION_SPRINGS } from '../../motion/omegaMotion.ts';

interface OmegaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  magnetic?: boolean;
  children: React.ReactNode;
}

export const OmegaButton: React.FC<OmegaButtonProps> = ({
  variant = 'secondary',
  magnetic = true,
  className = '',
  children,
  disabled,
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (magnetic && !disabled && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      const next = calculateMagneticOffset(e.clientX, e.clientY, centerX, centerY, 85, 2.2);
      setOffset(next);
    }
    if (onMouseMove) onMouseMove(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOffset({ dx: 0, dy: 0 });
    if (onMouseLeave) onMouseLeave(e);
  };

  const baseClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'destructive'
      ? 'btn-destructive'
      : variant === 'ghost'
      ? 'btn-ghost'
      : 'btn-secondary';

  return (
    <motion.button
      ref={btnRef}
      type="button"
      disabled={disabled}
      animate={{ x: offset.dx, y: offset.dy }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={MOTION_SPRINGS.snappy}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
};
