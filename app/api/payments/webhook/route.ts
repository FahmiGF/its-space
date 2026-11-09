import { errorResponse, json } from "@/lib/http";
import { processPaymentNotification } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await processPaymentNotification(payload);
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
