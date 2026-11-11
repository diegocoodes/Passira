# Operação da Passira

## Iniciar em outra máquina

Requer Node.js 24.x. No PowerShell, use `npm.cmd` se a execução de scripts estiver bloqueada.

```sh
npm ci
npm run db:migrate
npm run db:setup
npm run dev
```

A loja abre em http://127.0.0.1:3000 e o painel em http://127.0.0.1:3000/admin/. O primeiro acesso local é gerado aleatoriamente e salvo em `admin-access.local.txt`, que não é enviado ao GitHub. Altere a senha em Configurações. Não compartilhe esse arquivo nem o banco.

O banco local fica em `prisma/dev.db`. Para usar outro arquivo, configure `DATABASE_URL` em `.env`. Faça backup do banco com a aplicação parada. Copie também arquivos WAL/SHM se fizer uma cópia enquanto houver conexões abertas; prefira o mecanismo de backup do SQLite para cópias online.

## Produtos

Em **Produtos**, use **Novo produto**, **Editar** ou **Excluir**. Nome, descrição, categoria, disponibilidade, foto por link HTTPS, preços por opção, modalidade e custos são editados por formulários. Produtos novos aparecem na loja sem recompilar. Para pizzas, selecione tamanhos da categoria e mantenha os grupos de sabores/adicionais apropriados. A edição preserva as regras existentes de tamanhos e adicionais.

Um produto excluído sai do cardápio. Pedidos já recebidos mantêm o nome, opções, preço e custo registrados na compra. Excluir um produto não apaga vendas anteriores. Itens que já estavam em carrinhos são revalidados antes da confirmação.

O cardápio inicial é importado uma única vez dos arquivos de `src/data/menu/`. Rodar `db:setup` novamente não substitui alterações do administrador. O importador histórico `menu:import` atualiza os arquivos de origem, não o banco já em operação.

## Pedidos

Cada confirmação grava um pedido no servidor, com número sequencial global: #1, #2, #3. A sequência não reinicia a cada dia. Repetir a mesma tentativa após uma falha de conexão devolve o mesmo pedido, evitando duplicatas.

O cliente recebe um endereço privado `/pedido/[token]/`. O número do pedido sozinho não permite consultar dados pessoais. Guardar e compartilhar o endereço permite acompanhar o pedido; trate-o como privado.

O administrador avança as etapas por botões:

1. Recebido.
2. Aceito.
3. Em preparo.
4. Pronto.
5. Saiu para entrega, quando houver entrega.
6. Concluído.

É possível cancelar antes da saída para entrega. Pedidos concluídos ou cancelados não voltam para etapas anteriores. Atualizações concorrentes do painel são verificadas no servidor.

Painel e acompanhamento consultam novas informações a cada 15 segundos. Eles precisam de conexão com o servidor. O sistema registra os pedidos e suas etapas, mas não processa pagamentos nem faz rastreamento de entregador por GPS.

## Indicadores e lucro

Todos os dias usam o fuso America/Recife. O seletor de data altera os relatórios. A lista **Em andamento** inclui também pedidos de dias anteriores que ainda não terminaram.

- **Recebidos:** pedidos criados na data selecionada.
- **Concluídos:** pedidos concluídos nessa data, mesmo que tenham sido criados antes.
- **Faturamento de produtos:** subtotal dos pedidos concluídos nessa data, sem taxas de entrega.
- **Mais pedidos:** quantidade de unidades do produto principal em pedidos concluídos. Uma pizza de dois sabores conta como uma pizza do produto principal escolhido, não como duas pizzas.
- **Lucro estimado:** faturamento de produtos menos custos de produção registrados na compra e despesas da data.

Os custos são cadastrados por opção de preço e por adicional. Nas pizzas de dois sabores, o custo segue a média dos sabores, assim como o preço. Os custos dos adicionais por sabor também seguem essa média.

Custos vazios são desconhecidos. Nesse caso o painel mostra **Pendente**, sem inventar lucro. Informe zero somente quando o custo for realmente zero. Cadastrar custos depois não altera retroativamente os pedidos anteriores. Lance taxas de cartão, impostos e gastos operacionais em **Despesas**, evitando repetir custos já cadastrados no produto. O resultado não representa lucro líquido contábil sem o cadastro completo dos gastos.

## Entrega

Em **Configurações**, cadastre regiões, bairros e taxas confirmadas. Bairros não cadastrados ou com taxa vazia não permitem finalizar entrega. Retirada tem taxa zero. Não há preenchimento automático de endereço por CEP nesta versão.

## Hospedar na Vercel

O sistema agora precisa de um servidor Next.js e de um banco persistente. Exportar `out/` ou manter um arquivo SQLite dentro de uma função Vercel não atende a esses requisitos.

1. Use um banco PostgreSQL persistente, como Prisma Postgres.
2. Em um ambiente confiável, configure `DATABASE_URL=postgresql://...`, `ADMIN_EMAIL` e uma `ADMIN_PASSWORD` inicial forte, com no mínimo 12 caracteres. Não coloque segredos no repositório. A conexão deve usar TLS.
3. Execute `npm run db:migrate` e `npm run db:setup` com essas variáveis. Para o primeiro administrador de produção, execute o setup com `NODE_ENV=production`; não gera arquivo de senha local nesse modo.
4. Cadastre `DATABASE_URL` nas variáveis do projeto Vercel, para o ambiente correto. Separe os bancos de preview e produção.
5. Publique usando Node.js 24.x, `npm ci`, `npm run build` e a saída padrão do Next.js.
6. Acesse `/admin/`, altere a senha inicial, cadastre custos e entrega e confira o fluxo antes de receber clientes.

O build gera os clientes Prisma para PostgreSQL e SQLite a partir dos mesmos modelos, mas não executa migrations nem cria administradores automaticamente. Rode as migrations antes de publicar versões que alterem o schema. O comando `db:migrate` usa Prisma Migrate e seleciona o schema e as migrations pelo protocolo de `DATABASE_URL`. Os modelos canônicos ficam em `prisma/schema.prisma`; a versão em `prisma/sqlite/schema.prisma` é gerada por `npm run db:generate`. Não misture migrations dos dois conectores. Faça backups antes de futuras alterações de schema.

Uma conexão remota configurada no computador não é enviada à Vercel pelo GitHub. Cadastre a variável privada também no ambiente da hospedagem. O repositório não inclui credenciais nem cria contas no provedor automaticamente.

## Verificação

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes de serviço usam um banco temporário separado. O teste de navegador inicia uma instância de produção na porta 3100, com banco e usuário exclusivos de teste em `test-results/`. Ele não envia pedidos ao WhatsApp nem altera o banco da loja local. O teste completo da compra respeita o horário real da loja, das 10h às 23h15 em America/Recife.

Para validar os serviços no PostgreSQL, forneça `TEST_POSTGRES_URL` apenas ao processo de teste e execute `npm run test:system`. A suíte cria um schema aleatório exclusivo, verifica o isolamento antes de inserir dados e remove esse schema ao terminar. Ela não usa as tabelas operacionais de `public`. Não use os comandos de reset do Prisma no banco da loja.

As senhas são armazenadas como hashes scrypt com salt. As sessões duram 24 horas e usam cookies HttpOnly, SameSite estrito e Secure em produção. Alterar a senha encerra todas as sessões. As APIs administrativas verificam autenticação e origem das alterações; tentativas de login e criação de pedidos têm limitação de frequência.
