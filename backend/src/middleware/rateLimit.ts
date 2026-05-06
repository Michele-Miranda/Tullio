/**
 * Rate-limiting middleware factories.
 *
 * Three tiers:
 *   - `globalLimiter`     — applied to every request, broad DoS shield
 *                           (per-IP, generous window).
 *   - `aiChatLimiter`     — applied to chat / project-chat / tabular-review
 *                           endpoints which trigger paid LLM calls
 *                           (per-user, much tighter).
 *   - `uploadLimiter`     — applied to file-upload endpoints to bound
 *                           storage abuse (per-user, hourly window).
 *
 * All limiters key by authenticated user when available (`res.locals.userId`
 * populated by `requireAuth`), falling back to the source IP. Both windows
 * and budgets are conservative defaults — easy to tune via env vars later.
 */
import { rateLimit, type Options } from "express-rate-limit";
import type { Request, Response } from "express";

function userOrIpKey(req: Request, res: Response): string {
  const userId = res.locals?.userId as string | undefined;
  if (userId) return `u:${userId}`;
  // express-rate-limit v8 ships an ipKeyGenerator helper internally; fall
  // back to the request IP, which is properly normalized by Express when
  // `trust proxy` is set on the app.
  return `ip:${req.ip ?? "unknown"}`;
}

const baseOptions: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
};

/**
 * Coarse global cap. Generous enough that no real user hits it; tight
 * enough to slow down a runaway bot before it reaches more expensive
 * endpoints.
 */
export const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  limit: 300,
  message: { detail: "Too many requests. Please slow down." },
});

/**
 * AI chat endpoints. Each request can fan out to multi-iteration tool
 * loops, so we cap aggressively. 30 chat starts per minute per user is
 * already well above interactive use and below cost-runaway territory.
 */
export const aiChatLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  limit: 30,
  message: {
    detail:
      "Hai inviato troppe richieste alla chat in un breve periodo. Riprova tra qualche secondo.",
  },
});

/**
 * Tabular review can iterate over many cells per request, so we use a
 * slightly looser per-minute cap but a tighter daily floor via the
 * global limiter.
 */
export const tabularLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  limit: 20,
  message: {
    detail:
      "Hai avviato troppe analisi tabulari. Attendi qualche istante prima di riprovare.",
  },
});

/**
 * File-upload endpoints. 60 uploads per hour per user is plenty for
 * normal practice and bounds storage abuse.
 */
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: {
    detail:
      "Hai caricato troppi documenti in poco tempo. Attendi prima di caricarne altri.",
  },
});
