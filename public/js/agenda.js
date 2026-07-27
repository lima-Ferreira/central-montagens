// O array de agendamentos começa vazio e buscará os dados reais do Supabase
let agenda = [];
let abaAtual = "pendentes"; // Controla qual aba está ativa por padrão

async function carregarAgendaDoBanco() {
  try {
    // 1. Busca os vínculos de montadores normais do backend
    const respostaAgenda = await fetch("/api/agenda");
    // 2. Busca a tabela de solicitações direto para cruzar os dados novos
    const respostaSolicitacoes = await fetch("/api/solicitacoes");

    if (!respostaAgenda.ok || !respostaSolicitacoes.ok)
      throw new Error("Erro ao buscar os agendamentos da agenda.");

    const dadosBrutos = await respostaAgenda.json();
    const listaOriginalSolicitacoes = await respostaSolicitacoes.json();

    const agendamentosAgrupados = {};

    dadosBrutos.forEach((item) => {
      if (!item.solicitacoes || !item.montadores) return;

      const solicitacao = item.solicitacoes;
      const montador = item.montadores;

      // Cruza o ID para achar o registro completo com os campos novos salvos
      const dadosCompletosDb =
        listaOriginalSolicitacoes.find((s) => s.id === solicitacao.id) || {};

      if (!agendamentosAgrupados[solicitacao.id]) {
        agendamentosAgrupados[solicitacao.id] = {
          data: solicitacao.data_montagem,
          loja: solicitacao.loja,
          cidade: solicitacao.cidade,
          status: solicitacao.status,
          numero_pedido: solicitacao.id,
          // Captura os dados cruzados diretamente da tabela principal de solicitações
          solicitante:
            dadosCompletosDb.solicitante ||
            solicitacao.solicitante ||
            "Não informado",
          tipo_montagem:
            dadosCompletosDb.tipo_montagem ||
            solicitacao.tipo_montagem ||
            "Cliente",
          observacao:
            solicitacao.observacao ||
            solicitacao.observacoes ||
            "Sem observações.",
          montadores: [],
        };
      }
      agendamentosAgrupados[solicitacao.id].montadores.push(montador.nome);
    });

    agenda = Object.values(agendamentosAgrupados);
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

  // 1. Pega os dados originais ou filtrados
  let listaTrabalhada = dadosFiltrados || agenda;

  // 2. ORDENAÇÃO AUTOMÁTICA DA DATA: Organiza da data mais próxima para a mais distante
  listaTrabalhada.sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;
    return a.data.localeCompare(b.data); // Compara strings no formato YYYY-MM-DD
  });

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

// NOVO DESIGN DO CARD: Detalhado, organizado e focado na rota do montador
// ATUALIZAÇÃO DA AGENDA: Visual limpo usando os novos dados estratégicos
function gerarHtmlCard(item) {
  let equipeHtml = "";
  item.montadores.forEach((nome) => {
    equipeHtml += `<div class="montador" style="background:#f1f5f9; padding:6px 12px; border-radius:6px; font-size:13px; font-weight:500; color:#334155; margin-bottom:4px; border:1px solid #e2e8f0;">👷 ${nome}</div>`;
  });

  let dataFormatada = "---";
  if (item.data && item.data.includes("-")) {
    const partes = item.data.split("-");
    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
  } else if (item.data) {
    dataFormatada = item.data;
  }

  const statusBase = item.status || "Agendada";
  const classeStatus = statusBase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Badge inteligente para destacar se a equipe vai atender um cliente ou arrumar o mostruário da loja
  const badgeTipoCard =
    item.tipo_montagem === "Mostruário"
      ? `<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">🛠️ Mostruário Loja</span>`
      : `<span style="background:#f0fdf4; color:#166534; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">👤 Cliente Final</span>`;

  return `
    <div class="agenda-card" style="display:flex; flex-direction:column; justify-content:space-between; background:white; padding:20px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="margin:0; font-size:16px; font-weight:700; color:#1e293b;">${item.loja}</h3>
          <span class="status-agendado ${classeStatus}" style="font-size:11px; font-weight:bold; padding:4px 10px; border-radius:20px;">
            ${statusBase}
          </span>
        </div>
        
        <div class="cidade" style="font-size:13px; color:#64748b; margin-bottom:12px; font-weight:500;">📍 ${item.cidade}</div>
        
        <!-- Caixa Informativa Baseada na Ideia do Usuário -->
        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:12px; border-left:4px solid #007bff; font-size:13px;">
          <div style="margin-bottom:6px; color:#1e293b;">📋 <strong>Tipo:</strong> ${badgeTipoCard}</div>
          <div style="color:#475569;">👤 <strong>A pedido de:</strong> ${item.solicitante || "Não informado"}</div>
        </div>

        <div style="font-size:13px; margin-bottom:15px; color:#334155; line-height:1.4;">
          💬 <strong>Observação:</strong> <span style="font-style:italic; color:#64748b;">"${item.observacao || "Sem observações."}"</span>
        </div>
        
        <div class="data-info" style="font-size:13px; margin-bottom:15px; color:#1e293b;">
          📅 <strong>Data da Escala:</strong> <span style="font-weight:700; color:#007bff;">${dataFormatada}</span>
        </div>
        
        <div class="equipe" style="border-top:1px dashed #e2e8f0; padding-top:12px;">
          <strong style="font-size:13px; color:#475569; display:block; margin-bottom:8px;">Equipe Escalada</strong>
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${equipeHtml}
          </div>
        </div>
      </div>
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
