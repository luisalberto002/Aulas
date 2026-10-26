/* ============ EDITE APENAS ESTA PARTE ============
   Cada aula tem um título, uma data e uma lista de arquivos.
   "arquivo" é o caminho dentro da pasta "arquivos/" do repositório.
   Coloque a aula mais recente no topo. */
const TITULO = "Arquivos da turma";
const SUBTITULO = "Baixe aqui os materiais de cada aula.";

const AULAS = [
  {
    titulo: "Arquivos",
    data: "18/10/2026",
    arquivos: [
      { nome: "Roteiro da aula", arquivo: "Arquivos/Guia de Prompts da Persona ao Protótipo.docx" }
    ]
  }
];
/* ============ FIM DA PARTE EDITÁVEL ============ */

document.getElementById("titulo").textContent = TITULO;
document.getElementById("subtitulo").textContent = SUBTITULO;
document.title = TITULO;

const lista = document.getElementById("lista");
if (AULAS.length) {
  lista.textContent = "";
  AULAS.forEach(function (aula) {
    const sec = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = aula.titulo;
    sec.appendChild(h2);
    if (aula.data) {
      const d = document.createElement("p");
      d.className = "data";
      d.textContent = aula.data;
      sec.appendChild(d);
    }
    const ul = document.createElement("ul");
    aula.arquivos.forEach(function (f) {
      const li = document.createElement("li");
      const info = document.createElement("div");
      const n = document.createElement("div");
      n.className = "nome";
      n.textContent = f.nome;
      info.appendChild(n);
      if (f.descricao) {
        const ds = document.createElement("div");
        ds.className = "desc";
        ds.textContent = f.descricao;
        info.appendChild(ds);
      }
      const a = document.createElement("a");
      a.className = "baixar";
      a.href = "arquivos/" + f.arquivo;
      a.setAttribute("download", "");
      a.textContent = "Baixar";
      a.setAttribute("aria-label", "Baixar " + f.nome);
      li.appendChild(info);
      li.appendChild(a);
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    lista.appendChild(sec);
  });
}