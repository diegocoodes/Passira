# Passira San Martin

Cardápio e sistema de pedidos da Passira San Martin, no Recife. Next.js App Router, React, TypeScript, Prisma, PostgreSQL e Zustand. SQLite permanece disponível para desenvolvimento e testes locais.

O cliente abre cada produto em uma página própria, escolhe opções e confirma o pedido. O servidor valida preços e disponibilidade, grava um número sequencial e fornece um link privado de acompanhamento. O painel administrativo permite gerenciar a operação por formulários.

## Executar localmente

Requer Node.js 24.x e npm. No PowerShell, use `npm.cmd` se os scripts estiverem bloqueados.

```sh
npm ci
npm run db:migrate
npm run db:setup
npm run dev
```

- Loja: http://127.0.0.1:3000
- Administração: http://127.0.0.1:3000/admin/
- Banco local: `prisma/dev.db`
- Primeiro acesso: `admin-access.local.txt`, gerado localmente e ignorado pelo Git. Altere a senha pelo painel.

O setup importa o cardápio original uma única vez e não sobrescreve alterações posteriores. Banco, senhas e sessões não são enviados ao GitHub. Consulte [.env.example](.env.example) para configurar outro banco.

## Painel sem código

- Visão geral com pedidos recebidos, concluídos, faturamento, lucro estimado e produtos mais pedidos por data.
- Pedidos com etapas Recebido, Aceito, Em preparo, Pronto, Saiu para entrega e Concluído; cancelamento nas etapas permitidas.
- Produtos com criação, edição, exclusão, disponibilidade, categoria, descrição, foto por link HTTPS, opções de preço e custos.
- Despesas do dia.
- Regiões de entrega e custos dos adicionais.
- Alteração de senha e encerramento de sessões.

Produtos excluídos saem da loja; pedidos anteriores preservam os dados da compra. Cada pedido usa um número global crescente, sem reinício diário. O endereço de acompanhamento usa um token privado e não permite consultas apenas pelo número.

## Faturamento e lucro

Faturamento e ranking consideram os pedidos concluídos na data selecionada, em America/Recife. Recebidos são os pedidos criados nessa data. A lista de pedidos em andamento também inclui dias anteriores.

**Lucro estimado = vendas de produtos − custos registrados na compra − despesas da data.**

Taxas de entrega são mostradas separadamente. Custos vazios ficam pendentes e impedem apresentar um lucro inventado. Custos cadastrados depois não alteram pedidos antigos. Registre taxas, impostos e outros gastos nas despesas para aproximar o resultado real. O sistema não faz conciliação bancária nem apuração contábil automática.

## Produção

Esta versão precisa de servidor Next.js e banco persistente. Não usa mais exportação estática em `out/`.

Na Vercel, configure `DATABASE_URL` com a conexão PostgreSQL privada. Antes da publicação, execute as migrations e o setup em um ambiente confiável, com `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `NODE_ENV=production` para o primeiro administrador. As credenciais são fornecidas pelo ambiente e ficam fora do Git.

O build gera o Prisma Client, sem executar migrations ou criar contas automaticamente. Arquivos SQLite locais não são aceitos como banco de uma função Vercel. Em um servidor próprio, SQLite precisa ficar em disco persistente e ter backup.

O schema principal em `prisma/schema.prisma` usa PostgreSQL. `npm run db:generate` também gera uma versão SQLite com os mesmos modelos para manter os testes e bancos locais isolados. As migrations ficam separadas por conector; não aplique migrations SQLite ao PostgreSQL.

```sh
npm run build
npm start
```

A configuração completa, indicadores, segurança, backup e publicação estão em [docs/OPERACAO.md](docs/OPERACAO.md).

## Entrega e pagamento

As regiões de entrega começam vazias. Cadastre somente bairros atendidos e taxas confirmadas pelo painel. Taxa vazia ou bairro desconhecido bloqueia a entrega. Retirada tem taxa zero.

Pix, débito e crédito são escolhas de pagamento no recebimento. Não há gateway nem cobrança online. O WhatsApp continua disponível para contato opcional; a gravação e o acompanhamento do pedido ocorrem no servidor.

## Cardápio original e auditoria

A fonte original é [o cardápio público da loja](https://loja.neemo.com.br/passira-sanmartin), conferido em 10/11/2026. O inventário inicial possui 18 categorias, 130 pratos/bebidas, 62 sabores/opções de pizza e 289 registros de preço.

- [Inventário completo](audit/CARDAPIO.md)
- [Identidade visual](audit/BRAND-ASSETS.md)
- [Fotos e créditos](audit/IMAGE-CREDITS.md)
- [Restaurante e avaliações](audit/GOOGLE-CONTENT.md)
- Rota `/conferencia/`: registro histórico dos dados de origem.

As pendências originais de Guaraná Lata, Frango Empanado, Filet à Moda da casa e HAPPY PIZZA são importadas com bloqueio de compra. O administrador deve conferir os dados antes de liberar cada produto. Descrições incompletas não são preenchidas automaticamente.

Grande e Média permitem até dois sabores; Brotinho permite um. O preço e os custos de uma pizza de dois sabores seguem a média. Pizza em Dobro preserva a escolha obrigatória de duas pizzas inteiras e seus adicionais. Regras de horários e grupos são revalidadas pelo servidor.

Os arquivos em `src/data/menu/` e o comando `menu:import` preservam a origem e servem à importação inicial; a operação cotidiana usa o banco.

## Verificação

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes cobrem regras do cardápio, persistência, sequência, tentativas duplicadas, etapas, lucro, exclusão com histórico preservado, autenticação e o fluxo completo no navegador. Usam bancos isolados, sem enviar mensagens à loja. O teste de compra no navegador respeita o horário real de atendimento.

Mais detalhes em [docs/OPERACAO.md](docs/OPERACAO.md).
