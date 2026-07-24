let solicitacaoAtual = null;
let montadoresBancados = [];
let equipeSelecionadaIds = [];

async function inicializarTela() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const idSolicitacao = urlParams.get("id");

    if (!idSolicitacao) {
      alert("ID da solicitação não encontrado.");
      window.location.href = "/pages/solicitacoes.html";
      return;
    }

    // 1. Busca a solicitação específica
    const resSolicitacao = await fetch(`/api/solicitacoes/${idSolicitacao}`);
    if (!resSolicitacao.ok)
      throw new Error("Erro ao buscar detalhes da solicitação.");
    solicitacaoAtual = await resSolicitacao.json();

    // 2. Busca todos os montadores (Com bloco de proteção individual)
    try {
      const resMontadores = await fetch("/api/montadores");
      if (resMontadores.ok) {
        montadoresBancados = await resMontadores.json();
      }
    } catch (errM) {
      console.warn(
        "Aviso: Não foi possível carregar a lista de montadores.",
        errM,
      );
    }

    // 3. Se a solicitação já estiver 'Agendada', busca quais montadores já fazem parte dela
    if (solicitacaoAtual && solicitacaoAtual.status === "Agendada") {
      try {
        const resEscalados = await fetch(
          `/api/agenda/solicitacao/${idSolicitacao}`,
        );
        if (resEscalados.ok) {
          equipeSelecionadaIds = await resEscalados.json();
        }
      } catch (errE) {
        console.warn(
          "Aviso: Não foi possível buscar os montadores escalados.",
          errE,
        );
      }
    }

    // Renderiza as seções na tela de forma segura
    renderizarDadosSolicitacao();
    renderizarListaMontadores();
  } catch (error) {
    console.error(error);
    alert("Erro crítico ao carregar os dados da solicitação.");
    window.location.href = "/pages/solicitacoes.html";
  }
}

function renderizarDadosSolicitacao() {
  if (!solicitacaoAtual) return;

  let dataFormatada = "---";
  if (solicitacaoAtual.data_montagem) {
    const partes = solicitacaoAtual.data_montagem.split("-");
    if (partes.length === 3) {
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  let botoesAcaoHtml = "";
  if (solicitacaoAtual.status === "Agendada") {
    botoesAcaoHtml = `
      <button class="confirmar" style="background-color: #2ecc71; margin-left: 10px;" onclick="concluirMontagemDeVez()">
        ✅ Concluir Montagem
      </button>
      <button class="cancelar" style="background-color: #e74c3c; margin-left: 5px;" onclick="cancelarAgendamentoCompleto()">
        ❌ Cancelar Agendamento
      </button>
    `;
  }

  document.getElementById("dadosSolicitacao").innerHTML = `
    <div class="dados">
      <div class="card-info"><strong>Loja:</strong> ${solicitacaoAtual.loja}</div>
      <div class="card-info"><strong>Cidade:</strong> ${solicitacaoAtual.cidade}</div>
      <div class="card-info"><strong>Data:</strong> ${dataFormatada}</div>
      <div class="card-info"><strong>Quantidade:</strong> ${solicitacaoAtual.quantidade} montadores</div>
      <div class="card-info">
        <strong>Status Atual:</strong> 
        <span class="status ${solicitacaoAtual.status.toLowerCase()}">${solicitacaoAtual.status}</span>
        ${botoesAcaoHtml}
      </div>
    </div>
  `;
}

function renderizarListaMontadores() {
  let lista = document.getElementById("listaMontadores");
  if (!lista) return;
  lista.innerHTML = "";

  if (!montadoresBancados || montadoresBancados.length === 0) {
    lista.innerHTML = `<p class="info" style="color: #7f8c8d; padding: 10px;">Nenhum montador cadastrado no sistema ou disponível no momento.</p>`;
    return;
  }

  montadoresBancados.forEach((m) => {
    const mesmaCidade =
      m.cidade &&
      solicitacaoAtual.cidade &&
      m.cidade.toLowerCase() === solicitacaoAtual.cidade.toLowerCase();
    const jaMarcado = equipeSelecionadaIds.includes(m.id);

    lista.innerHTML += `
      <div class="montador-item" style="${mesmaCidade ? "background: #e8f4fd; border-left: 4px solid #3498db;" : ""}">
        <input type="checkbox" onchange="alternarMontador(${m.id})" ${jaMarcado ? "checked" : ""}>
        <span>👷 ${m.nome} <small>(${m.cidade}) - ${m.status}</small></span>
      </div>
    `;
  });
}

function alternarMontador(id) {
  const index = equipeSelecionadaIds.indexOf(id);
  if (index > -1) {
    equipeSelecionadaIds.splice(index, 1);
  } else {
    equipeSelecionadaIds.push(id);
  }
}

async function confirmarAgenda() {
  if (equipeSelecionadaIds.length === 0) {
    alert("Selecione ao menos um montador para a equipe!");
    return;
  }

  const dadosEscala = {
    solicitacao_id: solicitacaoAtual.id,
    montadores_ids: equipeSelecionadaIds,
  };

  try {
    await fetch(`/api/agenda/cancelar/${solicitacaoAtual.id}`, {
      method: "DELETE",
    });

    const resposta = await fetch("/api/agenda/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosEscala),
    });

    if (!resposta.ok) throw new Error("Erro ao salvar.");

    alert("⚙️ Agendamento e equipe atualizados com sucesso!");
    window.location.href = "/pages/solicitacoes.html";
  } catch (error) {
    console.error(error);
    alert("Erro ao atualizar o agendamento.");
  }
}

async function cancelarAgendamentoCompleto() {
  if (
    !confirm(
      "Tem certeza que deseja cancelar este agendamento? Os montadores escalados serão liberados.",
    )
  ) {
    return;
  }

  try {
    const resposta = await fetch(
      `/api/agenda/cancelar/${solicitacaoAtual.id}`,
      {
        method: "DELETE",
      },
    );

    if (!resposta.ok) throw new Error("Erro ao cancelar.");

    alert("🚚 Agendamento removido. A solicitação voltou a ficar Pendente.");
    window.location.href = "/pages/solicitacoes.html";
  } catch (error) {
    console.error(error);
    alert("Não foi possível cancelar o agendamento.");
  }
}

async function concluirMontagemDeVez() {
  if (
    !confirm(
      "Confirmar a conclusão desta montagem? A equipe escalada ficará livre para novos serviços.",
    )
  ) {
    return;
  }

  try {
    const resposta = await fetch(
      `/api/agenda/concluir/${solicitacaoAtual.id}`,
      {
        method: "POST",
      },
    );

    if (!resposta.ok)
      throw new Error("Erro ao finalizar a montagem no servidor.");

    alert(
      "🎉 Serviço concluído com sucesso! Os montadores já estão disponíveis no sistema.",
    );
    window.location.href = "/pages/solicitacoes.html";
  } catch (error) {
    console.error(error);
    alert("Não foi possível concluir a montagem.");
  }
}

function salvarEquipe() {
  alert(
    "Alterações de equipe registradas temporariamente. Clique no botão de confirmação verde abaixo para salvar no banco de dados.",
  );
}

// Inicializa a execução
inicializarTela();
