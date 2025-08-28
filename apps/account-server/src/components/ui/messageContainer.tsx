import { Card } from './card';

export default function MessageContainer({
  children,
  showBottomButton = false,
}: {
  children: React.ReactNode;
  showBottomButton?: boolean;
}) {
  return (
    <Card
      elevated
      className={`mt-4 px-6 pt-6 ${
        showBottomButton ? 'pb-[4.5rem]' : 'pb-6'
      } overflow-y-auto text-left w-full relative`}
    >
      <div className="text-sm text-black h-full break-all">{children}</div>
    </Card>
  );
}
