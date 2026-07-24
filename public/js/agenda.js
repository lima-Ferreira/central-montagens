// O array de agendamentos começa vazio e buscará os dados reais do Supabase
let agenda = [];

async function carregarAgendaDoBanco() {
  try {
    const resposta = await fetch("/api/agenda");

    if (!resposta.ok) {
      throw new Error("Erro ao buscar os agendamentos da agenda.");
    }

    // Recebe os dados brutos de junção das tabelas do servidor
    const dadosBrutos = await resposta.json();

    // Organiza os dados para agrupar montadores que pertencem à mesma solicitação de loja
    const agendamentosAgrupados = {};

    dadosBrutos.forEach((item) => {
      // Garante que o item possui os vínculos de solicitações e montadores antes de processar
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

    // Transforma o objeto agrupado de volta em um array limpo
    agenda = Object.values(agendamentosAgrupados);

    // Renderiza na tela
    renderizarCardsAgenda(agenda);
  } catch (erro) {
    console.error("Erro na agenda:", erro);
    alert("Não foi possível carregar os agendamentos reais.");
  }
}

function renderizarCardsAgenda(lista) {
  let area = document.getElementById("agendaLista");
  area.innerHTML = "";

  if (lista.length === 0) {
    area.innerHTML = `<p class="info" style="grid-column: 1/-1; text-align: center; color: #7f8c8d; margin-top: 20px;">Nenhum agendamento confirmado para o período.</p>`;
    return;
  }

  lista.forEach((item) => {
    let equipeHtml = "";

    item.montadores.forEach((nome) => {
      // CORREÇÃO: Removeu a palavra fixa "Worker" e manteve apenas o emoji estruturado
      equipeHtml += `
        <div class="montador">
          👷 ${nome}
        </div>
      `;
    });

    let dataFormatada = "---";
    if (item.data) {
      const partes = item.data.split("-");
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    let classeStatus = item.status ? item.status.toLowerCase() : "agendada";

    area.innerHTML += `
      <div class="agenda-card">
        <h3>${item.loja}</h3>
        <div class="cidade">📍 ${item.cidade}</div>
        <div class="data-info">📅 <strong>Data:</strong> ${dataFormatada}</div>
        
        <div class="equipe">
          <strong>Equipe Escalada</strong>
          ${equipeHtml}
        </div>
        
        <span class="status-agendado ${classeStatus}">
          ${item.status || "Agendada"}
        </span>
      </div>
    `;
  });
}

function filtrarAgenda() {
  let dataFiltro = document.getElementById("filtroData").value; // Retorna YYYY-MM-DD

  if (!dataFiltro) {
    renderizarCardsAgenda(agenda);
    return;
  }

  // Filtra comparando as strings de data no formato YYYY-MM-DD
  let resultado = agenda.filter((item) => item.data === dataFiltro);
  renderizarCardsAgenda(resultado);
}

// Inicializa a tela buscando os agendamentos reais do Supabase
carregarAgendaDoBanco();
