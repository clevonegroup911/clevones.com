import { NextResponse } from "next/server";

export type JsonBodyOk = { ok: true; body: unknown };
export type JsonBodyErr = { ok: false; response: NextResponse };
export type JsonBodyResult = JsonBodyOk | JsonBodyErr;

/**
 * Read and parse a JSON request body without letting SyntaxError escape as 500.
 * Empty or malformed payloads return a deterministic 400 JSON response.
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Impossible de lire le corps de la requête." },
        { status: 400 },
      ),
    };
  }

  if (!raw.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Corps JSON manquant." },
        { status: 400 },
      ),
    };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON malformé." }, { status: 400 }),
    };
  }
}
