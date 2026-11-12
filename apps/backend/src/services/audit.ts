import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { AuditLog } from "../models";
import { getActor } from "../middleware/auth";

export async function writeAudit(req: Request, res: Response, entry: {
  action: string;
  resourceType: string;
  resourceId?: unknown;
  outcome: "success" | "denied" | "failure";
  reason?: string;
}): Promise<void> {
  const actor = res.locals.actor ? getActor(res) : undefined;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  await AuditLog.create({
    actorUserId: actor?.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    outcome: entry.outcome,
    reason: entry.reason,
    requestId: res.locals.requestId,
    ipHash: createHash("sha256").update(ip).digest("hex"),
  });
}
