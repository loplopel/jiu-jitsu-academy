export function friendlyAuthError(message?:string){
  const m=String(message||'').toLowerCase();
  if(m.includes('rate limit')||m.includes('too many')) return 'Limite temporário de envio de e-mails atingido. Aguarde alguns minutos e tente novamente. Para uso real, configure SMTP próprio no Supabase.';
  if(m.includes('already')&&m.includes('registered')) return 'Já existe um acesso com estes dados. Confira o login cadastrado.';
  if(m.includes('invalid email')) return 'O e-mail informado é inválido.';
  return message||'Não foi possível concluir a operação.';
}
