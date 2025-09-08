import { Card } from './card';

export default function MessageContainer({
  children,
  showBottomButton = false,
  isMobile = false,
}: {
  children: React.ReactNode;
  showBottomButton?: boolean;
  isMobile?: boolean;
}) {
  return (
    <Card
      elevated
      className={`mt-4 px-6 pt-6 ${
        showBottomButton ? 'pb-[3.5rem]' : 'pb-6'
      } ${isMobile ? 'max-w-full' : 'max-w-[352px]'} overflow-y-auto text-left w-full relative`}
    >
      <div className="text-sm text-black h-full break-words">{children}</div>
    </Card>
  );
}
