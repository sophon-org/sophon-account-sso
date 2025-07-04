import { cn } from "@/lib/cn";

export const LegalNotice = ({ className }: { className?: string }) => {
  return (
    <div className={cn("text-md text-black text-center px-6 py-8", className)}>
      By logging in you are accepting our <a href="/terms">Terms of Use</a> and{" "}
      <a href="/privacy">Privacy Policy</a>.
    </div>
  );
};
