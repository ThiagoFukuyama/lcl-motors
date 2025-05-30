-- 1. Tabela de Modelos de Motores (entidades base dos produtos finais)
-- Ex: Modelo 1, Modelo 2, Modelo 3
CREATE TABLE IF NOT EXISTS Modelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
);

-- 2. Tabela de Modos de Produção (como um modelo pode ser produzido)
-- Ex: Interno, Terceirizado
CREATE TABLE IF NOT EXISTS ModosProducao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
);

-- 3. Tabela de Recursos Disponíveis (ativos de produção com capacidades limitadas)
-- Ex: Montagem, Acabamento
CREATE TABLE IF NOT EXISTS Recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    capacidade REAL NOT NULL -- Capacidade total disponível para este recurso
);

-- 4. Tabela de Demandas (quantidade total necessária para cada Modelo)
-- Ex: Modelo 1 precisa de 3000 unidades
CREATE TABLE IF NOT EXISTS Demandas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER,
    quantidade INTEGER NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(id)
);

-- 5. Tabela de Custos (custo unitário para produzir um Modelo usando um Modo de Produção específico)
-- Ex: Custo de Modelo 1 feito Internamente é 50
CREATE TABLE IF NOT EXISTS Custos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER,
    modo_id INTEGER,
    custo_unitario REAL NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(id),
    FOREIGN KEY (modo_id) REFERENCES ModosProducao(id)
);

-- 6. Tabela de Consumo de Recursos (quanto de um Recurso é consumido por unidade de Modelo em um Modo de Produção)
-- Ex: Modelo 1 Interno consome 1h de Montagem
CREATE TABLE IF NOT EXISTS ConsumoRecursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER,
    modo_id INTEGER,
    recurso_id INTEGER,
    consumo_unitario REAL NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(id),
    FOREIGN KEY (modo_id) REFERENCES ModosProducao(id),
    FOREIGN KEY (recurso_id) REFERENCES Recursos(id)
);

-- --- INSERÇÃO DE DADOS PARA O PROBLEMA DA LCL MOTORES LTDA. ---

-- Inserindo os 3 Modelos de Motores
INSERT INTO Modelos (id, nome) VALUES
(1, 'Modelo 1'),
(2, 'Modelo 2'),
(3, 'Modelo 3');

-- Inserindo os 2 Modos de Produção
INSERT INTO ModosProducao (id, nome) VALUES
(1, 'Interno'),
(2, 'Terceirizado');

-- Inserindo os Recursos (Montagem e Acabamento) e suas Capacidades
INSERT INTO Recursos (id, nome, capacidade) VALUES
(1, 'Montagem', 6000),   -- 6000 horas disponíveis
(2, 'Acabamento', 10000); -- 10000 horas disponíveis

-- Inserindo as Demandas para cada Modelo
INSERT INTO Demandas (modelo_id, quantidade) VALUES
(1, 3000), -- Demanda de 3000 unidades para o Modelo 1
(2, 2500), -- Demanda de 2500 unidades para o Modelo 2
(3, 500);  -- Demanda de 500 unidades para o Modelo 3

-- Inserindo os Custos Unitários para cada Modelo em cada Modo de Produção
INSERT INTO Custos (modelo_id, modo_id, custo_unitario) VALUES
-- Custos de Produção Interna
(1, 1, 50),   -- Modelo 1, Interno: R$ 50/unid
(2, 1, 90),   -- Modelo 2, Interno: R$ 90/unid
(3, 1, 120),  -- Modelo 3, Interno: R$ 120/unid
-- Custos de Produção Terceirizada
(1, 2, 65),   -- Modelo 1, Terceirizado: R$ 65/unid
(2, 2, 92),   -- Modelo 2, Terceirizado: R$ 92/unid
(3, 2, 140);  -- Modelo 3, Terceirizado: R$ 140/unid

-- Inserindo o Consumo de Recursos para cada Modelo em cada Modo de Produção
-- (Para Modos Terceirizados, o consumo de recursos internos é 0)

-- Consumo para Produção Interna (Modo_ID = 1)
-- Recursos de Montagem (Recurso_ID = 1)
INSERT INTO ConsumoRecursos (modelo_id, modo_id, recurso_id, consumo_unitario) VALUES
(1, 1, 1, 1),    -- Modelo 1, Interno: consome 1h de Montagem
(2, 1, 1, 2),    -- Modelo 2, Interno: consome 2h de Montagem
(3, 1, 1, 0.5);  -- Modelo 3, Interno: consome 0.5h de Montagem

-- Recursos de Acabamento (Recurso_ID = 2)
INSERT INTO ConsumoRecursos (modelo_id, modo_id, recurso_id, consumo_unitario) VALUES
(1, 1, 2, 2.5),  -- Modelo 1, Interno: consome 2.5h de Acabamento
(2, 1, 2, 1),    -- Modelo 2, Interno: consome 1h de Acabamento
(3, 1, 2, 4);    -- Modelo 3, Interno: consome 4h de Acabamento

-- Consumo para Produção Terceirizada (Modo_ID = 2)
-- Assume-se 0 consumo dos recursos internos (Montagem e Acabamento)
-- Não é estritamente necessário inserir essas linhas se o consumo for 0 e o código tratar ausência como 0.
-- Mas, para clareza e explicitação no banco, podemos incluir:
INSERT INTO ConsumoRecursos (modelo_id, modo_id, recurso_id, consumo_unitario) VALUES
-- Montagem (Recurso_ID = 1) para Terceirizados
(1, 2, 1, 0), -- Modelo 1, Terceirizado: consome 0h de Montagem
(2, 2, 1, 0), -- Modelo 2, Terceirizado: consome 0h de Montagem
(3, 2, 1, 0), -- Modelo 3, Terceirizado: consome 0h de Montagem
-- Acabamento (Recurso_ID = 2) para Terceirizados
(1, 2, 2, 0), -- Modelo 1, Terceirizado: consome 0h de Acabamento
(2, 2, 2, 0), -- Modelo 2, Terceirizado: consome 0h de Acabamento
(3, 2, 2, 0); -- Modelo 3, Terceirizado: consome 0h de Acabamento