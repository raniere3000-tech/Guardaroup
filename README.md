# Vestí 👗

Guarda-roupa digital para organizar roupas e montar looks em segundos. MVP para validar a ideia com amigos.

**App online:** https://raniere3000-tech.github.io/guardaroup/

## O que já faz

- **Boas-vindas** em 3 telas e **dicas em pop-up** na primeira visita a cada tela
- **Cadastro de roupa** pela câmera ou galeria, com **remoção automática de fundo** (roda no próprio celular, sem servidor). Dá pra escolher "Manter fundo" se o recorte sair ruim
- Categoria, cor (paleta de bolinhas) e detalhes opcionais: apelido, ocasião e clima
- **Guarda-roupa** com filtro por categoria e por cor; toque na peça para ver, editar ou excluir
- **Criador de looks**: parte de cima, de baixo, vestido (peça única), calçado e um extra (bolsa/acessório). Arrastar, redimensionar e **Sortear** um look aleatório
- **Looks salvos** com nome e categoria (pode criar novas). Editar, excluir e **compartilhar como imagem PNG**
- **Instalável (PWA)**: no celular, "Adicionar à tela inicial"
- **Estatísticas escondidas**: toque 5 vezes no logo "Vestí" da tela inicial

Os dados ficam salvos **só no aparelho** de cada pessoa (IndexedDB).

## Rodar no computador

```bash
npm install
npm run dev
```

## Publicar

Todo `push` na branch `main` publica sozinho no GitHub Pages (workflow em `.github/workflows/deploy.yml`).
Na primeira vez, ative em **Settings → Pages → Source: GitHub Actions**.

## Botão de feedback

Crie um Google Forms e cole o link em `FEEDBACK_URL`, no arquivo `src/lib/constants.js`. O botão aparece sozinho.

## Tecnologias

React + Vite + Tailwind CSS v4 · React Router · Framer Motion · react-rnd · idb-keyval · @imgly/background-removal · vite-plugin-pwa

> Atenção: `@imgly/background-removal` usa licença AGPL. Para um teste com amigos não há problema; se o app virar produto comercial, vale rever essa parte.
