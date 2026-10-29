import test from "node:test";
import assert from "node:assert/strict";
import {
  formatVoiceTime,
  elapsedVoiceTime,
  selectVoiceMimeType
} from "../src/voice-composer.mjs";

test("contador apresenta minutos, segundos e horas sem arredondar", () => {
  assert.equal(formatVoiceTime(0), "00:00");
  assert.equal(formatVoiceTime(59_999), "00:59");
  assert.equal(formatVoiceTime(60_000), "01:00");
  assert.equal(formatVoiceTime(3_661_999), "1:01:01");
  assert.equal(formatVoiceTime(-50), "00:00");
});

test("tempo de gravação não cresce durante pausa", () => {
  assert.equal(elapsedVoiceTime(1200, 500, 1800), 2500);
  assert.equal(elapsedVoiceTime(2500, null, 50_000), 2500);
  assert.equal(elapsedVoiceTime(2500, 3000, 4000), 3500);
  assert.equal(elapsedVoiceTime(2500, 4000, 3500), 2500);
});

test("formato gravável respeita compatibilidade do navegador", () => {
  assert.equal(selectVoiceMimeType(type => type === "audio/webm;codecs=opus"), "audio/webm;codecs=opus");
  assert.equal(selectVoiceMimeType(type => type === "audio/mp4"), "audio/mp4");
  assert.equal(selectVoiceMimeType(() => false), "");
});
