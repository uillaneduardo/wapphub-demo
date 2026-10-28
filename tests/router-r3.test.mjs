import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRoute} from "../src/router/routes.mjs";
import {checkRouteAccess} from "../src/router/guards.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const conversations=[
 {id:"mine",channelId:"wa",assignedToMemberId:"member-agent"},
 {id:"other",channelId:"wa",assignedToMemberId:"member-owner"},
 {id:"disabled",channelId:"off",assignedToMemberId:"member-agent"}
];
const channels=[{id:"wa",enabled:true},{id:"off",enabled:false}];
const context={conversations,channels,role:"AGENT",canAccess:c=>c.assignedToMemberId==="member-agent"};
const check=path=>checkRouteAccess(parseRoute(path),context);
test("R3: agent cannot open other or disabled conversations via pasted URLs",()=>{
 assert.equal(check("/inbox/mine").status,"allowed");
 assert.equal(check("/inbox/mine/details").status,"allowed");
 assert.equal(check("/inbox/other").status,"forbidden");
 assert.equal(check("/inbox/disabled").status,"forbidden");
 assert.equal(check("/contacts/other").status,"forbidden");
 assert.equal(check("/media?conversation=other").status,"forbidden");
 assert.equal(check("/media?conversation=disabled").status,"forbidden");
});
test("R3: unknown contacts/conversations are 404 without leaking metadata",()=>{
 assert.equal(check("/inbox/missing").status,"not-found");
 assert.equal(check("/contacts/missing").status,"not-found");
 assert.equal(check("/media?conversation=missing").status,"not-found");
 assert.equal(check("/settings/unlisted").status,"not-found");
});
test("R3: agent settings route protects management sections",()=>{
 assert.deepEqual(check("/settings"),{status:"redirect",path:"/settings/appearance"});
 assert.equal(check("/settings/appearance").status,"allowed");
 assert.equal(check("/settings/permissions").status,"forbidden");
 assert.equal(check("/settings/channels").status,"forbidden");
 assert.equal(check("/profile").status,"allowed");
 const owner={...context,role:"OWNER",canAccess:()=>true};
 assert.equal(checkRouteAccess(parseRoute("/settings/permissions"),owner).status,"allowed");
});
test("R3: unsupported media types and unbounded searches fail safely",()=>{
 assert.equal(check("/media?type=video").status,"allowed");
 assert.equal(check("/media?type=exe").status,"not-found");
 assert.equal(check("/media?q="+("x".repeat(161))).status,"not-found");
});
test("R3: route guard invoked before rendering, invalidates stale views",()=>{
 const main=source("src/main.js"),pages=source("src/pages.js");
 assert.match(main,/checkRouteAccess\(route,/);
 assert.match(main,/currentState\(\)\.role/);
 assert.match(main,/showModule\(gate\.status==="forbidden"\?"access-denied":"not-found"\)/);
 assert.match(main,/router\?\.refresh\(\)/);
 assert.match(main,/onSectionChange:section=>router\.navigate\(settingsPath\(section\)\)/);
 assert.match(pages,/const allowedConversation=/);
 assert.match(pages,/conversations\.filter\(allowedConversation\)/);
 assert.match(pages,/name==="access-denied"/);
});
test("R3: static assets never fall through to SPA HTML",()=>{
 const nginx=source("nginx.conf");
 assert.match(nginx,/try_files \$uri \$uri\/ \/index\.html/);
 assert.match(nginx,/pdf\|mp3\|wav\|ogg\|mp4\|webm/);
 assert.match(nginx,/try_files \$uri =404/);
});
