import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveReplyTarget} from "../src/reply-navigation.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const conversation={id:"mariana",messages:[
 {id:"m1",body:"Mensagem original",direction:"in"},
 {id:"m2",body:"Mensagem excluída",hidden:true},
 {id:"m3",body:"Mensagem apagada",deletedAll:true}
]};
test("referência resolve mensagem original no mesmo atendimento",()=>{
 assert.equal(resolveReplyTarget(conversation,{conversationId:"mariana",messageId:"m1"})?.body,"Mensagem original");
 assert.equal(resolveReplyTarget(conversation,{conversationId:"mariana",messageId:"m3"})?.id,"m3");
});
test("não navega entre conversas nem para mensagens inexistentes/ocultas",()=>{
 for(const reference of [
  {conversationId:"ricardo",messageId:"m1"},
  {conversationId:"mariana",messageId:"m9"},
  {conversationId:"mariana",messageId:"m2"},
  {conversationId:"mariana",messageId:9},
  null
 ])assert.equal(resolveReplyTarget(conversation,reference),null);
});
test("referência se torna acionável e preserva seleção múltipla",()=>{
 const chat=source("src/d2.js");
 assert.match(chat,/ref=el\("button","reply-reference"/);
 assert.match(chat,/ref\.dataset\.replyTarget=m\.reply\.messageId/);
 assert.match(chat,/await operationQuery\.getMessage\(conversation\.id,messageRow\.dataset\.messageId\)/);
 assert.match(chat,/if\(active\(\)\?\.id===conversation\.id&&message\?\.reply\)await jumpToOriginal\(message\.reply\)/);
 assert.match(chat,/\[data-reply-target\],a,button,input,video,audio/);
 assert.match(chat,/if\(query\)\{/);
 assert.match(chat,/row\.scrollIntoView\(/);
 assert.match(chat,/row\.focus\(\{preventScroll:true\}\)/);
 assert.match(chat,/reply-jump-highlight/);
 assert.doesNotMatch(source("src/reply-navigation.mjs"),/localStorage|document\.|fetch\(/);
});
test("mensagens demonstrativas incluem resposta com IDs vinculados",()=>{
 const data=source("src/media-fixtures.js");
 assert.match(data,/id:"sample:reply:mariana"/);
 assert.match(data,/conversationId:"mariana",messageId:"sample:video:mariana"/);
});
test("realce é discreto e respeita movimento reduzido",()=>{
 const css=source("src/styles.css");
 assert.match(css,/\.message-row\.reply-jump-highlight/);
 assert.match(css,/background:var\(--brand-soft\)/);
 assert.match(css,/scroll-margin-block:96px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
