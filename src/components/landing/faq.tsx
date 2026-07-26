import { Reveal } from "@/components/motion/reveal";

interface FaqProps {
  /** Limite de upload das categorias de documento/dados/imagem, em MB. */
  readonly maxDocumentSizeMb: number;
  readonly maxVideoSizeMb: number;
}

/**
 * `<details>`/`<summary>` nativos: acordeão acessível de graça (teclado, leitor de tela,
 * busca na página encontra o texto fechado) sem nenhuma dependência nova.
 */
export function Faq({ maxDocumentSizeMb, maxVideoSizeMb }: FaqProps) {
  const items = [
    {
      q: "Preciso pagar?",
      a: "Não. Todas as conversões do catálogo são gratuitas. Não há plano pago, e nada fica bloqueado atrás de assinatura.",
    },
    {
      q: "Preciso de conta?",
      a: "Sim, para converter. A conta é o que permite guardar seu histórico de conversões e separar seus arquivos dos de outras pessoas. O login é com Google.",
    },
    {
      q: "Qual o tamanho máximo?",
      a: `${maxDocumentSizeMb} MB por arquivo para documentos, dados e imagens; ${maxVideoSizeMb} MB e 15 minutos para vídeo. Imagens acima do limite são reduzidas no seu navegador antes de subir, para caberem.`,
    },
    {
      q: "O que acontece com meu arquivo?",
      a: "Ele é convertido durante a própria requisição e não fica guardado no servidor: registramos só os metadados da conversão (formatos, tamanho, data) para montar seu histórico. Vídeo nem chega a subir — é convertido dentro do navegador.",
    },
    {
      q: "A formatação é preservada?",
      a: "Texto, títulos, listas e tabelas sim. Fontes originais, posicionamento exato e blocos de código com indentação não — avisamos na tela quando a conversão simplifica o layout.",
    },
  ];

  return (
    <section aria-labelledby="faq" className="border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 id="faq" className="font-display text-2xl md:text-3xl">
          Perguntas frequentes
        </h2>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {items.map((item, index) => (
            <Reveal key={item.q} delay={index * 0.05}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-left font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-sanguine">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-xl leading-none text-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
