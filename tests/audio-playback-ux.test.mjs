import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {wavFromAudioBuffers, resolveMediaDuration} from "../src/audio-utils.mjs";
const source = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("WAV concatena segmentos com cabeçalho e duração navegável", async()=>{
 const mono = (...values)=>({sampleRate:8000,length:values.length,numberOfChannels:1,getChannelData:()=>new Float32Array(values)});
 const blob=wavFromAudioBuffers([mono(0,.25),mono(-.25,1)]);
 assert.equal(blob.type,"audio/wav");
 const buffer=await blob.arrayBuffer(),view=new DataView(buffer);
 assert.equal(new TextDecoder().decode(buffer.slice(0,4)),"RIFF");
 assert.equal(new TextDecoder().decode(buffer.slice(8,12)),"WAVE");
 assert.equal(view.getUint32(24,true),8000);
 assert.equal(view.getUint32(40,true),8);
 assert.equal(view.getInt16(44,true),0);
 assert.equal(view.getInt16(46,true),8192);
 assert.equal(view.getInt16(48,true),-8192);
 assert.equal(view.getInt16(50,true),32767);
});
test("tempo desconhecido do MediaRecorder usa duração registrada",()=>{
 assert.equal(resolveMediaDuration({duration:Infinity,seekable:{length:0}},11.2),11.2);
 assert.equal(resolveMediaDuration({duration:0,seekable:{length:1,end:()=>5.3}},undefined),5.3);
 assert.equal(resolveMediaDuration({duration:7.8},11.2),7.8);
 assert.equal(resolveMediaDuration({duration:NaN,seekable:{length:0}},undefined),0);
});
test("compositor usa o mesmo envio para encerrar gravação e permite seek quando pausado",()=>{
 const ui=source("index.html"),code=source("src/voice-composer.mjs");
 assert.match(ui,/id="voice-send"[^>]*aria-label="Finalizar e enviar áudio"/);
 assert.doesNotMatch(ui,/id="voice-stop"/);
 assert.doesNotMatch(ui,/id="voice-preview"/);
 assert.match(ui,/id="voice-paused-player"/);
 assert.match(code,/state === "paused"/);
 assert.match(code,/async function finalizeSegment/);
 assert.match(code,/await onSend\(conversation/);
 assert.match(code,/audio\.currentTime = Number\(seek\.value\)/);
});
test("player não cria waveform fictícia e sincroniza cursor pelo progresso real",()=>{
 const code=source("src/media-player.js");
 assert.doesNotMatch(code,/media-waveform/);
 assert.match(code,/resolveMediaDuration\(media,Number\(file\.durationSeconds\)\)/);
 assert.match(code,/media\.currentTime=position/);
 assert.match(code,/requestAnimationFrame\(tick\)/);
});
