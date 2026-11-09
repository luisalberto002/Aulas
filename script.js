/* ============ CONFIGURAÇÃO ============ */

const TITULO = "Arquivos da turma";
const SUBTITULO = "Baixe aqui os materiais de cada aula.";

const SUPABASE_URL = "https://fqfzgszhjricxbdzhihc.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_IIfD9h6uLTPaGS77NvPl9Q_X0QKPbCl";

/* ============ FIM DA CONFIGURAÇÃO ============ */

// Converte "2026-10-27" em "27/10/2026"
function formatarData(texto) {
  if (!texto) return "";
  const [ano, mes, dia] = texto.split("-");
  return dia + "/" + mes + "/" + ano;
}

async function carregarAulas() {
  const endereco =
    SUPABASE_URL +
    "/rest/v1/aulas?select=titulo,data,arquivos(nome,descricao,caminho)" +
    "&order=data.desc.nullslast,id.desc" +
    "&arquivos.order=id.asc";

  const resposta = await fetch(endereco, {
    headers: { apikey: SUPABASE_CHAVE }
  });

  if (!resposta.ok) {
    throw new Error("Erro ao carregar: " + resposta.status);
  }

  const dados = await resposta.json();

  // Traduz para o formato que o resto do código já entende
  return dados.map(function (aula) {
    return {
      titulo: aula.titulo,
      data: formatarData(aula.data),
      arquivos: aula.arquivos.map(function (f) {
        return { nome: f.nome, descricao: f.descricao, arquivo: f.caminho };
      })
    };
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  const elementoTitulo = document.getElementById("titulo");
  const elementoSubtitulo = document.getElementById("subtitulo");
  const lista = document.getElementById("lista");

  elementoTitulo.textContent = TITULO;
  elementoSubtitulo.textContent = SUBTITULO;
  document.title = TITULO;

  /*
   * A URL base respeita o caminho do projeto no GitHub Pages.
   * Exemplo:
   * https://usuario.github.io/turma/
   * arquivos serão procurados em /turma/arquivos/
   */
  const caminhoBase = new URL("./", window.location.href);
  const pastaArquivos = new URL("arquivos/", caminhoBase);

  function mostrarMensagem(mensagem, classe) {
    const p = document.createElement("p");
    p.className = classe;
    p.textContent = mensagem;
    lista.replaceChildren(p);
  }

  function criarLinkDownload(arquivo) {
    const link = document.createElement("a");

    link.className = "baixar";
    link.href =
      SUPABASE_URL +
      "/storage/v1/object/public/materiais/" +
      encodeURIComponent(arquivo.arquivo) +
      "?download=" +
      encodeURIComponent(arquivo.arquivo);
    link.textContent = "Baixar";
    link.setAttribute("aria-label", "Baixar " + arquivo.nome);

    /*
     * O atributo download funciona principalmente para arquivos
     * da mesma origem. O servidor ainda precisa disponibilizar
     * o arquivo no endereço indicado.
     */
    link.download = arquivo.arquivo;

    return link;
  }

  let AULAS = [];

  try {
    AULAS = await carregarAulas();
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(
      "Não foi possível carregar os materiais. Tente novamente mais tarde.",
      "erro"
    );
    return;
  }

  if (!Array.isArray(AULAS) || AULAS.length === 0) {
    mostrarMensagem("Nenhum arquivo publicado ainda.", "vazio");
    return;
  }

  lista.replaceChildren();

  AULAS.forEach(function (aula) {
    const secao = document.createElement("section");

    const titulo = document.createElement("h2");
    titulo.textContent = aula.titulo || "Materiais";
    secao.appendChild(titulo);

    if (aula.data) {
      const data = document.createElement("p");
      data.className = "data";
      data.textContent = aula.data;
      secao.appendChild(data);
    }

    const ul = document.createElement("ul");
    const arquivos = Array.isArray(aula.arquivos)
      ? aula.arquivos
      : [];

    if (arquivos.length === 0) {
      const item = document.createElement("li");
      item.textContent = "Nenhum arquivo cadastrado nesta aula.";
      ul.appendChild(item);
    }

    arquivos.forEach(function (arquivo) {
      const item = document.createElement("li");
      const informacoes = document.createElement("div");

      const nome = document.createElement("div");
      nome.className = "nome";
      nome.textContent = arquivo.nome || arquivo.arquivo || "Arquivo";
      informacoes.appendChild(nome);

      if (arquivo.descricao) {
        const descricao = document.createElement("div");
        descricao.className = "desc";
        descricao.textContent = arquivo.descricao;
        informacoes.appendChild(descricao);
      }

      item.appendChild(informacoes);

      if (
        typeof arquivo.arquivo === "string" &&
        arquivo.arquivo.trim() !== ""
      ) {
        item.appendChild(criarLinkDownload(arquivo));
      } else {
        const aviso = document.createElement("span");
        aviso.className = "desc";
        aviso.textContent = "Caminho do arquivo não informado.";
        item.appendChild(aviso);
      }

      ul.appendChild(item);
    });

    secao.appendChild(ul);
    lista.appendChild(secao);
  });
});
