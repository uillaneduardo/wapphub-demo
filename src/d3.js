// D3 — Cenários operacionais fictícios. Não conecta a serviços reais.
export const scenarios={
online:{label:"Conectado",tone:"success",message:"Canal conectado. Mensagens disponíveis.",send:true},
offline:{label:"Desconectado",tone:"danger",message:"Conexão interrompida. O envio está temporariamente indisponível.",send:false},
reconnecting:{label:"Reconectando",tone:"warning",message:"Tentando restabelecer a conexão. As mensagens ainda não foram sincronizadas.",send:false},
syncing:{label:"Sincronizando",tone:"info",message:"Sincronizando mensagens pendentes. O histórico pode estar incompleto.",send:false},
failed:{label:"Falha de sincronização",tone:"danger",message:"Não foi possível concluir a sincronização. Verifique os detalhes da conexão.",send:false}
};
const $=s=>document.querySelector(s);
const roles={OWNER:"Proprietário",SUPERVISOR:"Supervisor",AGENT:"Atendente"};
let state={role:"OWNER",connection:"online"},getCurrent=()=>null,onChange=()=>{};
const elem=(tag,cl,text)=>{const n=document.createElement(tag);n.className=cl;if(text!==undefined)n.textContent=text;return n};
export function canAccess(c){return !!c&&(state.role!=="AGENT"||c.assigned===true)}
export function canSend(c){return !!c&&canAccess(c)&&scenarios[state.connection].send&&c.status!=="Finalizado"}
export function currentState(){return {...state,...scenarios[state.connection]}}
function notify(text,tone="info"){const n=elem("div","toast d3-toast "+tone,text);$("#toast-region").append(n);setTimeout(()=>n.remove(),5000)}
function render(){const data=scenarios[state.connection],bar=$("#status-banner"),c=getCurrent();bar.hidden=state.connection==="online";bar.textContent=data.message;bar.dataset.tone=data.tone;const compose=$("#message-input");compose.disabled=!canSend(c);compose.placeholder=!c?"Selecione uma conversa":!canAccess(c)?"Aguarde a atribuição de um supervisor":!data.send?"Canal indisponível para envio":c?.status==="Finalizado"?"Atendimento finalizado":"Escreva uma mensagem...";$("#composer").querySelector('button[type="submit"]').disabled=!canSend(c);$("#chat-subtitle").textContent=!canAccess(c)?"Acesso restrito":c?.status||data.label;const status=$("#d3-connection");if(status){status.textContent=data.label;status.dataset.tone=data.tone}const role=$("#d3-role");if(role)role.textContent=roles[state.role];}
export function setupD3(getActive,refresh){
 getCurrent=getActive;onChange=refresh;
 // Diagnósticos são opt-in e não ocupam a navegação habitual.
 if(new URLSearchParams(location.search).get("diagnostics")==="1"){
   const controls=elem("div","d3-diagnostics","");
   const control=elem("button","d3-control","Diagnóstico");
   control.type="button";control.id="d3-open";control.onclick=openControls;
   const status=elem("span","d3-status","");status.id="d3-connection";
   const role=elem("span","d3-role","");role.id="d3-role";
   controls.append(control,status,role);document.body.append(controls);
 }
 render();
}
export function updateD3(){render()}
export function assertCanSend(c){if(canSend(c))return true;notify(!canAccess(c)?"Conversa não atribuída: você não tem acesso.":"Não é possível enviar nesta situação.","danger");return false}
export function openControls(){document.querySelector("#d3-overlay")?.remove();const overlay=elem("div","d2-overlay");overlay.id="d3-overlay";const panel=elem("section","d2-dialog");panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Estados operacionais");const head=elem("header","d2-dialog-head");head.append(elem("strong","","Diagnóstico operacional"));const close=elem("button","chip","Fechar");close.onclick=()=>overlay.remove();head.append(close);panel.append(head);const body=elem("div","d2-body");body.append(elem("p","","Altere o estado de conexão e o perfil para verificar o comportamento da interface."));const roleLabel=elem("label","d3-label","Perfil de acesso");const roleSelect=elem("select","d2-search");for(const [value,label] of Object.entries(roles)){const opt=elem("option","",label);opt.value=value;roleSelect.append(opt)}roleSelect.value=state.role;roleSelect.onchange=()=>{state.role=roleSelect.value;notify("Perfil selecionado: "+roles[state.role]);onChange();render()};roleLabel.append(roleSelect);body.append(roleLabel);const connLabel=elem("label","d3-label","Estado da conexão");const conn=elem("select","d2-search");for(const [value,entry] of Object.entries(scenarios)){const opt=elem("option","",entry.label);opt.value=value;conn.append(opt)}conn.value=state.connection;conn.onchange=()=>{state.connection=conn.value;notify(scenarios[state.connection].message,scenarios[state.connection].tone);onChange();render()};connLabel.append(conn);body.append(connLabel);const note=elem("p","d3-note","Estados e permissões são apresentados para inspeção local.");body.append(note);panel.append(body);overlay.append(panel);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.append(overlay);close.focus()}
