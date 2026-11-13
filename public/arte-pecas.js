// Vínculo entre cada peça e a sua arte.
// A chave é <hierarquia>_<número da peça>, e o valor é o caminho da imagem usada no jogo.
// Substitua a imagem WebP em public/assets/pieces/jogo/ mantendo o nome da chave.
// As artes prontas são usadas diretamente pelo servidor local e pela publicação.
// Caminho null ou arquivo inexistente: a peça mostra o kanji da hierarquia.
export const ARTE_PECAS = {
  // Hokage (10)
  hokage_1: 'assets/pieces/jogo/hokage_1.webp',

  // Kage das Sombras (9)
  kage_1: 'assets/pieces/jogo/kage_1.webp',

  // Conselheiros (8)
  conselheiro_1: 'assets/pieces/jogo/conselheiro_1.webp',
  conselheiro_2: 'assets/pieces/jogo/conselheiro_2.webp',

  // Sannins Lendários (7)
  sannin_1: 'assets/pieces/jogo/sannin_1.webp',
  sannin_2: 'assets/pieces/jogo/sannin_2.webp',
  sannin_3: 'assets/pieces/jogo/sannin_3.webp',

  // ANBU (6)
  anbu_1: 'assets/pieces/jogo/anbu_1.webp',
  anbu_2: 'assets/pieces/jogo/anbu_2.webp',
  anbu_3: 'assets/pieces/jogo/anbu_3.webp',
  anbu_4: 'assets/pieces/jogo/anbu_4.webp',

  // Jounin de Elite (5)
  especial_1: 'assets/pieces/jogo/especial_1.webp',
  especial_2: 'assets/pieces/jogo/especial_2.webp',
  especial_3: 'assets/pieces/jogo/especial_3.webp',
  especial_4: 'assets/pieces/jogo/especial_4.webp',

  // Jōnin (4)
  jounin_1: 'assets/pieces/jogo/jounin_1.webp',
  jounin_2: 'assets/pieces/jogo/jounin_2.webp',
  jounin_3: 'assets/pieces/jogo/jounin_3.webp',
  jounin_4: 'assets/pieces/jogo/jounin_4.webp',

  // Chuunin (3)
  chunin_1: 'assets/pieces/jogo/chunin_1.webp',
  chunin_2: 'assets/pieces/jogo/chunin_2.webp',
  chunin_3: 'assets/pieces/jogo/chunin_3.webp',
  chunin_4: 'assets/pieces/jogo/chunin_4.webp',
  chunin_5: 'assets/pieces/jogo/chunin_5.webp',

  // Genin (2)
  genin_1: 'assets/pieces/jogo/genin_1.webp',
  genin_2: 'assets/pieces/jogo/genin_2.webp',
  genin_3: 'assets/pieces/jogo/genin_3.webp',
  genin_4: 'assets/pieces/jogo/genin_4.webp',
  genin_5: 'assets/pieces/jogo/genin_5.webp',
  genin_6: 'assets/pieces/jogo/genin_6.webp',
  genin_7: 'assets/pieces/jogo/genin_7.webp',
  genin_8: 'assets/pieces/jogo/genin_8.webp',

  // Nukenin (1)
  nukenin_1: 'assets/pieces/jogo/nukenin_1.webp',

  // Armadilha Explosiva
  trap_1: 'assets/pieces/jogo/trap_1.webp',
  trap_2: 'assets/pieces/jogo/trap_2.webp',
  trap_3: 'assets/pieces/jogo/trap_3.webp',
  trap_4: 'assets/pieces/jogo/trap_4.webp',
  trap_5: 'assets/pieces/jogo/trap_5.webp',
  trap_6: 'assets/pieces/jogo/trap_6.webp',

  // Pergaminho Secreto
  scroll_1: 'assets/pieces/jogo/scroll_1.webp',

  // Verso das peças (null usa o brasão desenhado pela interface).
  // Para usar arte própria, salve jogo/verso_azul.webp e informe o caminho abaixo.
  verso_azul: null,
  verso_vermelho: null,
};

// Peça cuja arte representa cada hierarquia no painel "Seu exército".
// O valor é o número da peça (por exemplo genin: 8 usa a arte de genin_8). Hierarquias ausentes usam a peça 1.
export const ARTE_PAINEL = {
  conselheiro: 2,
  especial: 2,
  genin: 8,
};
