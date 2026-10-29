import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMockContactRepository} from "../src/data/adapters/mock/contact-storage.mjs";
import {createContactService} from "../src/services/contacts.mjs";
import {filterInboxConversations,filterAccessibleContacts,matchesContactSearch} from "../src/domain/conversation-query.mjs";
import {conversationMatchesChannels} from "../src/channel-filter.mjs";
import {conversations} from "../src/data.js";
import {conversations as fixtures} from "../src/data/adapters/mock/fixtures/conversations.js";
import {configureContactIdentity,nameOf,updateContact} from "../src/contact-identity.js";

const storage=(seed={})=>{
 const values=new Map(Object.entries(seed));
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),values};
};
const KEY="wapphub-demo-contacts-v1";

test("legacy fixture export preserves identity, IDs, channels and message tuples",()=>{
 assert.equal(conversations,fixtures);
 assert.equal(conversations.length,56);
 assert.equal(conversations.filter(c=>c.id.startsWith("load-")).length,50);
 assert.equal(conversations.find(c=>c.id==="mariana").channelId,"wa-sales");
 assert.ok(Array.isArray(conversations[0].messages[0]));
});

test("contact service reads existing v1 aliases without changing the storage key",async()=>{
 const legacy=storage({[KEY]:JSON.stringify({mariana:{alias:"Maria Antiga",photo:"https://example.org/a.png"}})});
 const service=createContactService(createMockContactRepository(legacy));
 configureContactIdentity(service);
 assert.equal(nameOf({id:"mariana",name:"Mariana"}),"Maria Antiga");
 await updateContact({id:"mariana"},{alias:"Maria Nova"});
 assert.equal(nameOf({id:"mariana",name:"Mariana"}),"Maria Nova");
 assert.equal(JSON.parse(legacy.getItem(KEY)).mariana.photo,"https://example.org/a.png");
 assert.equal(JSON.parse(legacy.getItem(KEY)).mariana.alias,"Maria Nova");
 const result=service.get("mariana");result.alias="Mutado";
 assert.equal(service.get("mariana").alias,"Maria Nova");
});

test("storage malformed, denied and quota errors do not claim saved data",async()=>{
 const corrupt=storage({[KEY]:"{invalid"});
 const service=createContactService(createMockContactRepository(corrupt));
 assert.deepEqual(service.get("a"),{});
 const blocked={getItem:()=>{throw new Error("blocked")},setItem:()=>{throw new Error("quota")}};
 const deny=createContactService(createMockContactRepository(blocked));
 await assert.rejects(deny.save("a",{alias:"Novo"}),/quota/);
 assert.deepEqual(deny.get("a"),{});
 const none=createContactService(createMockContactRepository(null));
 await assert.rejects(none.save("a",{alias:"Novo"}),/indisponível/);
});

test("contact adapter validates aliases, URLs and IDs",async()=>{
 const service=createContactService(createMockContactRepository(storage()));
 await assert.rejects(service.save("",{alias:"X"}),/inválido/);
 await assert.rejects(service.save("x",{photo:"javascript:alert(1)"}),/Imagem inválida/);
 await service.save("x",{alias:"A".repeat(120)});
 assert.equal(service.get("x").alias.length,80);
});

test("Inbox search uses visible channels and access before applying filters",()=>{
 const chats=[
  {id:"a",name:"Ana Júlia",phone:"+55 (81) 99999-1001",preview:"Orçamento",channelId:"whatsapp",assigned:true,unread:2},
  {id:"b",name:"Bruno",phone:"8198888",preview:"Privado",channelId:"web",assigned:false,unread:1},
  {id:"c",name:"Carlos",phone:"8197777",preview:"Oi",channelId:"disabled",assigned:true,unread:1}
 ];
 const channels=[{id:"all",enabled:true},{id:"whatsapp",enabled:true},{id:"web",enabled:true},{id:"disabled",enabled:false}];
 const args={canAccess:c=>c.id!=="b",channels,nameOf:c=>c.name,conversationMatchesChannels};
 const inbox=extras=>filterInboxConversations(chats,{...args,...extras});
 assert.deepEqual(inbox({filter:"unread"}).map(c=>c.id),["a"]);
 assert.deepEqual(inbox({filter:"mine",selectedChannels:new Set(["web"])}),[]);
 assert.deepEqual(inbox({query:"ana julia"}).map(c=>c.id),["a"]);
 assert.deepEqual(inbox({query:"81999991001"}).map(c=>c.id),["a"]);
 assert.ok(matchesContactSearch(chats[0],"orçamento",c=>c.name));
 assert.deepEqual(filterAccessibleContacts(chats,{canAccess:args.canAccess,channels,query:"ana",nameOf:args.nameOf}).map(c=>c.id),["a"]);
 assert.deepEqual(chats.map(c=>c.unread),[2,1,1]);
});

test("views no longer access contact localStorage or embed Inbox filtering",()=>{
 const contact=readFileSync(new URL("../src/contact-identity.js",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const pages=readFileSync(new URL("../src/pages.js",import.meta.url),"utf8");
 assert.doesNotMatch(contact,/localStorage|wapphub-demo-contacts-v1/);
 assert.match(main,/configureContactIdentity\(createContactService\(createMockContactRepository\(\)\)\)/);
 assert.match(main,/filterInboxConversations\(conversations,/);
 assert.match(pages,/filterAccessibleContacts\(conversations,/);
});
