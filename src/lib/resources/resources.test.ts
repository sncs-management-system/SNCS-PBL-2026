import { describe, expect, it } from "vitest";
import { formatFileSize, isSafePdfPath, MAX_PDF_BYTES, parsePublicResource, resourceFilename } from "./model";
import { readPdf } from "./download";

const published = { id: 1, title: "TLC Form", category: "TLC Forms", storage_path: "tlc/form.pdf", file_size_bytes: 3922034, status: "published", visibility: "public" };

describe("public resource boundary", () => {
  it("maps public published rows and rejects draft/private/archived records", () => {
    expect(parsePublicResource(published)?.fileSizeBytes).toBe(3922034);
    for (const fields of [{ status: "draft" }, { status: "archived" }, { visibility: "private" }]) {
      expect(parsePublicResource({ ...published, ...fields })).toBeNull();
    }
  });
  it("rejects malformed identifiers, paths and size metadata", () => {
    for (const fields of [{ id: Number.MAX_SAFE_INTEGER + 1 }, { title: " " }, { file_size_bytes: MAX_PDF_BYTES + 1 }, { storage_path: "../private.pdf" }]) {
      expect(parsePublicResource({ ...published, ...fields })).toBeNull();
    }
    for (const path of ["/form.pdf", "tlc/../form.pdf", "https://example.com/form.pdf", "form.pdf?x=1", "tlc\\form.pdf", "form.html"]) {
      expect(isSafePdfPath(path)).toBe(false);
    }
    expect(parsePublicResource({ ...published, id: "9007199254740993" })?.id).toBe("9007199254740993");
  });
  it("formats measured sizes and creates useful safe filenames", () => {
    expect(formatFileSize(3922034)).toBe("3.92 MB");
    expect(formatFileSize(5082223)).toBe("5.08 MB");
    expect(resourceFilename("TLC Scholar Transfer Form")).toBe("TLC-Scholar-Transfer-Form.pdf");
    expect(resourceFilename("../Niño: Form?")).toBe("Nino-Form.pdf");
  });
});

describe("PDF download validation", () => {
  it("preserves valid PDF bytes and rejects HTTP failures and non-PDF responses", async () => {
    const pdf = await readPdf(new Response("%PDF-1.7\nbody"), 13);
    expect(await pdf.text()).toBe("%PDF-1.7\nbody");
    expect(pdf.type).toBe("application/pdf");
    await expect(readPdf(new Response("error", { status: 404 }), 5)).rejects.toThrow();
    await expect(readPdf(new Response("<html>"), 6)).rejects.toThrow();
  });
  it("rejects truncated, changed and oversized files before saving", async () => {
    await expect(readPdf(new Response("%PDF-"), 10)).rejects.toThrow();
    await expect(readPdf(new Response("%PDF-extra"), 5)).rejects.toThrow();
    await expect(readPdf(new Response("%PDF-", { headers: { "Content-Length": String(MAX_PDF_BYTES + 1) } }), 5)).rejects.toThrow();
  });
});
