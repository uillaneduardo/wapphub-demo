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

test("barra de progresso enviada preserva contraste durante a reprodução",()=>{
 const css=source("src/styles.css");
 const rule=css.match(/\.message-row\.mine \.media-progress\s*\{([^}]+)\}/)?.[1] || "";
 assert.ok(rule.includes("currentColor var(--media-played,0%)"),"trecho reproduzido deve contrastar com o balão");
 assert.ok(rule.includes("color-mix(in srgb,currentColor 35%,transparent)"),"trilha restante deve permanecer perceptível");
 assert.match(css,/\.message-row\.mine \.media-progress::-webkit-slider-thumb\s*\{/);
 assert.match(css,/\.message-row\.mine \.media-progress::-moz-range-thumb\s*\{/);
});

test("play inicia no primeiro toque sem propagar para gestos da conversa",()=>{
 const player=source("src/media-player.js");
 const swipe=source("src/swipe-reply.js");
 assert.match(player,/play\.onclick=async e=>\{/);
 assert.match(player,/e\.stopPropagation\(\)/);
 assert.match(swipe,/const excluded="button,/);
 assert.match(swipe,/if\(e\.target\.closest\("button,input,textarea,select,a,video,audio,\[contenteditable\]"\)\)return;/);
});
test("compositor mantém ícones contrastantes e remove bordas",()=>{
 const css=source("src/styles.css");
 assert.match(css,/#composer \.composer-box\{\s*border:0;/);
 assert.match(css,/#composer \.composer-box:focus-within\{\s*border:0;/);
 assert.match(css,/#composer \.composer-box > \.icon-button:not\(:disabled\)/);
 assert.match(css,/color:var\(--text\)/);
});

test("compositor distingue superfície do fundo e mantém contraste dos ícones",()=>{
 const css=source("src/styles.css");
 const rule=css.match(/#composer \.composer-box\s*\{([^}]+)\}/)?.[1]||"";
 assert.match(rule,/background:color-mix\(in srgb,var\(--text\) 4%,var\(--panel\)\)/);
 assert.match(rule,/border-radius:16px/);
 assert.match(css,/#composer \.composer-box textarea::placeholder\s*\{/);
 assert.match(css,/#composer \.composer-box > \.icon-button svg,/);
 assert.match(css,/stroke-width:2\.15/);
 assert.match(css,/#composer \.composer-box:focus-within/);
});

test("compositor tem fundo discretamente escurecido no claro e elevado no escuro",()=>{
 const css=source("src/styles.css"),html=source("index.html");
 const rule=css.match(/#composer \.composer-box\s*\{([^}]+)\}/)?.[1]||"";
 const focused=css.match(/#composer \.composer-box:focus-within\s*\{([^}]+)\}/)?.[1]||"";
 assert.match(rule,/background:color-mix\(in srgb,var\(--text\) 4%,var\(--panel\)\)/);
 assert.match(focused,/background:color-mix\(in srgb,var\(--text\) 4%,var\(--panel\)\)/);
 assert.match(css,/html\[data-theme="dark"\] #composer \.composer-box/);
 assert.match(css,/background:color-mix\(in srgb,var\(--text\) 5%,var\(--panel\)\)/);
 assert.match(html,/<form class="composer" id="composer">/);
});
test("desktop reserva espaço ao compositor sem ocultá-lo sob histórico longo",()=>{
 const css=source("src/styles.css");
 assert.match(css,/@media\(min-width:761px\)\{[\s\S]*?\.shell > \.workspace\s*\{/);
 assert.match(css,/\.shell > \.workspace\s*\{[^}]*display:flex;[^}]*height:100%;[^}]*min-height:0;[^}]*overflow:hidden;/);
 assert.match(css,/\.workspace > \.messages\s*\{[^}]*flex:1 1 0%;[^}]*min-height:0;[^}]*overflow-y:auto;/);
 assert.match(css,/\.workspace > #composer\s*\{[^}]*display:block;[^}]*flex:0 0 auto;/);
});

test("campo do compositor tem foco sem contorno azul e tipografia mais legível",()=>{
 const css=source("src/styles.css");
 const block=css.match(/#composer \.composer-box #message-input:focus,\s*#composer \.composer-box #message-input:focus-visible\s*\{([^}]+)\}/)?.[1]||"";
 assert.match(block,/outline:none/);
 assert.match(block,/border:0/);
 const inputRule=css.match(/#composer \.composer-box #message-input\s*\{([^}]+)\}/)?.[1]||"";
 assert.match(inputRule,/font-size:16px/);
 assert.match(inputRule,/max-height:144px/);
 const box=css.match(/#composer \.composer-box\s*\{([^}]+)\}/)?.[1]||"";
 assert.match(box,/box-shadow:0 7px 28px/);
});
test("altura de textarea é redefinida ao trocar conversa e ao apagar texto",()=>{
 const main=source("src/main.js");
 assert.match(main,/\$\("#message-input"\)\.value="";\$\("#message-input"\)\.style\.height=""/);
 assert.match(main,/if\(!e\.target\.value\)\{e\.target\.style\.height="";return\}/);
});
