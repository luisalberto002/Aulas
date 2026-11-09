const SUPABASE_URL = "https://fqfzgszhjricxbdzhihc.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_IIfD9h6uLTPaGS77NvPl9Q_X0QKPbCl";

const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE);

const areaLogin = document.getElementById("area-login");
const areaPainel = document.getElementById("area-painel");
const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const textoQuem = document.getElementById("quem");
const botaoSair = document.getElementById("botao-sair");
const areaAulas = document.getElementById("area-aulas");
const formAula = document.getElementById("form-aula");
const erroAula = document.getElementById("erro-aula");
const listaAulas = document.getElementById("lista-aulas");
const areaArquivos = document.getElementById("area-arquivos");
const formArquivo = document.getElementById("form-arquivo");
const selectAula = document.getElementById("arquivo-aula");
const msgArquivo = document.getElementById("msg-arquivo");
const botaoEnviar = formArquivo.querySelector("button[type=submit]");
let aulasCarregadas = [];
let usuarioAtual = null;

// Decide qual tela mostrar: login (sem sessão) ou painel (com sessão)
function mostrarTela(sessao) {
  if (sessao) {
    textoQuem.textContent = "Conectado como " + sessao.user.email;
    formLogin.reset();
    areaLogin.hidden = true;
    areaPainel.hidden = false;
    areaAulas.hidden = false;
    areaArquivos.hidden = false;

    if (sessao.user.id !== usuarioAtual) {
      usuarioAtual = sessao.user.id;
      setTimeout(carregarAulasAdmin, 0);
    }
  } else {
    usuarioAtual = null;
    aulasCarregadas = [];
    areaPainel.hidden = true;
    areaAulas.hidden = true;
    areaArquivos.hidden = true;
    listaAulas.replaceChildren();
    areaLogin.hidden = false;
  }
}

formLogin.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  erroLogin.hidden = true;

  const { error } = await cliente.auth.signInWithPassword({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("senha").value
  });

  if (error) {
    erroLogin.textContent = "E-mail ou senha incorretos.";
    erroLogin.hidden = false;
  }
});

botaoSair.addEventListener("click", async function () {
  await cliente.auth.signOut();
});

// Dispara ao abrir a página, ao entrar e ao sair
cliente.auth.onAuthStateChange(function (evento, sessao) {
  mostrarTela(sessao);
});

// Mesma função do site público ("2026-10-27" vira "27/10/2026")
function formatarData(texto) {
  if (!texto) return "Sem data";
  const [ano, mes, dia] = texto.split("-");
  return dia + "/" + mes + "/" + ano;
}

async function carregarAulasAdmin() {
  const { data, error } = await cliente
    .from("aulas")
    .select("id, titulo, data, arquivos(id, nome, descricao, caminho)")
    .order("data", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .order("id", { referencedTable: "arquivos", ascending: true });

  if (error) {
    console.error(error);
    listaAulas.replaceChildren();
    const aviso = document.createElement("li");
    aviso.textContent = "Não foi possível carregar as aulas.";
    listaAulas.appendChild(aviso);
    return;
  }

  aulasCarregadas = data;
  desenharAulas();
}

// Desenha a tela usando os dados já guardados, sem ir ao servidor


function criarBotaoPequeno(texto, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-pequeno";
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}

// Desenha a tela usando os dados já guardados, sem ir ao servidor
function desenharAulas() {
  const selecionada = selectAula.value;
  listaAulas.replaceChildren();
  selectAula.replaceChildren();

  aulasCarregadas.forEach(function (aula) {
    const opcao = document.createElement("option");
    opcao.value = aula.id;
    opcao.textContent = aula.titulo + " (" + formatarData(aula.data) + ")";
    selectAula.appendChild(opcao);

    const item = document.createElement("li");
    const info = document.createElement("div");
    info.className = "info-aula";

    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = aula.titulo;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = formatarData(aula.data);

    info.append(nome, desc);

    aula.arquivos.forEach(function (arquivo) {
      const linha = document.createElement("div");
      linha.className = "desc";
      linha.textContent = "• " + arquivo.nome + "  (" + arquivo.caminho + ")";
      info.appendChild(linha);
    });

    item.append(
      info,
      criarBotaoPequeno("Editar aula", function () {
        editarAula(aula, item);
      })
    );
    listaAulas.appendChild(item);
  });

  if (selecionada) selectAula.value = selecionada;
}

// Monta um formulário de edição a partir de uma lista de campos.
// Um item { secao: "texto" } vira um subtítulo; os demais viram campos.
// aoSalvar recebe os valores e devolve uma mensagem de erro (texto) se falhar.
function criarFormEdicao(campos, aoSalvar, aoCancelar) {
  const form = document.createElement("form");
  form.className = "form-edicao";
  const entradas = {};

  // Criado antes para que os botões de perigo também possam usá-lo
  const erro = document.createElement("p");
  erro.className = "erro";
  erro.hidden = true;

  campos.forEach(function (campo) {
    if (campo.secao) {
      const subtitulo = document.createElement("h3");
      subtitulo.className = "secao-edicao";
      subtitulo.textContent = campo.secao;
      form.appendChild(subtitulo);
      return;
    }

    if (campo.botao) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-perigo";
      botao.textContent = campo.botao;

      botao.addEventListener("click", async function () {
        erro.hidden = true;
        botao.disabled = true;
        try {
          const mensagem = await campo.aoClicar();
          if (mensagem) {
            erro.textContent = mensagem;
            erro.hidden = false;
          }
        } finally {
          botao.disabled = false;
        }
      });

      form.appendChild(botao);
      return;
    }

    const rotulo = document.createElement("label");
    rotulo.textContent = campo.rotulo;

    const entrada = document.createElement("input");
    entrada.type = campo.tipo || "text";
    entrada.value = campo.valor || "";
    entrada.required = Boolean(campo.obrigatorio);

    rotulo.appendChild(entrada);
    form.appendChild(rotulo);
    entradas[campo.chave] = entrada;
  });

  const acoes = document.createElement("div");
  acoes.className = "acoes";

  const salvar = document.createElement("button");
  salvar.type = "submit";
  salvar.className = "baixar";
  salvar.textContent = "Salvar";

  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.className = "botao-secundario";
  cancelar.textContent = "Cancelar";
  cancelar.addEventListener("click", aoCancelar);

  acoes.append(salvar, cancelar);
  form.append(erro, acoes);

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    erro.hidden = true;
    salvar.disabled = true;

    const valores = {};
    Object.keys(entradas).forEach(function (chave) {
      valores[chave] = entradas[chave].value.trim() || null;
    });

    try {
      const mensagem = await aoSalvar(valores);
      if (mensagem) {
        erro.textContent = mensagem;
        erro.hidden = false;
      }
    } finally {
      salvar.disabled = false;
    }
  });

  return form;
}

