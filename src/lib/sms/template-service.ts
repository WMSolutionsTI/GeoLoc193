// SMS Templates for rotation to avoid blocking by operators
const smsTemplates = [
  "COBOM: Para compartilhar sua localização com a central de emergência, acesse: {link}",
  "Corpo de Bombeiros: Clique no link para enviar sua localização: {link}",
  "Central 193: Acesse o link para compartilhar sua posição: {link}",
  "COBOM Emergências: Link de localização: {link} - Ignore se não solicitou atendimento.",
  "COBOM: para compartilhar sua localização com a central, acesse o link a seguir: {link}. Caso você não tenha solicitado atendimento, ignore esta mensagem.",
  "Central de Emergências 193: Por favor, acesse {link} para enviar sua localização. Mensagem automática do Corpo de Bombeiros.",
];

// Track template usage to ensure rotation
let lastTemplateIndex = -1;

/**
 * Gets a random template, avoiding the last used one
 */
export function getRandomTemplate(): string {
  let index: number;
  do {
    index = Math.floor(Math.random() * smsTemplates.length);
  } while (index === lastTemplateIndex && smsTemplates.length > 1);
  
  lastTemplateIndex = index;
  return smsTemplates[index];
}

/**
 * Generates an SMS message with the provided link
 */
export function generateSmsMessage(link: string): string {
  const template = getRandomTemplate();
  return template.replace("{link}", link);
}

/**
 * Gets all available templates
 */
export function getAllTemplates(): string[] {
  return [...smsTemplates];
}

// SMS Templates without links (for operators that block links)
const smsTemplatesNoLink = [
  "COBOM 193: Acesse o site e digite seu telefone para compartilhar sua localização. Em caso de dúvidas, ligue 193.",
  "Corpo de Bombeiros: Entre no site informado pelo atendente e digite seu número de telefone para enviar sua localização.",
  "Central 193: Acesse nosso site e informe seu telefone para compartilharmos sua localização com a equipe de resgate.",
];

// Track no-link template usage to ensure rotation
let lastNoLinkTemplateIndex = -1;

/**
 * Gets a random no-link template, avoiding the last used one
 */
function getRandomNoLinkTemplate(): string {
  let index: number;
  do {
    index = Math.floor(Math.random() * smsTemplatesNoLink.length);
  } while (index === lastNoLinkTemplateIndex && smsTemplatesNoLink.length > 1);

  lastNoLinkTemplateIndex = index;
  return smsTemplatesNoLink[index];
}

/**
 * Generates an SMS message without a link (for operators that block links)
 */
export function generateSmsMessageNoLink(): string {
  return getRandomNoLinkTemplate();
}
