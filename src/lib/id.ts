function getRandomByte() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint8Array(1))[0];
  }

  return Math.floor(Math.random() * 256);
}

export function createId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) => {
    const value = Number(character) ^ (getRandomByte() & (15 >> (Number(character) / 4)));
    return value.toString(16);
  });
}
