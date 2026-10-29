/**
 * Volume de dados da demo: 50 conversas determinísticas, exclusivamente fictícias.
 * Não acessa API, localStorage ou provider. IDs estáveis preservam atribuições
 * feitas pelo usuário entre atualizações da aplicação.
 */
export const LOAD_CONVERSATION_COUNT=50;
const names=[
 "Carolina Mendes","Rafael Barbosa","Fernanda Lima","Gustavo Ribeiro","Camila Rocha",
 "André Oliveira","Juliana Martins","Pedro Henrique","Isabela Cardoso","Thiago Carvalho",
 "Beatriz Souza","Leonardo Almeida","Mariana Ferreira","Vinícius Castro","Larissa Gomes",
 "Diego Santana","Gabriela Farias","Marcelo Vieira","Natália Correia","Bruno Vasconcelos",
 "Paula Monteiro","Felipe Andrade","Renata Freitas","Daniel Araújo","Sofia Cavalcanti",
 "Rodrigo Silva","Letícia Moura","Eduardo Batista","Bianca Siqueira","Fábio Nascimento",
 "Aline Tavares","Henrique Melo","Priscila Dantas","João Vitor","Vanessa Teixeira",
 "Matheus Lacerda","Cláudia Bezerra","Samuel Costa","Mônica Albuquerque","Igor Nogueira",
 "Débora Pereira","Alexandre Pires","Luísa Macedo","Ricardo Campos","Tatiane Pontes",
 "Caio Fonseca","Elisa Barros","Otávio Reis","Flávia Azevedo","Cristiano Pinto"
];
const topics=[
 {subject:"revisão de equipamento",intro:"Olá! Preciso de uma atualização sobre a revisão do equipamento.",question:"Já existe previsão de conclusão da revisão?",answer:"A equipe está verificando o diagnóstico e enviaremos o retorno ainda hoje.",details:"Enviei a imagem com a identificação do aparelho.",close:"Obrigada! Vou aguardar a confirmação da revisão."},
 {subject:"segunda via de documento",intro:"Boa tarde, poderia solicitar a segunda via do documento?",question:"Vocês conseguem localizar pelo número do pedido?",answer:"Conseguimos consultar a solicitação e preparar uma cópia para conferência.",details:"Estou encaminhando o documento e os dados para conferência.",close:"Perfeito, agradeço pela ajuda com a segunda via."},
 {subject:"agendamento de visita",intro:"Gostaria de agendar uma visita técnica para esta semana.",question:"Há disponibilidade no período da tarde?",answer:"Estamos verificando os horários disponíveis com a equipe de campo.",details:"Segue uma referência do local para facilitar o atendimento.",close:"Esse horário funciona, pode deixar pré-agendado."},
 {subject:"pedido em andamento",intro:"Olá, podem me informar o andamento do meu pedido?",question:"A entrega já foi separada para envio?",answer:"O pedido está em acompanhamento e avisaremos quando houver atualização.",details:"Segue o comprovante de referência do pedido.",close:"Entendido, obrigado por acompanhar o pedido."},
 {subject:"suporte de conectividade",intro:"Bom dia! A conexão está oscilando desde ontem.",question:"Posso enviar um vídeo mostrando a falha?",answer:"Pode enviar. Nossa equipe está analisando o comportamento informado.",details:"Gravei um vídeo de teste para demonstrar a instabilidade.",close:"Tudo bem, fico no aguardo do suporte."},
 {subject:"orçamento de manutenção",intro:"Preciso de um orçamento para manutenção preventiva.",question:"O orçamento inclui mão de obra e materiais?",answer:"Vamos detalhar os itens e encaminhar os valores para aprovação.",details:"Enviei uma fotografia do equipamento para referência.",close:"Certo, aguardo a proposta detalhada."},
 {subject:"atualização cadastral",intro:"Gostaria de atualizar os dados do meu cadastro.",question:"Posso revisar as informações antes de salvar?",answer:"Claro! Confira os campos e nos informe os dados que precisam de correção.",details:"Separei as informações necessárias para a atualização.",close:"Obrigado, os dados estão corretos agora."},
 {subject:"garantia de serviço",intro:"Estou com uma dúvida sobre a garantia do atendimento.",question:"Qual é o procedimento para solicitar uma avaliação?",answer:"Vamos registrar a ocorrência e conferir as condições da garantia.",details:"Segue uma descrição adicional para a análise.",close:"Ótimo, agradeço pelas orientações sobre a garantia."},
 {subject:"entrega de material",intro:"Boa tarde, gostaria de confirmar a entrega do material.",question:"O motorista já recebeu a autorização de saída?",answer:"A logística está conferindo os dados e vai confirmar a programação.",details:"Anexei o resumo do pedido para validação.",close:"Tudo certo, vou acompanhar o recebimento."},
 {subject:"configuração de aplicativo",intro:"Olá, estou tentando configurar o aplicativo no celular.",question:"Existe algum passo a passo para concluir a configuração?",answer:"Podemos orientar. Primeiro precisamos confirmar a versão instalada.",details:"Enviei uma captura da tela onde aparece a mensagem.",close:"Consegui avançar, obrigado pela explicação."}
];
const formatTime=minutes=>{
 const hour=Math.floor(minutes/60)%24;
 return String(hour).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0");
};
export function createLoadConversations(){
 return names.map((name,index)=>{
  const i=index+1,number=String(i).padStart(3,"0"),id="load-"+number;
  const topic=topics[index%topics.length];
  const channelId=["wa-sales","web-support","wa-help","team"][index%4];
  const assigned=index%6!==0;
  const completed=assigned&&index%11===0;
  const length=18+((index*17)%84)+(index%13===0?65:0);
  const firstMinute=8*60+index%12*6;
  const messages=Array.from({length},(_,j)=>{
   const direction=j%2===0?"in":"out";
   const blocks=[
    topic.intro, "Olá, "+name.split(" ")[0]+"! Já estamos acompanhando sua solicitação.",
    topic.question,topic.answer,topic.details,
    "Recebemos as informações e estamos verificando com o setor responsável.",
    "Perfeito. Há alguma outra informação que eu possa enviar?",
    "Por enquanto está tudo certo. Assim que houver novidade, aviso por aqui.",
    "O atendimento continua em acompanhamento. Registro atualizado.",
    "Obrigado! Pode me avisar quando houver uma posição?",
    "Sim, manteremos este histórico atualizado para sua consulta.",
    topic.close
   ];
   const body=blocks[j%blocks.length];
   const time=formatTime(firstMinute+j*2);
   const message={id:id+":msg-"+String(j+1).padStart(3,"0"),conversationId:id,
    direction,body,time};
   if(direction==="out")message.status=["sent","delivered","read"][Math.floor(j/2)%3];
   return message;
  });
  const last=messages.at(-1);
  return {
   id,name,initials:name.split(" ").slice(0,2).map(part=>part[0]).join(""),
   phone:"+55 (81) 90000-"+String(2000+i).padStart(4,"0"),
   channelId,time:last.time,unread:index%5===0?0:index%7+1,
   assigned,agent:assigned?"Você":"Não atribuído",
   status:completed?"Finalizado":assigned?"Em atendimento":"Aguardando atribuição",
   preview:last.body,subject:topic.subject,messages
  };
 });
}
