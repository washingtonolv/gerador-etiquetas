# Gerador de Etiquetas D&D

Aplicação web para criar, editar, organizar e imprimir etiquetas promocionais e materiais de loja. O sistema reúne diferentes modelos de etiquetas, permite importar produtos por planilha e gera folhas prontas para impressão em dimensões reais.

## Acesso

- Aplicação: https://washingtonolv.github.io/gerador-etiquetas/
- Repositório: https://github.com/washingtonolv/gerador-etiquetas

## Recursos

- Criação e edição de etiquetas diretamente no navegador
- Diferentes modelos para vitrines, expositores, maquiagem, campanhas e cartões de vendedoras
- Campos de produto, marca, preço “DE”, preço “POR”, descrição e quantidade, conforme o modelo
- Pré-visualização antes da impressão
- Impressão em folhas A4 com dimensões próprias para cada modelo
- Duplicação e remoção de itens
- Importação em lote por arquivo CSV
- Backup completo das etiquetas em JSON
- Restauração de backups JSON
- Salvamento automático dos dados no armazenamento local do navegador
- Alternância entre tema claro e escuro
- Layout responsivo para computador, tablet e celular
- Download do PowerPoint editável da campanha BLITZ A5
- Funcionamento como aplicação web instalável (PWA)

## Modelos disponíveis

O projeto mantém os seguintes identificadores de modelo:

| Identificador | Uso |
| --- | --- |
| `placa` | Etiqueta de vitrine |
| `pcr` | Expositor de madeira |
| `prec` | Modelo de preço |
| `make` | Etiqueta para maquiagem |
| `make2` | Variação de etiqueta para maquiagem |
| `make3` | Variação de etiqueta para maquiagem |
| `pais` | Etiqueta temática |
| `pais6` | Modelo A6 |
| `blitz` | Campanha BLITZ em A5 |
| `blitzpreco` | Preçário BLITZ para vitrine |
| `vendedoras` | Cartões de vendedoras |

Alguns modelos possuem artes específicas por marca. Os arquivos ficam organizados dentro de `assets/`.

## Como usar

1. Abra a aplicação no navegador.
2. Escolha o modelo desejado.
3. Preencha os dados da etiqueta.
4. Ajuste a quantidade de cópias.
5. Confira a prévia.
6. Clique em **Imprimir**.
7. Na janela de impressão, mantenha a escala em **100%** ou **Tamanho real** para preservar as medidas.

### Importação por CSV

A aplicação aceita uma etiqueta por linha, usando ponto e vírgula como separador:

```csv
Nome do produto;Preço POR;Preço DE (opcional);Marca (opcional)
Pó Bronzer;56,90;75,00;Avon
Creme Renew Ultimate;99,90;174,90;Avon
Batom Matte;29,90;;
```

O próprio sistema disponibiliza o arquivo `modelo-importacao.csv` para download.

### Backup e restauração

Use **Exportar etiquetas** para baixar um backup em formato JSON. Para recuperar os dados, abra **Importar** e selecione o arquivo JSON anteriormente exportado.

> Os dados também são salvos automaticamente no `localStorage` do navegador. Limpar os dados do navegador pode apagar esse conteúdo; por isso, mantenha backups JSON quando necessário.

## Formatos de impressão

Entre os layouts especiais existentes no projeto estão:

- BLITZ: duas artes A5 de 148 × 210 mm em uma folha A4 paisagem
- Preçário BLITZ: oito peças de 53 × 52 mm em uma folha A4 paisagem
- Cartões de vendedoras: nove cartões de 90 × 50 mm em uma folha A4 paisagem
- Modelo A6: quatro peças de 105 × 148 mm em uma folha A4

Para evitar alterações de tamanho, desative opções como “Ajustar à página” quando o navegador ou a impressora as habilitar automaticamente.

## Tecnologias

- HTML e CSS
- JavaScript
- TypeScript
- React 18
- Lit 3
- Vite 8
- Web Worker para montar o PowerPoint BLITZ sem bloquear a interface
- GitHub Actions para validação contínua
- GitHub Pages para publicação

## Executar localmente

### Pré-requisitos

- Node.js LTS
- npm

### Instalação

```bash
git clone https://github.com/washingtonolv/gerador-etiquetas.git
cd gerador-etiquetas
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o bundle moderno e sincroniza os arquivos publicados |
| `npm run preview` | Abre uma prévia local da build |
| `npm run typecheck` | Valida os tipos TypeScript |
| `npm test` | Executa os testes de fumaça e modernização |
| `npm run check` | Executa typecheck, testes e build |

Antes de publicar alterações, execute:

```bash
npm run check
```

## Estrutura do projeto

```text
.
├── .github/workflows/       # Integração contínua
├── assets/                  # Artes, fontes, ícones e prévias
├── scripts/                 # Scripts auxiliares da build
├── src/
│   ├── main.ts              # Entrada do bundle moderno
│   ├── modules/             # Downloads e funções isoladas
│   ├── shell/               # Shell Lit e estado de carregamento
│   └── workers/             # Processamento em segundo plano
├── tests/                   # Testes automatizados
├── uploads/                 # Arquivos editáveis e partes do PowerPoint
├── index.html               # Interface e motor principal
├── support.js               # Runtime de compatibilidade
├── manifest.webmanifest     # Configuração da PWA
├── package.json             # Dependências e comandos
├── tsconfig.json            # Configuração TypeScript
└── vite.config.ts           # Configuração de build
```

## Arquitetura

A aplicação preserva o gerador existente em `index.html` e `support.js`, enquanto `src/main.ts` fornece uma camada moderna construída com Vite e TypeScript. O shell em Lit informa o estado de carregamento. As rotinas de download ficam em módulos separados, e a montagem do PowerPoint é executada em um Web Worker.

A configuração `base: "./"` permite publicar a saída estática em subdiretórios, incluindo o GitHub Pages.

## Testes e integração contínua

O fluxo de CI é executado em pushes para `main`, pull requests e acionamentos manuais. Ele:

1. Instala as dependências com `npm ci`.
2. Executa `npm run check`.
3. Confirma que os arquivos gerados estão sincronizados com o código-fonte.

Os testes verificam, entre outros pontos:

- Tratamento e formatação de preços
- Limites de quantidade
- Inclusão e edição nos modelos
- Configuração das páginas de impressão
- Presença das artes necessárias
- Integridade dos arquivos da aplicação moderna

## Publicação

O site é publicado pelo GitHub Pages a partir do branch `main`. Após qualquer mudança no código moderno:

1. Execute `npm run check`.
2. Confirme os arquivos gerados `modern-app.js`, `modern-app.js.map` e `modern-assets/`.
3. Envie o commit para o branch de publicação.

## Observações

- O projeto é privado no npm (`"private": true`) e não foi preparado como pacote reutilizável.
- Os arquivos de artes e PowerPoint tornam o repositório relativamente grande.
- A interface funciona sem uma API ou banco de dados externo; os dados operacionais permanecem no navegador do usuário.
