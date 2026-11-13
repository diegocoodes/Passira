place
Identidade existente: vermelho, verde, branco e preto do Passira; Barlow Condensed e Source Sans 3, conforme AGENTS.md. Composição da casa com duas fotografias reais; avaliações em composição editorial. Hero, navegação, cardápio, abertura, contatos e operação preservados por escopo solicitado.

## Conteúdo e voz

Pizzaria e restaurante em San Martin, Recife. A ação da seção da casa é Como chegar. A avaliação geral registrada é 4,3 de 5, consultada em 11/11/2026. Os três depoimentos, nomes, retratos e links vêm de src/data/google-reviews.json. Sem contagem de avaliações disponível, não apresentar contagem. Nenhum fato ou depoimento novo.

Voz: direta e acolhedora, com os nomes reais da casa e do bairro. Texto do painel preservado; novos rótulos apenas para orientar a visita e a leitura das avaliações.

## Composição

- a-passira: título Nossa casa pelo campo editável, conteúdo do painel no texto de apresentação, informações de visita e fotos do salão e da fachada. Um bloco visual em colunas no desktop; texto antes das fotos no celular. Alturas guiadas pelo conteúdo para preservar a edição pelo painel.
- avaliacoes: título Avaliações dos clientes, nota do Google com data de consulta, um depoimento integral em destaque e os outros dois íntegros em linhas de leitura. Retratos e fonte de cada depoimento preservados.
- Créditos das fotos reunidos em uma lista expansível no rodapé. A atribuição do salão só aparece quando a foto original está em uso.

## Movimento

Moment sorteado pela skill: picture-develops, film, na foto do salão. Mostra o ambiente em uma única entrada, sem WebGL, sem carrossel e com versão estática para menos movimento. Fotografias vinculadas ao mapa usam o zoom 1,03 do kit. Botões e links usam a camada de movimento original da skill, sem alterar os arquivos do kit. Excluir as duas seções dos efeitos de entrada antigos para não sobrepor animações.

## Limites da aplicação da skill

Esta tarefa altera somente duas seções de uma loja existente com servidor, banco e checkout. Não converter o projeto para exportação estática, substituir a identidade, remover os contatos reais, impor o template do kit ao restante da loja ou inventar fotografias e avaliações. Fotografias existentes da própria casa, sem imagens de outro restaurante. A análise global da skill pode apontar a estrutura e os efeitos já existentes fora deste escopo; registrar os resultados sem ocultá-los.

## Validação

Resultado final: `GATE: OPEN 99 (rounds used up)`. Três rodadas encerradas, com cinco exceções específicas aceitas. A auditoria global não passou; as 99 pendências abertas estão integralmente registradas em design-validation.json.

Validação em produção local com banco SQLite isolado em test-results, sem modificar os dados da loja. Build Next.js e TypeScript aprovados. As capturas em 1440, 1024, 820, 768 e 390 px ficam em .taste-skill/shots, ignoradas pelo Git. A auditoria completa também percorreu essas larguras e verificou 320 px; não registrou erros de execução nos cinco tamanhos. Isso não equivale a aprovação de todas as regras visuais da skill.

O copy-lint final registrou zero FAIL e um WARN em uma descrição de pizza já existente no cardápio, fora destas seções. Os três relatos continuam identificados e ligados às fontes originais. Os arquivos de movimento foram comparados byte a byte com a skill instalada e estão intactos; sua licença acompanha os arquivos em public/assets.

As fotos responsivas preservam os originais: salão em 800 px, 73.030 bytes, e fachada em 640 px, 33.350 bytes. O enquadramento do salão usa CSS somente na fotografia original. Uma foto substituída pelo painel usa o preenchimento normal. A camada de movimento mantém a versão estática sem JavaScript ou com preferência por menos movimento, e o controlador React desmonta apenas o efeito da própria seção ao navegar.

O resultado final da auditoria global, suas pendências e cinco exceções específicas para os dados reais da loja estão em design-validation.json. As regras de telas inteiras da skill conflitam com o conteúdo editável e o cardápio expansível já existentes. O desenho dos depoimentos é intencional: um relato ocupa as duas linhas da coluna esquerda, enquanto dois ocupam a direita. As linhas não são três cartões de mesma altura.

O perf.mjs executou três cargas por largura em 1440 e 390 px. Não registrou requisições quebradas, módulos sem montagem nem deslocamento de layout. A auditoria de desempenho ficou com quatro FAIL e seis WARN no conjunto das duas larguras: imagens maiores que seus quadros, imagens abaixo da primeira tela sem lazy loading, transferência total e JavaScript. Os limites são da página inteira. As duas fotos da casa carregam antecipadamente de propósito para atender ao acesso direto pela navegação, que na medição anterior de rede lenta deixava os quadros vazios após o clique; esse custo está incluído no apontamento de lazy loading. A medição é de Chrome local em CPU e não representa dados de usuários reais.
