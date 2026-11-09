import { getCurrentUser } from "@/lib/auth";
import { errorResponse, json } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
