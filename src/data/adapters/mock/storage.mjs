/**
 * Centraliza JSON em armazenamento local para adaptadores temporários da demo.
 * Não escreve durante leituras, não apaga dados inválidos e mantém as chaves v1/v2.
 * Falhas de gravação são propagadas para que a interface não alegue sucesso.
 */
export function createMockStorage(storage) {
  const resolve=arguments.length===0?()=>{try{return globalThis.localStorage}catch{return null}}:()=>storage;
  return Object.freeze({
    read(key, fallback = null) {
      try {
        const raw=resolve()?.getItem(key);
        if (raw == null) return structuredClone(fallback);
        return JSON.parse(raw);
      } catch {
        return structuredClone(fallback);
      }
    },
    write(key, value) {
      const target=resolve();
      if(!target || typeof target.setItem!=="function")throw new Error("Armazenamento local indisponível");
      target.setItem(key,JSON.stringify(value));
      return true;
    }
  });
}
export const mockStorage=createMockStorage();
