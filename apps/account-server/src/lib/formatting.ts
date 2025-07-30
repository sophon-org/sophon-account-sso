export function shortenAddress(
  address: `0x${string}` | string | undefined,
  chars = 3,
): string | undefined {
  return address && `${address.slice(0, chars + 3)}...${address.slice(-5)}`;
}

export function formatNumberWithCommas(number: number): string {
  // Split number into integer and decimal parts
  const parts = number.toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Handle decimal part if it exists
  if (parts.length > 1) {
    const decimalPart = parts[1].slice(0, 9); // Limit to 9 decimal places
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}
