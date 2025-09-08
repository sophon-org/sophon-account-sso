export const OpenAction = ({
  sendMessage,
}: {
  sendMessage: (message: { action: string; payload: unknown }) => void;
}) => {
  return (
    <button
      className="bg-purple-500/30 text-black border border-purple-500/50 px-4 py-2 rounded-md hover:bg-purple-500/50 transition-all duration-300 hover:cursor-pointer w-full"
      onClick={() => sendMessage({ action: 'openModal', payload: {} })}
      type="button"
    >
      Open Bottom Sheet
    </button>
  );
};
