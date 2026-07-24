// TRAVA DE SEGURANÇA: Se não estiver logado, chuta de volta para a tela inicial
if (localStorage.getItem("usuarioLogado") !== "true") {
  alert("⚠️ Acesso negado! Por favor, faça login primeiro.");
  window.location.href = "/"; // Volta para a raiz (login)
}

// Atualiza o nome do usuário no topo da barra lateral dinamicamente
const nomeSalvo = localStorage.getItem("nomeUsuario") || "Lima";
const elementoUsuario = document.querySelector(".usuario");
if (elementoUsuario) {
  elementoUsuario.innerHTML = `${nomeSalvo} ▼`;
}

async function carregarDashboard() {
  try {
    const resposta = await fetch("/api/dashboard");
    if (!resposta.ok) throw new Error("Falha ao carregar métricas.");

    const dados = await resposta.json();

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

    if (dados.tabelaHoje.length === 0) {
      tabelaHoje.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #7f8c8d; padding: 15px;">Nenhuma montagem agendada para a data de hoje.</td></tr>`;
    } else {
      dados.tabelaHoje.forEach((item) => {
        tabelaHoje.innerHTML += `
          <tr>
            <td>📍 ${item.cidade}</td>
            <td>👷 ${item.montadores.join(", ")}</td>
            <td>${item.loja}</td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
          </tr>
        `;
      });
    }

    // 3. Renderiza a nova tabela de Próximos Compromissos
    let tabelaFutura = document.getElementById("tabelaAgendaFutura");
    tabelaFutura.innerHTML = "";

    if (dados.tabelaFuturo.length === 0) {
      tabelaFutura.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #7f8c8d; padding: 15px;">Nenhum agendamento futuro encontrado no sistema.</td></tr>`;
    } else {
      dados.tabelaFuturo.forEach((item) => {
        // Formata a data de YYYY-MM-DD para DD/MM/YYYY
        const [ano, mes, dia] = item.data.split("-");
        const dataBr = `${dia}/${mes}/${ano}`;

        tabelaFutura.innerHTML += `
          <tr>
            <td><strong>📅 ${dataBr}</strong></td>
            <td>📍 ${item.cidade}</td>
            <td>👷 ${item.montadores.join(", ")}</td>
            <td>${item.loja}</td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
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

// Inicializa o painel quando a página abre
carregarDashboard();
