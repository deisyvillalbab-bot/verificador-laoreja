
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key no encontrada en variables de entorno" }) };

  // Mostrar primeros 10 caracteres de la key para verificar que es la correcta
  const keyPreview = apiKey.substring(0, 15) + "...";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [{ role: "user", content: "Di solo: hola" }],
    }),
  });

  const raw = await res.text();

  // Devolver TODO para diagnóstico
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: res.status,
      keyPreview,
      response: raw
    })
  };
};
