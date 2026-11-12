import React, { useState, Children, useEffect } from 'react';
import { cn } from '@/lib/utils';
import './Stepper.css';

function ChevronLeft({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export type StepperAccent = 'brand' | 'creator';

const ACCENT_STYLES: Record<
  StepperAccent,
  {
    eyebrowText: string;
    badge: string;
    sidebarActive: string;
    circleActive: string;
    barActive: string;
    horizontalLabelActive: string;
  }
> = {
  brand: {
    eyebrowText: 'text-brand-blue',
    badge: 'bg-brand-blue/10 text-brand-blue border border-brand-blue/25',
    sidebarActive: 'border-brand-blue bg-brand-blue/[0.06] text-ink font-semibold',
    circleActive: 'bg-brand-blue text-white border border-brand-blue',
    barActive: 'bg-brand-blue',
    horizontalLabelActive: 'text-brand-blue font-bold',
  },
  creator: {
    eyebrowText: 'text-lava',
    badge: 'bg-lava/10 text-lava border border-lava/25',
    sidebarActive: 'border-lava bg-lava/[0.06] text-ink font-semibold',
    circleActive: 'bg-lava text-white border border-lava',
    barActive: 'bg-lava',
    horizontalLabelActive: 'text-lava font-bold',
  },
};

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  initialStep?: number;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>;
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
  accent?: StepperAccent;
  onboardingTitle?: string;
  sidebarBrandSubtitle?: string;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  sidebarFooterContent?: React.ReactNode;
  /** @deprecated Light Paper Canvas is always enforced per DESIGN.md. */
  isDarkTheme?: boolean;
}

export function Stepper({
  children,
  initialStep = 1,
  activeStep,
  onStepChange = () => {},
  onBeforeNext,
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
  accent = 'brand',
  onboardingTitle = 'Onboarding Process',
  sidebarBrandSubtitle = 'Verification Setup',
  sidebarHeader,
  sidebarFooter,
  sidebarFooterContent,
  isDarkTheme: _isDarkTheme = false,
  className,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(activeStep !== undefined ? activeStep : initialStep);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const accentStyle = ACCENT_STYLES[accent] ?? ACCENT_STYLES.brand;
  const resolvedSidebarFooter = sidebarFooter ?? sidebarFooterContent;

  useEffect(() => {
    if (activeStep !== undefined && activeStep !== currentStep) {
      setCurrentStep(activeStep);
    }
  }, [activeStep, currentStep]);

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
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (onBeforeNext) {
      const result = onBeforeNext(currentStep);
      const canProceed = result instanceof Promise ? await result : result;
      if (!canProceed) return;
    }
    if (!isLastStep) {
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (onBeforeNext) {
      const result = onBeforeNext(currentStep);
      const canProceed = result instanceof Promise ? await result : result;
      if (!canProceed) return;
    }
    updateStep(totalSteps + 1);
  };

  // Render Horizontal Layout
  if (layout === 'horizontal') {
    return (
      <div className={cn('outer-container text-ink', className)} {...rest}>
        <div
          className={cn(
            'step-circle-container rounded-2xl bg-white border border-black/10',
            stepCircleContainerClassName
          )}
        >
          <div className={cn('step-indicator-row border-b border-black/10', stepContainerClassName)}>
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
                        const clickedStatus =
                          currentStep === clicked ? 'active' : currentStep > clicked ? 'complete' : 'inactive';
                        // Linear navigation control: cannot jump forward to inactive steps
                        if (clickedStatus !== 'inactive') {
                          updateStep(clicked);
                        }
                      },
                    })
                  ) : (
                    <StepIndicator
                      step={stepNumber}
                      disableStepIndicators={disableStepIndicators}
                      currentStep={currentStep}
                      accent={accent}
                      onClickStep={(clicked) => {
                        const clickedStatus =
                          currentStep === clicked ? 'active' : currentStep > clicked ? 'complete' : 'inactive';
                        // Linear navigation control: cannot jump forward to inactive steps
                        if (clickedStatus !== 'inactive') {
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
            className={cn('step-content-default p-4 sm:p-6', contentClassName)}
          >
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>

          {!isCompleted && !hideFooter && (
            <div className={cn('footer-container border-t border-black/10 pt-4', footerClassName)}>
              <div className={cn('footer-nav mt-0', currentStep !== 1 ? 'spread' : 'end')}>
                {currentStep !== 1 && (
                  <button
                    type="button"
                    {...backButtonProps}
                    onClick={(e) => {
                      backButtonProps.onClick?.(e);
                      if (!e.defaultPrevented) {
                        handleBack();
                      }
                    }}
                    className={cn(
                      'back-button transition-colors duration-150',
                      currentStep === 1 && 'inactive',
                      backButtonProps.className
                    )}
                  >
                    {backButtonText}
                  </button>
                )}
                <button
                  type="button"
                  {...nextButtonProps}
                  onClick={(e) => {
                    nextButtonProps.onClick?.(e);
                    if (!e.defaultPrevented) {
                      if (isLastStep) {
                        void handleComplete();
                      } else {
                        void handleNext();
                      }
                    }
                  }}
                  className={cn(
                    'next-button bg-ink text-white hover:bg-charcoal transition-colors duration-150',
                    nextButtonProps.className
                  )}
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

  // Render Split Layout (Vertical Step Tracker on Light Paper Canvas)
  return (
    <div
      className={cn(
        'flex w-full min-h-screen flex-col md:flex-row bg-canvas text-ink',
        className
      )}
      {...rest}
    >
      {/* Left panel: Vertical Steps Tracker */}
      <aside className="hidden md:flex flex-col w-full md:w-[300px] lg:w-[320px] shrink-0 md:min-h-screen p-4 sm:p-6 justify-between bg-white border-r border-black/10">
        <div className="space-y-6 min-w-0">
          {/* Header section (e.g. Profile banner) */}
          {sidebarHeader && (
            <div className="pb-5 border-b border-dashed border-black/10">
              {sidebarHeader}
            </div>
          )}

          {/* Onboarding title */}
          <div className="min-w-0">
            <span
              className={cn(
                'font-mono text-[10px] font-bold uppercase tracking-[0.14em]',
                accentStyle.eyebrowText
              )}
            >
              {sidebarBrandSubtitle}
            </span>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink mt-1">
              {onboardingTitle}
            </h3>
          </div>

          {/* Steps List */}
          <div className="space-y-3 relative">
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;
              const label = stepLabels && stepLabels[index] ? stepLabels[index] : `Step ${stepNumber}`;
              const status =
                currentStep === stepNumber ? 'active' : currentStep > stepNumber ? 'complete' : 'inactive';
              const isInteractive = !disableStepIndicators && status !== 'inactive';

              return (
                <div key={stepNumber} className="relative">
                  <div
                    role={isInteractive ? 'button' : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    onClick={() => {
                      if (isInteractive) {
                        updateStep(stepNumber);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        updateStep(stepNumber);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3.5 px-4 py-3 rounded-xl border-l-4 transition-colors duration-150 min-w-0',
                      status === 'active'
                        ? accentStyle.sidebarActive
                        : 'border-transparent text-slate hover:text-ink hover:bg-black/[0.02]',
                      isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {/* Circle Indicator */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors duration-150',
                        status === 'active'
                          ? accentStyle.circleActive
                          : status === 'complete'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black/[0.03] text-steel border border-black/10'
                      )}
                    >
                      {status === 'complete' ? <CheckIcon className="w-4 h-4 text-white" /> : stepNumber}
                    </div>

                    {/* Step label text */}
                    <span
                      className={cn(
                        'text-xs sm:text-sm tracking-tight min-w-0 truncate',
                        status === 'active'
                          ? 'text-ink font-bold'
                          : status === 'complete'
                          ? 'text-emerald-700 font-medium'
                          : 'text-steel'
                      )}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Vertical connecting line */}
                  {isNotLastStep && (
                    <div
                      className={cn(
                        'absolute left-[35px] top-[46px] w-[2px] h-[30px] z-0',
                        currentStep > stepNumber ? 'bg-emerald-600' : 'bg-black/10'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar footer section */}
        {resolvedSidebarFooter && (
          <div className="pt-5 border-t border-dashed border-black/10">
            {resolvedSidebarFooter}
          </div>
        )}
      </aside>

      {/* Right panel: Centered Active Step Container */}
      <div className="flex-1 min-w-0 min-h-screen bg-canvas p-3 sm:p-5 md:p-6 flex items-start md:items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl bg-white text-ink border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-4 sm:p-6 flex flex-col justify-between min-w-0">
          {/* Mobile progress: replaces the hidden split sidebar below md. */}
          <div className="md:hidden mb-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="min-w-0">
                <span
                  className={cn(
                    'font-mono text-[10px] font-bold uppercase tracking-[0.14em] block',
                    accentStyle.eyebrowText
                  )}
                >
                  {sidebarBrandSubtitle}
                </span>
                <h3 className="font-display text-base font-bold tracking-tight text-ink mt-0.5 truncate">
                  {onboardingTitle}
                </h3>
              </div>
              <span
                className={cn(
                  'shrink-0 font-mono tabular-nums text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full',
                  accentStyle.badge
                )}
              >
                {currentStep}/{totalSteps}
              </span>
            </div>

            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, totalSteps)}, minmax(0, 1fr))` }}
              aria-label={`${onboardingTitle} progress`}
            >
              {stepsArray.map((_, index) => {
                const stepNumber = index + 1;
                const label = stepLabels && stepLabels[index] ? stepLabels[index] : `Step ${stepNumber}`;
                const status =
                  currentStep === stepNumber ? 'active' : currentStep > stepNumber ? 'complete' : 'inactive';

                return (
                  <button
                    key={stepNumber}
                    type="button"
                    aria-label={label}
                    title={label}
                    disabled={disableStepIndicators || status === 'inactive'}
                    onClick={() => {
                      if (!disableStepIndicators && status !== 'inactive') {
                        updateStep(stepNumber);
                      }
                    }}
                    className={cn(
                      'h-2 rounded-full transition-colors duration-150',
                      status === 'active'
                        ? accentStyle.barActive
                        : status === 'complete'
                        ? 'bg-emerald-600'
                        : 'bg-black/10',
                      disableStepIndicators || status === 'inactive' ? 'cursor-default' : 'cursor-pointer'
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Header of Content card: Back button and progress */}
          <div className="flex justify-between items-center gap-2 mb-5 pb-3.5 border-b border-black/10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-ink transition-colors duration-150 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <span
              className={cn(
                'font-mono tabular-nums text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0',
                accentStyle.badge
              )}
            >
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Active Step Content */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <StepContentWrapper
              isCompleted={isCompleted}
              currentStep={currentStep}
              className={cn('step-content-default', contentClassName)}
            >
              {stepsArray[currentStep - 1]}
            </StepContentWrapper>
          </div>

          {/* Footer Controls */}
          {!isCompleted && !hideFooter && (
            <div className={cn('flex justify-end items-center pt-5 border-t border-black/10 mt-5', footerClassName)}>
              <button
                type="button"
                {...nextButtonProps}
                onClick={(e) => {
                  nextButtonProps.onClick?.(e);
                  if (!e.defaultPrevented) {
                    if (isLastStep) {
                      void handleComplete();
                    } else {
                      void handleNext();
                    }
                  }
                }}
                className={cn(
                  'next-button bg-ink text-white hover:bg-charcoal transition-colors duration-150',
                  nextButtonProps.className
                )}
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

export default Stepper;

function StepContentWrapper({
  isCompleted,
  currentStep,
  children,
  className,
}: {
  isCompleted: boolean;
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}) {
  if (isCompleted) return null;

  return (
    <div key={currentStep} className={cn('w-full min-w-0', className)}>
      {children}
    </div>
  );
}

export function Step({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('step-default', className)}>{children}</div>;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
  accent = 'brand',
  label,
}: {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
  accent?: StepperAccent;
  label?: string;
}) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';
  const accentStyle = ACCENT_STYLES[accent] ?? ACCENT_STYLES.brand;

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 z-10',
        disableStepIndicators ? 'cursor-default opacity-50 pointer-events-none' : 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      <div className="step-indicator">
        <div
          className={cn(
            'step-indicator-inner border',
            status === 'active'
              ? accentStyle.circleActive
              : status === 'complete'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-black/[0.03] text-steel border-black/10'
          )}
        >
          {status === 'complete' ? (
            <CheckIcon className="check-icon" />
          ) : status === 'active' ? (
            <div className="active-dot" />
          ) : (
            <span className="step-number font-mono tabular-nums">{step}</span>
          )}
        </div>
      </div>
      {label && (
        <span
          className={cn(
            'text-[11px] font-semibold text-center transition-colors duration-150 max-w-[80px] sm:max-w-none leading-tight',
            status === 'active'
              ? accentStyle.horizontalLabelActive
              : status === 'complete'
              ? 'text-emerald-700'
              : 'text-steel'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div className="step-connector mt-[-1.25rem]">
      <div
        className="step-connector-inner bg-emerald-600 transition-colors duration-150"
        style={{ width: isComplete ? '100%' : '0%' }}
      />
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
