import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {capabilities,grantFor,eligibleConversations} from "../src/role-rules.mjs";
const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("OWNER retains required permissions and AGENT never manages assignments",()=>{
 for(const c of capabilities)assert.equal(grantFor("OWNER",c.id,{OWNER:{[c.id]:false}}),true);
 assert.equal(grantFor("AGENT","manageAssignments",{AGENT:{manageAssignments:true}}),false);
 assert.equal(grantFor("AGENT","deleteAll"),false);
 assert.equal(grantFor("SUPERVISOR","manageAssignments"),true);
 assert.equal(grantFor("INVALID","forward"),false);
});
test("owners can customize eligible actions for supervisor or agent",()=>{
 assert.equal(grantFor("AGENT","forward",{AGENT:{forward:false}}),false);
 assert.equal(grantFor("AGENT","editContacts",{AGENT:{editContacts:true}}),true);
 assert.equal(grantFor("SUPERVISOR","manageChannels",{SUPERVISOR:{manageChannels:true}}),true);
});
test("AGENT receives only personally assigned conversations",()=>{
 const conversations=[
  {id:"a",assignedToMemberId:"member-agent"},
  {id:"b",assignedToMemberId:"member-owner"},
  {id:"c",assignedToMemberId:null}
 ];
 assert.deepEqual(eligibleConversations(conversations,"AGENT","member-agent").map(c=>c.id),["a"]);
 assert.deepEqual(eligibleConversations(conversations,"SUPERVISOR","member-agent").map(c=>c.id),["a","b","c"]);
});
test("settings and main consume same records and channel registry instance",()=>{
 const main=file("src/main.js"),settings=file("src/settings.js"),pages=file("src/pages.js"),manage=file("src/channel-management.js");
 assert.match(main,/initializeAssignments\(conversations,adminState\(\)\.members\)/);
 assert.match(settings,/renderAccessPanel\(panel/);
 assert.match(main,/data\.js\?v=load50-1/);
 assert.match(settings,/data\.js\?v=channels-1/);
 assert.match(pages,/data\.js\?v=channels-1/);
 for(const s of [main,settings,pages,manage])assert.match(s,/channels\.js\?v=channels-1/);
 assert.match(file("src/d3.js"),/assignedToMemberId==="member-agent"/);
 assert.doesNotMatch(file("src/access-panel.js"),/localStorage\.|fetch\(/);
});
