/**
 * Trigger a browser download for an in-memory blob.
 *
 * The create/click/revoke dance was written out four times across the ICS and
 * image exporters; getting one of the steps wrong leaks an object URL for the
 * lifetime of the page.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
