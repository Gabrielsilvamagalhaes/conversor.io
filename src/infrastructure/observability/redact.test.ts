import { describe, expect, it } from "vitest";
import { hashFileName, redactValue, serializeError, truncateIp } from "./redact";

describe("redactValue", () => {
  it("preserva identificadores derivados de hash", () => {
    // `fileNameHash` casa com a denylist (`filename`), mas existe exatamente para
    // correlacionar logs sem expor o nome real: redigi-lo esvaziaria o log de conversão.
    const out = redactValue({
      fileNameHash: "9f2c1ab34de5",
      fileName: "contrato-joao.pdf",
    }) as Record<string, unknown>;

    expect(out.fileNameHash).toBe("9f2c1ab34de5");
    expect(out.fileName).toBe("[redacted]");
  });

  it("redige chaves sensíveis por substring, case-insensitive", () => {
    const out = redactValue({
      idToken: "abc",
      Cookie: "xyz",
      Authorization: "Bearer x",
      password: "123",
      senha: "123",
      privateKey: "-----BEGIN",
      apiKey: "sk-live",
      credentialData: "x",
      userEmail: "a@b.com",
      cpf: "111",
      cnpj: "222",
      phoneNumber: "333",
      telefoneContato: "444",
      fileName: "contrato.pdf",
      displayName: "João",
      safe: "ok",
    }) as Record<string, unknown>;

    expect(out.idToken).toBe("[redacted]");
    expect(out.Cookie).toBe("[redacted]");
    expect(out.Authorization).toBe("[redacted]");
    expect(out.password).toBe("[redacted]");
    expect(out.senha).toBe("[redacted]");
    expect(out.privateKey).toBe("[redacted]");
    expect(out.apiKey).toBe("[redacted]");
    expect(out.credentialData).toBe("[redacted]");
    expect(out.userEmail).toBe("[redacted]");
    expect(out.cpf).toBe("[redacted]");
    expect(out.cnpj).toBe("[redacted]");
    expect(out.phoneNumber).toBe("[redacted]");
    expect(out.telefoneContato).toBe("[redacted]");
    expect(out.fileName).toBe("[redacted]");
    expect(out.displayName).toBe("[redacted]");
    expect(out.safe).toBe("ok");
  });

  it("redige campos aninhados sensíveis dentro do limite de profundidade", () => {
    const out = redactValue({
      level1: { level2: { session: "s3cr3t", safe: "ok" } },
    }) as Record<string, unknown>;

    const level1 = out.level1 as Record<string, unknown>;
    const level2 = level1.level2 as Record<string, unknown>;
    expect(level2.session).toBe("[redacted]");
    expect(level2.safe).toBe("ok");
  });

  it("trunca valores além da profundidade máxima (4)", () => {
    const deep = { a: { b: { c: { d: { e: { f: "too deep" } } } } } };
    const out = redactValue(deep) as Record<string, unknown>;

    // Navega até a profundidade máxima; além disso deve virar "[truncated]".
    let cursor: unknown = out;
    const path = ["a", "b", "c", "d", "e"];
    for (const key of path) {
      cursor = (cursor as Record<string, unknown>)[key];
    }
    expect(cursor).toBe("[truncated]");
  });

  it("trunca objeto com mais de 50 chaves", () => {
    const bigObject: Record<string, number> = {};
    for (let i = 0; i < 51; i++) {
      bigObject[`key${i}`] = i;
    }
    expect(redactValue(bigObject)).toBe("[truncated]");
  });

  it("não trunca objeto com exatamente 50 chaves", () => {
    const object: Record<string, number> = {};
    for (let i = 0; i < 50; i++) {
      object[`key${i}`] = i;
    }
    const out = redactValue(object) as Record<string, unknown>;
    expect(out.key0).toBe(0);
    expect(out.key49).toBe(49);
  });

  it("trata ciclos sem estourar a call stack", () => {
    const cyclic: Record<string, unknown> = { safe: "ok" };
    cyclic.self = cyclic;

    const out = redactValue(cyclic) as Record<string, unknown>;
    expect(out.safe).toBe("ok");
    expect(out.self).toBe("[circular]");
  });

  it("corta strings longas com sufixo de truncamento", () => {
    const longString = "a".repeat(600);
    const out = redactValue({ safe: longString }) as Record<string, unknown>;
    const value = out.safe as string;

    expect(value.length).toBeLessThan(600);
    expect(value.endsWith("…[truncated]")).toBe(true);
  });

  it("preserva arrays redigindo os elementos", () => {
    const out = redactValue([{ token: "x" }, { safe: "ok" }]) as Array<Record<string, unknown>>;
    expect(out[0]?.token).toBe("[redacted]");
    expect(out[1]?.safe).toBe("ok");
  });

  it("preserva valores primitivos não sensíveis", () => {
    expect(redactValue(42)).toBe(42);
    expect(redactValue(true)).toBe(true);
    expect(redactValue(null)).toBeNull();
    expect(redactValue(undefined)).toBeUndefined();
  });
});

