import type { RequestHandler } from "express";
import { authenticateToken, readSessionCookie } from "../services/auth";

export type Actor = {
  userId: import("mongoose").Types.ObjectId;
  role: string;
  patientId?: import("mongoose").Types.ObjectId;
  email?: string;
  mobile?: string;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = readSessionCookie(req);
    if (!token) {
      res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue.", requestId: res.locals.requestId } });
      return;
    }
    const actor = await authenticateToken(token);
    if (!actor) {
      res.status(401).json({ error: { code: "SESSION_INVALID", message: "Your session has expired. Sign in again.", requestId: res.locals.requestId } });
      return;
    }
    res.locals.actor = actor satisfies Actor;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRoles(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const actor = res.locals.actor as Actor | undefined;
    if (!actor || !roles.includes(actor.role)) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have permission to do this.", requestId: res.locals.requestId } });
      return;
    }
    next();
  };
}

export function getActor(res: import("express").Response): Actor {
  return res.locals.actor as Actor;
}
