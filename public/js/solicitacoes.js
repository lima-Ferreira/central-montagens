let solicitacoes = [];

// BUSCAR SOLICITAÇÕES DO BANCO DE DADOS
async function carregarSolicitacoes() {
  try {
    const respuesta = await fetch("/api/solicitacoes");

    if (!respuesta.ok) {
      throw new Error("Erro ao buscar solicitações do servidor");
    }

    solicitacoes = await respuesta.json();

    let tabela = document.getElementById("listaSolicitacoes");
    tabela.innerHTML = "";

    solicitacoes.forEach((item) => {
      let status = item.status.toLowerCase();

      let dataFormatada = "---";
      if (item.data_montagem) {
        const partes = item.data_montagem.split("-");
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }

      // Estilização simples para diferenciar Mostruário de Cliente na tabela
      const badgeTipo =
        item.tipo_montagem === "Mostruário"
          ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">🏪 Loja</span>`
          : `<span style="background:#f0fdf4; color:#166534; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">👤 Cliente</span>`;

      tabela.innerHTML += `
        <tr>
          <td>${item.id}</td>
          <td>
            <div style="font-weight:bold; color:#1e293b;">${item.loja}</div>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">Por: ${item.solicitante || "Não informado"} ${badgeTipo}</div>
          </td>
          <td>${item.cidade}</td>
          <td>${item.quantidade}</td>
          <td>${dataFormatada}</td>
          <td>${item.prioridade}</td>
          <td>
            <span class="status ${status}">
              ${item.status}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 5px;">
              <button class="acao" onclick="abrirSolicitacao(${item.id})">
                Abrir
              </button>
              <button class="acao" style="background-color: #e74c3c;" onclick="deletarSolicitacao(${item.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Não foi possível carregar as solicitações.");
  }
}

window.abrirModal = function () {
  document.getElementById("modal").style.display = "flex";
};

window.fecharModal = function () {
  document.getElementById("modal").style.display = "none";
};

// SALVAR NOVA SOLICITAÇÃO NO BANCO DE DADOS
window.salvarSolicitacao = function () {
  const loja = document.getElementById("loja").value;
  const solicitante = document.getElementById("solicitante").value.trim();
  const tipo_montagem = document.getElementById("tipo_montagem").value;
  const quantidade = document.getElementById("quantidade").value;
  const data_montagem = document.getElementById("data").value;
  const prioridade = document.getElementById("prioridade").value;
  const observacao = document.getElementById("observacao").value.trim();

  if (!data_montagem) {
    alert("Por favor, selecione uma data para a montagem.");
    return;
  }

  let cidade = "Russas";
  if (loja.includes("(")) {
    cidade = loja.split("(")[1].replace(")", "").trim();
  }

  // Objeto estruturado com as duas novas propriedades estratégicas
  const novaSolicitacao = {
    loja: loja,
    solicitante: solicitante || "Não Informado",
    tipo_montagem: tipo_montagem,
    cidade: cidade,
    quantidade: parseInt(quantidade),
    data_montagem: data_montagem,
    prioridade: prioridade,
    observacao: observacao,
  };

  executarEnvio(novaSolicitacao);
};

// Separação assíncrona limpa para evitar colisões de escopo global no HTML
async function executarEnvio(dadosEnvio) {
  try {
    const resposta = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosEnvio),
    });

    if (!resposta.ok) {
      throw new Error("Falha ao registrar nova solicitação no banco");
    }

    // Reseta o formulário limpando os novos inputs também
    document.getElementById("solicitante").value = "";
    document.getElementById("tipo_montagem").selectedIndex = 0;
    document.getElementById("quantidade").value = "1";
    document.getElementById("data").value = "";
    document.getElementById("observacao").value = "";

    await carregarSolicitacoes();
    fecharModal();
    alert("Solicitação registrada com sucesso!");
  } catch (erro) {
    console.error("Erro ao salvar:", erro);
    alert("Ocorreu um erro ao salvar a solicitação.");
  }
}

// NOVA FUNÇÃO: FAZ A EXCLUSÃO DA SOLICITAÇÃO NO BANCO
window.deletarSolicitacao = async function (id) {
  if (
    !confirm(
      `Tem certeza que deseja excluir a solicitação Nº ${id}? Se ela estiver agendada, a escala também será apagada.`,
    )
  ) {
    return;
  }

  try {
    const resposta = await fetch(`/api/solicitacoes/${id}`, {
      method: "DELETE",
    });

    if (!resposta.ok) {
      throw new Error("Erro ao deletar o registro no servidor.");
    }

    alert(`Solicitação Nº ${id} removida com sucesso!`);
    await carregarSolicitacoes();
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir a solicitação.");
  }
};

window.abrirSolicitacao = function (id) {
  window.location.href = "/pages/detalhe-solicitacao.html?id=" + id;
};

// Oculta campos de quantidade e prioridade se for apenas um lançamento de folga
window.mudouTipo = function () {
  const tipo = document.getElementById("tipo_montagem").value;
  const blocoCampos = document.getElementById("camposEscondiveis");
  const labelLoja = document.getElementById("labelLoja");
  const labelSolicitante = document.getElementById("labelSolicitante");

  if (tipo === "Ausência") {
    blocoCampos.style.display = "none";
    labelLoja.textContent = "Unidade do Montador";
    labelSolicitante.textContent = "Nome do Montador Ausente";
    document.getElementById("quantidade").value = "1";
    document.getElementById("prioridade").value = "Normal";
  } else {
    blocoCampos.style.display = "block";
    labelLoja.textContent = "Loja solicitante";
    labelSolicitante.textContent = "A pedido de (Nome do Solicitante)";
  }
};

// Ajuste rápido para resetar a tela ao fechar o modal
const funcaoFecharAntiga = window.fecharModal;
window.fecharModal = function () {
  funcaoFecharAntiga();
  document.getElementById("tipo_montagem").value = "Cliente";
  window.mudouTipo();
};

// Inicializa o sistema puxando a tabela atualizada do banco
carregarSolicitacoes();
