import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

/**
 * Os três passos são uma sequência real e ordenada — por isso a numeração é informação, não
 * enfeite: o passo 2 só existe depois do 1, e a prévia do passo 3 é a razão de o download não
 * ser automático.
 */
const STEPS = [
  {
    title: "Solte o arquivo",
    body: "Arraste para a área de upload ou escolha do disco. Validamos o conteúdo de verdade — pelos bytes iniciais, não pela extensão do nome.",
  },
  {
    title: "Escolha o destino",
    body: "Mostramos só os formatos que aquele arquivo realmente alcança. Você também renomeia a saída aqui.",
  },
  {
    title: "Confira e baixe",
    body: "O resultado aparece na tela antes de qualquer download: a planilha, as páginas do PDF, a imagem convertida.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <Reveal className="relative aspect-[3/4] overflow-hidden rounded-xl bg-bg-elev">
          <Image
            src="/art/selfportrait-800.webp"
            alt="Autorretrato atribuído a Leonardo da Vinci"
            fill
            sizes="(max-width: 768px) 100vw, 35vw"
            className="object-cover object-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
          <p className="pointer-events-none absolute bottom-4 left-4 text-[0.65rem] leading-tight text-muted">
            <span className="block font-display text-sm text-fg">Autorretrato</span>
            atribuído a Leonardo da Vinci · c. 1512
          </p>
        </Reveal>

        <div>
          <h2 id="como-funciona" className="font-display text-2xl md:text-3xl">
            Como funciona
          </h2>

          <ol className="mt-8 space-y-8">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 0.08} className="flex gap-5">
                <span
                  aria-hidden
                  className="mt-1 shrink-0 font-display text-sm tabular-nums text-gold"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="border-l border-line pl-5">
                  <span className="block font-display text-lg text-fg">{step.title}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                    {step.body}
                  </span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