// Edita a aula e todos os seus materiais num único formulário
function editarAula(aula, item) {
  const campos = [
    { secao: "Dados da aula" },
    { chave: "titulo", rotulo: "Título da aula", valor: aula.titulo, obrigatorio: true },
    { chave: "data", rotulo: "Data", tipo: "date", valor: aula.data }
  ];

  aula.arquivos.forEach(function (arquivo) {
    campos.push({ secao: "Material: " + arquivo.caminho });
    campos.push({
      chave: "nome-" + arquivo.id,
      rotulo: "Nome do material",
      valor: arquivo.nome,
      obrigatorio: true
    });
    campos.push({
      chave: "descricao-" + arquivo.id,
      rotulo: "Descrição (opcional)",
      valor: arquivo.descricao
    });
    campos.push({
      botao: "Remover material",
      aoClicar: function () {
        return removerMaterial(arquivo);
      }
    });
  });

  campos.push({ secao: "Zona de perigo" });
  campos.push({
    botao: "Excluir aula",
    aoClicar: function () {
      return excluirAula(aula);
    }
  });

  const form = criarFormEdicao(
    campos,
    async function (valores) {
      const pedidos = [];

      // Só envia o que realmente mudou
      if (valores.titulo !== aula.titulo || valores.data !== aula.data) {
        pedidos.push(
          cliente
            .from("aulas")
            .update({ titulo: valores.titulo, data: valores.data })
            .eq("id", aula.id)
        );
      }

      aula.arquivos.forEach(function (arquivo) {
        const nome = valores["nome-" + arquivo.id];
        const descricao = valores["descricao-" + arquivo.id];

        if (nome !== arquivo.nome || descricao !== arquivo.descricao) {
          pedidos.push(
            cliente
              .from("arquivos")
              .update({ nome: nome, descricao: descricao })
              .eq("id", arquivo.id)
          );
        }
      });

      if (pedidos.length === 0) {
        desenharAulas(); // nada mudou
        return;
      }

      const resultados = await Promise.all(pedidos);
      const erros = resultados
        .map(function (r) { return r.error; })
        .filter(Boolean);

      if (erros.length > 0) {
        console.error(erros);
        return "Algumas alterações não puderam ser salvas. Tente novamente.";
      }

      carregarAulasAdmin();
    },
    desenharAulas
  );

  item.replaceChildren(form);
}


formAula.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  erroAula.hidden = true;

  const titulo = document.getElementById("aula-titulo").value.trim();
  const data = document.getElementById("aula-data").value || null;

  const { error } = await cliente.from("aulas").insert({ titulo: titulo, data: data });

  if (error) {
    console.error(error);
    erroAula.textContent = "Não foi possível criar a aula.";
    erroAula.hidden = false;
    return;
  }

  formAula.reset();
  carregarAulasAdmin();
});

