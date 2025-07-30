export default function MessageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 p-6 rounded-3xl h-[336px] overflow-y-auto border border-[rgba(255,255,255,0.48)] text-left bg-[rgba(255,255,255,0.48)] backdrop-blur-xs shadow-[0px_0px_2px_2px_rgba(15,14,13,0.04),0px_0px_0px_4px_rgba(15,14,13,0.04),0px_2px_24px_0px_#CCE4FF,0px_12px_36px_0px_#FFECE0] w-full">
      <div className="text-sm text-black">{children}</div>
    </div>
  );
}
