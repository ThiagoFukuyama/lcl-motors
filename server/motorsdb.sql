-- Criação do banco de dados LCL Motores (versão completa e corrigida)

-- Produtos Produzidos
CREATE TABLE Produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    demanda_terceirizada_minima INTEGER DEFAULT 0,
    demanda_minima_total INTEGER DEFAULT 0
);

-- Modos de Produção
CREATE TABLE ModosProducao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
);

-- Recursos com capacidade
CREATE TABLE Recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    capacidade REAL NOT NULL
);

-- Custos e Lucros por produto/modo
CREATE TABLE Custos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER,
    modo_id INTEGER,
    custo_unitario REAL DEFAULT 0,
    lucro_unitario REAL DEFAULT 0, -- NOVO: lucro por unidade (usado se objetivo for maximizar)
    FOREIGN KEY (produto_id) REFERENCES Produtos(id),
    FOREIGN KEY (modo_id) REFERENCES ModosProducao(id)
);

-- Consumo de recursos por produto/modo
CREATE TABLE ConsumoRecursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER,
    modo_id INTEGER,
    recurso_id INTEGER,
    consumo_unitario REAL NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES Produtos(id),
    FOREIGN KEY (modo_id) REFERENCES ModosProducao(id),
    FOREIGN KEY (recurso_id) REFERENCES Recursos(id)
);

-- DADOS DE EXEMPLO
INSERT INTO Produtos (id, nome, demanda_terceirizada_minima, demanda_minima_total) VALUES
(1, 'Modelo 1', 100, 3000),
(2, 'Modelo 2', 200, 2500),
(3, 'Modelo 3', 50, 500);

INSERT INTO ModosProducao (id, nome) VALUES
(1, 'Interno'),
(2, 'Terceirizado');

INSERT INTO Recursos (id, nome, capacidade) VALUES
(1, 'Montagem', 6000),
(2, 'Acabamento', 10000);

-- Custos e Lucros
INSERT INTO Custos (produto_id, modo_id, custo_unitario, lucro_unitario) VALUES
(1, 1, 50, 80),
(1, 2, 65, 60),
(2, 1, 90, 120),
(2, 2, 92, 100),
(3, 1, 120, 160),
(3, 2, 140, 140);

-- Consumo Interno
INSERT INTO ConsumoRecursos (produto_id, modo_id, recurso_id, consumo_unitario) VALUES
(1, 1, 1, 1),
(1, 1, 2, 2.5),
(2, 1, 1, 2),
(2, 1, 2, 1),
(3, 1, 1, 0.5),
(3, 1, 2, 4);

-- Consumo Terceirizado (zero)
INSERT INTO ConsumoRecursos (produto_id, modo_id, recurso_id, consumo_unitario) VALUES
(1, 2, 1, 0), (1, 2, 2, 0),
(2, 2, 1, 0), (2, 2, 2, 0),
(3, 2, 1, 0), (3, 2, 2, 0);
