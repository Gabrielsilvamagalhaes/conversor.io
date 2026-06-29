import Link from "next/link";

const FORMATS = ["xlsx ↔ csv", "docx → pdf", "pdf → txt", "json ↔ csv", "vídeo → áudio"];

/** Rodapé: colunas + contato + barra legal. Arte é domínio público (Wikimedia). */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-elev">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-lg">
            conversor<span className="text-sanguine">.io</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            A oficina renascentista dos seus arquivos. Do códice ao código.
          </p>
        </div>

        <nav aria-label="Formatos">
          <p className="text-xs uppercase tracking-widest text-gold">Formatos</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {FORMATS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Produto">
          <p className="text-xs uppercase tracking-widest text-gold">Produto</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/app" className="text-muted hover:text-fg">
                Converter
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted hover:text-fg">
                Entrar
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Contato</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a href="mailto:gabiles278@gmail.com" className="text-muted hover:text-fg">
                gabiles278@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Gabrielsilvamagalhaes"
                className="text-muted hover:text-fg"
              >
                github.com/Gabrielsilvamagalhaes
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-6 py-5 text-center text-xs text-muted">
        © 2026 conversor.io — todos os direitos reservados · arte de Leonardo da Vinci (domínio
        público, via Wikimedia Commons)
      </div>
    </footer>
  );
}
