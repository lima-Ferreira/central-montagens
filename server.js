const express = require("express");
const path = require("path");

// 1. CARREGA O .ENV IMEDIATAMENTE NO INÍCIO DE TUDO
require("dotenv").config();

// Importa os pacotes necessários para o Supabase e WebSocket
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// 2. CONFIGURAÇÃO SEGURA DO CLIENTE SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ ERRO: Verifique se as chaves SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas no arquivo .env",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

// ==========================================
// 📍 ROTAS DE NAVEGAÇÃO
// ==========================================

// Rota inicial (Página de Login)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

// ==========================================
// 👷 ROTAS DA API: MONTADORES
// ==========================================

// Buscar todos os montadores
app.get("/api/montadores", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("montadores")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cadastrar novo montador
app.post("/api/montadores", async (req, res) => {
  try {
    const { nome, telefone, cidade, status } = req.body;
    const { data, error } = await supabase
      .from("montadores")
      .insert([{ nome, telefone, cidade, status }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 🚚 ROTAS DA API: SOLICITAÇÕES
// ==========================================

// Buscar todas as solicitações
// Procure por esta rota no seu server.js e mude o res.status(500) para enviar o erro real:
app.get("/api/solicitacoes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("solicitacoes") // <-- Verifique se no seu Supabase a tabela se chama exatamente 'solicitacoes'
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    // ATUALIZADO: Vai mandar a mensagem real do Supabase para o console do VS Code e do navegador
    console.error("❌ ERRO NO SUPABASE:", error);
    res.status(500).json({ error: error.message || error });
  }
});

// Buscar uma solicitação específica pelo ID
app.get("/api/solicitacoes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar uma solicitação do banco de dados
app.delete("/api/solicitacoes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    res.json({ success: true, message: "Solicitação deletada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 📊 API: DADOS DO DASHBOARD (VERSÃO CORRIGIDA)
// ==========================================
// ==========================================
// 📊 API: DADOS DO DASHBOARD COM PRÓXIMOS COMPROMISSOS
// ==========================================
app.get("/api/dashboard", async (req, res) => {
  try {
    // 1. Busca solicitações
    const { data: solics, error: errS } = await supabase
      .from("solicitacoes")
      .select("status, prioridade");
    if (errS) throw errS;

    // 2. Busca montadores livres
    const { data: monts, error: errM } = await supabase
      .from("montadores")
      .select("status")
      .eq("status", "Disponível");
    if (errM) throw errM;

    let pendentes = 0;
    let urgentes = 0;
    solics.forEach((item) => {
      if (item.status === "Pendente") pendentes++;
      if (item.prioridade === "Urgente") urgentes++;
    });

    const hojeStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

    // 3. Busca todos os agendamentos do banco
    const { data: todosAgendamentos, error: errA } = await supabase.from(
      "agenda",
    ).select(`
        id,
        solicitacoes ( id, loja, cidade, data_montagem, status ),
        montadores ( id, nome )
      `);
    if (errA) throw errA;

    // Agrupamento inteligente para hoje e futuro
    const agrupadoHoje = {};
    const agrupadoFuturo = {};

    todosAgendamentos.forEach((item) => {
      if (!item.solicitacoes || !item.montadores) return;

      const s = item.solicitacoes;
      const m = item.montadores;

      if (s.data_montagem === hojeStr) {
        // Se for hoje
        if (!agrupadoHoje[s.id]) {
          agrupadoHoje[s.id] = {
            cidade: s.cidade,
            loja: s.loja,
            status: s.status,
            data: s.data_montagem,
            montadores: [],
          };
        }
        agrupadoHoje[s.id].montadores.push(m.nome);
      } else if (s.data_montagem > hojeStr) {
        // Se for uma data futura
        if (!agrupadoFuturo[s.id]) {
          agrupadoFuturo[s.id] = {
            cidade: s.cidade,
            loja: s.loja,
            status: s.status,
            data: s.data_montagem,
            montadores: [],
          };
        }
        agrupadoFuturo[s.id].montadores.push(m.nome);
      }
    });

    // Ordena os agendamentos futuros por data mais próxima
    const futuroOrdenado = Object.values(agrupadoFuturo).sort((a, b) =>
      a.data.localeCompare(b.data),
    );

    res.json({
      cards: {
        pendentes,
        hoje: Object.keys(agrupadoHoje).length,
        urgentes,
        montadoresLivres: monts.length,
      },
      tabelaHoje: Object.values(agrupadoHoje),
      tabelaFuturo: futuroOrdenado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Cadastrar nova solicitação de loja
app.post("/api/solicitacoes", async (req, res) => {
  try {
    const { loja, cidade, quantidade, data_montagem, prioridade, observacao } =
      req.body;
    const { data, error } = await supabase
      .from("solicitacoes")
      .insert([
        {
          loja,
          cidade,
          quantidade,
          data_montagem,
          prioridade,
          observacao,
          status: "Pendente",
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ✅ API: CONCLUIR MONTAGEM E LIBERAR EQUIPE
// ==========================================
app.post("/api/agenda/concluir/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const solicitacaoId = parseInt(id);

    // 1. Busca quais montadores estavam escalados nessa solicitação antes de finalizar
    const { data: escalados, error: errBusca } = await supabase
      .from("agenda")
      .select("montador_id")
      .eq("solicitacao_id", solicitacaoId);

    if (errBusca) throw errBusca;

    // 2. Atualiza o status da solicitação pai para 'Concluída'
    const { error: errStatus } = await supabase
      .from("solicitacoes")
      .update({ status: "Concluída" })
      .eq("id", solicitacaoId);

    if (errStatus) throw errStatus;

    // 3. Se houver montadores vinculados, volta o status de todos para 'Disponível'
    if (escalados && escalados.length > 0) {
      const idsMontadores = escalados.map((item) => item.montador_id);

      const { error: errMontadores } = await supabase
        .from("montadores")
        .update({ status: "Disponível" })
        .in("id", idsMontadores);

      if (errMontadores) throw errMontadores;
    }

    res.json({
      success: true,
      message: "Montagem concluída e equipe liberada!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar o status operacional de um montador específico
app.put("/api/montadores/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("montadores")
      .update({ status: status })
      .eq("id", parseInt(id))
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 📅 ROTAS DA API: AGENDA / ESCALAÇÕES
// ==========================================

// Buscar os agendamentos consolidados
app.get("/api/agenda", async (req, res) => {
  try {
    const { data, error } = await supabase.from("agenda").select(`
        id,
        solicitacoes ( id, loja, cidade, data_montagem, status ),
        montadores ( id, nome )
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salvar escala de equipe e confirmar agendamento
// Salvar escala de equipe e confirmar agendamento (CORRIGIDO)
app.post("/api/agenda/confirmar", async (req, res) => {
  try {
    const { solicitacao_id, montadores_ids } = req.body;

    // 1. Vincula cada montador selecionado à solicitação na tabela 'agenda'
    const escalacoes = montadores_ids.map((mId) => ({
      solicitacao_id: parseInt(solicitacao_id),
      montador_id: parseInt(mId),
    }));

    const { error: erroAgenda } = await supabase
      .from("agenda")
      .insert(escalacoes);

    if (erroAgenda) throw erroAgenda;

    // CORREÇÃO AQUI: Atualiza o status da solicitação comparando 'id' com 'solicitacao_id'
    const { error: erroStatus } = await supabase
      .from("solicitacoes")
      .update({ status: "Agendada" })
      .eq("id", parseInt(solicitacao_id)); // Mudado de 'solicitacao_id' para 'id'

    if (erroStatus) throw erroStatus;

    res.json({ success: true, message: "Agendamento confirmado com sucesso!" });
  } catch (error) {
    console.error("❌ ERRO AO CONFIRMAR AGENDA:", error);
    res.status(500).json({ error: error.message || error });
  }
});

// ==========================================
// 🔄 API ADICIONAL: EDITAR / CANCELAR AGENDAMENTO
// ==========================================

// Rota para buscar apenas os IDs dos montadores já escalados em uma solicitação
app.get("/api/agenda/solicitacao/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("agenda")
      .select("montador_id")
      .eq("solicitacao_id", parseInt(id));

    if (error) throw error;

    // Retorna apenas um array limpo de IDs de montadores [1, 3, 5]
    const ids = data.map((item) => item.montador_id);
    res.json(ids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para cancelar/limpar o agendamento completo de uma solicitação
app.delete("/api/agenda/cancelar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const solicitacaoId = parseInt(id);

    // 1. Deleta todas as escalações daquela solicitação na tabela agenda
    const { error: erroDelete } = await supabase
      .from("agenda")
      .delete()
      .eq("solicitacao_id", solicitacaoId);

    if (erroDelete) throw erroDelete;

    // 2. Volta o status da solicitação pai para 'Pendente'
    const { error: erroStatus } = await supabase
      .from("solicitacoes")
      .update({ status: "Pendente" })
      .eq("id", solicitacaoId);

    if (erroStatus) throw erroStatus;

    res.json({
      success: true,
      message: "Agendamento cancelado e redefinido para pendente!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR (MANTÉM O PROCESSO ATIVO)
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado com sucesso na porta ${PORT}!`);
});
