import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mediaEntries,filterMedia,mediaTotals,mediaKind} from "../src/media-catalog.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const conv=[
 {id:"a",name:"Cliente A",messages:[
  {id:"i1",time:"10:00",direction:"in",file:{kind:"image",url:"/a.svg",name:"Foto"}},
  {id:"v1",time:"10:01",direction:"out",file:{kind:"video",url:"/a.mp4",name:"Vídeo"}},
  {id:"hidden",hidden:true,file:{kind:"audio",url:"/a.wav"}},
  {id:"deleted",deletedAll:true,file:{kind:"image",url:"/b.svg"}}
 ]},
 {id:"b",name:"Cliente B",messages:[
  ["in","Olá","10:02"],
  {id:"a1",time:"10:03",direction:"in",file:{kind:"audio",url:"/a.wav",name:"Voz"}},
  {id:"broken",file:{kind:"video",name:"Sem fonte"}}
 ]}
];
test("catalogue indexes image, video and audio without hidden/deleted/no-source items",()=>{
 const items=mediaEntries(conv);
 assert.deepEqual(items.map(m=>m.id),["i1","v1","a1"]);
 assert.deepEqual(mediaTotals(items),{all:3,image:1,audio:1,video:1,document:0});
 assert.equal(mediaKind({mimeType:"video/mp4"}),"video");
 assert.equal(mediaKind({kind:"document"}),"document");
});
test("filters combine conversation, type and search with accent-safe casing",()=>{
 const items=mediaEntries(conv);
 assert.deepEqual(filterMedia(items,{conversationId:"a"}).map(m=>m.id),["i1","v1"]);
 assert.deepEqual(filterMedia(items,{kind:"audio"}).map(m=>m.id),["a1"]);
 assert.deepEqual(filterMedia(items,{conversationId:"b",query:"voz"}).map(m=>m.id),["a1"]);
 assert.deepEqual(filterMedia(items,{conversationId:"b",kind:"video"}),[]);
});
test("player and gallery are presentation-only and offer media controls",()=>{
 const player=source("src/media-player.js"),gallery=source("src/media-gallery.js");
 for(const content of [player,gallery])assert.doesNotMatch(content,/localStorage\.|sessionStorage\.|\bfetch\(|XMLHttpRequest/);
 for(const control of ['media-play','media-progress','media-time','media-duration','media-speed'])assert.ok(player.includes(control),control);
 assert.match(player,/playbackRate/);
 assert.match(player,/media\.currentTime=/);
 assert.match(player,/media\.addEventListener\("error"/);
 assert.match(gallery,/Filtrar mídias por conversa/);
 assert.match(gallery,/renderConversationMedia/);
});
test("mídias têm acesso na navegação e nos detalhes da conversa",()=>{
 const html=source("index.html"),main=source("src/main.js"),pages=source("src/pages.js"),chat=source("src/d2.js");
 assert.match(html,/data-nav="midias"/);
 assert.match(html,/id="detail-media"/);
 assert.match(main,/seedMediaFixtures\(conversations\)/);
 assert.match(main,/renderConversationMedia\(c,/);
 assert.match(pages,/name==="midias"/);
 assert.match(pages,/conversations\.filter\(canAccess\)/);
 assert.match(chat,/createMediaPlayer\(m\.file/);
});
test("assets shipped by docker and CSP allows only the declared media origin",()=>{
 const docker=source("Dockerfile"),config=source("nginx.conf");
 assert.match(docker,/COPY assets\//);
 assert.match(config,/media-src 'self' blob: https:\/\/interactive-examples\.mdn\.mozilla\.net/);
 for(const name of ["equipment.svg","receipt.svg","video-poster.svg"])assert.match(source("assets/"+name),/<svg/);
});
