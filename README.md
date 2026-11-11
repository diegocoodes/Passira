# Passira San Martin

Cardápio responsivo da Passira San Martin, no Recife, com Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React e Zustand. Inclui seleção de pratos, categorias com navegação por toque e teclado, personalização de pizzas, carrinho, finalização por WhatsApp, fotos do restaurante e avaliações reais do Google.

## Publicar na Vercel

O projeto está preparado para importar diretamente de [diegocoodes/Passira](https://github.com/diegocoodes/Passira).

1. Abra [Vercel New Project](https://vercel.com/new) e importe o repositório `diegocoodes/Passira`.
2. Use a branch `main` e o diretório raiz do repositório, `./`.
3. Mantenha as configurações abaixo e clique em **Deploy**.

| Configuração | Valor |
| --- | --- |
| Framework Preset | Next.js |
| Node.js | 24.x, definido em `package.json` e `.nvmrc` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Padrão do Next.js, sem override |
| Variáveis próprias ou chaves de API | Nenhuma para esta versão |

O arquivo `vercel.json` registra o framework e os comandos. Na Vercel, `next.config.ts` utiliza o build nativo do Next.js, identificado pela variável de sistema `VERCEL=1`. Mantenha habilitada a opção de acesso às variáveis de sistema do projeto. Fora da Vercel, o mesmo comando continua gerando a exportação estática em `out/`.

Ao conectar o repositório, a Vercel pode publicar os próximos commits da branch de produção automaticamente. Não é necessário cadastrar um comando de servidor personalizado ou alterar a saída para `public/` ou `out/` no painel.

Referências: [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [configuração por arquivo](https://vercel.com/docs/project-configuration/vercel-json) e [variáveis de sistema](https://vercel.com/docs/environment-variables/system-environment-variables).

## Executar

Requer Node.js 24.x e npm. No Windows com execução de scripts do PowerShell bloqueada, use `npm.cmd` no lugar de `npm`.

```sh
npm ci
npm run dev
```

Para validar e servir a versão estática de produção:

```sh
npm test
npm run typecheck
npm run build
npm start
```

O endereço local padrão é http://127.0.0.1:3000. O comando `npm start` serve a exportação estática local em `out/`; a Vercel utiliza sua integração nativa com Next.js. Nenhuma API ou credencial da Neemo é necessária em execução.

## Interface e conteúdo

O layout mantém vermelho, verde, branco e preto da marca, com Barlow Condensed nos títulos e Source Sans 3 nos textos. As fontes WOFF2 são locais, acompanhadas de suas licenças em `public/fonts/`.

A seleção da casa apresenta três produtos do cadastro e utiliza os mesmos preços, personalização e validações do cardápio completo. As categorias têm imagens padronizadas, indicação de seleção, setas, arraste e navegação por teclado. No celular, atalhos levam aos destaques, cardápio, restaurante e avaliações.

A seção sobre o restaurante usa fotos reais do salão e da fachada. As três avaliações incluem imagem pública do perfil, nota, relato e link individual do Google Maps. A nota geral de 4,3 foi consultada em 11/11/2026; os dados não têm sincronização automática. Autoria, fontes e limites da pesquisa estão em [audit/GOOGLE-CONTENT.md](audit/GOOGLE-CONTENT.md). O logotipo está documentado em [audit/BRAND-ASSETS.md](audit/BRAND-ASSETS.md).

A foto da pizza principal foi preservada porque não foi encontrada uma versão original melhor em alta resolução. As imagens complementares ilustrativas são identificadas na interface e têm créditos próprios.

## Fonte e cadastro

Fonte exclusiva dos dados: https://loja.neemo.com.br/passira-sanmartin, conferida em 10/11/2026. As respostas públicas da própria página estão preservadas em `audit/source/`, sem tokens. O registro das aberturas está em `audit/browser-audit.json`, com textos capturados em `audit/browser-dialogs/`. Foram abertos os 130 itens comuns e cinco opções de tamanho/promoção; os sabores foram percorridos nas opções de pizza, incluindo a etapa de adicionais da Pizza em Dobro. A categoria HAPPY PIZZA não apareceu na navegação no horário da conferência.

O inventário completo com **nomes, descrições, tamanhos, preços e opções de cada produto** está em [audit/CARDAPIO.md](audit/CARDAPIO.md) e na rota `/conferencia/`.

| Categoria da fonte | Produtos/sabores |
| --- | ---: |
| Pizzas | 52 |
| HAPPY PIZZA | 1 |
| PROMOÇÃO DE PIZZAS SEG À QUINTA | 8 |
| PIZZA + REFRI 1 LITRO (desativada) | 0 |
| PIZZA EM DOBRO | 1 |
| Semana de Promoções! | 11 |
| Pizza, Somente 1 sabor | 1 |
| Aves | 11 |
| Pratos Individuais | 17 |
| Na Brasa | 15 |
| Guarnições | 10 |
| Massas | 3 |
| Filet Mignon | 7 |
| Comida Chinesa | 15 |
| Frutos do Mar | 11 |
| Saladas | 4 |
| Petiscos | 13 |
| Bebidas | 12 |

Total: **130 pratos/bebidas e 62 sabores/opções de pizza**, com 10 tamanhos cadastrados na fonte, 289 registros de preço, 8 grupos e 31 opções. Tamanhos sem sabores/preços e categorias desativadas não são vendidos. Os espaços, erros de escrita e trechos incompletos da fonte foram preservados nos dados.

## Atualizar o cardápio

- `src/data/types.ts`: contratos de dados.
- `src/data/menu/categories.json`: categorias e horários.
- `src/data/menu/products.json`: produtos e sabores, descrições e pendências.
- `src/data/menu/sizes.json`: tamanhos, limites de sabores e restrições.
- `src/data/menu/prices.json`: valores em centavos e vínculos entre produto e tamanho.
- `src/data/menu/option-groups.json`: mínimos, máximos e repetição de escolhas.
- `src/data/menu/additions.json`: acompanhamentos/adicionais e preços.
- `src/data/menu/rules.json`: configuração original da regra de cobrança.
- `src/data/delivery.ts`: regiões atendidas e taxas de entrega.
- `src/data/store.json`: endereço, contato e horários confirmados.

O importador `npm run menu:import` reconstrói esses arquivos e o relatório a partir das respostas salvas em `audit/source/`. Para uma nova conferência, atualize os arquivos de origem somente depois de verificar o cardápio dinâmico, revisar as pendências do importador e conferir também as opções internas. As fotos originais em `public/images/` foram preservadas. Os 42 itens sem foto recebem referências ilustrativas de pratos semelhantes, identificadas nos cards e nos detalhes: são 26 arquivos WebP em `public/images/illustrative/`, associados em `src/data/illustrative-images.ts`, sem alterar os dados importados. Fontes, autores e licenças estão em [audit/IMAGE-CREDITS.md](audit/IMAGE-CREDITS.md) e no link público de créditos do rodapé. O script `node scripts/import-illustrative-images.mjs` recompõe os assets e os créditos a partir das fontes registradas.

Os cards usam fotografias padronizadas, preços e botões alinhados, com sombra e movimento discretos ao passar o mouse. A preferência de redução de movimento é respeitada. As categorias ficam em uma faixa horizontal em todos os tamanhos de tela, com setas, arraste com mouse, gesto de toque e navegação pelas teclas de direção, Home e End.

## Regras de cálculo

Grande (8 Fatias) e Média (6 Fatias) permitem até dois sabores; Brotinho permite um. Os sabores de uma mesma pizza usam o mesmo tamanho e a mesma categoria. O preço é a média aritmética dos sabores selecionados; complementos por sabor também seguem a média, conforme a configuração confirmada. O resultado é arredondado uma vez para centavos, depois da composição. Nenhum preço é aceito do navegador como autoridade: o carrinho armazena identificadores e escolhas e recalcula a partir dos dados tipados.

Pizza em Dobro exige duas escolhas inteiras, permite repetir o sabor e não permite meio a meio. O preço confirmado é R$ 85,99 antes de adicionais. Frango Catupiry acrescenta R$ 18,00; Calabresa com Cream Creese e Costela com Cream cheese acrescentam R$ 20,00; Trio Nordestino acrescenta R$ 30,00 por escolha. Não há bordas inventadas. Grupos desativados na fonte não são oferecidos.

As restrições de dias e horários de categorias e produtos são respeitadas em America/Recife. A finalização também verifica o funcionamento da loja, das 10h às 23h15.

## Entrega e pendências

As taxas e regiões de entrega **não foram confirmadas**. A lista de regiões começa vazia. Não é presumido que San Martin ou qualquer outro bairro tenha entrega grátis. Uma taxa `null` é pendente e bloqueia a confirmação. Retirada tem taxa zero. Cadastre somente bairros atendidos e valores confirmados em centavos em `src/data/delivery.ts`, conforme o tipo `DeliveryRegion`. Após configurar e recompilar, a taxa será somada ao subtotal e salva no pedido.

Itens preservados, sinalizados e bloqueados até revisão:

- **Guaraná Lata, 350ml:** R$ 8,50 na chamada e R$ 9,00 na tabela de preço interna.
- **Frango Empanado, 2 Pessoas:** R$ 67,60 na chamada/tela de produto e R$ 69,99 na tabela de preço interna.
- **Filet à Moda da casa, 2 Pessoas:** descrição exige dois acompanhamentos, mas o grupo Guarnição Filet está desativado e vazio.
- **HAPPY PIZZA:** aparece nos dados, com dois grupos SABORES de mesmo título e IDs diferentes, mas não apareceu na navegação durante a conferência. O preço registrado de R$ 47,99 foi preservado, sem liberar compra.

Outras observações: PIZZA + REFRI 1 LITRO está desativada. Média, 1 Sabor, Grande, 1 Sabor e uma opção GRANDE da HAPPY PIZZA não possuem sabores/preços associados. A moda da casa e Calabresa G têm descrições truncadas na fonte; não foram completadas. Descrições vazias continuam vazias.

## Pedidos e pagamento

O carrinho e até 20 resumos de pedidos são persistidos em localStorage na chave `passira-cart-v1`. Todos os atalhos do pedido levam à página `/finalizar/`, com as etapas Carrinho, Seus dados e Conferência. O carrinho permanece após recarregar a página; cada nova finalização começa com um formulário novo. A edição dos itens mantém a página e os dados já preenchidos. Há retirada e formulário de entrega. Nome e telefone com DDD são obrigatórios; a entrega também exige CEP, endereço, número e bairro. Complemento e observações são opcionais.

**Esta versão não possui backend de pedidos, painel da cozinha ou confirmação automática da pizzaria.** O cliente confere os valores, salva o pedido no navegador, baixa o resumo ou abre o WhatsApp confirmado da loja para enviá-lo. Salvar ou abrir o WhatsApp não significa que a loja recebeu ou aceitou o pedido; isso é informado na interface. O envio é uma ação explícita do cliente. Nenhuma mensagem é enviada automaticamente. O histórico pode ser apagado pelo próprio cliente.

Pix, débito e crédito são apenas escolhas salvas com o pedido. Não há gateway, processamento financeiro, coleta de número de cartão, senha, CVV ou dados bancários.

## Validação

Dez testes automatizados cobrem inventário, média dos sabores, Brotinho, Pizza em Dobro com repetição e acréscimos, acompanhamentos obrigatórios, produtos em revisão, taxas de entrega, totais, horários e formatos brasileiros. TypeScript e compilação de produção passam. O fluxo foi exercitado em Chromium, incluindo setas, arraste sem seleção acidental, teclado e swipe touch das categorias, acesso direto à finalização, carrinho vazio, persistência após recarga, edição, retirada, bloqueio de entrega sem taxa, forma de pagamento salva, recibo e início de um segundo pedido. Layout conferido em 320, 390, 768, 1024 e 1440 pixels, sem rolagem horizontal. Os destaques chegam ao carrinho; as fotos carregam e os links de avaliações apontam às fontes individuais. Nenhum pedido de teste foi enviado à loja.
