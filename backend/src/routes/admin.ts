/**
 * Admin endpoints — operazioni amministrative non legate a un singolo
 * utente. Protette da token statico configurato via env (ADMIN_API_TOKEN),
 * passato nell'header `X-Admin-Token`.
 *
 * Il token va trattato come secret di alto valore: ruotarlo regolarmente,
 * non condividerlo via email/Slack, e non esporlo a frontend client.
 *
 * Operazioni esposte:
 *   - POST /admin/retention/run  — esegue la funzione SQL
 *                                  `public.tullio_run_retention` con le
 *                                  soglie passate in body o quelle di
 *                                  default. Pensata per essere invocata
 *                                  da un cron esterno (cron job, GitHub
 *                                  Actions, Supabase Scheduled Function).
 */

import { Router, type RequestHandler } from "express";
import { createServerSupabase } from "../lib/supabase";

export const adminRouter = Router();

const requireAdminToken: RequestHandler = (req, res, next) => {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
        res.status(503).json({
            detail:
                "Admin API non configurata. Settare ADMIN_API_TOKEN nelle env.",
        });
        return;
    }
    const provided =
        (req.headers["x-admin-token"] as string | undefined) ?? "";
    if (provided.length === 0 || provided !== expected) {
        res.status(401).json({ detail: "Admin token mancante o invalido." });
        return;
    }
    next();
};

adminRouter.post("/retention/run", requireAdminToken, async (req, res) => {
    const body = (req.body ?? {}) as {
        chat_days?: number;
        audit_days?: number;
    };
    const chatDays =
        typeof body.chat_days === "number" && body.chat_days > 0
            ? body.chat_days
            : 365;
    const auditDays =
        typeof body.audit_days === "number" && body.audit_days > 0
            ? body.audit_days
            : 90;

    const db = createServerSupabase();
    const { data, error } = await db.rpc("tullio_run_retention", {
        p_chat_days: chatDays,
        p_audit_days: auditDays,
    });

    if (error) {
        console.error("[admin/retention] failed:", error);
        res.status(500).json({ detail: error.message });
        return;
    }

    const summary = Array.isArray(data) && data.length ? data[0] : data;
    console.log(
        `[admin/retention] ran with chat_days=${chatDays} audit_days=${auditDays}: ${JSON.stringify(summary)}`,
    );
    res.json({
        ok: true,
        chat_days: chatDays,
        audit_days: auditDays,
        deleted: summary,
        run_at: new Date().toISOString(),
    });
});

adminRouter.get("/health", requireAdminToken, (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});
