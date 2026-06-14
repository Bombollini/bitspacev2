import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!RESEND_API_KEY) {
      // Return 200 with a warning so the client doesn't surface this as an error
      // (the meeting was already created; email is a background side-effect)
      return new Response(JSON.stringify({ warning: "RESEND_API_KEY is not configured. Email not sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!to || !to.length) {
      return new Response(JSON.stringify({ warning: "No recipients defined. Email not sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bitspace Protocol <onboarding@resend.dev>", // Replace with a verified domain for production
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      // Log the error server-side but return 200 so the client isn't disrupted.
      // The meeting was already saved; email failure is non-critical.
      console.error(`Resend API error (${res.status}):`, responseText);
      return new Response(JSON.stringify({ warning: `Email delivery failed: ${responseText}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = JSON.parse(responseText);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("send-meeting-email unexpected error:", error.message);
    // Still return 200 — email is a background side-effect, not critical
    return new Response(JSON.stringify({ warning: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