describe("serializeError", () => {
  it("nunca serializa o objeto de erro cru", () => {
    class CustomError extends Error {
      config = { headers: { Authorization: "Bearer x" } };
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }
    const error = new CustomError("falhou");
    const out = serializeError(error);

    expect(out?.name).toBe("CustomError");
    expect(out?.message).toBe("falhou");
    // `stack` passa pelo mesmo corte de tamanho de qualquer string (> 500 chars), então
    // comparamos só o prefixo em vez do stack bruto completo.
    expect(out?.stack?.startsWith("CustomError: falhou")).toBe(true);
    expect(out).not.toHaveProperty("config");
  });

  it("lida com valores que não são Error", () => {
    expect(serializeError("boom")).toEqual({ name: "UnknownError", message: "boom" });
    expect(serializeError({ weird: true })).toEqual({
      name: "UnknownError",
      message: "[object Object]",
    });
  });

  it("retorna undefined quando não há erro", () => {
    expect(serializeError(undefined)).toBeUndefined();
  });
});

describe("truncateIp", () => {
  it("zera o último octeto de um IPv4", () => {
    expect(truncateIp("203.0.113.42")).toBe("203.0.113.0");
  });

  it("mantém os 3 primeiros grupos de um IPv6", () => {
    expect(truncateIp("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe("2001:db8:85a3::");
  });

  it("não promove grupos da cauda ao truncar um IPv6 comprimido", () => {
    // `2001:db8::1` tem prefixo `2001:db8`; filtrar os grupos vazios traria o `1` final
    // para a terceira posição e produziria um prefixo que não é o do endereço.
    expect(truncateIp("2001:db8::1")).toBe("2001:db8::");
    expect(truncateIp("2001:db8:85a3::8a2e:370:7348")).toBe("2001:db8:85a3::");
  });

  it("retorna undefined para entrada inválida", () => {
    expect(truncateIp("not-an-ip")).toBeUndefined();
    expect(truncateIp("999.999.999.999")).toBeUndefined();
    expect(truncateIp(null)).toBeUndefined();
    expect(truncateIp(undefined)).toBeUndefined();
    expect(truncateIp("")).toBeUndefined();
  });
});

describe("hashFileName", () => {
  it("é determinístico para o mesmo nome", () => {
    expect(hashFileName("contrato-joao.pdf")).toBe(hashFileName("contrato-joao.pdf"));
  });

  it("tem 12 caracteres hexadecimais", () => {
    const hash = hashFileName("contrato-joao.pdf");
    expect(hash).toHaveLength(12);
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
  });

  it("difere para nomes diferentes", () => {
    expect(hashFileName("a.pdf")).not.toBe(hashFileName("b.pdf"));
  });
});
