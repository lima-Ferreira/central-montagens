// O array de agendamentos começa vazio e buscará os dados reais do Supabase
let agenda = [];
let abaAtual = "pendentes"; // Controla qual aba está ativa por padrão

async function carregarAgendaDoBanco() {
  try {
    const resposta = await fetch("/api/agenda");
    if (!resposta.ok)
      throw new Error("Erro ao buscar os agendamentos da agenda.");

    const dadosBrutos = await resposta.json();
    const agendamentosAgrupados = {};

    dadosBrutos.forEach((item) => {
      if (!item.solicitacoes || !item.montadores) return;

      const solicitacao = item.solicitacoes;
      const montador = item.montadores;

      if (!agendamentosAgrupados[solicitacao.id]) {
        agendamentosAgrupados[solicitacao.id] = {
          data: solicitacao.data_montagem,
          loja: solicitacao.loja,
          cidade: solicitacao.cidade,
          status: solicitacao.status,
          montadores: [],
        };
      }
      agendamentosAgrupados[solicitacao.id].montadores.push(montador.nome);
    });

    agenda = Object.values(agendamentosAgrupados);

    // Renderiza os dois painéis separadamente
    renderizarCardsAgenda();
  } catch (erro) {
    console.error("Erro na agenda:", erro);
    alert("Não foi possível carregar os agendamentos reais.");
  }
}

// Função para alternar a exibição entre Pendentes e Concluídas
window.alternarAbas = function (aba) {
  abaAtual = aba;
  const btnPendentes = document.getElementById("abaPendentes");
  const btnConcluidas = document.getElementById("abaConcluidas");
  const listaPendentes = document.getElementById("agendaLista");
  const listaConcluidas = document.getElementById("agendaConcluidasLista");

  if (aba === "pendentes") {
    btnPendentes.style.backgroundColor = "#007bff";
    btnPendentes.style.color = "white";
    btnConcluidas.style.backgroundColor = "#e2e8f0";
    btnConcluidas.style.color = "#4a5568";
    listaPendentes.style.display = "grid";
    listaConcluidas.style.display = "none";
  } else {
    btnConcluidas.style.backgroundColor = "#166534"; // Verde escuro para o histórico
    btnConcluidas.style.color = "white";
    btnPendentes.style.backgroundColor = "#e2e8f0";
    btnPendentes.style.color = "#4a5568";
    listaPendentes.style.display = "none";
    listaConcluidas.style.display = "grid";
  }
  renderizarCardsAgenda();
};

function renderizarCardsAgenda(dadosFiltrados = null) {
  let areaPendentes = document.getElementById("agendaLista");
  let areaConcluidas = document.getElementById("agendaConcluidasLista");

  areaPendentes.innerHTML = "";
  areaConcluidas.innerHTML = "";

  const listaTrabalhada = dadosFiltrados || agenda;

  // CORREÇÃO: Remove acentos e espaços para comparar de forma segura (concluída vs concluida)
  const agendadas = listaTrabalhada.filter((item) => {
    const statusLimpo = (item.status || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return statusLimpo !== "conclui-da" && statusLimpo !== "concluida";
  });

  const concluidas = listaTrabalhada.filter((item) => {
    const statusLimpo = (item.status || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return statusLimpo === "conclui-da" || statusLimpo === "concluida";
  });

  // 1. RENDERIZA PENDENTES/AGENDADAS
  if (agendadas.length === 0) {
    areaPendentes.innerHTML = `<p class="info" style="grid-column: 1/-1; text-align: center; color: #7f8c8d; margin-top: 20px;">Nenhum agendamento ativo pendente.</p>`;
  } else {
    agendadas.forEach(
      (item) => (areaPendentes.innerHTML += gerarHtmlCard(item)),
    );
  }

  // 2. RENDERIZA CONCLUÍDAS
  if (concluidas.length === 0) {
    areaConcluidas.innerHTML = `<p class="info" style="grid-column: 1/-1; text-align: center; color: #7f8c8d; margin-top: 20px;">Nenhum histórico de montagem concluída encontrado.</p>`;
  } else {
    concluidas.forEach(
      (item) => (areaConcluidas.innerHTML += gerarHtmlCard(item)),
    );
  }
}

// CORREÇÃO DA DATA: Corrigido o bug que transformava a data em undefined
function gerarHtmlCard(item) {
  let equipeHtml = "";
  item.montadores.forEach((nome) => {
    equipeHtml += `<div class="montador">👷 ${nome}</div>`;
  });

  let dataFormatada = "---";
  if (item.data && item.data.includes("-")) {
    const partes = item.data.split("-");
    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
  } else if (item.data) {
    dataFormatada = item.data;
  }

  // Define a classe de estilo limpa para o CSS
  const statusBase = item.status || "Agendada";
  const classeStatus = statusBase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return `
    <div class="agenda-card">
      <h3>${item.loja}</h3>
      <div class="cidade">📍 ${item.cidade}</div>
      <div class="data-info">📅 <strong>Data:</strong> ${dataFormatada}</div>
      
      <div class="equipe">
        <strong>Equipe Escalada</strong>
        ${equipeHtml}
      </div>
      
      <span class="status-agendado ${classeStatus}">
        ${statusBase}
      </span>
    </div>
  `;
}

window.filtrarAgenda = function () {
  let dataFiltro = document.getElementById("filtroData").value;
  if (!dataFiltro) {
    renderizarCardsAgenda();
    return;
  }
  let resultado = agenda.filter((item) => item.data === dataFiltro);
  renderizarCardsAgenda(resultado);
};

// Inicializa a tela buscando os agendamentos reais do Supabase
carregarAgendaDoBanco();
