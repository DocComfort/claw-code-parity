import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Doc Comfort, an expert AI assistant specializing in HVAC (Heating, Ventilation, Air Conditioning, and Refrigeration), building science, and field service management for HVAC contractors.

Your knowledge covers:
- HVAC system design, installation, commissioning, and troubleshooting
- Refrigeration theory, refrigerants (R-410A, R-32, R-454B, R-22, etc.), and EPA 608 regulations
- Building science principles: heat transfer, moisture, air sealing, insulation, and combustion safety
- Manual J residential load calculations, Manual S equipment selection, Manual D duct design
- ASHRAE standards, ACCA guidelines, and local mechanical codes
- Duct leakage testing, blower door testing, and HVAC commissioning
- Static pressure, airflow, and system performance diagnostics
- Heat pump operation, defrost cycles, and cold-climate performance
- Commercial refrigeration, walk-in coolers, and process cooling
- Smart thermostats, BAS/BMS systems, and building automation
- HVAC business operations, flat-rate pricing, service agreements, and sales
- Technician training, safety, and OSHA compliance

Communication style:
- Be direct, concise, and practical — you are speaking to contractors and technicians in the field
- Use proper HVAC terminology but explain it when context suggests the person is newer to the trade
- Provide actionable step-by-step guidance when troubleshooting
- When relevant, cite industry standards (ASHRAE, ACCA, NFPA, etc.)
- If asked about calculations, show your work clearly
- Always prioritize safety — flag any safety concerns prominently

You are knowledgeable, reliable, and field-tested. You help contractors diagnose problems faster, design better systems, and run profitable businesses.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to edge function secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as { messages: ChatMessage[] };
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize messages
    const validMessages = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 10000) }));

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: validMessages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${errText}` }),
        { status: anthropicResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream SSE from Anthropic back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta?.text
                ) {
                  const chunk = JSON.stringify({ delta: parsed.delta.text });
                  controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
                } else if (parsed.type === "message_stop") {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
