import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
      requestId: res.locals.requestId,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const err = error instanceof Error ? error : new Error("Unknown error");
  const requestId = res.locals.requestId as string | undefined;
  const isBadJson = err instanceof SyntaxError && "body" in err;
  const isCorsDenied = err.message === "CORS_ORIGIN_DENIED";
  const status = isBadJson ? 400 : isCorsDenied ? 403 : 500;
  const code = isBadJson ? "INVALID_JSON" : isCorsDenied ? "ORIGIN_NOT_ALLOWED" : "INTERNAL_ERROR";
  const message = isBadJson
    ? "The request body contains invalid JSON."
    : isCorsDenied
      ? "This origin is not allowed."
      : "An unexpected error occurred.";

  if (status === 500) {
    console.error("Unhandled request error", { requestId, message: err.message });
  }

  res.status(status).json({ error: { code, message, requestId } });
};
