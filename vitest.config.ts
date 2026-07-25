import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Fora do bundler do Next (que resolve a condição `react-server` para o no-op
      // `empty.js`), o pacote lança ao ser importado — aqui reproduzimos o mesmo no-op
      // para permitir testar módulos de infraestrutura marcados com `import "server-only"`.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
