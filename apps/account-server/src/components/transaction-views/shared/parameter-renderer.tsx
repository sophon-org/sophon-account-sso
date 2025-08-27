import AddressLink from './AddressLink';

export const renderSimpleValue = (
  value: unknown,
): React.JSX.Element | string => {
  if (
    typeof value === 'string' &&
    value.startsWith('0x') &&
    value.length === 42
  ) {
    // It's an address
    return <AddressLink address={value} />;
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
};

export const renderNestedValue = (
  obj: unknown,
  depth = 0,
): React.JSX.Element => {
  const indentClass = depth > 0 ? 'ml-4' : '';

  if (Array.isArray(obj)) {
    return (
      <div className={indentClass}>
        {obj.map((item, index) => (
          <div
            key={`array-${depth}-${index}-${JSON.stringify(item).slice(0, 10)}`}
            className="text-sm text-black"
          >
            <span className="font-bold">
              <span className="mr-1">{'\u2022'}</span>
              {index}
            </span>{' '}
            {renderSimpleValue(item)}
          </div>
        ))}
      </div>
    );
  }

  if (obj && typeof obj === 'object') {
    return (
      <div className={indentClass}>
        {Object.entries(obj as Record<string, unknown>).map(([key, value]) => (
          <div key={key} className="text-sm text-black">
            <span className="font-bold">
              <span className="mr-1">{'\u2022'}</span>
              {key}:
            </span>{' '}
            {Array.isArray(value) || (value && typeof value === 'object') ? (
              <div>{renderNestedValue(value, depth + 1)}</div>
            ) : (
              renderSimpleValue(value)
            )}
          </div>
        ))}
      </div>
    );
  }

  return <span>{renderSimpleValue(obj)}</span>;
};

export const renderParameterValue = (arg: {
  name: string;
  value: string;
  type: string;
}): React.JSX.Element | string => {
  if (arg.type === 'address') {
    return <AddressLink address={arg.value} />;
  }

  // Check if it's a complex object (starts with { or [)
  if (
    arg.type === 'tuple' ||
    arg.value.startsWith('{') ||
    arg.value.startsWith('[')
  ) {
    try {
      const parsed = JSON.parse(arg.value);
      if (typeof parsed === 'object') {
        return <div className="mt-1">{renderNestedValue(parsed)}</div>;
      }
    } catch {
      // If JSON parsing fails, display as is
    }
  }

  return <span>{arg.value}</span>;
};
