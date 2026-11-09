import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin, errorResponse, getBaseUrl, HttpError, json } from "@/lib/http";
import { createPaymentSession } from "@/lib/payments";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const { id } = await params;
    const result = await createPaymentSession(id, user.id, getBaseUrl(request));
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
