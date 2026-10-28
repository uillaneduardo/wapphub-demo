import {parseRoute} from "./routes.mjs";

/** History API adapter. UI state is read from location, not localStorage. */
export function createRouter({render}){
 const current=()=>parseRoute(location.pathname+location.search);
 const dispatch=()=>{
  const route=current();
  if(route.name==="redirect")return navigate(route.path,{replace:true});
  document.title=route.title+" · WappHub";
  render(route);
 };
 function navigate(url,{replace=false}={}){
  const target=new URL(url,location.origin);
  if(target.origin!==location.origin)return false;
  const href=target.pathname+target.search+target.hash;
  if(href!==(location.pathname+location.search+location.hash)){
   history[replace?"replaceState":"pushState"]({}, "",href);
  }
  dispatch();return true;
 }
 window.addEventListener("popstate",dispatch);
 dispatch();
 return {navigate,current,refresh:dispatch};
}
