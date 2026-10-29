import {mockStorage} from "./data/adapters/mock/storage.mjs";
// Tema de demonstração. Futuramente será substituído por configuração validada do Core.
const KEY="wapphub-demo-appearance-v1";
const presets={neutral:"#52525b",blue:"#2563eb",indigo:"#4f46e5",emerald:"#047857",orange:"#c2410c",rose:"#be185d"};
const root=document.documentElement;
const isHex=value=>/^#[0-9a-fA-F]{6}$/.test(value);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hex=values=>"#"+values.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const mix=(a,b,n)=>hex(rgb(a).map((v,i)=>v*(1-n)+rgb(b)[i]*n));
const luminance=color=>rgb(color).map(x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const read=()=>{try{const v=mockStorage.read(KEY,{});return {mode:["light","dark"].includes(v.mode)?v.mode:"light",accent:isHex(v.accent)?v.accent:presets.indigo,animations:typeof v.animations==="boolean"?v.animations:true,blurMedia:typeof v.blurMedia==="boolean"?v.blurMedia:true}}catch{return {mode:"light",accent:presets.indigo,animations:true,blurMedia:true}}};
export const appearance=read();
export const palette=presets;
export function applyAppearance(){const dark=appearance.mode==="dark",base=appearance.accent;root.dataset.theme=appearance.mode;root.dataset.animations=appearance.animations?"on":"off";root.style.setProperty("--brand-accent",base);root.style.setProperty("--brand-soft",mix(base,dark?"#09090b":"#ffffff",dark?.75:.91));root.style.setProperty("--brand-border",mix(base,dark?"#fafafa":"#09090b",dark?.18:.12));root.style.setProperty("--brand-text",contrast(base,dark?"#ffffff":"#ffffff")>=4.5?"#ffffff":"#09090b");root.style.setProperty("--brand-indicator",base);}
// Persist first; on quota/privacy errors keep the last applied theme unchanged.
export function setAppearance(next){
 const candidate={...appearance};
 if(next.mode&&["light","dark"].includes(next.mode))candidate.mode=next.mode;
 if(next.accent&&isHex(next.accent))candidate.accent=next.accent;
 if(typeof next.animations==="boolean")candidate.animations=next.animations;
 if(typeof next.blurMedia==="boolean")candidate.blurMedia=next.blurMedia;
 mockStorage.write(KEY,candidate);
 Object.assign(appearance,candidate);
 applyAppearance();
 window.dispatchEvent(new Event("wapphub-appearance-changed"));
 return {...appearance};
}
export function openAppearanceSettings(){document.getElementById("appearance-dialog")?.remove();const backdrop=document.createElement("div");backdrop.id="appearance-dialog";backdrop.className="d2-overlay";const panel=document.createElement("section");panel.className="d2-dialog";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Aparência da organização");const head=document.createElement("header");head.className="d2-dialog-head";const heading=document.createElement("strong");heading.textContent="Aparência da organização";const close=document.createElement("button");close.className="chip";close.type="button";close.textContent="Fechar";close.onclick=()=>backdrop.remove();head.append(heading,close);panel.append(head);const body=document.createElement("div");body.className="d2-body";
const feedback=document.createElement("p");feedback.className="provider-form-error";feedback.setAttribute("role","alert");body.append(feedback);
const save=next=>{try{setAppearance(next);feedback.textContent="";return true}catch{feedback.textContent="Não foi possível salvar a aparência neste navegador.";return false}};const mode=document.createElement("select");mode.className="d2-search";for(const [v,t] of [["light","Tema claro"],["dark","Tema escuro"]]){const op=document.createElement("option");op.value=v;op.textContent=t;mode.append(op)}mode.value=appearance.mode;mode.onchange=()=>{if(!save({mode:mode.value}))mode.value=appearance.mode};const label=document.createElement("label");label.textContent="Tema";label.append(mode);body.append(label);const colors=document.createElement("div");colors.className="appearance-colors";for(const [name,color] of Object.entries(presets)){const b=document.createElement("button");b.type="button";b.className="appearance-swatch";b.title=name;b.style.background=color;b.setAttribute("aria-label","Cor "+name);b.setAttribute("aria-pressed",String(appearance.accent===color));b.onclick=()=>{if(!save({accent:color}))return;colors.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));picker.value=color};colors.append(b)}body.append(colors);const custom=document.createElement("label");custom.textContent="Cor personalizada";const picker=document.createElement("input");picker.type="color";picker.value=appearance.accent;picker.oninput=()=>{if(!save({accent:picker.value})){picker.value=appearance.accent;return}colors.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed","false"))};custom.append(picker);body.append(custom);const reset=document.createElement("button");reset.type="button";reset.className="chip";reset.textContent="Restaurar padrão";reset.onclick=()=>{if(save({mode:"light",accent:presets.indigo,animations:true,blurMedia:true}))backdrop.remove()};body.append(reset);panel.append(body);backdrop.append(panel);backdrop.onclick=e=>{if(e.target===backdrop)backdrop.remove()};document.body.append(backdrop);close.focus()}
applyAppearance();