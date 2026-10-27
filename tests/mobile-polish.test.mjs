import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=src("index.html"),css=src("src/styles.css"),d2=src("src/d2.js"),settings=src("src/settings.js");

test("search for messages is part of app, not native prompt",()=>{
 assert.match(html,/id="message-search"[^>]*role="search"/);
 assert.match(html,/id="message-search-input"[^>]*type="search"/);
 assert.match(html,/id="message-search-clear"/);
 assert.match(html,/id="message-search-close"/);
 assert.doesNotMatch(d2,/\bprompt\s*\(/);
 assert.match(d2,/searchInput\.addEventListener\("input"/);
 assert.match(d2,/searchInput\.addEventListener\("keydown"/);
 assert.match(d2,/searchCount\.textContent=query/);
 assert.match(d2,/searchBox\.hidden=true/);
 assert.match(css,/\.message-search\[hidden\]/);
});

test("settings mobile sections use a single responsive selector",()=>{
 assert.match(settings,/settings-mobile-switch/);
 assert.match(settings,/settings-mobile-select/);
 assert.match(settings,/sectionSelect\.addEventListener\("change"/);
 assert.match(css,/@media\(max-width:760px\)[\s\S]*\.settings-menu\{display:none\}/);
 assert.match(css,/\.settings-mobile-switch\{display:flex/);
});

test("admin action buttons stay together in mobile rows",()=>{
 assert.match(src("src/admin-ui.js"),/settings-row-actions/);
 assert.match(src("src/channel-management.js"),/settings-row-actions/);
 assert.match(css,/\.settings-panel \.settings-row-actions/);
 assert.match(css,/\.settings-panel \.settings-item\{grid-template-columns:minmax\(0,1fr\)/);
});
