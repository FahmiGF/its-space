import { destroySession } from "@/lib/auth";
import { assertSameOrigin, errorResponse, json } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await destroySession();
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
