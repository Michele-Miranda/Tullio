/**
 * Minimal ambient declaration for the ESM-only `file-type` package.
 *
 * `file-type` is ESM-only since v17 and ships type definitions in
 * `package.json#exports` that the CommonJS-targeted TypeScript compiler
 * cannot resolve under `moduleResolution: node`. Upgrading to `node16` /
 * `bundler` would ripple through the rest of the codebase, so we declare
 * just the surface we actually use.
 *
 * Loaded via dynamic `import("file-type")` in `lib/upload.ts`.
 */
declare module "file-type" {
    export type FileTypeResult = {
        ext: string;
        mime: string;
    };

    export function fileTypeFromBuffer(
        buffer: Uint8Array | ArrayBuffer | Buffer,
    ): Promise<FileTypeResult | undefined>;
}
