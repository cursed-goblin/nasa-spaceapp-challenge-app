export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain",
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(filename: string, value: unknown): void {
  downloadTextFile(filename, JSON.stringify(value, null, 2), "application/json");
}
