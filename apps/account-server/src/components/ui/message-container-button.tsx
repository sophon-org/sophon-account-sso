interface MessageContainerButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export default function MessageContainerButton({
  onClick,
  children,
}: MessageContainerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-[#FAF8F5] rounded-b-xl absolute bottom-0 left-0 h-11 cursor-pointer hover:bg-[#F5F1E8] transition-colors"
    >
      {children}
    </button>
  );
}
