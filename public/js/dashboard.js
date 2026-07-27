// 1. CAPTURA DE FILTROS DA URL
const urlParams = new URLSearchParams(window.location.search);
const equipeFiltrada = urlParams.get("equipe"); // Pega o nome do montador do link do WhatsApp

// SE O LINK VIER DO WHATSAPP, LOGA O MONTADOR AUTOMATICAMENTE
if (equipeFiltrada) {
  localStorage.setItem("usuarioLogado", "true");
  localStorage.setItem("nomeUsuario", equipeFiltrada.replace(/_/g, " "));
  localStorage.setItem("nivelAcesso", "montador");
}

// TRAVA DE SEGURANÇA PADRÃO: Só barra se não estiver logado de nenhuma forma
if (localStorage.getItem("usuarioLogado") !== "true") {
  alert("⚠️ Acesso negado! Por favor, faça login primeiro.");
  window.location.href = "/";
}

// Ajusta o layout visual dependendo de quem está acessando
const nivelAcesso = localStorage.getItem("nivelAcesso");
if (nivelAcesso === "montador") {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.style.display = "none";

  const content = document.querySelector(".content");
  if (content) {
    content.style.marginLeft = "0";
    content.style.width = "100%";
    content.style.padding = "15px";
  }

  const secaoCards = document.querySelector(".cards");
  if (secaoCards) secaoCards.style.display = "none";
}

// ADICIONA O BOTÃO DE COMPARTILHAR GERAL (Apenas para o Administrador/Lima)
if (nivelAcesso !== "montador") {
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const btnGeral = document.createElement("button");
    btnGeral.innerHTML = "📢 Compartilhar Agenda Geral";
    btnGeral.style.cssText =
      "background:#007bff; color:white; padding:10px 15px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px; margin-top:10px;";
    btnGeral.onclick = function () {
      const textoMsg =
        "🛠️ *Central de Montagens - Agenda Completa*\nConfira o painel com todos os agendamentos atualizados aqui:\n" +
        window.location.origin +
        "/pages/dashboard.html";
      const urlFinal = new URL("https://wa.me");
      urlFinal.searchParams.set("text", textoMsg);
      window.open(urlFinal.toString(), "_blank");
    };
    topbar.appendChild(btnGeral);
  }
}

// FUNÇÃO DE DISPARO DO WHATSAPP INDIVIDUAL (Blindada contra erros de URL)
window.compartilharAgenda = function (nomesEquipe, tipoAgenda) {
  const linkCompartilhar =
    window.location.origin +
    "/pages/dashboard.html?equipe=" +
    encodeURIComponent(nomesEquipe.replace(/ /g, "_"));

  let textoMsg = "";
  if (tipoAgenda === "hoje") {
    textoMsg =
      "🛠️ *Central de Montagens*\nSua agenda de hoje está pronta! Confira aqui:\n" +
      linkCompartilhar;
  } else {
    textoMsg =
      "📅 *Próximas Montagens - Equipe " +
      nomesEquipe +
      "*\nConfira sua escala futura aqui:\n" +
      linkCompartilhar;
  }

  const urlFinal = new URL("https://wa.me");
  urlFinal.searchParams.set("text", textoMsg);
  window.open(urlFinal.toString(), "_blank");
};

