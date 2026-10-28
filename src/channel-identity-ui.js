/**
 * Componente de apresentação reutilizável; sem storage e sem suposição
 * de que o transporte técnico determina a plataforma do canal.
 */
const svgNS="http://www.w3.org/2000/svg";
export function createOriginIcon(identity){
 const svg=document.createElementNS(svgNS,"svg");
 const use=document.createElementNS(svgNS,"use");
 use.setAttribute("href","#i-"+identity.icon);
 svg.append(use);svg.setAttribute("aria-hidden","true");
 svg.classList.add("origin-icon");return svg;
}
export function createOriginBadge(identity,{compact=false,provider=false,status=false}={}){
 const el=document.createElement("span");el.className="origin-identity"+(compact?" is-compact":"");
 const label=document.createElement("span");label.className="origin-identity-label";
 label.textContent=compact?identity.platformLabel:identity.channelName;
 el.append(createOriginIcon(identity),label);
 if(provider){const technical=document.createElement("span");
  technical.className="origin-identity-provider";
  technical.textContent="· "+identity.providerName;el.append(technical)}
 if(status&&identity.status!=="connected"){
  const state=document.createElement("span");state.className="origin-identity-status";
  state.dataset.state=identity.status;state.textContent=identity.statusLabel;el.append(state);
 }
 el.title="Plataforma: "+identity.platformLabel+"\nCanal: "+identity.channelName+
  "\nProvider: "+identity.providerName+"\nConexão: "+identity.statusLabel;
 el.setAttribute("aria-label",identity.platformLabel+", canal "+identity.channelName+
  ", provider "+identity.providerName+", "+identity.statusLabel);
 return el;
}
