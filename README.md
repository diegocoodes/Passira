# Passira - San Martin

Cardápio responsivo com Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React e Zustand. A pasta de trabalho estava vazia; não havia estrutura ou dependências anteriores a preservar.

## Executar

Requer Node.js 20.9 ou superior. No Windows com execução de scripts do PowerShell bloqueada, use `npm.cmd` no lugar de `npm`.

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

O endereço local padrão é http://127.0.0.1:3000. A publicação usa os arquivos de `out/`. Nenhuma API ou credencial da Neemo é necessária em execução.

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
| Pizza - Somente 1 sabor | 1 |
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

O importador `npm run menu:import` reconstrói esses arquivos e o relatório a partir das respostas salvas em `audit/source/`. Para uma nova conferência, atualize os arquivos de origem somente depois de verificar o cardápio dinâmico, revisar as pendências do importador e conferir também as opções internas. As fotos locais em `public/images/` vieram dos produtos da própria fonte; produtos sem foto não recebem imagens de outro prato.

## Regras de cálculo

Grande (8 Fatias) e Média (6 Fatias) permitem até dois sabores; Brotinho permite um. Os sabores de uma mesma pizza usam o mesmo tamanho e a mesma categoria. O preço é a média aritmética dos sabores selecionados; complementos por sabor também seguem a média, conforme a configuração confirmada. O resultado é arredondado uma vez para centavos, depois da composição. Nenhum preço é aceito do navegador como autoridade: o carrinho armazena identificadores e escolhas e recalcula a partir dos dados tipados.

Pizza em Dobro exige duas escolhas inteiras, permite repetir o sabor e não permite meio a meio. O preço confirmado é R$ 85,99 antes de adicionais. Frango Catupiry acrescenta R$ 18,00; Calabresa com Cream Creese e Costela com Cream cheese acrescentam R$ 20,00; Trio Nordestino acrescenta R$ 30,00 por escolha. Não há bordas inventadas. Grupos desativados na fonte não são oferecidos.

As restrições de dias e horários de categorias e produtos são respeitadas em America/Recife. A finalização também verifica o funcionamento da loja, das 10h às 23h15.

## Entrega e pendências

As taxas e regiões de entrega **não foram confirmadas**. A lista de regiões começa vazia. Não é presumido que San Martin ou qualquer outro bairro tenha entrega grátis. Uma taxa `null` é pendente e bloqueia a confirmação. Retirada tem taxa zero. Cadastre somente bairros atendidos e valores confirmados em centavos em `src/data/delivery.ts`, conforme o tipo `DeliveryRegion`. Após configurar e recompilar, a taxa será somada ao subtotal e salva no pedido.

Itens preservados, sinalizados e bloqueados até revisão:

- **Guaraná Lata - 350ml:** R$ 8,50 na chamada e R$ 9,00 na tabela de preço interna.
- **Frango Empanado - 2 Pessoas:** R$ 67,60 na chamada/tela de produto e R$ 69,99 na tabela de preço interna.
- **Filet à Moda da casa - 2 Pessoas:** descrição exige dois acompanhamentos, mas o grupo Guarnição Filet está desativado e vazio.
- **HAPPY PIZZA:** aparece nos dados, com dois grupos SABORES de mesmo título e IDs diferentes, mas não apareceu na navegação durante a conferência. O preço registrado de R$ 47,99 foi preservado, sem liberar compra.

Outras observações: PIZZA + REFRI 1 LITRO está desativada. Média - 1 Sabor, Grande - 1 Sabor e uma opção GRANDE da HAPPY PIZZA não possuem sabores/preços associados. A moda da casa e Calabresa G têm descrições truncadas na fonte; não foram completadas. Descrições vazias continuam vazias.

## Pedidos e pagamento

O carrinho e até 20 resumos de pedidos são persistidos em localStorage na chave `passira-cart-v1`. Há retirada e formulário de entrega. Nome e telefone com DDD são obrigatórios; a entrega também exige CEP, endereço, número e bairro. Complemento e observações são opcionais.

**Esta versão não possui backend de pedidos, painel da cozinha ou confirmação automática da pizzaria.** O cliente confere os valores, salva o pedido no navegador, baixa o resumo ou abre o WhatsApp confirmado da loja para enviá-lo. Salvar ou abrir o WhatsApp não significa que a loja recebeu ou aceitou o pedido; isso é informado na interface. O envio é uma ação explícita do cliente. Nenhuma mensagem é enviada automaticamente. O histórico pode ser apagado pelo próprio cliente.

Pix, débito e crédito são apenas escolhas salvas com o pedido. Não há gateway, processamento financeiro, coleta de número de cartão, senha, CVV ou dados bancários.

## Validação

Dez testes automatizados cobrem inventário, média dos sabores, Brotinho, Pizza em Dobro com repetição e acréscimos, acompanhamentos obrigatórios, produtos em revisão, taxas de entrega, totais, horários e formatos brasileiros. TypeScript e compilação de produção passam. O fluxo foi exercitado em Chrome, incluindo persistência após recarga, edição, retirada, entrega sem taxa, forma de pagamento salva, recibo, pesquisa e conferência. Layout conferido em 320, 390, 768, 1024 e 1440 pixels, sem rolagem horizontal. Nenhum pedido de teste foi enviado à loja.
