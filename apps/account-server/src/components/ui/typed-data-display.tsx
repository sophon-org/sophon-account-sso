import { renderNestedValue } from '../transaction-views/shared/parameter-renderer';

interface TypedDataDisplayProps {
  data: unknown;
  depth?: number;
}

export default function TypedDataDisplay({
  data,
  depth = 0,
}: TypedDataDisplayProps) {
  return <div>{renderNestedValue(data, depth)}</div>;
}
