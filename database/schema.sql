-- 1. TABELA DE MONTADORES
CREATE TABLE montadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    cidade VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Disponível',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE SOLICITAÇÕES DE LOJAS
CREATE TABLE solicitacoes (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    data_montagem DATE NOT NULL,
    prioridade VARCHAR(50) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'Pendente',
    observacao TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE AGENDA (Vínculo de quais montadores vão para qual solicitação)
CREATE TABLE agenda (
    id SERIAL PRIMARY KEY,
    solicitacao_id INT REFERENCES solicitacoes (id) ON DELETE CASCADE,
    montador_id INT REFERENCES montadores (id) ON DELETE CASCADE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        -- Evita escalar o mesmo montador duas vezes para a mesma solicitação
        CONSTRAINT unica_escalacao UNIQUE (solicitacao_id, montador_id)
);