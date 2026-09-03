"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Copy, Check, Home, TrendingUp, Key, FileBarChart2, MessageSquareText,
  Sparkles, ChevronDown, History, Trash2, X, Heart
} from "lucide-react";
import { usePromptHistory } from "../hooks/usePromptHistory";
import { Button } from "./ui/button";

const LISBON_ZONES = [
  "Chiado", "Príncipe Real", "Avenida da Liberdade", "Avenidas Novas",
  "Campo de Ourique", "Estrela", "Alvalade", "Areeiro", "Alfama",
  "Belém", "Restelo", "Parque das Nações", "Marvila", "Arroios",
  "Benfica", "Cascais", "Estoril", "Oeiras", "Outra zona",
];

const PROPERTY_TYPES = [
  "Apartamento T0/T1", "Apartamento T2", "Apartamento T3+",
  "Moradia", "Duplex / Loft", "Prédio", "Loja / Escritório", "Terreno",
];

const TONES = [
  "Formal e institucional",
  "Caloroso e próximo",
  "Direto e executivo",
];

const DOC_TYPES = [
  {
    id: "avaliacao",
    label: "Avaliação para vendedor",
    hint: "Estimativa de valor e estratégia de venda",
    Icon: FileBarChart2,
    instruction: (f) => `Redige um relatório de avaliação de mercado para o proprietário do imóvel, com o objetivo de apoiar a decisão de venda e a captação do imóvel para a carteira da consultora. Inclui uma estimativa de valor de mercado (identificada como estimativa), os fatores que a justificam, e uma recomendação de estratégia de preço e prazo. Fecha com uma chamada para ação a convidar o proprietário a avançar com a angariação.`,
    fields: [
      { id: "saleReason", label: "Motivo da venda", type: "text", placeholder: "Ex.: mudança de cidade, sucessão, investimento a liquidar" },
      { id: "timeline", label: "Prazo desejado pelo proprietário", type: "text", placeholder: "Ex.: venda em 3 meses" },
      { id: "competition", label: "Notas sobre concorrência / imóveis comparáveis", type: "textarea", placeholder: "Ex.: 3 imóveis semelhantes na zona, entre 450.000€ e 520.000€" },
    ],
  },
  {
    id: "comprador",
    label: "Apresentação para comprador",
    hint: "Foco em estilo de vida e habitabilidade",
    Icon: Home,
    instruction: (f) => `Redige uma apresentação do imóvel para um potencial comprador, com foco em estilo de vida, habitabilidade e envolvente. Destaca como o imóvel e a zona respondem ao perfil e às prioridades indicadas. Fecha com uma chamada para ação a propor uma visita.`,
    fields: [
      { id: "buyerProfile", label: "Perfil do comprador", type: "select", options: ["Família com filhos", "Casal jovem", "Expatriado / relocation", "Reformado(a)", "Investidor a habitar parte do ano"] },
      { id: "priorities", label: "Prioridades de estilo de vida", type: "textarea", placeholder: "Ex.: escolas próximas, silêncio, varanda, garagem" },
    ],
  },
  {
    id: "investimento",
    label: "Proposta para investidor",
    hint: "Foco em rentabilidade e segurança",
    Icon: TrendingUp,
    instruction: (f) => `Redige uma proposta de investimento imobiliário, com foco em ROI, rentabilidade e segurança do capital. Apresenta uma estimativa de rentabilidade líquida anual (identificada como estimativa) e o racional de valorização da zona. Fecha com uma chamada para ação a propor uma reunião para análise detalhada do negócio.`,
    fields: [
      { id: "investmentType", label: "Tipo de investimento", type: "select", options: ["Compra para arrendar (buy-to-let)", "Compra, remodelação e revenda (flip)", "Alojamento local / turístico", "Golden Visa / residência por investimento"] },
      { id: "expectedYield", label: "Rentabilidade líquida estimada", type: "text", placeholder: "Ex.: 4,5% a 5,5% ao ano" },
      { id: "horizon", label: "Horizonte temporal do investimento", type: "text", placeholder: "Ex.: 5 a 7 anos" },
    ],
  },
  {
    id: "arrendamento",
    label: "Demonstração de arrendamento",
    hint: "Para arrendatários e senhorios",
    Icon: Key,
    instruction: (f) => `Redige uma apresentação do imóvel para arrendamento, adaptada ao perfil do arrendatário indicado, destacando localização, condições e conveniência. Fecha com uma chamada para ação a propor uma visita ou o envio de documentação para candidatura.`,
    fields: [
      { id: "tenantProfile", label: "Perfil do arrendatário", type: "select", options: ["Estudante", "Jovem profissional", "Família", "Expatriado em relocation", "Arrendamento de curta duração"] },
      { id: "contractLength", label: "Duração do contrato", type: "text", placeholder: "Ex.: 12 meses, renovável" },
      { id: "furnished", label: "Estado do imóvel", type: "select", options: ["Mobilado", "Semi-mobilado", "Sem mobília"] },
    ],
  },
  {
    id: "cma",
    label: "Relatório comparativo (CMA)",
    hint: "Análise comparativa de mercado",
    Icon: FileBarChart2,
    instruction: (f) => `Redige um relatório comparativo de mercado (CMA), cruzando o imóvel em análise com os imóveis comparáveis indicados, para justificar um valor de referência. Organiza os dados de forma analítica e clara. Fecha com uma recomendação objetiva de posicionamento de preço.`,
    fields: [
      { id: "comparables", label: "Imóveis comparáveis (texto livre)", type: "textarea", placeholder: "Ex.: T2 na mesma rua, 85m², vendido por 480.000€ em março" },
      { id: "reportGoal", label: "Objetivo do relatório", type: "text", placeholder: "Ex.: justificar preço junto do proprietário" },
    ],
  },
  {
    id: "followup",
    label: "Mensagem de acompanhamento",
    hint: "E-mail ou WhatsApp para cliente",
    Icon: MessageSquareText,
    instruction: (f) => `Redige uma mensagem curta de acompanhamento (para e-mail ou WhatsApp) para o cliente, com o objetivo indicado abaixo. Mantém o texto direto e pronto a enviar, sem necessidade de introdução longa. Fecha com uma chamada para ação clara.`,
    fields: [
      { id: "followUpGoal", label: "Objetivo da mensagem", type: "select", options: ["Agendar visita", "Retomar contacto após silêncio", "Enviar proposta", "Confirmar detalhes de negócio", "Agradecer visita e pedir feedback"] },
      { id: "channel", label: "Canal", type: "select", options: ["E-mail", "WhatsApp / SMS"] },
    ],
  },
];

