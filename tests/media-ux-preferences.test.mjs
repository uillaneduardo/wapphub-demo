import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mediaVisibilityKey,resolveMediaBlur} from "../src/media-preferences.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("visibilidade identifica a mídia por conversa e mensagem",()=>{
 const a=mediaVisibilityKey("mariana","sample:video:mariana");
 const b=mediaVisibilityKey("ricardo","sample:video:mariana");
 assert.notEqual(a,b);
 assert.equal(a,mediaVisibilityKey("mariana","sample:video:mariana"));
 assert.equal(resolveMediaBlur(a,{},true),true);
 assert.equal(resolveMediaBlur(a,{},false),false);
 assert.equal(resolveMediaBlur(a,{[a]:false},true),false);
 assert.equal(resolveMediaBlur(a,{[a]:true},false),true);
 assert.equal(resolveMediaBlur("",{},true),false);
});
test("preferências preservam tema existente e adicionam dois switches independentes",()=>{
 const appearance=read("src/appearance.js"),settings=read("src/settings.js");
 assert.match(appearance,/wapphub-demo-appearance-v1/);
 assert.match(appearance,/typeof v.animations==="boolean"\?v.animations:true/);
 assert.match(appearance,/typeof v.blurMedia==="boolean"\?v.blurMedia:true/);
 assert.match(appearance,/root.dataset.animations=appearance.animations\?"on":"off"/);
 assert.match(appearance,/wapphub-appearance-changed/);
 assert.match(settings,/Animações da interface/);
 assert.match(settings,/Desfocar prévias de mídias/);
 assert.match(settings,/toggle.dataset.appearanceKey=key/);
 assert.match(settings,/setAppearance\(\{\[key\]:toggle.checked\}\)/);
});
test("adaptação da mídia persiste por item sem acoplar a UI à persistência",()=>{
 const store=read("src/media-visibility-store.js");
 const control=read("src/media-blur.js");
 const gallery=read("src/media-gallery.js");
 const d2=read("src/d2.js");
 const player=read("src/media-player.js");
 assert.match(store,/wapphub-demo-media-blur-v1/);
 assert.match(store,/setMediaBlurred\(key,value\)/);
 assert.match(store,/wapphub-media-blur-changed/);
 for(const ui of [control,gallery,player,d2])assert.doesNotMatch(ui,/localStorage\.|sessionStorage\./);
 assert.match(control,/wapphub-appearance-changed/);
 assert.match(control,/media-blur-toggle/);
 assert.match(control,/aria-pressed/);
 assert.match(gallery,/attachMediaBlur\(card/);
 assert.match(gallery,/attachMediaBlur\(tile/);
 assert.match(d2,/attachMediaBlur\(frame,img/);
 assert.match(player,/attachMediaBlur\(stage,media/);
 assert.match(player,/if\(video&&visibilityKey\)setMediaBlurred\(visibilityKey,false\)/);
});
test("efeito atinge apenas bitmap/vídeo, sem desfocar controles ou legendas",()=>{
 const css=read("src/styles.css");
 assert.match(css,/\.media-blur-surface\.is-media-blurred \.media-blur-content/);
 assert.match(css,/\.media-blur-toggle/);
 assert.match(css,/\.message-image-frame/);
 assert.match(css,/\.media-card-open/);
 assert.match(css,/\.detail-media-open/);
 assert.match(css,/html\[data-animations="off"\]/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/@keyframes wh-enter/);
 assert.match(read("index.html"),/id="i-eye"/);
 assert.match(read("index.html"),/id="i-eye-off"/);
});
test("animar só mensagens novas, respeitar a escolha ao rolar para a resposta",()=>{
 const chat=read("src/d2.js");
 assert.match(chat,/m.id===recentlySentMessageId/);
 assert.match(chat,/recentlySentMessageId=m.id/);
 assert.match(chat,/recentlySentMessageId=null/);
 assert.match(chat,/dataset.animations==="off"/);
});
