// Banco de dados local simulado (temporário até ligarmos o Supabase)
let montadores = [
  {
    nome: "Carlos Vitor",
    telefone: "",
    cidade: "Russas",
    status: "Disponível",
  },
  { nome: "Keven", telefone: "", cidade: "Russas", status: "Disponível" },
  { nome: "Abmael", telefone: "", cidade: "Limoeiro", status: "Agendado" },
  {
    nome: "Marcus Victor",
    telefone: "",
    cidade: "Limoeiro",
    status: "Agendado",
  },
  { nome: "João Vitor", telefone: "", cidade: "Russas", status: "Disponível" },
  { nome: "Denilson", telefone: "", cidade: "Russas", status: "Disponível" },
  {
    nome: "Jaylanno",
    telefone: "88-994438085",
    cidade: "Russas",
    status: "Disponível",
  },
  {
    nome: "Edneudo",
    telefone: "88-993318690",
    cidade: "Russas",
    status: "Disponível",
  },
];

let montadorAtual = null;

function carregarPerfil() {
  // 1. Pega o nome que passamos na URL pelo botão "Abrir"
  const urlParams = new URLSearchParams(window.location.search);
  const nomeUrl = decodeURIComponent(urlParams.get("nome"));

  // 2. Procura o montador correspondente na nossa lista
  montadorAtual = montadores.find((m) => m.nome === nomeUrl);

  // Se o montador não existir na lista, exibe erro e volta
  if (!montadorAtual) {
    alert("Montador não encontrado!");
    window.location.href = "/pages/montadores.html";
    return;
  }

  // 3. Renderiza dinamicamente as informações dele no HTML
  let classeStatus = montadorAtual.status.toLowerCase();

  document.getElementById("dadosMontador").innerHTML = `
        <div class="dados">
            <div class="card-info"><strong>Nome completo:</strong> ${montadorAtual.nome}</div>
            <div class="card-info"><strong>Telefone:</strong> ${montadorAtual.telefone || "Não informado"}</div>
            <div class="card-info"><strong>Cidade Base:</strong> ${montadorAtual.cidade}</div>
            <div class="card-info">
                <strong>Situação Atual:</strong> 
                <span class="status ${classeStatus}">${montadorAtual.status}</span>
            </div>
        </div>
    `;
}

function atualizarStatus(novoStatus) {
  if (!montadorAtual) return;

  // Altera o status temporariamente na memória
  montadorAtual.status = novoStatus;
  alert(`O status de ${montadorAtual.nome} foi alterado para: ${novoStatus}`);

  // Recarrega as informações na tela para atualizar a cor do badge
  carregarPerfil();
}

// Inicializa a página lendo os parâmetros da URL
carregarPerfil();