const SHARED_FIELDS = [
  { id: "clientName", label: "Nome do cliente", type: "text", placeholder: "Ex.: Sr. e Sra. Almeida" },
  { id: "propertyType", label: "Tipo de imóvel", type: "select", options: PROPERTY_TYPES },
  { id: "zone", label: "Zona em Lisboa", type: "select", options: LISBON_ZONES },
  { id: "area", label: "Área (m²)", type: "text", placeholder: "Ex.: 92" },
  { id: "bedrooms", label: "Nº de quartos", type: "text", placeholder: "Ex.: T3" },
  { id: "price", label: "Valor (€)", type: "text", placeholder: "Ex.: 495.000€ ou renda 1.450€/mês" },
  { id: "highlights", label: "Pontos fortes / diferenciais", type: "textarea", placeholder: "Ex.: vista rio, remodelado em 2023, garagem, luz natural" },
  { id: "extraContext", label: "Contexto adicional", type: "textarea", placeholder: "Qualquer informação extra relevante para este caso" },
];

function Field({ field, value, onChange }) {
  const base =
    "w-full rounded-sm border border-[#E8D8C8] bg-white px-3 py-2 text-[15px] text-[#3B2A22] placeholder:text-[#B89C86] focus:outline-none focus:border-[#4A2E23] focus:ring-1 focus:ring-[#4A2E23] transition-colors";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#6B584C]">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          rows={2}
          className={base + " resize-y"}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      ) : field.type === "select" ? (
        <div className="relative">
          <select
            className={base + " appearance-none pr-8"}
            value={value || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
          >
            <option value="">Selecionar…</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C8570]" />
        </div>
      ) : (
        <input
          type="text"
          className={base}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      )}
    </label>
  );
}

