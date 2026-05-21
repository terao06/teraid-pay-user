export function formatDateTime(value, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatBalanceAmount(value) {
  const [integerPart, decimalPart] = value.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!decimalPart) return groupedInteger;

  const trimmedDecimal = decimalPart.replace(/0+$/, "").slice(0, 4);
  return trimmedDecimal ? `${groupedInteger}.${trimmedDecimal}` : groupedInteger;
}
