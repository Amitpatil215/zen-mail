export function requireWorkerSecret(request: Request) {
  const expected = process.env.WORKER_SECRET;
  if (!expected) throw new Error("WORKER_SECRET not configured.");
  const got = request.headers.get("x-worker-secret");
  if (!got || got !== expected) throw new Error("Unauthorized worker.");
}

