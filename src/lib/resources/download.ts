import { MAX_PDF_BYTES, resourceFilename, type PublicResource } from "./model";

// Read with a hard limit so a changed/misconfigured remote file cannot grow without bound.
export async function readPdf(response: Response, expectedBytes: number): Promise<Blob> {
  if (!response.ok || !response.body || expectedBytes < 5 || expectedBytes > MAX_PDF_BYTES) {
    throw new Error("The PDF is unavailable.");
  }
  const length = response.headers.get("content-length");
  if (length && Number(length) > MAX_PDF_BYTES) throw new Error("The PDF exceeds the size limit.");
  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PDF_BYTES || total > expectedBytes) throw new Error("The PDF size has changed.");
      chunks.push(value.slice().buffer as ArrayBuffer);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const blob = new Blob(chunks, { type: "application/pdf" });
  if (total !== expectedBytes || await blob.slice(0, 5).text() !== "%PDF-") {
    throw new Error("The downloaded file is incomplete or is not a PDF.");
  }
  return blob;
}

export function savePdf(blob: Blob, resource: PublicResource): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = resourceFilename(resource.title);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser time to consume the URL before releasing its backing data.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}
