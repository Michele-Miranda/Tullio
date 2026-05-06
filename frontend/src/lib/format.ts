const LOCALE = "it-IT";
const TIME_ZONE = "Europe/Rome";

export function formatDate(
    value: string | number | Date,
    options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
    return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(
        new Date(value),
    );
}

export function formatDateTime(value: string | number | Date): string {
    return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDateShort(value: string | number | Date): string {
    return formatDate(value, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatNumber(
    value: number,
    options: Intl.NumberFormatOptions = {},
): string {
    return new Intl.NumberFormat(LOCALE, options).format(value);
}

export function formatCurrency(
    value: number,
    currency: string = "EUR",
): string {
    return new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
    }).format(value);
}

export function formatPercent(value: number, fractionDigits: number = 1): string {
    return new Intl.NumberFormat(LOCALE, {
        style: "percent",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value);
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${formatNumber(value, { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}

const RTF = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function formatRelativeTime(value: string | number | Date): string {
    const date = new Date(value);
    const diffMs = date.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const absSec = Math.abs(diffSec);

    if (absSec < 60) return RTF.format(diffSec, "second");
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return RTF.format(diffMin, "minute");
    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) return RTF.format(diffHour, "hour");
    const diffDay = Math.round(diffHour / 24);
    if (Math.abs(diffDay) < 30) return RTF.format(diffDay, "day");
    const diffMonth = Math.round(diffDay / 30);
    if (Math.abs(diffMonth) < 12) return RTF.format(diffMonth, "month");
    const diffYear = Math.round(diffMonth / 12);
    return RTF.format(diffYear, "year");
}
