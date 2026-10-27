/**
 * Dados exclusivamente ilustrativos, sem persistência. As regras e views recebem
 * objetos de mensagem normalizados e não conhecem este adaptador.
 */
const videoSample="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
function audioFixture(){
 const rate=8000,seconds=5,samples=rate*seconds,buffer=new ArrayBuffer(44+samples*2);
 const view=new DataView(buffer),ascii=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i))};
 ascii(0,"RIFF");view.setUint32(4,36+samples*2,true);ascii(8,"WAVE");ascii(12,"fmt ");
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);
 view.setUint16(34,16,true);ascii(36,"data");view.setUint32(40,samples*2,true);
 for(let i=0;i<samples;i++){
  const t=i/rate,env=Math.min(1,t*9)*Math.min(1,(seconds-t)*6);
  const pulse=Math.max(0,Math.sin(t*7))*0.55;
  const freq=170+42*Math.sin(2*Math.PI*t*.7);
  const wave=(Math.sin(2*Math.PI*freq*t)*.45+Math.sin(2*Math.PI*freq*1.98*t)*.12)*env*pulse;
  view.setInt16(44+i*2,Math.round(wave*32767),true);
 }
 return URL.createObjectURL(new Blob([buffer],{type:"audio/wav"}));
}
const image=(id,name,url,time,body="")=>({id,direction:"in",body,time,file:{kind:"image",name,url,mimeType:"image/svg+xml"}});
const audio=(id,url,time)=>({id,direction:"in",body:"",time,file:{kind:"audio",name:"Mensagem de voz",url,mimeType:"audio/wav"}});
const video=(id,time)=>({id,direction:"in",body:"",time,file:{kind:"video",name:"Vídeo recebido",url:videoSample,poster:"./assets/video-poster.svg",mimeType:"video/mp4"}});
export function seedMediaFixtures(conversations){
 if(conversations.some(c=>(c.messages||[]).some(m=>!Array.isArray(m)&&m?.id==="sample:voice:mariana")))return;
 const samples={
  mariana:[
   image("sample:image:mariana","Foto do equipamento","./assets/equipment.svg","14:25","Equipamento avaliado"),
   audio("sample:voice:mariana",audioFixture(),"14:26"),
   video("sample:video:mariana","14:27")
  ],
  ricardo:[image("sample:receipt:ricardo","Comprovante ilustrativo","./assets/receipt.svg","14:07")],
  empresa:[video("sample:video:empresa","13:47")]
 };
 for(const c of conversations)if(samples[c.id])c.messages.push(...samples[c.id]);
}
