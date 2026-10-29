/** Audio gravado: consolida segmentos decodificados em PCM WAV seekable. */
export function wavFromAudioBuffers(buffers) {
  if (!Array.isArray(buffers) || !buffers.length) throw new Error("Nenhum trecho gravado");
  const sampleRate = buffers[0].sampleRate;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error("Taxa de áudio inválida");
  let samples = 0;
  for (const buffer of buffers) {
    if (buffer.sampleRate !== sampleRate) throw new Error("Taxas incompatíveis");
    samples += buffer.length;
  }
  // PCM mono 16 bits, compatível com seek em Chrome/Firefox/Safari.
  if (samples > (0xffffffff - 44) / 2) throw new Error("Gravação excede o formato WAV");
  const bytes = new ArrayBuffer(44 + samples * 2);
  const data = new DataView(bytes);
  const ascii = (offset, value) => [...value].forEach((letter, i) => data.setUint8(offset + i, letter.charCodeAt(0)));
  ascii(0, "RIFF"); data.setUint32(4, bytes.byteLength - 8, true);
  ascii(8, "WAVE"); ascii(12, "fmt "); data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, sampleRate, true); data.setUint32(28, sampleRate * 2, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  ascii(36, "data"); data.setUint32(40, samples * 2, true);
  let at = 44;
  for (const buffer of buffers) {
    const channels = Array.from({length:buffer.numberOfChannels}, (_,i)=>buffer.getChannelData(i));
    for (let i = 0; i < buffer.length; i++) {
      let sample = 0;
      for (const channel of channels) sample += channel[i];
      sample = Math.max(-1, Math.min(1, sample / channels.length));
      data.setInt16(at, sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767), true);
      at += 2;
    }
  }
  return new Blob([bytes], {type:"audio/wav"});
}

export function resolveMediaDuration(element, fileDuration) {
  const raw = element?.duration;
  if (Number.isFinite(raw) && raw > 0) return raw;
  if (Number.isFinite(fileDuration) && fileDuration > 0) return fileDuration;
  const ranges = element?.seekable;
  if (ranges?.length) {
    try {
      const end = ranges.end(ranges.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    } catch { /* range indisponível */ }
  }
  return 0;
}
