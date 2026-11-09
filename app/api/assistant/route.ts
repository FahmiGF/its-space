import { z } from "zod";
import { answerAssistant } from "@/lib/assistant";
import { assertSameOrigin, errorResponse, json } from "@/lib/http";

const schema = z.object({
  query: z.string().trim().min(3, "Tulis pertanyaan minimal 3 karakter.").max(240),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const result = await answerAssistant(input.query);
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
