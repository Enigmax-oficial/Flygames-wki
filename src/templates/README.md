# 📚 Minecraft Addon Wiki - Templates & Guia de Expansão

Esta pasta contém os **Templates Oficiais em JSON** para expansão e criação estática de páginas da Wikipedia do seu Addon de Minecraft.

## 🚀 Como Expandir esta Wiki no GitHub Pages

Para publicar novas páginas no GitHub Pages ou manter seu repositório sincronizado:

1. **Escolha um Template:**
   - `item-template.json` -> Para Armas, Ferramentas, Armaduras ou Itens
   - `mob-template.json` -> Para Mobs Hostis, Pacíficos e Bosses
   - `block-template.json` -> Para Blocos, Minérios e Bancadas
   - `recipe-template.json` -> Para Receitas e Rituais
   - `biome-template.json` -> Para Biomas e Dimensões
   - `guide-template.json` -> Para Guias, Tutoriais e Patch Notes

2. **Crie ou Edite na Aplicação:**
   - Abra a wiki na web e clique no botão **"➕ Criar com Template"** no menu.
   - Selecione o tipo de página desejado, preencha os dados e pré-visualize o resultado em tempo real com receitas de crafting interativas 3x3.
   - Clique em **"Baixar JSON / Exportar Página"** ou adicione diretamente ao bundle.

3. **Deploy no GitHub Pages:**
   - Execute `npm run build`
   - O projeto gera a pasta estática `/dist`
   - Publique os arquivos no seu branch `gh-pages` ou configure o GitHub Actions (incluso no modal de exportação).

---
*Gerado para a Wikipedia Estática do Addon de Minecraft.*
