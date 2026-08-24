import { OnboardingWizard } from "./OnboardingWizard";

/** Blocking first-run modal — no close affordance, since a profile is required to use the app.
 * Disappears on its own once ProfileGate sees a profile in the store. */
export function OnboardingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 dark:bg-slate-950/80">
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:p-8 dark:bg-slate-900">
        <OnboardingWizard />
      </div>
    </div>
  );
}
