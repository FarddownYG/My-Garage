// 🎯 Visual feedback components for user interactions
// Animated toast notifications, loading states, and success messages

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { toastTransitions, successFeedback, errorShake } from '../../utils/animations';

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface FeedbackToastProps {
  type: FeedbackType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

export function FeedbackToast({
  type,
  message,
  isVisible,
  onClose,
  duration = 4000,
  position = 'top'
}: FeedbackToastProps) {
  useEffect(() => {
    if (isVisible && type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />;
    }
  };

  const getBackgroundClass = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-600/90 to-emerald-600/90';
      case 'error':
        return 'bg-gradient-to-r from-red-600/90 to-rose-600/90';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600/90 to-amber-600/90';
      case 'info':
        return 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90';
      case 'loading':
        return 'bg-gradient-to-r from-blue-600/90 to-purple-600/90';
    }
  };

  const positionClass = position === 'top' 
    ? 'top-4 left-1/2 -translate-x-1/2' 
    : 'bottom-24 left-1/2 -translate-x-1/2';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${positionClass} z-[100] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[280px] max-w-[90vw] md:max-w-md ${getBackgroundClass()}`}
          initial={toastTransitions.initial}
          animate={toastTransitions.animate}
          exit={toastTransitions.exit}
          layout
        >
          {getIcon()}
          <p className="text-white font-medium flex-1 text-sm">{message}</p>
          {type !== 'loading' && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  message,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }[size];

  const content = (
    <motion.div
      className="flex flex-col items-center justify-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <div className={`${sizeClass} rounded-full border-3 border-blue-500/30 border-t-blue-500`} />
      </motion.div>
      {message && (
        <motion.p
          className="text-zinc-400 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

interface SuccessCheckmarkProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function SuccessCheckmark({ isVisible, onComplete }: SuccessCheckmarkProps) {
  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6 shadow-2xl"
            variants={successFeedback}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ErrorMessageProps {
  message: string;
  isVisible: boolean;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, isVisible, onDismiss }: ErrorMessageProps) {
  useEffect(() => {
    if (isVisible && onDismiss) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
          variants={errorShake}
          animate="animate"
        >
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">{message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400/80 hover:text-red-400 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, label, showPercentage = true }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">{label}</span>
          {showPercentage && (
            <span className="text-blue-400 font-medium">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export function SkeletonLoader({ className = "h-4 w-full", count = 1 }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-zinc-800/50 rounded ${className}`}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1
          }}
        />
      ))}
    </>
  );
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [pullDistance, setPullDistance] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100));
      setIsPulling(distance > 60);
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling) {
      await onRefresh();
    }
    setStartY(0);
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            className="flex justify-center py-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Loader2
              className={`w-6 h-6 text-blue-400 ${isPulling ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullDistance * 3.6}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
