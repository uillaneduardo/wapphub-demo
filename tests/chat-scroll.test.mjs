import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {distanceFromBottom,shouldShowJump,renderScrollMode,JUMP_THRESHOLD} from "../src/chat-scroll-policy.mjs";
import {createChatScrollController} from "../src/chat-scroll.js";

test("at the latest message there is no jump control; historical position shows it",()=>{
 assert.equal(distanceFromBottom({scrollHeight:1200,scrollTop:850,clientHeight:350}),0);
 assert.equal(shouldShowJump({scrollHeight:1200,scrollTop:850,clientHeight:350}),false);
 assert.equal(shouldShowJump({scrollHeight:1200,scrollTop:850-JUMP_THRESHOLD-1,clientHeight:350}),true);
 assert.equal(shouldShowJump({scrollHeight:220,scrollTop:0,clientHeight:350}),false);
 assert.equal(shouldShowJump({scrollHeight:1200,scrollTop:0,clientHeight:0}),false);
 assert.equal(renderScrollMode({conversationChanged:true}),"latest");
 assert.equal(renderScrollMode({nearBottom:true}),"latest");
 assert.equal(renderScrollMode({nearBottom:false}),"preserve");
 assert.equal(renderScrollMode({conversationChanged:true,searching:true}),"search");
});

function fixture(){
 const viewport={
  scrollHeight:900,clientHeight:300,scrollTop:0,events:{},
  addEventListener(name,callback){this.events[name]=callback},
  removeEventListener(){},
  querySelectorAll(){return []},
  scrollTo(options){
   this.scrollTop=Math.max(0,Math.min(options.top,this.scrollHeight-this.clientHeight));
   this.lastBehavior=options.behavior;
   this.events.scroll?.();
  }
 };
 const composer={getBoundingClientRect:()=>({height:88})};
 const values=new Map(),workspace={style:{setProperty:(key,value)=>values.set(key,value)}};
 const button={hidden:true,events:{},addEventListener(name,callback){this.events[name]=callback},removeEventListener(){}};
 const raf=[],observers=[];
 const prior={doc:globalThis.document,win:globalThis.window,resize:globalThis.ResizeObserver,raf:globalThis.requestAnimationFrame,cancel:globalThis.cancelAnimationFrame};
 globalThis.document={documentElement:{dataset:{animations:"on"}}};
 globalThis.window={matchMedia:()=>({matches:false})};
 globalThis.ResizeObserver=class {
  constructor(callback){this.callback=callback;observers.push(this)}
  observe(){}
  disconnect(){}
 };
 globalThis.requestAnimationFrame=callback=>{raf.push(callback);return raf.length};
 globalThis.cancelAnimationFrame=()=>{};
 const controller=createChatScrollController({viewport,composer,workspace,button});
 return {viewport,button,workspace,values,observers,controller,flush:()=>{for(const cb of raf.splice(0))cb()},restore:()=>{
  controller.destroy();
  for(const [name,key] of [["document","doc"],["window","win"],["ResizeObserver","resize"],["requestAnimationFrame","raf"],["cancelAnimationFrame","cancel"]]){
   if(prior[key]===undefined)delete globalThis[name];else globalThis[name]=prior[key];
  }
 }};
}
test("new conversation lands at newest message; manual reading survives a rerender",()=>{
 const f=fixture();
 try{
  const one=f.controller.capture("a");f.controller.commit(one);f.flush();
  assert.equal(f.viewport.scrollTop,900);
  assert.equal(f.button.hidden,true);
  f.viewport.scrollTop=250;f.viewport.events.scroll();
  assert.equal(f.button.hidden,false);
  const same=f.controller.capture("a");f.viewport.scrollHeight=1100;f.controller.commit(same);f.flush();
  assert.equal(f.viewport.scrollTop,250,"should not jump to latest when reading older messages");
  assert.equal(f.button.hidden,false);
  assert.equal(f.values.get("--chat-jump-composer-height"),"88px");
  f.button.events.click();f.flush();
  assert.equal(f.viewport.scrollTop,800);
  assert.equal(f.viewport.lastBehavior,"smooth");
  assert.equal(f.button.hidden,true);
  const two=f.controller.capture("b");f.viewport.scrollHeight=2000;f.controller.commit(two);f.flush();
  assert.equal(f.viewport.scrollTop,2000);
  assert.equal(f.button.hidden,true);
 }finally{f.restore()}
});
test("search starts at top and image growth only follows when pinned",()=>{
 const f=fixture();
 try{
  let state=f.controller.capture("a");f.controller.commit(state);f.flush();
  state=f.controller.capture("a");f.controller.commit(state,{searching:true});f.flush();
  assert.equal(f.viewport.scrollTop,0);
  assert.equal(f.button.hidden,false);
  f.viewport.scrollHeight=1200;f.observers[0].callback();
  assert.equal(f.viewport.scrollTop,0,"image size must not pull user away from search");
  f.button.events.click();
  f.viewport.scrollHeight=1300;f.observers[0].callback();
  assert.equal(f.viewport.scrollTop,1300,"image size keeps latest anchored");
  globalThis.document.documentElement.dataset.animations="off";
  f.viewport.scrollTop=100;f.viewport.events.scroll();
  f.button.events.click();
  assert.equal(f.viewport.lastBehavior,"auto");
 }finally{f.restore()}
});
test("integration retains ARIA label and no longer forces scroll inside renderD2",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const d2=readFileSync(new URL("../src/d2.js",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
 assert.match(html,/id="chat-jump-latest"/);
 assert.match(html,/aria-label="Ir para a mensagem mais recente"/);
 assert.match(html,/aria-controls="messages"/);
 assert.doesNotMatch(d2,/container.scrollTop=query\?0:container.scrollHeight/);
 assert.match(main,/chatScroll.capture\(allowed\?conversation.id:null\)/);
 assert.match(main,/chatScroll.commit\(before,result\)/);
 assert.match(css,/\.chat-jump-latest\[hidden\]\{display:none!important\}/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/html\[data-animations="off"\] \.chat-jump-latest/);
});
