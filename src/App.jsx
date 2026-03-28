import { useState, useEffect, useRef } from "react";

const VERDICTS = {
  "VERDADERO":              { color:"#16a34a", bg:"#dcfce7", border:"#86efac", icon:"✅", label:"Verdadero" },
  "FALSO":                  { color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", icon:"❌", label:"Falso" },
  "PARCIALMENTE VERDADERO": { color:"#d97706", bg:"#fef3c7", border:"#fcd34d", icon:"⚠️", label:"Parcialmente verdadero" },
  "ENGAÑOSO":               { color:"#ea580c", bg:"#ffedd5", border:"#fdba74", icon:"🔶", label:"Engañoso" },
  "NO VERIFICABLE":         { color:"#64748b", bg:"#f1f5f9", border:"#cbd5e1", icon:"🔍", label:"No verificable" },
};

const STEPS = [
  "Poniendo la oreja…",
  "Buscando en fuentes verificadas…",
  "Consultando medios colombianos…",
  "Triangulando la información…",
  "Construyendo criterio…",
];

const EXAMPLES = [
  "El gobierno de Petro eliminó el servicio militar obligatorio en Colombia",
  "Colombia es el país con más biodiversidad por kilómetro cuadrado del mundo",
  "El DANE reportó que la pobreza monetaria aumentó en Colombia en 2024",
  "Francia Márquez fue la primera mujer afrocolombiana en ser vicepresidenta de Colombia",
];

export default function App() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const barRef = useRef(null);
  const MAX = 600;

  useEffect(() => {
    if (!loading) { setStep(0); return; }
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (result && barRef.current) {
      setTimeout(() => { if (barRef.current) barRef.current.style.width = result.confianza + "%"; }, 300);
    }
  }, [result]);

  const verify = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/.netlify/functions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticia: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      if (!data.veredicto) throw new Error("Respuesta inválida");
      setResult(data);
    } catch (e) {
      setError(e.message || "No se pudo verificar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setText(""); };
  const vc = result ? (VERDICTS[result.veredicto] || VERDICTS["NO VERIFICABLE"]) : null;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#317976 0%,#1e4f4d 100%)", fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif" }}>
      <nav style={{ background:"rgba(0,0,0,0.3)", backdropFilter:"blur(12px)", padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"1px solid rgba(255,255,255,0.1)", position:"sticky", top:0, zIndex:10 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="20" fill="#111"/>
          <text x="20" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="Georgia,serif" letterSpacing="-0.5">or</text>
        </svg>
        <div>
          <div style={{ color:"white", fontSize:"17px", fontWeight:"800", lineHeight:1 }}>LaOrejaRoja</div>
          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"10px", letterSpacing:"1.8px", textTransform:"uppercase", marginTop:"2px" }}>Verificador · Beta</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.1)", borderRadius:"20px", padding:"5px 12px" }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4ade80" }}/>
          <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"11px", fontWeight:"600" }}>Activo</span>
        </div>
      </nav>

      <div style={{ maxWidth:"660px", margin:"0 auto", padding:"40px 18px 70px" }}>
        {!result && !loading && (
          <div style={{ textAlign:"center", marginBottom:"30px" }}>
            <div style={{ fontSize:"42px", marginBottom:"12px" }}>👂</div>
            <h1 style={{ color:"white", fontSize:"clamp(22px,5vw,32px)", fontWeight:"900", margin:"0 0 12px", letterSpacing:"-0.5px", lineHeight:1.2 }}>
              ¿Dudas de una noticia?
            </h1>
            <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"15px", lineHeight:1.75, margin:"0 auto", maxWidth:"460px" }}>
              Escribe la afirmación o titular. Buscamos en fuentes verificadas y te entregamos el contexto completo.
            </p>
          </div>
        )}

        {!result && (
          <div style={{ background:"white", borderRadius:"18px", overflow:"hidden", boxShadow:"0 20px 70px rgba(0,0,0,0.3)", marginBottom:"18px" }}>
            <textarea value={text}
              onChange={e => e.target.value.length <= MAX && setText(e.target.value)}
              onKeyDown={e => (e.ctrlKey || e.metaKey) && e.key === "Enter" && verify()}
              disabled={loading}
              placeholder='"El gobierno eliminó el servicio militar en Colombia…"'
              style={{ width:"100%", minHeight:"120px", border:"none", outline:"none", resize:"none", fontSize:"15px", padding:"20px 20px 8px", fontFamily:"inherit", color:"#111", lineHeight:1.7, background:"transparent", boxSizing:"border-box" }}
            />
            <div style={{ padding:"10px 16px 14px", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ color: text.length > MAX * 0.85 ? "#ef4444":"#cbd5e1", fontSize:"12px" }}>{text.length}/{MAX}</span>
              <button onClick={verify} disabled={loading || !text.trim()}
                style={{ background: !text.trim() || loading ? "#e2e8f0":"#317976", color: !text.trim() || loading ? "#94a3b8":"white", border:"none", borderRadius:"10px", padding:"10px 22px", fontSize:"14px", fontWeight:"700", cursor: !text.trim() || loading ? "not-allowed":"pointer", fontFamily:"inherit" }}>
                {loading ? "Verificando…" : "Verificar →"}
              </button>
            </div>
          </div>
        )}

        {!result && !loading && text === "" && (
          <div style={{ marginBottom:"28px" }}>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"11px", textTransform:"uppercase", letterSpacing:"1.2px", textAlign:"center", marginBottom:"10px" }}>Prueba con estos ejemplos</p>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)}
                style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.13)", borderRadius:"10px", padding:"10px 15px", color:"rgba(255,255,255,0.82)", fontSize:"13px", cursor:"pointer", textAlign:"left", marginBottom:"7px", fontFamily:"inherit", lineHeight:1.45 }}>
                "{ex}"
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:"64px 20px", color:"white" }}>
            <div style={{ width:"52px", height:"52px", border:"4px solid rgba(255,255,255,0.15)", borderTop:"4px solid rgba(255,255,255,0.9)", borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 22px" }}/>
            <div style={{ fontSize:"17px", fontWeight:"700", marginBottom:"6px" }}>{STEPS[step]}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"13px" }}>Buscando en fuentes verificadas · puede tardar ~30 seg</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"14px", padding:"18px 20px", marginBottom:"16px" }}>
            <p style={{ color:"#b91c1c", fontSize:"14px", margin:"0 0 12px", lineHeight:1.6 }}><strong>⚠️</strong> {error}</p>
            <button onClick={() => setError(null)} style={{ background:"none", border:"1px solid #dc2626", borderRadius:"8px", padding:"6px 14px", color:"#dc2626", cursor:"pointer", fontSize:"13px", fontFamily:"inherit" }}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {result && vc && (
          <div style={{ animation:"fadeUp 0.45s ease" }}>
            <div style={{ background:vc.bg, border:`2px solid ${vc.border}`, borderRadius:"18px 18px 0 0", padding:"20px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <span style={{ fontSize:"38px", lineHeight:1 }}>{vc.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#94a3b8", fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"4px" }}>Veredicto LaOrejaRoja</div>
                  <div style={{ color:vc.color, fontSize:"21px", fontWeight:"900" }}>{vc.label}</div>
                </div>
                <div style={{ background:"white", borderRadius:"12px", padding:"10px 14px", textAlign:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
                  <div style={{ color:vc.color, fontSize:"26px", fontWeight:"900", lineHeight:1 }}>{result.confianza}%</div>
                  <div style={{ color:"#94a3b8", fontSize:"9px", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:"2px" }}>confianza</div>
                </div>
              </div>
              <div style={{ height:"5px", background:"rgba(0,0,0,0.08)", borderRadius:"3px", marginTop:"16px", overflow:"hidden" }}>
                <div ref={barRef} style={{ height:"100%", width:"0%", background:vc.color, borderRadius:"3px", transition:"width 1.3s cubic-bezier(0.4,0,0.2,1)" }}/>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:"0 0 18px 18px", padding:"22px", boxShadow:"0 24px 70px rgba(0,0,0,0.22)" }}>
              <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"12px 15px", marginBottom:"20px" }}>
                <div style={{ color:"#94a3b8", fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:"5px" }}>Afirmación analizada</div>
                <p style={{ color:"#475569", fontSize:"14px", margin:0, lineHeight:1.55, fontStyle:"italic" }}>"{text.slice(0, 220)}{text.length > 220 ? "…" : ""}"</p>
              </div>

              <SectionTitle color={vc.color} label="Análisis" />
              {(result.resumen || "").split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i} style={{ color:"#374151", fontSize:"15px", lineHeight:1.78, margin:"0 0 13px" }}>{p}</p>
              ))}

              {result.senales_alerta?.trim() && (
                <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderLeft:"4px solid #ea580c", borderRadius:"0 10px 10px 0", padding:"13px 15px", marginBottom:"18px" }}>
                  <div style={{ color:"#c2410c", fontSize:"10px", fontWeight:"800", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>🚨 Señales de alerta</div>
                  <p style={{ color:"#374151", fontSize:"13px", lineHeight:1.6, margin:0 }}>{result.senales_alerta}</p>
                </div>
              )}

              {result.contexto?.trim() && (
                <div style={{ background:"linear-gradient(135deg,#f0fdf9,#ecfdf5)", border:"1px solid #a7f3d0", borderLeft:"4px solid #317976", borderRadius:"0 10px 10px 0", padding:"13px 15px", marginBottom:"20px" }}>
                  <div style={{ color:"#317976", fontSize:"10px", fontWeight:"800", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>📌 Contexto</div>
                  <p style={{ color:"#374151", fontSize:"14px", lineHeight:1.65, margin:0 }}>{result.contexto}</p>
                </div>
              )}

              {result.fuentes?.length > 0 && (
                <div style={{ marginBottom:"20px" }}>
                  <SectionTitle color={vc.color} label={`Fuentes consultadas (${result.fuentes.length})`} />
                  {result.fuentes.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", gap:"10px", padding:"10px 13px", borderRadius:"9px", background:"#f8fafc", border:"1px solid #f1f5f9", marginBottom:"5px", textDecoration:"none" }}>
                      <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:vc.color, marginTop:"5px", flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:"#317976", fontWeight:"700", fontSize:"13px" }}>{f.nombre}</div>
                        <div style={{ color:"#64748b", fontSize:"12px", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.descripcion}</div>
                      </div>
                      <span style={{ color:"#94a3b8", fontSize:"15px" }}>↗</span>
                    </a>
                  ))}
                </div>
              )}

              <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"12px 15px", color:"#94a3b8", fontSize:"12px", lineHeight:1.65, marginBottom:"18px" }}>
                <strong style={{ color:"#64748b" }}>📋 Nota:</strong> Verificación basada en búsqueda web en fuentes abiertas. Para noticias de alto impacto consulta directamente <strong>Colombia Check</strong>, <strong>AFP Factual</strong> o <strong>La Silla Vacía</strong>.
              </div>

              <div style={{ display:"flex", gap:"9px" }}>
                <button onClick={reset} style={{ flex:1, background:"#317976", color:"white", border:"none", borderRadius:"10px", padding:"12px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>
                  Verificar otra noticia
                </button>
                <button onClick={() => navigator.clipboard?.writeText(`LaOrejaRoja verificó:\n"${text.slice(0,100)}…"\nVeredicto: ${vc.label} (${result.confianza}% confianza)`)}
                  style={{ background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"10px", padding:"12px 16px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>
                  Copiar 📋
                </button>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop:"30px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
            {[
              { icon:"🌐", t:"Busca en internet", d:"Consulta medios verificados colombianos y latinoamericanos en tiempo real" },
              { icon:"⚖️", t:"Triangula fuentes", d:"Cruza mínimo 3 fuentes independientes para mayor rigor" },
              { icon:"📌", t:"Entrega contexto", d:"No solo verdadero/falso: te da el panorama completo" },
            ].map((c, i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.09)", borderRadius:"13px", padding:"15px 12px", textAlign:"center" }}>
                <div style={{ fontSize:"22px", marginBottom:"7px" }}>{c.icon}</div>
                <div style={{ color:"white", fontSize:"12px", fontWeight:"700", marginBottom:"5px", lineHeight:1.3 }}>{c.t}</div>
                <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"11px", lineHeight:1.5 }}>{c.d}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ tex
