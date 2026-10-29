/**
 * Centraliza JSON em armazenamento local para adaptadores temporários da demo.
 * Não escreve durante leituras, não apaga dados inválidos e mantém as chaves v1/v2.
 * Falhas de gravação são propagadas para que a interface não alegue sucesso.
 */
export function createMockStorage(storage) {
  if (arguments.length === 0) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  return Object.freeze({
    read(key, fallback = null) {
      try {
        const raw=storage?.getItem(key);
        if (raw == null) return structuredClone(fallback);
        return JSON.parse(raw);
      } catch {
        return structuredClone(fallback);
      }
    },
    write(key, value) {
      if(!storage || typeof storage.setItem!=="function")throw new Error("Armazenamento local indisponível");
      storage.setItem(key,JSON.stringify(value));
      return true;
    }
  });
}
export const mockStorage=createMockStorage();
