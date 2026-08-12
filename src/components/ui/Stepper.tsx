import React, { useState, Children, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import './Stepper.css';

function ChevronLeft({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  initialStep?: number;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => React.ReactNode;
  stepLabels?: string[];
  hideFooter?: boolean;

  // Split Layout Props
  layout?: 'horizontal' | 'split';
  onboardingTitle?: string;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  isDarkTheme?: boolean;
}

export default function Stepper({
  children,
  initialStep = 1,
  activeStep,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  stepLabels,
  hideFooter = false,

  // Split Layout Props
  layout = 'horizontal',
  onboardingTitle = 'Onboarding Process',
  sidebarHeader,
  sidebarFooter,
  isDarkTheme = false,
  className,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(activeStep !== undefined ? activeStep : initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  useEffect(() => {
    if (activeStep !== undefined && activeStep !== currentStep) {
      setDirection(activeStep > currentStep ? 1 : -1);
      setCurrentStep(activeStep);
    }
  }, [activeStep]);

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  // Render Horizontal Layout (Default React Bits style)
  if (layout === 'horizontal') {
    return (
      <div className="outer-container" {...rest}>
        <div className={`step-circle-container ${stepCircleContainerClassName}`}>
          <div className={`step-indicator-row ${stepContainerClassName}`}>
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;
              const label = stepLabels && stepLabels[index] ? stepLabels[index] : undefined;
              return (
                <React.Fragment key={stepNumber}>
                  {renderStepIndicator ? (
                    renderStepIndicator({
                      step: stepNumber,
                      currentStep,
                      onStepClick: (clicked) => {
                        const clickedStatus = currentStep === clicked ? 'active' : currentStep > clicked ? 'complete' : 'inactive';
                        // Linear navigation control: cannot jump forward to inactive steps
                        if (clickedStatus !== 'inactive') {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }
                      }
                    })
                  ) : (
                    <StepIndicator
                      step={stepNumber}
                      disableStepIndicators={disableStepIndicators}
                      currentStep={currentStep}
                      onClickStep={(clicked) => {
                        const clickedStatus = currentStep === clicked ? 'active' : currentStep > clicked ? 'complete' : 'inactive';
                        // Linear navigation control: cannot jump forward to inactive steps
                        if (clickedStatus !== 'inactive') {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }
                      }}
                      label={label}
                    />
                  )}
                  {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
                </React.Fragment>
              );
            })}
          </div>

          <StepContentWrapper
            isCompleted={isCompleted}
            currentStep={currentStep}
            direction={direction}
            className={`step-content-default ${contentClassName}`}
          >
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>

          {!isCompleted && !hideFooter && (
            <div className={`footer-container ${footerClassName}`}>
              <div className={`footer-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
                {currentStep !== 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className={`back-button ${currentStep === 1 ? 'inactive' : ''}`}
                    {...backButtonProps}
                  >
                    {backButtonText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={isLastStep ? handleComplete : handleNext}
                  className="next-button"
                  {...nextButtonProps}
                >
                  {isLastStep ? 'Complete' : nextButtonText}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Split Layout (Evolved Vertical Step panel)
  return (
    <div 
      className={cn(
        'flex w-full min-h-screen flex-col md:flex-row transition-all duration-300',
        isDarkTheme
          ? 'bg-[#09090b] text-white'
          : 'bg-[#f8fafc] text-slate-800',
        className
      )}
      {...rest}
    >
      {/* Left panel: Vertical Steps Tracker */}
      <div 
        className={`hidden md:flex flex-col w-full md:w-[320px] shrink-0 md:min-h-screen p-8 justify-between border-b md:border-b-0 md:border-r transition-all duration-300 ${
          isDarkTheme 
            ? 'bg-[#121214] border-white/5' 
            : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="space-y-8">
          {/* Header section (e.g. Profile banner) */}
          {sidebarHeader && (
            <div className="pb-6 border-b border-dashed border-slate-250/60 dark:border-white/5">
              {sidebarHeader}
            </div>
          )}

          {/* Onboarding title */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Verification Setup
            </span>
            <h3 className="text-xl font-extrabold tracking-tight mt-1">
              {onboardingTitle}
            </h3>
          </div>

          {/* Steps List */}
          <div className="space-y-3 relative">
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;
              const label = stepLabels && stepLabels[index] ? stepLabels[index] : `Step ${stepNumber}`;
              const status = currentStep === stepNumber ? 'active' : currentStep > stepNumber ? 'complete' : 'inactive';

              return (
                <div key={stepNumber} className="relative">
                  <div
                    onClick={() => {
                      // Linear navigation control: cannot jump forward to inactive steps
                      if (!disableStepIndicators && status !== 'inactive') {
                        setDirection(stepNumber > currentStep ? 1 : -1);
                        updateStep(stepNumber);
                      }
                    }}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 border-l-4 ${
                      status === 'active'
                        ? isDarkTheme
                          ? 'border-indigo-500 bg-white/5 text-white font-semibold shadow-sm'
                          : 'border-indigo-600 bg-slate-100 text-slate-900 font-semibold shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    } ${disableStepIndicators || status === 'inactive' ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {/* Circle Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      status === 'active'
                        ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-500/10'
                        : status === 'complete'
                        ? 'bg-emerald-500 text-white'
                        : isDarkTheme 
                          ? 'bg-white/5 text-slate-500 border border-white/10' 
                          : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {status === 'complete' ? <CheckIcon className="w-4 h-4 text-white" /> : stepNumber}
                    </div>

                    {/* Step label text */}
                    <span className={`text-xs sm:text-sm tracking-wide transition-all ${
                      status === 'active'
                        ? isDarkTheme ? 'text-white font-bold' : 'text-slate-900 font-bold'
                        : status === 'complete'
                        ? 'text-emerald-500 font-medium'
                        : isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {label}
                    </span>
                  </div>

                  {/* Vertical connecting line */}
                  {isNotLastStep && (
                    <div className={`absolute left-[30px] top-[48px] w-[2px] h-[22px] z-0 ${
                      currentStep > stepNumber 
                        ? 'bg-emerald-500' 
                        : isDarkTheme ? 'bg-white/10' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar footer section */}
        {sidebarFooter && (
          <div className="pt-6 border-t border-dashed border-slate-250/60 dark:border-white/5">
            {sidebarFooter}
          </div>
        )}
      </div>

      {/* Right panel: Centered Active Step Container */}
      <div className={`flex-1 min-h-screen md:min-h-screen p-3 sm:p-8 md:p-16 flex items-start md:items-center justify-center transition-all duration-300 ${
        isDarkTheme ? 'bg-[#0b0b0d]' : 'bg-[#f8fafc]'
      }`}>
        <div className={`w-full max-w-xl rounded-2xl sm:rounded-3xl border shadow-2xl p-4 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-300 ${
          isDarkTheme ? 'bg-[#18181b] border-white/5 text-white' : 'bg-white border-slate-200/60 text-slate-800'
        }`}>
          {/* Mobile progress: replaces the hidden split sidebar below md. */}
          <div className="md:hidden mb-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Verification Setup
                </span>
                <h3 className="text-base font-extrabold tracking-tight">
                  {onboardingTitle}
                </h3>
              </div>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isDarkTheme ? 'bg-white/5 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {currentStep}/{totalSteps}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5" aria-label={`${onboardingTitle} progress`}>
              {stepsArray.map((_, index) => {
                const stepNumber = index + 1;
                const label = stepLabels && stepLabels[index] ? stepLabels[index] : `Step ${stepNumber}`;
                const status = currentStep === stepNumber ? 'active' : currentStep > stepNumber ? 'complete' : 'inactive';

                return (
                  <button
                    key={stepNumber}
                    type="button"
                    aria-label={label}
                    title={label}
                    disabled={disableStepIndicators || status === 'inactive'}
                    onClick={() => {
                      if (!disableStepIndicators && status !== 'inactive') {
                        setDirection(stepNumber > currentStep ? 1 : -1);
                        updateStep(stepNumber);
                      }
                    }}
                    className={`h-2 rounded-full transition-all ${
                      status === 'active'
                        ? 'bg-indigo-600'
                        : status === 'complete'
                        ? 'bg-emerald-500'
                        : isDarkTheme
                          ? 'bg-white/10'
                          : 'bg-slate-200'
                    } ${disableStepIndicators || status === 'inactive' ? 'cursor-default' : 'cursor-pointer'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Header of Content card: Back button and progress */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className={`flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-all ${
                  isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isDarkTheme ? 'bg-white/5 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
            }`}>
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Active Step Content */}
          <div className="flex-1 flex flex-col justify-center">
            <StepContentWrapper
              isCompleted={isCompleted}
              currentStep={currentStep}
              direction={direction}
              className={`step-content-default ${contentClassName}`}
            >
              {stepsArray[currentStep - 1]}
            </StepContentWrapper>
          </div>

          {/* Footer Controls */}
          {!isCompleted && !hideFooter && (
            <div className={`flex justify-end items-center pt-6 border-t border-slate-100 dark:border-white/5 mt-6 ${footerClassName}`}>
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className="next-button"
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete' : nextButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className
}: {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [parentHeight, setParentHeight] = useState<number | 'auto'>('auto');

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({
  children,
  direction,
  onHeightReady
}: {
  children: React.ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target) {
          onHeightReady((entry.target as HTMLElement).offsetHeight);
        }
      }
    });
    observer.observe(containerRef.current);
    onHeightReady(containerRef.current.offsetHeight);
    return () => observer.disconnect();
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'relative', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-30%' : '30%',
    opacity: 0
  })
};

export function Step({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`step-default ${className}`}>{children}</div>;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
  label
}: {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
  label?: string;
}) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer z-10" onClick={handleClick}>
      <motion.div
        className="step-indicator"
        style={disableStepIndicators ? { pointerEvents: 'none', opacity: 0.5 } : {}}
        animate={status}
        initial={false}
      >
        <motion.div
          variants={{
            inactive: { scale: 1, backgroundColor: '#f1f5f9', color: '#64748b' },
            active: { scale: 1.08, backgroundColor: '#4f46e5', color: '#ffffff' },
            complete: { scale: 1, backgroundColor: '#10b981', color: '#ffffff' }
          }}
          transition={{ duration: 0.3 }}
          className="step-indicator-inner shadow-sm border border-slate-200/60"
        >
          {status === 'complete' ? (
            <CheckIcon className="check-icon" />
          ) : status === 'active' ? (
            <div className="active-dot" />
          ) : (
            <span className="step-number">{step}</span>
          )}
        </motion.div>
      </motion.div>
      {label && (
        <span
          className={`text-[11px] font-semibold text-center transition-colors duration-300 max-w-[80px] sm:max-w-none leading-tight ${
            status === 'active'
              ? 'text-indigo-600 font-bold'
              : status === 'complete'
              ? 'text-emerald-600'
              : 'text-slate-400'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#10b981' }
  };

  return (
    <div className="step-connector mt-[-1.25rem]">
      <motion.div
        className="step-connector-inner"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
