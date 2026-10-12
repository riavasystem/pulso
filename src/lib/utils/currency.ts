export function formatCurrency(
  amount: number,
  currency = "CLP",
  locale = "es-CL",
) {
  if (!Number.isFinite(amount)) {
    throw new RangeError("El monto debe ser un número finito.");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(amount);
}

export function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
