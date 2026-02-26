import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Wrench, CheckSquare, FileText, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  { icon: Car, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10', key: 'step1' },
  { icon: Wrench, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10', key: 'step2' },
  { icon: CheckSquare, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', key: 'step3' },
  { icon: FileText, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', key: 'step4' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('valcar-onboarding-done', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('valcar-onboarding-done', 'true');
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-sm"
      >
        {t('onboarding.skip')}
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              className={`w-28 h-28 rounded-3xl ${step.bg} flex items-center justify-center mx-auto mb-8 border border-white/5`}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl text-white mb-3">
              {currentStep === 0 ? t('onboarding.step1Title') :
               currentStep === 1 ? t('onboarding.step2Title') :
               currentStep === 2 ? t('onboarding.step3Title') :
               t('onboarding.step4Title')}
            </h2>

            {/* Description */}
            <p className="text-slate-400 text-base leading-relaxed">
              {currentStep === 0 ? t('onboarding.step1Desc') :
               currentStep === 1 ? t('onboarding.step2Desc') :
               currentStep === 2 ? t('onboarding.step3Desc') :
               t('onboarding.step4Desc')}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-8 bg-gradient-to-r from-cyan-500 to-violet-500'
                : index < currentStep
                ? 'w-2 bg-cyan-500/50'
                : 'w-2 bg-slate-700'
            }`}
            layout
          />
        ))}
      </div>

      {/* Button */}
      <motion.button
        onClick={handleNext}
        className="w-full max-w-sm h-14 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
        whileTap={{ scale: 0.95 }}
      >
        {currentStep === steps.length - 1 ? t('onboarding.start') : t('onboarding.next')}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
