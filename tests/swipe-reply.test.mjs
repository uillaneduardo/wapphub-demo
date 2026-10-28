import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {swipeDirection,swipeIntent,swipeOffset,shouldReplyFromSwipe,swipeThreshold,SWIPE_REPLY_PX,SWIPE_REPLY_TOUCH_PX,SWIPE_MAX_PX} from "../src/swipe-reply.mjs";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("mensagens recebidas respondem ao arrastar para a direita",()=>{
 assert.equal(swipeDirection("in"),1);
 assert.equal(swipeIntent(18,3,"in"),"horizontal");
 assert.equal(shouldReplyFromSwipe(SWIPE_REPLY_PX+5,4,"in"),true);
 assert.equal(shouldReplyFromSwipe(40,2,"in"),false);
 assert.equal(swipeIntent(-25,2,"in"),"opposite");
});

test("mensagens enviadas respondem ao arrastar para a esquerda",()=>{
 assert.equal(swipeDirection("out"),-1);
 assert.equal(swipeIntent(-25,4,"out"),"horizontal");
 assert.equal(shouldReplyFromSwipe(-SWIPE_REPLY_PX-3,0,"out"),true);
 assert.equal(shouldReplyFromSwipe(77,1,"out"),false);
 assert.equal(swipeOffset(-230,"out"),-120);
 assert.equal(swipeOffset(240,"in"),120);
});

test("movimento vertical e arrastos curtos não disparam resposta",()=>{
 assert.equal(swipeIntent(7,65,"in"),"vertical");
 assert.equal(swipeIntent(-8,-49,"out"),"vertical");
 assert.equal(swipeIntent(7,3,"in"),"pending");
 assert.equal(shouldReplyFromSwipe(78,71,"in"),false);
 assert.equal(shouldReplyFromSwipe(20,0,"in"),false);
});

test("adaptador suporta touch, mouse e pen sem conflitar com ações existentes",()=>{
 const adapter=src("src/swipe-reply.js"),chat=src("src/d2.js");
 for(const event of ["pointerdown","pointermove","pointerup","pointercancel","lostpointercapture"])
  assert.ok(adapter.includes('addEventListener("'+event+'"'),event);
 assert.match(adapter,/e\.pointerType==="mouse"&&e\.button!==0/);
 assert.match(adapter,/isSelectionActive\(\)/);
 assert.match(adapter,/\.media-player,\.file-card/);
 assert.ok(adapter.includes('target.closest(".bubble")'));
 assert.ok(adapter.includes("area.setPointerCapture(g.pointerId)"));
 assert.match(adapter,/e\.preventDefault\(\);e\.stopImmediatePropagation\(\)/);
 assert.match(chat,/swipeGesture=setupSwipeReply/);
 assert.match(chat,/onReply:id=>action\("reply",id\)/);
 assert.match(chat,/swipeGesture\?\.cancel\(\)/);
 assert.match(chat,/clearTimeout\(touchTimer\);touchStart=null;closeMenu\(\)/);
});

test("feedback visual usa cor de destaque sem faixas e respeita movimento reduzido",()=>{
 const html=src("index.html"),css=src("src/styles.css");
 assert.match(html,/id="i-reply-swipe"/);
 assert.match(css,/\.swipe-reply-cue/);
 assert.match(css,/\.message-row\.swipe-reply-ready \.swipe-reply-cue/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/touch-action:pan-y/);
});

test("compositor e detalhes atualizam sem erro de callback",()=>{
 const main=src("src/main.js");
 assert.match(main,/\$\("#detail-agent"\)\.textContent=c\.agent;renderConversationMedia\(/);
 assert.doesNotMatch(main,/c\.agentrenderConversationMedia/);
 assert.match(main,/d2\.js\?v=motion-1/);
});

test("Android ativa a resposta com percurso menor e libera mais deslocamento visual",()=>{
 assert.equal(swipeThreshold("touch"),SWIPE_REPLY_TOUCH_PX);
 assert.ok(SWIPE_REPLY_TOUCH_PX<SWIPE_REPLY_PX);
 assert.ok(SWIPE_MAX_PX>=2*SWIPE_REPLY_TOUCH_PX);
 assert.equal(shouldReplyFromSwipe(39,3,"in","touch"),true);
 assert.equal(shouldReplyFromSwipe(-39,2,"out","touch"),true);
 assert.equal(shouldReplyFromSwipe(31,1,"in","touch"),false);
 assert.equal(shouldReplyFromSwipe(39,45,"in","touch"),false);
});

test("no mobile um touchmove não passivo controla arrasto horizontal, sem impedir scroll vertical",()=>{
 const adapter=src("src/swipe-reply.js");
 for(const event of ["touchstart","touchmove","touchend","touchcancel"])
  assert.ok(adapter.includes('addEventListener("'+event+'"'),event);
 assert.ok(adapter.includes("{passive:false}"));
 assert.ok(adapter.includes("const intent=swipeIntent(dx,dy,g.direction)"));
 assert.ok(adapter.includes('if(intent==="vertical"||intent==="opposite"){clear();return}'));
 assert.ok(adapter.includes("if(event?.cancelable)event.preventDefault()"));
 assert.ok(adapter.includes("if(dx*swipeDirection(g.direction)>=swipeThreshold"));
 assert.ok(adapter.includes("g.started&&g.armed&&"));
 assert.ok(adapter.includes("if(gesture&&!gesture.started)clear()"));
});
