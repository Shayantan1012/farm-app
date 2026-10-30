export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "datetime";
  minimum?: string;
  maximum?: string;
  optional?: boolean;
};

export function localDateValue(date: Date) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`;
}

export function localDateTimeValue(date: Date) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${localDateValue(date)}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function pickerDate(value: string, mode: "date" | "datetime") {
  if (value) {
    const parsed =
      mode === "date"
        ? new Date(
            Number(value.slice(0, 4)),
            Number(value.slice(5, 7)) - 1,
            Number(value.slice(8, 10)),
            12,
          )
        : new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date(Date.now() + (mode === "datetime" ? 3600000 : 0));
  if (mode === "datetime") {
    fallback.setSeconds(0, 0);
    fallback.setMinutes(Math.ceil(fallback.getMinutes() / 15) * 15);
  }
  return fallback;
}