// "Trabalho Final (v2).PDF" vira "trabalho-final-v2.pdf"
function criarNomeSeguro(nomeOriginal) {
  const ponto = nomeOriginal.lastIndexOf(".");
  const base = ponto > 0 ? nomeOriginal.slice(0, ponto) : nomeOriginal;
  const extensao = ponto > 0 ? nomeOriginal.slice(ponto + 1) : "";

  const limpo = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // troca símbolos e espaços por hífen
    .replace(/^-+|-+$/g, "");        // tira hífens das pontas

  const extLimpa = extensao.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (limpo || "arquivo") + (extLimpa ? "." + extLimpa : "");
}

function mostrarMsgArquivo(texto, classe) {
  if (!texto) {
    msgArquivo.hidden = true;
    return;
  }
  msgArquivo.textContent = texto;
  msgArquivo.className = classe;
  msgArquivo.hidden = false;
}

formArquivo.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const aulaId = Number(selectAula.value);
  const nome = document.getElementById("arquivo-nome").value.trim();
  const descricao =
    document.getElementById("arquivo-descricao").value.trim() || null;
  const arquivo = document.getElementById("arquivo-arquivo").files[0];

  if (!arquivo) {
    mostrarMsgArquivo("Escolha um arquivo.", "erro");
    return;
  }

  botaoEnviar.disabled = true;
  mostrarMsgArquivo("Enviando...", "vazio");

  const caminho = criarNomeSeguro(arquivo.name);

  try {
    // Passo 1: envia o arquivo para o Storage (sem sobrescrever)
    const envio = await cliente.storage
      .from("materiais")
      .upload(caminho, arquivo, { upsert: false });

    if (envio.error) {
      console.error(envio.error);
      const jaExiste = /already exists|duplicate/i.test(envio.error.message);
      mostrarMsgArquivo(
        jaExiste
          ? 'Já existe um arquivo chamado "' + caminho + '". Renomeie o arquivo e tente de novo.'
          : "Falha no envio: " + envio.error.message,
        "erro"
      );
      return;
    }

    // Passo 2: cadastra o material no banco
    const registro = await cliente
      .from("arquivos")
      .insert({ aula_id: aulaId, nome: nome, descricao: descricao, caminho: caminho });

    if (registro.error) {
      console.error(registro.error);
      // Desfaz o passo 1 para não deixar arquivo órfão
      await cliente.storage.from("materiais").remove([caminho]);
      mostrarMsgArquivo(
        "Não foi possível cadastrar o material. O envio foi desfeito.",
        "erro"
      );
      return;
    }

    formArquivo.reset();
    mostrarMsgArquivo("Arquivo enviado com sucesso.", "vazio");
    carregarAulasAdmin();
  } finally {
    botaoEnviar.disabled = false; // roda em qualquer saída do bloco try
  }
});

async function removerMaterial(arquivo) {
  const certeza = confirm(
    'Remover o material "' + arquivo.nome + '"?\n\n' +
    "O arquivo será apagado definitivamente e deixará de aparecer para os alunos."
  );
  if (!certeza) return;

  // 1) apaga o arquivo do Storage
  if (arquivo.caminho) {
    const { error: erroStorage } = await cliente.storage
      .from("materiais")
      .remove([arquivo.caminho]);

    if (erroStorage) {
      console.error(erroStorage);
      return "Não foi possível apagar o arquivo. Nada foi removido do site.";
    }
  }

  // 2) apaga o registro do banco
  const { error: erroBanco } = await cliente
    .from("arquivos")
    .delete()
    .eq("id", arquivo.id);

  if (erroBanco) {
    console.error(erroBanco);
    return "O arquivo foi apagado, mas o cadastro não pôde ser removido. Tente remover de novo.";
  }

  carregarAulasAdmin();
}

async function excluirAula(aula) {
  const total = aula.arquivos.length;
  const aviso =
    total > 0
      ? "\n\nOs " + total + " material(is) desta aula também serão apagados definitivamente."
      : "";

  const certeza = confirm(
    'Excluir a aula "' + aula.titulo + '"?' + aviso +
    "\n\nEsta ação não pode ser desfeita."
  );
  if (!certeza) return;

  const caminhos = aula.arquivos
    .map(function (arquivo) { return arquivo.caminho; })
    .filter(Boolean);

  // 1) apaga os arquivos do Storage
  if (caminhos.length > 0) {
    const { error: erroStorage } = await cliente.storage
      .from("materiais")
      .remove(caminhos);

    if (erroStorage) {
      console.error(erroStorage);
      return "Não foi possível apagar os arquivos. A aula não foi excluída.";
    }
  }

  // 2) apaga a aula (os registros dos materiais saem junto, por cascata)
  const { error: erroBanco } = await cliente
    .from("aulas")
    .delete()
    .eq("id", aula.id);

  if (erroBanco) {
    console.error(erroBanco);
    return "Os arquivos foram apagados, mas a aula não pôde ser excluída. Tente de novo.";
  }

  carregarAulasAdmin();
}