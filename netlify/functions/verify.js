exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: "Body inválido" }) }; }

  const { noticia } = body;
  if (!noticia?.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: "Falta la afirmación" }) };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key no configurada" }) };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Responde solo con este JSON exacto sin texto adicional: {"veredicto":"VERDADERO","confianza":80,"resumen":"Prueba exitosa de conexión para LaOrejaRoja.","fuentes":[],"contexto":"","senales_alerta":""}` }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "Error API: " + res.status, detail: raw }) };

  const data = JSON.parse(raw);
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { statusCode: 500, headers, body: JSON.stringify({ error: "Sin JSON", raw: text }) };

  return { statusCode: 200, headers, body: match[0] };
};
