/**
 * Audit-trail helpers.
 *
 * Logs every model invocation (chat, project chat, tabular cell, completion)
 * to `model_invocations` and persists citation validation failures to
 * `citation_validation_failures`. Both tables are created by the
 * `001_audit_governance.sql` migration.
 *
 * All inserts are intentionally fire-and-forget at the call site (we
 * `await` here but never throw on insert failure): an audit log failure
 * must not break the user-facing response, but we do log to console for
 * operational visibility.
 */

import { createServerSupabase } from "./supabase";
import type { LlmUsage } from "./llm";

export type InvocationSurface =
    | "chat"
    | "project_chat"
    | "tabular"
    | "tabular_cell"
    | "completion"
    | "other";

export type ModelInvocationLog = {
    userId: string | null;
    chatId?: string | null;
    projectId?: string | null;
    workflowId?: string | null;
    surface: InvocationSurface;
    model: string;
    usage: LlmUsage;
    latencyMs: number;
    status: "ok" | "error";
    errorMessage?: string | null;
};

/**
 * Insert a row in `model_invocations`. Returns the inserted id when
 * available so callers can link citation validation failures back to a
 * specific invocation.
 */
export async function logModelInvocation(
    db: ReturnType<typeof createServerSupabase>,
    log: ModelInvocationLog,
): Promise<string | null> {
    try {
        const { data, error } = await db
            .from("model_invocations")
            .insert({
                user_id: log.userId,
                chat_id: log.chatId ?? null,
                project_id: log.projectId ?? null,
                workflow_id: log.workflowId ?? null,
                surface: log.surface,
                model: log.model,
                provider: log.usage.provider,
                iterations: log.usage.iterations,
                input_tokens: log.usage.input_tokens,
                output_tokens: log.usage.output_tokens,
                latency_ms: log.latencyMs,
                status: log.status,
                error_message: log.errorMessage ?? null,
            })
            .select("id")
            .single();
        if (error) {
            console.error("[audit] logModelInvocation insert failed:", error);
            return null;
        }
        return (data as { id?: string } | null)?.id ?? null;
    } catch (err) {
        console.error("[audit] logModelInvocation threw:", err);
        return null;
    }
}

export type CitationFailureLog = {
    userId: string | null;
    chatId?: string | null;
    invocationId?: string | null;
    docId: string;
    documentId?: string | null;
    ref: number;
    page: number | string;
    quote: string;
    status: "quote_not_found" | "doc_not_found" | "skipped";
};

/**
 * Persist citation validation failures so we can audit hallucination
 * patterns over time. We deliberately log `skipped` separately from
 * actual failures so dashboards can distinguish "we didn't validate"
 * from "we validated and the model lied".
 */
export async function logCitationFailures(
    db: ReturnType<typeof createServerSupabase>,
    failures: CitationFailureLog[],
): Promise<void> {
    if (!failures.length) return;
    try {
        const rows = failures.map((f) => ({
            user_id: f.userId,
            chat_id: f.chatId ?? null,
            invocation_id: f.invocationId ?? null,
            doc_id: f.docId,
            document_id: f.documentId ?? null,
            ref: f.ref,
            page: typeof f.page === "number" ? String(f.page) : f.page,
            quote: f.quote,
            status: f.status,
        }));
        const { error } = await db
            .from("citation_validation_failures")
            .insert(rows);
        if (error) {
            console.error(
                "[audit] logCitationFailures insert failed:",
                error,
            );
        }
    } catch (err) {
        console.error("[audit] logCitationFailures threw:", err);
    }
}

/**
 * Extract citation validation failures from a list of annotations
 * produced by `extractAnnotations`. Used by the route handlers to
 * persist them to `citation_validation_failures`.
 */
export function citationFailuresFromAnnotations(
    annotations: unknown[],
    common: { userId: string | null; chatId?: string | null; invocationId?: string | null },
): CitationFailureLog[] {
    const out: CitationFailureLog[] = [];
    for (const a of annotations) {
        if (!a || typeof a !== "object") continue;
        const obj = a as Record<string, unknown>;
        if (obj.type !== "citation_data") continue;
        const status = obj.validation_status as string | undefined;
        if (status === "quote_not_found" || status === "doc_not_found") {
            out.push({
                userId: common.userId,
                chatId: common.chatId ?? null,
                invocationId: common.invocationId ?? null,
                docId: String(obj.doc_id ?? ""),
                documentId: (obj.document_id as string | undefined) ?? null,
                ref: Number(obj.ref ?? 0),
                page: (obj.page as number | string | undefined) ?? "",
                quote: String(obj.quote ?? ""),
                status,
            });
        }
    }
    return out;
}
