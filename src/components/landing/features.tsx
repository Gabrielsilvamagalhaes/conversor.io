import { Eye, History, ImageOff, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

/** Só entra aqui o que o produto já faz hoje — nada de promessa. */
const FEATURES = [
  {
    icon: Eye,
    title: "Prévia antes de baixar",
    body: "O resultado aparece na tela primeiro. O download é uma escolha sua, não um efeito colateral.",
  },
  {
    icon: History,
    title: "Histórico das conversões",
    body: "Toda conversão fica registrada no painel, com formato, tamanho e quando aconteceu.",
  },
  {
    icon: MonitorSmartphone,
    title: "Vídeo sem upload",
    body: "Vídeo vira áudio dentro do navegador, com ffmpeg.wasm. O arquivo não sai do seu computador.",
  },
  {
    icon: ImageOff,
    title: "Metadados removidos",
    body: "Imagens convertidas saem sem EXIF — a localização de onde a foto foi tirada não vai junto.",
  },
  {
    icon: ShieldCheck,
    title: "Validação real do conteúdo",
    body: "Conferimos a assinatura binária do arquivo, não a extensão do nome. Executável disfarçado não passa.",
  },
] as const;

export function Features() {
  return (
    <section aria-labelledby="recursos" className="border-y border-line bg-bg-elev">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <h2 id="recursos" className="font-display text-2xl md:text-3xl">
          O que vem junto
        </h2>

        <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal as="li" key={feature.title} delay={index * 0.06}>
              <feature.icon aria-hidden className="h-5 w-5 text-sanguine" strokeWidth={1.5} />
              <p className="mt-4 font-display text-lg text-fg">{feature.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
