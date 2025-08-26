import { Card } from './card';

export default function MessageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card elevated className="mt-4 p-6 overflow-y-auto text-left w-full">
      <div className="text-sm text-black h-full break-all">{children}</div>
    </Card>
  );
}
