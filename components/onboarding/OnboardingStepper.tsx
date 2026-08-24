interface OnboardingStepperProps {
  currentStep: number;
  steps: string[];
}

export function OnboardingStepper({ currentStep, steps }: OnboardingStepperProps) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{steps[currentStep]}</span>
        <span>
          {currentStep + 1} / {steps.length}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
