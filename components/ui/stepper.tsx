"use client";

import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center">
              {i === currentStep && (
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md scale-150" />
              )}
              <div
                className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center
                  text-sm font-semibold transition-all duration-500
                  ${
                    i < currentStep
                      ? "bg-white text-black"
                      : i === currentStep
                        ? "bg-white text-black shadow-[0_0_0_4px_rgba(255,255,255,0.15)]"
                        : "bg-white/5 text-slate-200 border border-white/15"
                  }
                `}
              >
                {i < currentStep ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            </div>

            <span
              className={`
                text-[11px] font-medium tracking-wide transition-all duration-300
                ${i === currentStep ? "text-white" : i < currentStep ? "text-slate-200" : "text-slate-200"}
              `}
            >
              {step.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div className="relative mx-3 mb-6 flex-1 w-14 h-px overflow-hidden">
              <div className="absolute inset-0 bg-white/15 rounded-full" />
              <div
                className="absolute inset-0 bg-white rounded-full transition-all duration-500 origin-left"
                style={{ transform: `scaleX(${i < currentStep ? 1 : 0})` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
