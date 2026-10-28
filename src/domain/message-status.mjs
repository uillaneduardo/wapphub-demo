/** Valores somente ilustrativos da demo, sem recibos do provider. */
export const demoDeliveryStatuses = Object.freeze(["sent","delivered","read","failed"]);
export const demoDeliveryLabels = Object.freeze({
  sent:"Enviada (simulação)",
  delivered:"Entregue (simulação)",
  read:"Lida (simulação)",
  failed:"Falha (simulação)"
});
export function nextDemoDeliveryStatus(current) {
  return demoDeliveryStatuses[(demoDeliveryStatuses.indexOf(current)+1)%demoDeliveryStatuses.length];
}