export default function GeradorPromptImobiliario() {
  const [agencyName, setAgencyName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0].id);
  const [formData, setFormData] = useState({});
  const [tone, setTone] = useState(TONES[0]);
  const [international, setInternational] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const previewRef = useRef(null);
  const { history, addEntry, removeEntry, clearHistory } = usePromptHistory();

  const docType = DOC_TYPES.find((d) => d.id === selectedType);

  const handleChange = (id, value) => setFormData((prev) => ({ ...prev, [id]: value }));

  const filledSharedFields = SHARED_FIELDS.filter((f) => formData[f.id]?.trim());
  const filledExtraFields = docType.fields.filter((f) => formData[f.id]?.trim());

  const prompt = useMemo(() => {
    const who = agencyName || agentName
      ? ` a representar ${[agencyName, agentName].filter(Boolean).join(", em nome de ")}`
      : "";

    const persona = `A partir de agora, atua como um(a) Consultor(a) Imobiliário(a) Sénior e Especialista em Investimento Imobiliário em Lisboa, Portugal${who}.

O teu objetivo é redigir relatórios, apresentações e comunicações persuasivas e altamente profissionais para clientes compradores, vendedores, arrendatários e investidores, nacionais e internacionais.

Diretrizes obrigatórias:
- Idioma: português de Portugal (PT-PT) correto, ${tone.toLowerCase()}, claro e comercial. Transmite autoridade, confiança e sofisticação.
- Contexto de mercado: considera sempre a realidade imobiliária de Lisboa — zonas nobres, zonas históricas, periferias em expansão, rendas médias, impacto do turismo e, quando aplicável, regimes como o Golden Visa.
- Adaptação ao público: ênfase em ROI e segurança para investidores; em estilo de vida e habitabilidade para compradores e arrendatários; em avaliação de mercado e captação para proprietários e vendedores.
- Estrutura: introdução breve, tópicos claros, dados analíticos (quando não houver dados reais, identifica-os expressamente como estimativas), e termina sempre com uma chamada para ação (CTA) forte.`;

    const task = `\n\nTarefa específica — ${docType.label}:\n${docType.instruction(formData)}`;

    const dataLines = [...filledSharedFields, ...filledExtraFields]
      .map((f) => `- ${f.label}: ${formData[f.id]}`)
      .join("\n");

    const dataBlock = dataLines
      ? `\n\nDados fornecidos para este caso:\n${dataLines}`
      : "";

    const intlNote = international
      ? `\n\nO cliente é internacional: depois do texto em português, apresenta também uma versão resumida em inglês, com o mesmo essencial e o mesmo CTA.`
      : "";

    const factCheckNote = `\n\nNunca inventes dados, números ou factos que não te tenham sido fornecidos: se precisares de mais informações, dados ou detalhes para completar o texto com rigor, pergunta-me antes de continuar.`;

    const closing = `\n\nGera agora o texto completo, pronto a usar, sem comentários adicionais fora do próprio texto.`;

    return persona + task + dataBlock + intlNote + factCheckNote + closing;
  }, [agencyName, agentName, docType, formData, tone, international, filledSharedFields, filledExtraFields]);

  const displayedPrompt = viewingEntry ? viewingEntry.prompt : prompt;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayedPrompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = displayedPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);

    // Só guarda no histórico prompts gerados de novo (não uma cópia de um item já do histórico)
    if (!viewingEntry) {
      addEntry({
        docTypeLabel: docType.label,
        clientName: formData.clientName || "",
        zone: formData.zone || "",
        prompt,
      });
    }
  }

  function handleViewHistoryEntry(entry) {
    setViewingEntry(entry);
    setShowHistory(true);
    scrollToPreview();
  }

  function handleBackToCurrent() {
    setViewingEntry(null);
  }

  function scrollToPreview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#FBF3EC", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4A2E23 0%, #6B4A3D 100%)" }}>
        {/* Corações decorativos, espalhados (ícones Lucide) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Heart size={22} className="absolute left-[6%] top-[16%] -rotate-12 text-[#E4685D] opacity-25" fill="#E4685D" />
          <Heart size={16} className="absolute left-[88%] top-[8%] rotate-6 text-[#E4685D] opacity-20" fill="#E4685D" />
          <Heart size={28} className="absolute left-[92%] top-[52%] rotate-12 text-[#E4685D] opacity-[0.18]" fill="#E4685D" />
          <Heart size={14} className="absolute left-[3%] top-[68%] rotate-[-8deg] text-[#E4685D] opacity-25" fill="#E4685D" />
          <Heart size={18} className="absolute left-[20%] top-[84%] rotate-6 text-[#E4685D] opacity-20" fill="#E4685D" />
        </div>

        {/* Lhama decorativa (ilustração enviada pelo Daniel para a Cynthia) */}
        <div className="pointer-events-none absolute -right-2 bottom-0 h-32 w-32 sm:h-44 sm:w-44 md:h-56 md:w-56 lg:-right-4 lg:h-64 lg:w-64">
          <Image
            src="/images/lhama-cynthia.png"
            alt="Ilustração de uma lhama fofa com manta andina colorida"
            fill
            sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, (max-width: 1024px) 224px, 256px"
            className="object-contain object-bottom drop-shadow-xl"
            priority
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="flex items-center gap-2 text-[#E8CBA5]">
            <Sparkles size={16} className="shrink-0" />
            <span className="text-[13px] tracking-wide">Feito à mão, com carinho, para a Cynthia Bittow</span>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[32px] leading-[1.15] text-[#FBF3EC] md:text-[40px]"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Prompts prontos a usar, em PT-PT, para cada tipo de cliente em Lisboa.
          </h1>
          <p
            className="mt-2 max-w-xl text-[22px] text-[#E8CBA5]"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            para a mulher que eu amo e me faz feliz 💛
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#E8D6C8]">
            Escolhe o tipo de documento, preenche os dados do caso e recebe um prompt completo
            para enviar à IA que usas nas apresentações e relatórios.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <input
              className="w-56 rounded-sm border border-[#7A5646] bg-[#3A2018] px-3 py-2 text-[14px] text-[#FBF3EC] placeholder:text-[#C7AA96] focus:outline-none focus:border-[#C9A66B]"
              placeholder="Nome da agência (opcional)"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
            <input
              className="w-56 rounded-sm border border-[#7A5646] bg-[#3A2018] px-3 py-2 text-[14px] text-[#FBF3EC] placeholder:text-[#C7AA96] focus:outline-none focus:border-[#C9A66B]"
              placeholder="Nome da consultora / consultor"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <button
          onClick={scrollToPreview}
          className="mb-6 w-full rounded-sm border border-[#4A2E23] bg-[#4A2E23] py-2.5 text-[14px] font-medium text-[#FBF3EC] lg:hidden"
        >
          Ver prompt gerado
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr_360px] lg:items-start">
          {/* Rail: document type */}
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {DOC_TYPES.map((d) => {
              const active = d.id === selectedType;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedType(d.id)}
                  className={
                    "flex shrink-0 items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors lg:w-full " +
                    (active
                      ? "border-[#C9A66B] bg-white"
                      : "border-transparent hover:bg-white/60")
                  }
                >
                  <d.Icon size={17} className={active ? "mt-0.5 text-[#C9A66B]" : "mt-0.5 text-[#9C8570]"} />
                  <span>
                    <span className={"block text-[14px] " + (active ? "font-medium text-[#4A2E23]" : "text-[#6B584C]")}>
                      {d.label}
                    </span>
                    <span className="hidden text-[12px] text-[#9C8570] lg:block">{d.hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Form */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-3 text-[15px] font-medium text-[#4A2E23]">Perfil e tom da comunicação</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field field={{ id: "tone", label: "Tom da comunicação", type: "select", options: TONES }} value={tone} onChange={(_, v) => setTone(v)} />
                <label className="flex items-center gap-2 self-end pb-2">
                  <input type="checkbox" checked={international} onChange={(e) => setInternational(e.target.checked)} className="h-4 w-4 accent-[#4A2E23]" />
                  <span className="text-[14px] text-[#6B584C]">Cliente internacional (incluir resumo em inglês)</span>
                </label>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-[15px] font-medium text-[#4A2E23]">Detalhes do imóvel e do cliente</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SHARED_FIELDS.map((f) => (
                  <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field field={f} value={formData[f.id]} onChange={handleChange} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-[15px] font-medium text-[#4A2E23]">Específico — {docType.label}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {docType.fields.map((f) => (
                  <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field field={f} value={formData[f.id]} onChange={handleChange} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Preview */}
          <aside ref={previewRef} className="lg:sticky lg:top-6">
            <div className="border border-[#E8D8C8] bg-white">
              <div className="flex items-center justify-between border-b border-[#E8D8C8] px-4 py-3">
                <span className="text-[13px] font-medium text-[#4A2E23]">
                  {viewingEntry ? "Prompt do histórico" : "Prompt gerado"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory((v) => !v)}
                    aria-expanded={showHistory}
                  >
                    <History size={13} />
                    Histórico{history.length > 0 ? ` (${history.length})` : ""}
                  </Button>
                  <Button size="sm" onClick={handleCopy}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>

              {viewingEntry && (
                <div className="flex items-center justify-between gap-2 border-b border-[#E8D8C8] bg-[#FBF0E6] px-4 py-2 text-[12px] text-[#9C8570]">
                  <span>
                    A ver um prompt guardado em{" "}
                    {new Date(viewingEntry.createdAt).toLocaleString("pt-PT")}.
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleBackToCurrent}>
                    <X size={12} />
                    Voltar ao atual
                  </Button>
                </div>
              )}

              <pre className="max-h-[520px] overflow-y-auto whitespace-pre-wrap break-words px-4 py-4 text-[12.5px] leading-relaxed text-[#3B2A22]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {displayedPrompt}
              </pre>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#9C8570]">
              Copia este texto e cola-o na conversa com a IA que costumas usar. Podes ajustá-lo
              livremente antes de enviar. Cada vez que copias, o prompt fica guardado no
              histórico (últimos 10, neste navegador).
            </p>

            {showHistory && (
              <div className="mt-4 border border-[#E8D8C8] bg-white">
                <div className="flex items-center justify-between border-b border-[#E8D8C8] px-4 py-2.5">
                  <span className="text-[12.5px] font-medium text-[#4A2E23]">
                    Últimos prompts gerados
                  </span>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      <Trash2 size={12} />
                      Limpar tudo
                    </Button>
                  )}
                </div>

                {history.length === 0 ? (
                  <p className="px-4 py-4 text-[12.5px] text-[#9C8570]">
                    Ainda não geraste nenhum prompt. Copia um prompt para o guardar aqui.
                  </p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-[#F3E4D4]">
                    {history.map((entry) => (
                      <li key={entry.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
                        <button
                          onClick={() => handleViewHistoryEntry(entry)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-[13px] text-[#4A2E23]">
                            {entry.docTypeLabel}
                            {entry.clientName ? ` — ${entry.clientName}` : ""}
                          </span>
                          <span className="block truncate text-[11.5px] text-[#9C8570]">
                            {entry.zone ? `${entry.zone} · ` : ""}
                            {new Date(entry.createdAt).toLocaleString("pt-PT")}
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(entry.id)}
                          aria-label="Remover do histórico"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Rodapé com assinatura pessoal */}
      <footer className="border-t border-[#E8D8C8] py-8">
        <div className="mx-auto flex max-w-6xl flex-nowrap items-center justify-center gap-1.5 px-4 text-center sm:gap-3 sm:px-6">
          <Image
            src="/images/bubu_dudu_v-removebg.png"
            alt="Bubu e Dudu"
            width={44}
            height={38}
            className="h-7 w-auto shrink-0 rounded-lg shadow-sm sm:h-9"
          />
          <p
            className="whitespace-nowrap text-[13.5px] text-[#6B584C] sm:text-[18px]"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            para Minha Linda, All Duck Life!
          </p>
          <Image
            src="/images/bubu_dudu_space-removebg.png"
            alt="Bubu e Dudu"
            width={38}
            height={38}
            className="h-7 w-7 shrink-0 rounded-lg shadow-sm sm:h-9 sm:w-9"
          />
        </div>
      </footer>
    </div>
  );
}
