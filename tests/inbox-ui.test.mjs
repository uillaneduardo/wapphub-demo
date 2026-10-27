import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=source("index.html");

test("seletor de canais fica ao lado de Caixa de entrada",()=>{
 assert.match(html,/<div class="inbox-topline">/);
 const top=html.split('<div class="inbox-topline">')[1].split("</div>")[0];
 assert.match(top,/Caixa de entrada/);
 assert.match(top,/id="channel-filter-trigger"/);
 assert.match(top,/id="channel-filter-popover"/);
 assert.match(top,/aria-haspopup="dialog"/);
 assert.doesNotMatch(html,/id="channel-select"/);
 assert.match(html,/id="conversation-count"/);
});

test("não há menu inativo ou mensagens de protótipo nas telas",()=>{
 assert.doesNotMatch(html,/id="inbox-menu"|id="channel-status"|class="inbox-footer"/);
 assert.doesNotMatch(html,/Visão unificada|Ambiente de demonstração|WhatsApp · Simulado|dados fictícios/i);
 const ui=["src/main.js","src/pages.js","src/settings.js","src/admin-ui.js","src/channel-management.js","src/d2.js"];
 for(const path of ui)assert.doesNotMatch(source(path),/demonstração|na demo|visão unificada|permissões simuladas|dados fictícios/i,path);
});

test("diagnósticos operacionais não dependem de rodapé da inbox",()=>{
 const state=source("src/d3.js");
 assert.match(state,/URLSearchParams\(location.search\)/);
 assert.doesNotMatch(state,/querySelector\("\.inbox-footer"\)/);
 assert.match(state,/const status=\$\("#d3-connection"\);if\(status\)/);
});

test("canal da conversa é exibido nos detalhes e imports são versionados",()=>{
 const main=source("src/main.js");
 assert.match(html,/id="detail-channel"/);
 assert.match(main,/\$\("#detail-channel"\)\.textContent=getChannel\(c.channelId\)\.name/);
 assert.match(html,/main\.js\?v=d5-2/);
 assert.match(main,/d3\.js\?v=d4-6/);
 assert.match(main,/d2\.js\?v=d5-2/);
});
