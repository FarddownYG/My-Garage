// 🎨 Animation utilities for smooth transitions and user feedback
// Using Motion (Framer Motion) for animations

/**
 * Page transition variants for screen navigation
 */
export const pageTransitions = {
  initial: { 
    opacity: 0, 
    x: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] // Custom easing for smooth feel
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

/**
 * Modal/Dialog animation variants
 */
export const modalTransitions = {
  overlay: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  },
  modal: {
    initial: { 
      opacity: 0, 
      y: 50,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: 30,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  },
  modalFromBottom: {
    initial: { 
      opacity: 0, 
      y: "100%"
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: "100%",
      transition: { 
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  }
};

/**
 * List item animations with stagger effect
 */
export const listTransitions = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  },
  item: {
    initial: { 
      opacity: 0, 
      y: 10
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  }
};

/**
 * Card hover animations
 */
export const cardHover = {
  rest: { 
    scale: 1 
  },
  hover: { 
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

/**
 * Button press animation
 */
export const buttonPress = {
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeOut"
    }
  }
};

/**
 * Fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Slide in from right (for drawers)
 */
export const slideInFromRight = {
  initial: { x: "100%" },
  animate: { 
    x: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    x: "100%",
    transition: { 
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

/**
 * Success feedback animation (scale + bounce)
 */
export const successFeedback = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400
    }
  },
  exit: { 
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Error shake animation
 */
export const errorShake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

/**
 * Loading pulse animation
 */
export const loadingPulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

/**
 * Badge notification animation
 */
export const badgeBounce = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 400
    }
  }
};

/**
 * Notification toast animation
 */
export const toastTransitions = {
  initial: { 
    opacity: 0, 
    y: -20,
    x: "-50%"
  },
  animate: { 
    opacity: 1, 
    y: 0,
    x: "-50%",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    x: "-50%",
    transition: { duration: 0.2 }
  }
};

/**
 * Progress bar animation
 */
export const progressBar = (progress: number) => ({
  initial: { width: "0%" },
  animate: { 
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
});

/**
 * Skeleton loading animation
 */
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
