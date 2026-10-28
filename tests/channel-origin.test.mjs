import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inferChannelPlatform,channelIdentity,platformOptions} from "../src/channel-identity.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const providers=[{id:"external",name:"WhatsApp (API)",kind:"external"},{id:"native",name:"WappHub Native",kind:"internal"},{id:"baileys",name:"Baileys",kind:"external"}];
test("separa plataforma, instância de canal e provider (incluindo Baileys)",()=>{
 const identity=channelIdentity({id:"wa-sales",name:"WhatsApp · Comercial",provider:"baileys",state:"connected",enabled:true},providers);
 assert.equal(identity.platform,"whatsapp");
 assert.equal(identity.channelName,"WhatsApp · Comercial");
 assert.equal(identity.providerName,"Baileys");
 assert.equal(identity.statusLabel,"Conectado");
 assert.equal(identity.icon,"origin-whatsapp");
});
test("identifica chat web e interno mesmo compartilhando provider nativo",()=>{
 assert.equal(inferChannelPlatform({id:"web-support",name:"Chat · Suporte",provider:"native"}),"web");
 assert.equal(inferChannelPlatform({id:"team",name:"WappHub · Equipe",provider:"native"}),"internal");
 assert.equal(channelIdentity({id:"team",name:"Equipe",provider:"native",platform:"internal",enabled:true},providers).platformLabel,"Interno");
});
test("canais legados funcionam e plataforma explícita prevalece",()=>{
 assert.equal(inferChannelPlatform({id:"wa-help",name:"WhatsApp · Suporte"}),"whatsapp");
 assert.equal(inferChannelPlatform({id:"wa-sales",platform:"web",name:"Atendimento"}),"web");
 assert.equal(inferChannelPlatform({id:"custom",name:"Suporte",provider:"external"}),"other");
 assert.equal(platformOptions.length,4);
});
test("não confunde indisponibilidade com categoria ou provider",()=>{
 const missing=channelIdentity(null,providers);
 assert.equal(missing.platform,"other");
 assert.equal(missing.providerName,"Provider indisponível");
 assert.equal(missing.status,"unavailable");
 const channel={id:"custom",name:"Chat da empresa",platform:"web",provider:"missing",state:"disconnected",enabled:true};
 const info=channelIdentity(channel,providers);
 assert.equal(info.platform,"web");
 assert.equal(info.providerName,"Provider indisponível");
 assert.equal(info.statusLabel,"Desconectado");
 assert.equal(channelIdentity({...channel,enabled:false},providers).statusLabel,"Desabilitado");
 assert.equal(channelIdentity({...channel,state:"failed"},providers).statusLabel,"Falha na conexão");
});
test("renderização reusa o componente sem buscar dados nem persistir na view",()=>{
 const ui=source("src/channel-identity-ui.js");
 const main=source("src/main.js");
 const gallery=source("src/media-gallery.js");
 const pages=source("src/pages.js");
 const html=source("index.html");
 const channels=source("src/channels.js");
 const management=source("src/channel-management.js");
 for(const js of [ui,source("src/channel-identity.mjs")])assert.doesNotMatch(js,/localStorage|fetch\(|XMLHttpRequest/);
 assert.match(main,/function renderOrigin\(c\)/);
 assert.match(main,/createOriginBadge\(originOf\(c\),\{status:true\}\)/);
 assert.match(main,/header\.replaceChildren\(createOriginBadge\(identity,\{provider:true,status:true\}\)\)/);
 for(const id of ["chat-origin","detail-platform","detail-channel","detail-provider","detail-connection"])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const symbol of ["origin-whatsapp","origin-web","origin-internal","origin-unknown"])
  assert.ok(html.includes('id="i-'+symbol+'"'),symbol);
 assert.match(gallery,/getOriginForItem/);
 assert.match(gallery,/createOriginBadge\(identity\)/);
 assert.match(pages,/channelIdentity\(channels\.find\(c=>c\.id===item\.channelId\),providers\)/);
 assert.match(channels,/platform:data\.platform/);
 assert.match(management,/Plataforma de origem/);
 assert.match(source("src/media-catalog.mjs"),/channelId:c\.channelId/);
});
test("CSS preserva identidade compacta e estilos de acesso por teclado",()=>{
 const css=source("src/styles.css");
 assert.match(css,/\.conversation-origin/);
 assert.match(css,/\.chat-origin-line/);
 assert.match(css,/\.origin-detail-section/);
 assert.match(css,/\.media-card-meta \.origin-identity/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/html\[data-animations="off"\]/);
});
