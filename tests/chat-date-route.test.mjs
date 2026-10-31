import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {refreshChatDateIndicator,setChatDateIndicatorVisible} from "../src/chat-dates.js?v=dates-1&route-scope-1";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("balão de data acompanha somente conversa aberta, nunca dashboard ou inbox mobile",()=>{
 const original={
  document:globalThis.document,window:globalThis.window,
  requestAnimationFrame:globalThis.requestAnimationFrame
 };
 const callbacks=[],added=[],overlays=[];
 const flags={module:false,mobile:false,chatOpen:true};
 const row={
  dataset:{messageDay:"2026-10-30"},
  getBoundingClientRect:()=>({bottom:240})
 };
 const viewport={
  isConnected:true,
  querySelectorAll:()=>[row],
  getBoundingClientRect:()=>({left:100,top:120,width:400,height:600}),
  addEventListener:()=>{},
  removeEventListener:()=>{}
 };
 const app={classList:{contains:key=>key==="chat-open"&&flags.chatOpen}};
 globalThis.document={
  head:{append:element=>added.push(element)},
  body:{
   classList:{contains:key=>key==="module-active"&&flags.module},
   append:element=>overlays.push(element)
  },
  getElementById:id=>id==="app"?app:null,
  createElement:tag=>({tagName:tag,hidden:false,style:{},setAttribute(){}})
 };
 globalThis.window={
  matchMedia:()=>({matches:flags.mobile}),
  addEventListener:()=>{}
 };
 globalThis.requestAnimationFrame=fn=>{callbacks.push(fn);return callbacks.length};
 const flush=()=>{for(const fn of callbacks.splice(0))fn()};
 try{
  setChatDateIndicatorVisible(true);
  refreshChatDateIndicator(viewport);
  flush();
  const balloon=overlays.find(node=>node.className==="chat-floating-date");
  assert.ok(balloon,"indicador inserido no documento");
  assert.equal(balloon.hidden,false,"conversa aberta deve mostrar indicador");

  // Mesmo um RAF pendente não pode reexibir o indicador fora da conversa.
  setChatDateIndicatorVisible(true);
  setChatDateIndicatorVisible(false);
  assert.equal(balloon.hidden,true,"deve ocultar imediatamente ao sair");
  flush();
  assert.equal(balloon.hidden,true,"RAF antigo não pode voltar a exibir");

  flags.module=true;
  setChatDateIndicatorVisible(true);
  flush();
  assert.equal(balloon.hidden,true,"dashboard e configurações nunca exibem o balão");

  flags.module=false;
  flags.mobile=true;
  flags.chatOpen=false;
  setChatDateIndicatorVisible(true);
  flush();
  assert.equal(balloon.hidden,true,"lista de conversas no mobile oculta indicador");

  flags.chatOpen=true;
  setChatDateIndicatorVisible(true);
  flush();
  assert.equal(balloon.hidden,false,"abrir chat no mobile volta a exibir");

  viewport.isConnected=false;
  setChatDateIndicatorVisible(true);
  flush();
  assert.equal(balloon.hidden,true,"chat desmontado não exibe indicador");
 }finally{
  setChatDateIndicatorVisible(false);
  for(const [key,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[key];
   else globalThis[key]=value;
  }
 }
});
test("rotas controlam a visibilidade e compartilham exatamente o mesmo módulo",()=>{
 const main=source("src/main.js"),d2=source("src/d2.js"),css=source("src/chat-dates.css");
 const importPath='"./chat-dates.js?v=dates-1&route-scope-1"';
 assert.ok(main.includes(importPath));
 assert.ok(d2.includes(importPath),"D2 deve usar a mesma instância de módulo do roteador");
 assert.match(main,/const router=createRouter\(\{render:route=>\{\s*\/\/[^\n]*\n setChatDateIndicatorVisible\(false\)/);
 assert.match(main,/select\(id,\{openChat:true,markRead:true\}\);[\s\S]*?setChatDateIndicatorVisible\(true\)/);
 assert.match(css,/body\.module-active \.chat-floating-date\{display:none!important\}/);
});
