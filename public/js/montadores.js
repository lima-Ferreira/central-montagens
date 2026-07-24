let montadores = [];

async function carregarMontadores() {
  try {
    const resposta = await fetch("/api/montadores");
    if (!resposta.ok) throw new Error("Erro ao buscar montadores");

    montadores = await resposta.json();

    let tabela = document.getElementById("listaMontadores");
    if (!tabela) return;

    tabela.innerHTML = "";

    if (montadores.length === 0) {
      tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #7f8c8d; padding: 15px;">Nenhum montador cadastrado.</td></tr>`;
      return;
    }

    montadores.forEach((m) => {
      let classe = m.status ? m.status.toLowerCase() : "disponível";

      tabela.innerHTML += `
        <tr>
          <td>${m.nome}</td>
          <td>${m.telefone || "---"}</td>
          <td>${m.cidade}</td>
          <td>
            <span class="status ${classe}">
              ${m.status || "Disponível"}
            </span>
          </td>
          <td>
            <!-- CORREÇÃO: Usa exatamente m.id (campo gerado pelo Supabase) -->
            <button class="acao" onclick="abrirMontador(${m.id})">
              Abrir
            </button>
          </td>
        </tr>
      `;
    });
  } catch (erro) {
    console.error("Erro:", erro);
  }
}

function abrirMontador(id) {
  if (!id) {
    alert("Erro: Montador sem ID válido.");
    return;
  }
  // Envia o ID numérico correto para a URL
  window.location.href = "/pages/detalhe-montador.html?id=" + id;
}

function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

async function salvarMontador() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const cidade = document.getElementById("cidade").value;
  const status = document.getElementById("status").value;

  if (!nome) {
    alert("Por favor, preencha o nome.");
    return;
  }

  const novoMontador = { nome, telefone, cidade, status };

  try {
    const resposta = await fetch("/api/montadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoMontador),
    });

    if (!resposta.ok) throw new Error("Falha ao registrar novo montador");

    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";

    await carregarMontadores();
    fecharModal();
    alert("Montador cadastrado com sucesso!");
  } catch (erro) {
    console.error(erro);
    alert("Erro ao salvar o montador.");
  }
}

carregarMontadores();
