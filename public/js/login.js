// Função para interceptar o formulário e validar o acesso
document
  .getElementById("loginForm")
  ?.addEventListener("submit", function (event) {
    event.preventDefault(); // Impede a página de recarregar

    // Captura os dados digitados nos inputs do HTML
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    // REGRA DE ACESSO DEFINIDA: Altere aqui o usuário e senha da sua central
    const usuarioValido = "lima";
    const senhaValida = "montagem2026";

    // Adiciona uma validação extra para o seu colega do outro setor entrar também
    const usuarioSetor2 = "central";
    const senhaSetor2 = "montagem2026";

    if (
      (usuario === usuarioValido && senha === senhaValida) ||
      (usuario === usuarioSetor2 && senha === senhaSetor2)
    ) {
      // Guarda na memória do navegador que o usuário está logado
      localStorage.setItem("usuarioLogado", "true");
      localStorage.setItem(
        "nomeUsuario",
        usuario === "lima" ? "Lima" : "Central",
      );

      alert("🔓 Acesso autorizado com sucesso! Bem-vindo.");

      // Redireciona o usuário direto para o Dashboard principal
      window.location.href = "/pages/dashboard.html";
    } else {
      alert("❌ Usuário ou senha incorretos. Tente novamente.");
    }
  });
