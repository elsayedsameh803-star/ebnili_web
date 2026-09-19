import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

interface GenerateRequest {
  prompt: string;
  templateType?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!geminiApiKey && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: setting } = await adminClient
        .from("app_settings")
        .select("value")
        .eq("key", "gemini_api_key")
        .maybeSingle();
      if (setting?.value) {
        geminiApiKey = setting.value;
      }
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured. Please add it in Admin Dashboard > Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GenerateRequest = await req.json();
    const { prompt, templateType } = body;

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isPro = false;
    let credits = 0;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        userId = userData.user.id;
        const { data: profile } = await userClient
          .from("profiles")
          .select("credits, subscription_tier, role")
          .eq("id", userData.user.id)
          .maybeSingle();
        if (profile) {
          isPro = profile.subscription_tier === "pro";
          credits = profile.credits;
        }
      }
    }

    if (userId && !isPro && credits <= 0) {
      return new Response(
        JSON.stringify({ error: "No credits remaining. Please upgrade your plan." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemInstruction = `You are an expert web developer. Generate a complete, single-file HTML document based on the user's request.

Rules:
1. Output ONLY valid HTML code. No markdown, no explanations, no code blocks.
2. The entire app must be in a single HTML file with inline CSS and JavaScript.
3. Use modern, beautiful, responsive design with CSS Grid, Flexbox, and CSS variables.
4. Use a professional color scheme (avoid purple/violet). Prefer blues, greens, oranges, or neutral tones.
5. Include smooth transitions and hover effects.
6. Make it fully responsive (mobile, tablet, desktop).
7. Use semantic HTML5 elements.
8. Add realistic placeholder content that matches the app's purpose.
9. If the user asks for a specific type (e-commerce, dashboard, landing page), include all relevant sections.
10. Do NOT use external resources, CDNs, or imports. Everything must be self-contained.
11. Start with <!DOCTYPE html> and end with </html>.`;

    const fullPrompt = templateType && templateType !== "blank"
      ? `Template type: ${templateType}\n\nUser request: ${prompt}`
      : `User request: ${prompt}`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    let geminiResponse: Response | null = null;
    let lastError = "";
    const allErrors: string[] = [];

    for (const model of GEMINI_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (res.ok) {
            geminiResponse = res;
            break;
          }

          const errorText = await res.text();
          let modelError = "";
          try {
            const errJson = JSON.parse(errorText);
            modelError = errJson?.error?.message ?? errorText;
          } catch {
            modelError = errorText;
          }

          if (attempt === 0) {
            allErrors.push(`${model}: ${modelError}`);
          }
          lastError = modelError;
          console.error(`Model ${model} attempt ${attempt + 1} failed:`, modelError);

          if (modelError.includes("API key not valid")) {
            break;
          }

          if (modelError.includes("high demand") && attempt === 0) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break;
        } catch (fetchErr) {
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          allErrors.push(`${model}: ${msg}`);
          lastError = msg;
          console.error(`Model ${model} fetch error:`, msg);
          break;
        }
      }
      if (geminiResponse) break;
    }

    if (!geminiResponse) {
      return new Response(
        JSON.stringify({ error: `AI generation failed. Tried ${allErrors.length} models: ${allErrors.join(" | ")}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleanCode = generatedText.trim();
    if (cleanCode.startsWith("```html")) {
      cleanCode = cleanCode.slice(7);
    } else if (cleanCode.startsWith("```")) {
      cleanCode = cleanCode.slice(3);
    }
    if (cleanCode.endsWith("```")) {
      cleanCode = cleanCode.slice(0, -3);
    }
    cleanCode = cleanCode.trim();

    if (userId && !isPro && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await adminClient
        .from("profiles")
        .update({ credits: credits - 1 })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({ code: cleanCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
