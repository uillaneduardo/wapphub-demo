import {currentState} from "./d3.js?v=d4-6";
import {roleAllows} from "./demo-access-store.js?v=d4-6";
// Comandos demonstrativos. O Core é a autoridade sobre permissões reais.
export const permissions={forward:true,deleteMine:true,deleteAll:false};
export const can=action=>permissions[action]===true&&roleAllows(currentState().role,action);
