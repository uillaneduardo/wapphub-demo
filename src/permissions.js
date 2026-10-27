// Apenas demonstração. O Core deverá impor autorizações reais.
export const permissions={forward:true,deleteMine:true,deleteAll:false};
export const can=action=>permissions[action]===true;