async function carregarDashboard() {
  try {
    const resposta = await fetch("/api/dashboard");
    if (!resposta.ok) throw new Error("Falha ao carregar métricas.");

    const dados = await resposta.json();

    // Remove espaços extras e deixa em minúsculo para comparar sem erros
    const nomeFiltroNorm = equipeFiltrada
      ? equipeFiltrada.replace(/_/g, " ").trim().toLowerCase()
      : null;

    // 1. Atualiza os cards
    document.getElementById("cardPendentes").innerText = String(
      dados.cards.pendentes,
    ).padStart(2, "0");
    document.getElementById("cardHoje").innerText = String(
      dados.cards.hoje,
    ).padStart(2, "0");
    document.getElementById("cardUrgentes").innerText = String(
      dados.cards.urgentes,
    ).padStart(2, "0");
    document.getElementById("cardMontadores").innerText = String(
      dados.cards.montadoresLivres,
    ).padStart(2, "0");

    // 2. Renderiza a tabela de Hoje
    let tabelaHoje = document.getElementById("tabelaAgendaDia");
    tabelaHoje.innerHTML = "";

    // FILTRO CORRIGIDO: Verifica se o nome pesquisado está dentro do array de montadores
    const listaHojeFiltrada = dados.tabelaHoje.filter((item) => {
      if (!nomeFiltroNorm) return true;
      return item.montadores.some(
        (m) =>
          m.toLowerCase().trim().includes(nomeFiltroNorm) ||
          nomeFiltroNorm.includes(m.toLowerCase().trim()),
      );
    });

    if (listaHojeFiltrada.length === 0) {
      tabelaHoje.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #7f8c8d; padding: 15px;">Nenhuma montagem agendada.</td></tr>`;
    } else {
      const thAcao = nivelAcesso === "montador" ? "" : "<th>Ação</th>";
      document
        .querySelector("#tabelaAgendaDia")
        .closest("table")
        .querySelector("thead tr").innerHTML = `
        <th>Cidade</th><th>Equipe de Montadores</th><th>Loja</th><th>Status</th>${thAcao}
      `;

      listaHojeFiltrada.forEach((item) => {
        const nomesEquipe = item.montadores.join(", ");
        const colunaAcao =
          nivelAcesso === "montador"
            ? ""
            : `<td><button onclick="compartilharAgenda('${nomesEquipe}', 'hoje')" style="background:#25d366; color:white; padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">📲 Enviar</button></td>`;

        tabelaHoje.innerHTML += `
          <tr>
            <td>📍 ${item.cidade}</td>
            <td>👷 ${nomesEquipe}</td>
            <td>${item.loja}</td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
            ${colunaAcao}
          </tr>
        `;
      });
    }

    // 3. Renderiza a tabela de Próximos Compromissos
    let tabelaFutura = document.getElementById("tabelaAgendaFutura");
    tabelaFutura.innerHTML = "";

    // FILTRO CORRIGIDO: Verifica se o nome pesquisado está dentro do array de montadores
    const listaFuturaFiltrada = dados.tabelaFuturo.filter((item) => {
      if (!nomeFiltroNorm) return true;
      return item.montadores.some(
        (m) =>
          m.toLowerCase().trim().includes(nomeFiltroNorm) ||
          nomeFiltroNorm.includes(m.toLowerCase().trim()),
      );
    });

    if (listaFuturaFiltrada.length === 0) {
      tabelaFutura.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #7f8c8d; padding: 15px;">Nenhum agendamento futuro encontrado.</td></tr>`;
    } else {
      const thAcaoFutura = nivelAcesso === "montador" ? "" : "<th>Ação</th>";
      document
        .querySelector("#tabelaAgendaFutura")
        .closest("table")
        .querySelector("thead tr").innerHTML = `
        <th>Data</th><th>Cidade</th><th>Equipe de Montadores</th><th>Loja</th><th>Status</th>${thAcaoFutura}
      `;

      listaFuturaFiltrada.forEach((item) => {
        const [ano, mes, dia] = item.data.split("-");
        const dataBr = `${dia}/${mes}/${ano}`;
        const nomesEquipe = item.montadores.join(", ");

        const colunaAcao =
          nivelAcesso === "montador"
            ? ""
            : `<td><button onclick="compartilharAgenda('${nomesEquipe}', 'futuro')" style="background:#25d366; color:white; padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">📲 Enviar</button></td>`;

        tabelaFutura.innerHTML += `
          <tr>
            <td><strong>📅 ${dataBr}</strong></td>
            <td>📍 ${item.cidade}</td>
            <td>👷 ${nomesEquipe}</td>
            <td>${item.loja}</td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
            ${colunaAcao}
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error(error);
    const erroHtml = `<tr><td colspan="5" style="text-align: center; color: #e74c3c;">Erro de comunicação com o servidor.</td></tr>`;
    document.getElementById("tabelaAgendaDia").innerHTML = erroHtml;
    document.getElementById("tabelaAgendaFutura").innerHTML = erroHtml;
  }
}

carregarDashboard();
