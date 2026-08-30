repo: washingtonolv/gerador-etiquetas
branch: main

## Last sync
date: 2026-08-24

### Updated in this project
- Dez modelos editáveis no gerador, incluindo o BLITZ A5 e o Preçário Blitz Vitrine
- Preçário Blitz Vitrine com 15 artes de marca, peças de 53 × 52 mm e impressão de 8 unidades por A4 paisagem
- PowerPoint BLITZ corrigido para o tamanho A5 exato (14,8 × 21 cm)
- Prévia otimizada e impressão A4 em dimensões reais
- Painéis de edição e modelos recolhíveis
- Testes de regressão para dados, quantidades, importação e modelos
- Build moderno com Vite e TypeScript, mantendo saída estática compatível com GitHub Pages
- Shell Lit para inicialização resiliente e aviso de carregamento
- React empacotado localmente, sem dependência do CDN durante a inicialização
- Montagem do PowerPoint BLITZ em Web Worker para não bloquear a interface

## Screen map
| Screen | Repo files |
| --- | --- |
| Gerador de Etiquetas | index.html, support.js, manifest.webmanifest, assets/**/* |
| Código moderno | src/**/*, vite.config.ts, modern-app.js, modern-assets/**/* |
| Testes automatizados | tests/smoke.mjs, tests/modernization.mjs, package.json |

## Notes
O site é publicado pelo GitHub Pages a partir do branch `main`. Execute `npm run check` antes de publicar alterações.
