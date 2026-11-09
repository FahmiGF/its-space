import { getAvailability } from "@/lib/facilities";
import { errorResponse, json } from "@/lib/http";
import { isDateString, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? todayInJakarta();
    if (!isDateString(date)) {
      return json({ error: "Tanggal tidak valid." }, 422);
    }
    const availability = await getAvailability(slug, date);
    return json({ date, ...availability });
  } catch (error) {
    return errorResponse(error);
  }
}
