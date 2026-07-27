// 1. CAPTURA DE FILTROS DA URL DE FORMA BLINDADA
const urlParams = new URLSearchParams(window.location.search);
const equipeFiltrada = urlParams.get("equipe"); // Pega o nome do montador do link do WhatsApp

// SE O LINK VIER DO WHATSAPP, LOGA O MONTADOR AUTOMATICAMENTE
if (equipeFiltrada && equipeFiltrada.trim() !== "") {
  localStorage.setItem("usuarioLogado", "true");
  localStorage.setItem("nomeUsuario", equipeFiltrada.replace(/_/g, " "));
  localStorage.setItem("nivelAcesso", "montador");
}

// TRAVA DE SEGURANÇA PADRÃO: Só barra se não estiver logado de nenhuma forma
if (localStorage.getItem("usuarioLogado") !== "true") {
  setTimeout(() => {
    if (localStorage.getItem("usuarioLogado") !== "true") {
      alert("⚠️ Acesso negado! Por favor, faça login primeiro.");
      window.location.href = "/";
    }
  }, 100);
}

// EXECUTA ASSIM QUE O HTML DA AGENDA ESTIVER PRONTO NA TELA
document.addEventListener("DOMContentLoaded", () => {
  const nivelAcessoAtual = localStorage.getItem("nivelAcesso");

  // SE FOR ACESSO DE MONTADOR, METE O BLOQUEIO GERAL DE NAVEGAÇÃO
  if (nivelAcessoAtual === "montador") {
    // 1. Esconde a sidebar (Menu Lateral) completamente
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.style.setProperty("display", "none", "important");

    // 2. Oculta os botões de abas e filtros de data (Evita que o montador mexa na busca)
    const secaoFiltrosTop = document.querySelector(".topbar div");
    if (secaoFiltrosTop) secaoFiltrosTop.style.display = "none";

    const secaoAbas = document.querySelector(".abas-agenda");
    if (secaoAbas) secaoAbas.style.display = "none";

    // 3. Estica o conteúdo dos cards para ocupar a tela inteira do celular de forma limpa
    const content = document.querySelector(".content");
    if (content) {
      content.style.marginLeft = "0";
      content.style.width = "100%";
      content.style.padding = "15px";
    }
  }
});

let agenda = [];
let abaAtual = "pendentes";

async function carregarAgendaDoBanco() {
  try {
    const resposta = await fetch("/api/agenda");
    if (!resposta.ok)
      throw new Error("Erro ao buscar os agendamentos da agenda.");

    const dadosBrutos = await resposta.json();
    const agendamentosAgrupados = {};
    const nomeFiltroNorm = equipeFiltrada
      ? equipeFiltrada.replace(/_/g, " ").trim().toLowerCase()
      : null;

    dadosBrutos.forEach((item) => {
      if (!item.solicitacoes || !item.montadores) return;

      const solicitacao = item.solicitacoes;
      const montador = item.montadores;

      // Proteção contra valores nulos nas propriedades do banco de dados
      const txtSolicitante = (solicitacao.solicitante || "").toLowerCase();
      const txtMontador = (montador.nome || "").toLowerCase();

      // FILTRAGEM ULTRA BLINDADA: Se for o link "geral", não barra nada e exibe tudo!
      if (nomeFiltroNorm && nomeFiltroNorm !== "geral") {
        const pertenceAEquipe =
          txtSolicitante.includes(nomeFiltroNorm) ||
          txtMontador.includes(nomeFiltroNorm);
        if (!pertenceAEquipe) return; // Pula essa linha se for de outro montador
      }

      if (!agendamentosAgrupados[solicitacao.id]) {
        agendamentosAgrupados[solicitacao.id] = {
          data: solicitacao.data_montagem,
          loja: solicitacao.loja,
          cidade: solicitacao.cidade,
          status: solicitacao.status,
          numero_pedido: solicitacao.id,
          solicitante: solicitacao.solicitante || "Não informado",
          tipo_montagem: solicitacao.tipo_montagem || "Cliente",
          observacao: solicitacao.observacao || "Sem observações.",
          montadores: [],
        };
      }
      agendamentosAgrupados[solicitacao.id].montadores.push(
        montador.nome || "Montador",
      );
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

  const listaTrabalhada = dadosFiltrados || agenda;

  // ORDENAÇÃO AUTOMÁTICA DA DATA: Organiza da data mais próxima para a mais distante
  listaTrabalhada.sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;
    return a.data.localeCompare(b.data); // Compara strings no formato YYYY-MM-DD
  });

  // Remove acentos e espaços para comparar de forma segura (concluída vs concluida)
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

// NOVO DESIGN DO CARD COMPLETO (CORRIGIDO DEFINITIVO)
function gerarHtmlCard(item) {
  let equipeHtml = "";
  if (item.montadores && item.montadores.length > 0) {
    item.montadores.forEach((nome) => {
      equipeHtml += `<div class="montador" style="background:#f1f5f9; padding:6px 12px; border-radius:6px; font-size:13px; font-weight:500; color:#334155; margin-bottom:4px; border:1px solid #e2e8f0;">👷 ${nome}</div>`;
    });
  }

  let dataFormatada = "---";
  if (item.data && item.data.includes("-")) {
    const partes = item.data.split("-");
    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`; // CORREÇÃO DA DATA FIXADA AQUI
  } else if (item.data) {
    dataFormatada = item.data;
  }

  const statusBase = item.status || "Agendada";
  const classeStatus = statusBase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Badge inteligente atualizada com suporte a cores para folgas/afastamentos e clientes
  let badgeTipoCard = "";
  if (item.tipo_montagem === "Mostruário") {
    badgeTipoCard = `<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">🛠️ Mostruário Loja</span>`;
  } else if (item.tipo_montagem === "Ausência") {
    badgeTipoCard = `<span style="background:#fee2e2; color:#991b1b; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">⚠️ Folga / Ausência</span>`;
  } else {
    badgeTipoCard = `<span style="background:#f0fdf4; color:#166534; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">👤 Cliente Final</span>`;
  }

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
