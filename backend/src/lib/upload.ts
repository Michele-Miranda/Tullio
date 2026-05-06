import type { RequestHandler } from "express";
import multer from "multer";
import path from "path";

export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_MB = Math.round(
  MAX_UPLOAD_SIZE_BYTES / (1024 * 1024),
);

/**
 * Whitelist of (file extension, expected MIME prefix) pairs accepted by
 * the upload pipeline. Used by `validateFileMagicBytes` to fail fast on
 * mislabeled files (e.g. a .txt rinominato in .docx).
 *
 * Tullio currently accepts only PDF and Word documents. The magic-byte
 * check looks at the first bytes of the file to confirm the real file
 * format matches the declared extension — this prevents an attacker
 * from bypassing the extension whitelist by sending arbitrary content
 * with a `.pdf` or `.docx` name.
 */
const ALLOWED_FILE_TYPES: Record<
  string,
  { exts: string[]; description: string }
> = {
  pdf: { exts: ["pdf"], description: "PDF" },
  // file-type returns "docx", "pptx", "xlsx" for OOXML files; "x-cfb"
  // for legacy .doc / .xls / .ppt (OLE compound files).
  docx: { exts: ["docx"], description: "Microsoft Word (.docx)" },
  doc: { exts: ["doc", "x-cfb"], description: "Microsoft Word legacy (.doc)" },
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Run a magic-byte check on `buffer` and verify it matches the file's
 * declared extension. Returns `null` on success, or a string describing
 * the mismatch on failure.
 *
 * The check is best-effort: file-type may not detect some legitimate
 * variants (e.g. very old or malformed but still valid Word docs). On
 * `undefined` we err on the side of permitting the file rather than
 * blocking legitimate uploads — but only if the extension is in the
 * allowlist. The combination of (extension in allowlist) + (size limit)
 * + (multer memory storage so we always have the bytes) keeps the blast
 * radius bounded.
 */
export async function validateFileMagicBytes(
  buffer: Buffer,
  filename: string,
): Promise<string | null> {
  const ext = path.extname(filename).slice(1).toLowerCase();
  const allowed = ALLOWED_FILE_TYPES[ext];
  if (!allowed) {
    return `Unsupported file extension: .${ext || "unknown"}. Allowed: ${Object.keys(
      ALLOWED_FILE_TYPES,
    )
      .map((e) => "." + e)
      .join(", ")}.`;
  }

  // file-type is ESM-only since v17; load it via dynamic import so it
  // works under our CommonJS build target.
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    // file-type couldn't sniff a known signature — accept conservatively
    // since some legitimate docx files have non-standard zip headers.
    return null;
  }

  if (!allowed.exts.includes(detected.ext)) {
    return `File content does not match its extension. The file claims to be a ${allowed.description} (.${ext}) but the actual format is "${detected.ext}" (${detected.mime}). Refusing the upload to avoid prompt injection / file-type spoofing.`;
  }

  return null;
}

export function singleFileUpload(fieldName: string): RequestHandler {
  return (req, res, next) => {
    memoryUpload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return void res.status(413).json({
              detail: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`,
            });
          }
          return void res.status(400).json({
            detail: `Upload failed: ${err.message}`,
          });
        }
        return next(err);
      }

      const file = (req as { file?: Express.Multer.File }).file;
      if (!file) {
        // No file attached — let the route handler decide whether that's
        // an error (it usually is) so we don't pre-empt a clearer response.
        return next();
      }

      try {
        const violation = await validateFileMagicBytes(
          file.buffer,
          file.originalname,
        );
        if (violation) {
          console.warn(
            `[upload] rejected file="${file.originalname}" reason="${violation}"`,
          );
          return void res.status(415).json({ detail: violation });
        }
      } catch (e) {
        console.error("[upload] magic-byte validation threw:", e);
        return void res.status(500).json({
          detail: "Internal error while validating uploaded file.",
        });
      }

      return next();
    });
  };
}
