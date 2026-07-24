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

      tabela.innerHTML += `
        <tr>
          <td>${item.id}</td>
          <td>${item.loja}</td>
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
              <!-- NOVO BOTÃO: Deletar solicitação -->
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

function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// SALVAR NOVA SOLICITAÇÃO NO BANCO DE DADOS
async function salvarSolicitacao() {
  const loja = document.getElementById("loja").value;
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

  const novaSolicitacao = {
    loja: loja,
    cidade: cidade,
    quantidade: parseInt(quantidade),
    data_montagem: data_montagem,
    prioridade: prioridade,
    observacao: observacao,
  };

  try {
    const resposta = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novaSolicitacao),
    });

    if (!resposta.ok) {
      throw new Error("Falha ao registrar nova solicitação no banco");
    }

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
async function deletarSolicitacao(id) {
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
    await carregarSolicitacoes(); // Atualiza a tabela na hora
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir a solicitação.");
  }
}

function abrirSolicitacao(id) {
  window.location.href = "/pages/detalhe-solicitacao.html?id=" + id;
}

carregarSolicitacoes();
