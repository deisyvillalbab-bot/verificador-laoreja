const SYSTEM_PROMPT = `Eres el verificador de noticias oficial de LaOrejaRoja, medio digital colombiano dedicado a construir criterio crítico. Verifica afirmaciones buscando en fuentes confiables de internet.

PROCESO:
1. Realiza MÍNIMO 3 búsquedas con términos distintos para triangular.
2. PRIORIZA: colombiacheck.com, lasillavacia.com, elespectador.com, eltiempo.com, verdadabierta.com, AFP Factual Colombia, Reuters Fact Check, Chequeado, dane.gov.co, gobierno.gov.co.
3. Evalúa convergencia entre fuentes. Detecta contexto que cambie el significado.
4. Identifica patrones de desinformación si los hay.

ESTILO LAOREJAROJA: directo, sin amarillismo, sin "no es X es Y", distingue hechos de opiniones.

RESPONDE SOLO con JSON válido, sin texto extra ni backticks:
{
  "veredicto": "VERDADERO"|"FALSO"|"PARCIALMENTE VERDADERO"|"ENGAÑOSO"|"NO VERIFICABLE",
  "confianza": <0-100>,
  "resumen": "<2-3 párrafos con evidencia concreta>",
  "fuentes": [{"nombre":"string","url":"string","descripcion":"string"}],
  "contexto": "<antecedentes y datos de fondo relevantes>",
  "senales_alerta": "<patrones de desinformación detectados, o vacío>"
}`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Body inválido" }) };
  }

  const { noticia } = body;
  if (!noticia || !noticia.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Falta la afirmación a verificar" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API key no configurada" }) };
  }

  let messages = [
    { role: "user", content: `Verifica esta afirmación para LaOrejaRoja: "${noticia.trim()}"` }
  ];

  for (let i = 0; i < 8; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Error API: " + res.status, detail: err }) };
    }

    const data = await res.json();
    messages = [...messages, { role: "assistant", content: data.content }];

    if (data.stop_reason === "end_turn") {
      const textBlock = [...data.content].reverse().find(b => b.type === "text");
      if (!textBlock || !textBlock.text) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Sin respuesta de texto" }) };
      }
      const raw = textBlock.text.replace(/```json|```/g, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "No se encontró JSON en la respuesta" }) };
      }
      const result = JSON.parse(match[0]);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (data.stop_reason === "tool_use") {
      const toolResults = data.content
        .filter(b => b.type === "tool_use")
        .map(b => ({
          type: "tool_result",
          tool_use_id: b.id,
          content: JSON.stringify(b.output || ""),
        }));
      messages = [...messages, { role: "user", content: toolResults }];
      continue;
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: "Stop reason inesperado: " + data.stop_reason }) };
  }

  return { statusCode: 500, headers, body: JSON.stringify({ error: "Demasiados turnos sin respuesta final" }) };
};
