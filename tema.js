(function () {
  const CHAVE = "tema";
  const raiz = document.documentElement;

  function lerTemaSalvo() {
    try {
      return localStorage.getItem(CHAVE);
    } catch (erro) {
      return null;
    }
  }

  // Aplica o tema salvo antes de a página aparecer (evita "piscar")
  const salvo = lerTemaSalvo();
  if (salvo === "dark" || salvo === "light") {
    raiz.setAttribute("data-theme", salvo);
  }

  function temaAtual() {
    const forcado = raiz.getAttribute("data-theme");
    if (forcado) return forcado;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    const botao = document.getElementById("botao-tema");
    if (!botao) return;

    function atualizarBotao() {
      const escuro = temaAtual() === "dark";
      botao.textContent = escuro ? "Tema claro" : "Tema escuro";
      botao.setAttribute(
        "aria-label",
        escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"
      );
    }

    botao.addEventListener("click", function () {
      const novo = temaAtual() === "dark" ? "light" : "dark";
      raiz.setAttribute("data-theme", novo);
      try {
        localStorage.setItem(CHAVE, novo);
      } catch (erro) {
        /* sem armazenamento: o tema vale só nesta visita */
      }
      atualizarBotao();
    });

    atualizarBotao();
  });
})();