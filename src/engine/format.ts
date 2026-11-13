const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export function fmtNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "∞";
  if (digits > 0) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  }
  return numberFormatter.format(value);
}

export function fmtDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function fmtMusd(value: number): string {
  if (!Number.isFinite(value)) return "Unlimited";
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(2)}B`;
  if (Math.abs(value) < 10) return `$${value.toFixed(1)}M`;
  return `$${fmtNumber(value)}M`;
}

export function fmtMass(value: number): string {
  if (value >= 1000) return `${fmtDecimal(value / 1000)} t`;
  return `${fmtNumber(value)} kg`;
}

export function fmtPower(value: number): string {
  if (value >= 1000) return `${fmtDecimal(value / 1000)} kW`;
  return `${fmtNumber(value)} W`;
}

export function fmtEnergy(value: number): string {
  if (value >= 1000) return `${fmtDecimal(value / 1000)} kWh`;
  return `${fmtNumber(value)} Wh`;
}

export function fmtData(value: number): string {
  if (value < 1) return `${value.toFixed(2)} Gb`;
  if (value >= 1000) return `${fmtDecimal(value / 1000)} Tb`;
  return `${fmtNumber(value, value < 10 ? 1 : 0)} Gb`;
}

export function fmtDataRate(value: number): string {
  return `${fmtData(value)}/day`;
}

export function fmtPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function fmtArcsec(value: number): string {
  if (value < 1) return `${value.toFixed(1)}″`;
  if (value >= 60) {
    const degrees = value / 3600;
    return `${fmtNumber(degrees, degrees < 1 ? 2 : 1)}°`;
  }
  return `${fmtNumber(value)}″`;
}

export function fmtMonths(value: number): string {
  if (value >= 12) {
    const years = value / 12;
    return `${fmtNumber(years, years % 1 === 0 ? 0 : 1)} yr`;
  }
  return `${fmtNumber(value)} mo`;
}

export function fmtDays(value: number): string {
  if (value >= 365) {
    const years = value / 365;
    return `${fmtNumber(years, years % 1 === 0 ? 0 : 1)} yr`;
  }
  return `${fmtNumber(value)} d`;
}

export function fmtDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
