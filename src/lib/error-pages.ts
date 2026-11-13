type ErrorContent = { title: string; description: string; label: string; art: 'pizza' | 'oven'; retry?: boolean; signIn?: boolean };

const errors: Record<number, ErrorContent> = {
  400: { title: 'Faltou acertar a receita.', description: 'Não conseguimos entender esta solicitação. Confira as informações e tente novamente pelo caminho correto.', label: 'Solicitação inválida', art: 'pizza' },
  401: { title: 'Falta uma etapa para entrar.', description: 'Esta página precisa de um acesso autorizado. Entre na sua conta para continuar ou volte ao cardápio.', label: 'Acesso necessário', art: 'pizza', signIn: true },
  403: { title: 'Esta mesa está reservada.', description: 'Você não tem permissão para acessar esta página. Use uma conta autorizada ou continue pelo cardápio.', label: 'Acesso não permitido', art: 'pizza', signIn: true },
  404: { title: 'Esta fatia sumiu.', description: 'A página que você procurou não está no nosso cardápio. O endereço pode ter mudado ou não existir mais.', label: 'Página não encontrada', art: 'pizza' },
  405: { title: 'Essa receita pede outro caminho.', description: 'Este endereço não aceita essa ação. Volte ao cardápio para continuar navegando.', label: 'Ação não permitida', art: 'pizza' },
  408: { title: 'A conexão passou do ponto.', description: 'A página levou mais tempo do que o esperado para responder. Tente carregá-la novamente.', label: 'Tempo de solicitação esgotado', art: 'oven', retry: true },
  410: { title: 'Essa fatia saiu do cardápio.', description: 'Este conteúdo não está mais disponível. No cardápio, você encontra o que está disponível agora.', label: 'Conteúdo removido', art: 'pizza' },
  413: { title: 'Essa porção ficou grande demais.', description: 'O conteúdo enviado é maior do que o permitido. Reduza o arquivo ou a quantidade de informações antes de tentar novamente.', label: 'Conteúdo muito grande', art: 'pizza' },
  415: { title: 'Esse ingrediente não combina.', description: 'O formato enviado não é aceito nesta ação. Confira o arquivo ou os dados e tente novamente.', label: 'Formato não aceito', art: 'pizza' },
  422: { title: 'Vamos conferir a receita?', description: 'Algumas informações precisam ser corrigidas. Volte ao formulário e confira os campos indicados.', label: 'Informações inválidas', art: 'pizza' },
  429: { title: 'Vamos dar um respiro ao forno.', description: 'Recebemos muitas tentativas em pouco tempo. Aguarde um pouco antes de tentar novamente.', label: 'Muitas tentativas', art: 'oven', retry: true },
  500: { title: 'O forno pediu uma pausa.', description: 'Não conseguimos carregar esta página agora. Tente novamente em instantes ou volte ao cardápio.', label: 'Falha no sistema', art: 'oven', retry: true },
  501: { title: 'Essa receita ainda não está pronta.', description: 'Esta ação ainda não está disponível no servidor. Você pode continuar navegando pelo cardápio.', label: 'Recurso não disponível', art: 'oven' },
  502: { title: 'A conexão saiu do ponto.', description: 'Não recebemos uma resposta válida de um dos serviços. Tente novamente em instantes.', label: 'Falha de comunicação', art: 'oven', retry: true },
  503: { title: 'Uma pausa na cozinha.', description: 'O serviço está temporariamente indisponível. Aguarde um pouco e tente novamente.', label: 'Serviço indisponível', art: 'oven', retry: true },
  504: { title: 'O forno demorou a responder.', description: 'Um dos serviços levou mais tempo do que o esperado para responder. Tente novamente em instantes.', label: 'Tempo de resposta esgotado', art: 'oven', retry: true },
  505: { title: 'Essa conexão pede outra receita.', description: 'O servidor não conseguiu atender esta conexão. Tente abrir o site em um navegador atualizado.', label: 'Versão de conexão não aceita', art: 'oven', retry: true },
};

export function parseErrorCode(value: string): number | null {
  return /^[45]\d{2}$/.test(value) ? Number(value) : null;
}

export function errorContent(code: number): ErrorContent {
  return errors[code] ?? { title: 'Essa receita saiu do ponto.', description: 'Não conseguimos concluir o acesso a esta página. Volte ao cardápio ou tente novamente.', label: 'Não foi possível continuar', art: code >= 500 ? 'oven' : 'pizza', retry: true };
}
