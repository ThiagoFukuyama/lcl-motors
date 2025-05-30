# api.R - API para resolver Programação Linear com R + SQLite usando Plumber (Versão Otimizada e Genérica)

library(plumber)
library(DBI)
library(RSQLite)
library(dplyr)
library(lpSolve)

# Conecta ao banco de dados SQLite
# CERTIFIQUE-SE DE QUE "motorsdb.db" FOI CRIADO USANDO O SCRIPT schema_lcl.sql
# E ESTEJA NO MESMO DIRETÓRIO DO api.R
con <- dbConnect(RSQLite::SQLite(), "motorsdb.db")

# Função para criar as tabelas se não existirem (garante a estrutura em caso de execução sem o script SQL externo)
# É uma boa prática tê-la, mas a ideia é que o schema_lcl.sql seja executado primeiro.
create_tables <- function(con) {
  dbExecute(con, "CREATE TABLE IF NOT EXISTS Modelos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL)")
  dbExecute(con, "CREATE TABLE IF NOT EXISTS ModosProducao (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL)")
  dbExecute(con, "CREATE TABLE IF NOT EXISTS Recursos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, capacidade REAL NOT NULL)")
  dbExecute(con, "CREATE TABLE IF NOT EXISTS Demandas (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, quantidade INTEGER NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id))")
  dbExecute(con, "CREATE TABLE IF NOT EXISTS Custos (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, modo_id INTEGER, custo_unitario REAL NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id), FOREIGN KEY (modo_id) REFERENCES ModosProducao(id))")
  dbExecute(con, "CREATE TABLE IF NOT EXISTS ConsumoRecursos (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, modo_id INTEGER, recurso_id INTEGER, consumo_unitario REAL NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id), FOREIGN KEY (modo_id) REFERENCES ModosProducao(id), FOREIGN KEY (recurso_id) REFERENCES Recursos(id))")
}

# Garante que as tabelas sejam criadas ao iniciar a API
create_tables(con)


#* @apiTitle API de Programação Linear - Sistema Genérico de Produção

# --- Rotas de Status e Listagem ---

#* Status da API
#* Retorna uma mensagem de status para verificar se a API está funcionando.
#* @get /
function() {
  list(status = "API de Programação Linear funcionando!")
}

#* Listar todos os dados do modelo
#* Retorna todos os dados atualmente carregados no banco de dados para o modelo de PL.
#* @get /modelo_dados
function() {
  list(
    modelos = dbReadTable(con, "Modelos"),
    modos_producao = dbReadTable(con, "ModosProducao"),
    recursos = dbReadTable(con, "Recursos"),
    demandas = dbReadTable(con, "Demandas"),
    custos = dbReadTable(con, "Custos"),
    consumo_recursos = dbReadTable(con, "ConsumoRecursos")
  )
}

# --- Rotas de Adição de Dados (CRUD) ---

#* Adicionar modelo
#* Adiciona um novo tipo de modelo (ex: 'Motor XYZ').
#* @param nome O nome do modelo.
#* @post /modelo
function(nome) {
  dbExecute(con, "INSERT INTO Modelos (nome) VALUES (?)", params = list(nome))
  list(status = "Modelo adicionado com sucesso")
}

#* Adicionar modo de produção
#* Adiciona um novo modo de produção (ex: 'Interno', 'Terceirizado', 'Expresso').
#* @param nome O nome do modo de produção.
#* @post /modo_producao
function(nome) {
  dbExecute(con, "INSERT INTO ModosProducao (nome) VALUES (?)", params = list(nome))
  list(status = "Modo de produção adicionado com sucesso")
}

#* Adicionar recurso
#* Adiciona um novo recurso disponível (ex: 'Montagem', 'Acabamento', 'Energia').
#* @param nome O nome do recurso.
#* @param capacidade A capacidade total disponível para este recurso.
#* @post /recurso
function(nome, capacidade) {
  dbExecute(con, "INSERT INTO Recursos (nome, capacidade) VALUES (?, ?)", params = list(nome, as.numeric(capacidade)))
  list(status = "Recurso adicionado com sucesso")
}

#* Adicionar demanda
#* Define a demanda mínima para um modelo específico.
#* @param modelo_id O ID do modelo.
#* @param quantidade A quantidade demandada.
#* @post /demanda
function(modelo_id, quantidade) {
  dbExecute(con, "INSERT INTO Demandas (modelo_id, quantidade) VALUES (?, ?)", params = list(as.integer(modelo_id), as.integer(quantidade)))
  list(status = "Demanda registrada")
}

#* Adicionar custo
#* Define o custo unitário para produzir um modelo em um modo de produção específico.
#* @param modelo_id O ID do modelo.
#* @param modo_id O ID do modo de produção.
#* @param custo_unitario O custo por unidade.
#* @post /custo
function(modelo_id, modo_id, custo_unitario) {
  dbExecute(con, "INSERT INTO Custos (modelo_id, modo_id, custo_unitario) VALUES (?, ?, ?)",
            params = list(as.integer(modelo_id), as.integer(modo_id), as.numeric(custo_unitario)))
  list(status = "Custo registrado")
}

#* Adicionar consumo de recurso
#* Define quanto de um recurso é consumido para produzir uma unidade de um modelo em um modo de produção específico.
#* @param modelo_id O ID do modelo.
#* @param modo_id O ID do modo de produção.
#* @param recurso_id O ID do recurso.
#* @param consumo_unitario A quantidade de recurso consumida por unidade.
#* @post /consumo_recurso
function(modelo_id, modo_id, recurso_id, consumo_unitario) {
  dbExecute(con, "INSERT INTO ConsumoRecursos (modelo_id, modo_id, recurso_id, consumo_unitario) VALUES (?, ?, ?, ?)",
            params = list(as.integer(modelo_id), as.integer(modo_id), as.integer(recurso_id), as.numeric(consumo_unitario)))
  list(status = "Consumo de recurso registrado")
}

# --- Rota Principal: Resolver o problema de Programação Linear ---

#* Resolve o problema de programação linear
#* Este endpoint calcula a produção ideal de cada modelo/modo de produção para minimizar o custo total,
#* respeitando as restrições de recursos e atendendo às demandas (MAIOR OU IGUAL).
#* @get /resolver
function() {
  # 1. Carregar dados do banco de dados (garantindo a ordem para consistência)
  modelos <- dbGetQuery(con, "SELECT id, nome FROM Modelos ORDER BY id")
  modos_producao <- dbGetQuery(con, "SELECT id, nome FROM ModosProducao ORDER BY id")
  recursos <- dbGetQuery(con, "SELECT id, nome, capacidade FROM Recursos ORDER BY id")
  demandas <- dbGetQuery(con, "SELECT modelo_id, quantidade FROM Demandas ORDER BY modelo_id")
  custos <- dbGetQuery(con, "SELECT modelo_id, modo_id, custo_unitario FROM Custos ORDER BY modelo_id, modo_id")
  consumo_recursos <- dbGetQuery(con, "SELECT modelo_id, modo_id, recurso_id, consumo_unitario FROM ConsumoRecursos ORDER BY modelo_id, modo_id, recurso_id")

  # Validação básica de dados essenciais
  if (nrow(modelos) == 0 || nrow(modos_producao) == 0 || nrow(recursos) == 0 ||
      nrow(demandas) == 0 || nrow(custos) == 0) {
    stop("Dados insuficientes para resolver o PL. Verifique se as tabelas Modelos, ModosProducao, Recursos, Demandas e Custos estão preenchidas.")
  }

  # 2. Definir as variáveis de decisão (quantidades de cada modelo por modo de produção)
  # Cria uma combinação de todos os modelos com todos os modos de produção.
  # Esta combinação define as colunas da matriz de restrições e os elementos da função objetivo.
  vars_map <- expand.grid(modelo_id = modelos$id, modo_id = modos_producao$id)
  vars_map <- vars_map[order(vars_map$modelo_id, vars_map$modo_id), ] # Garante a ordem consistente
  
  num_vars <- nrow(vars_map)
  
  if (num_vars == 0) {
    stop("Nenhuma variável de decisão pode ser formada. Verifique se há Modelos e ModosProducao definidos.")
  }

  # Nomes descritivos para as variáveis de decisão na saída
  var_names <- apply(vars_map, 1, function(row) {
    mod_name <- modelos$nome[modelos$id == row["modelo_id"]]
    modo_name <- modos_producao$nome[modos_producao$id == row["modo_id"]]
    paste0("Qtd_", mod_name, "_", modo_name)
  })

  # 3. Construir o Vetor de Coeficientes da Função Objetivo (f.obj)
  # O custo total a ser minimizado. Cada coeficiente corresponde a uma variável de decisão.
  f.obj <- rep(0, num_vars)
  for (i in 1:num_vars) {
    current_modelo_id <- vars_map$modelo_id[i] # Nome mais específico
    current_modo_id <- vars_map$modo_id[i]     # Nome mais específico
    
    custo_val <- custos %>% 
      filter(modelo_id == current_modelo_id & modo_id == current_modo_id) %>% # Usando nomes específicos
      pull(custo_unitario)
    
    if (length(custo_val) > 0) {
      f.obj[i] <- custo_val[1] # Usa o primeiro custo encontrado (idealmente único)
    } else {
      # Se não houver custo definido para uma combinação, assume-se 0 (pode ser um erro/alerta)
      warning(paste0("Custo não definido para Modelo ID ", current_modelo_id, " e Modo ID ", current_modo_id, ". Assumindo custo 0."))
    }
  }

  # 4. Construir a Matriz de Restrições (f.con), Direções (f.dir) e Lados Direitos (f.rhs)
  f.con <- NULL # Matriz de coeficientes das restrições
  f.dir <- c()  # Direções das restrições (<=, >=, =)
  f.rhs <- c()  # Lados direitos das restrições

  # A. Restrições de Recursos (Consumo <= Capacidade)
  # Para cada recurso, a soma do consumo de todas as produções não pode exceder sua capacidade.
  for (r_idx in 1:nrow(recursos)) { # Loop pelos índices dos recursos
    current_recurso_id <- recursos$id[r_idx]
    linha_restricao_recurso <- rep(0, num_vars)
    
    for (v_idx in 1:num_vars) { # Loop pelos índices das variáveis de decisão
      current_modelo_id_var <- vars_map$modelo_id[v_idx] # Nome mais específico
      current_modo_id_var <- vars_map$modo_id[v_idx]     # Nome mais específico
      
      consumo_val <- consumo_recursos %>%
        filter(modelo_id == current_modelo_id_var & modo_id == current_modo_id_var & recurso_id == current_recurso_id) %>% # Usando nomes específicos
        pull(consumo_unitario)
      
      if (length(consumo_val) > 0) {
        linha_restricao_recurso[v_idx] <- consumo_val[1] # Coeficiente de consumo
      } else {
        # Se não houver consumo definido para uma combinação, assume-se 0
        linha_restricao_recurso[v_idx] <- 0 
      }
    }
    
    f.con <- rbind(f.con, linha_restricao_recurso)
    f.dir <- c(f.dir, "<=")
    f.rhs <- c(f.rhs, recursos$capacidade[r_idx])
  }

  # B. Restrições de Demanda (Produção Total do Modelo >= Demanda)
  # Para cada modelo, a soma das quantidades produzidas (por qualquer modo) DEVE SER MAIOR OU IGUAL à demanda.
  for (m_idx in 1:nrow(modelos)) { # Loop pelos índices dos modelos
    current_modelo_id_demanda <- modelos$id[m_idx] # Nome mais específico
    
    linha_restricao_demanda <- rep(0, num_vars)
    
    for (v_idx in 1:num_vars) { # Loop pelos índices das variáveis de decisão
      # Se a variável de decisão atual (vars_map[v_idx,]) corresponde ao modelo atual (current_modelo_id_demanda)
      # então essa variável contribui para a demanda desse modelo.
      if (vars_map$modelo_id[v_idx] == current_modelo_id_demanda) {
        linha_restricao_demanda[v_idx] <- 1 
      }
    }
    
    demanda_val <- demandas %>% 
      filter(modelo_id == current_modelo_id_demanda) %>% # Usando nome específico
      pull(quantidade)
    
    if (length(demanda_val) > 0) {
      f.con <- rbind(f.con, linha_restricao_demanda)
      f.dir <- c(f.dir, ">=") 
      f.rhs <- c(f.rhs, demanda_val[1])
    } else {
      warning(paste0("Modelo '", modelos$nome[m_idx], "' (ID: ", current_modelo_id_demanda, ") não tem demanda definida. Restrição de demanda não adicionada."))
    }
  }

  # --- INÍCIO: SAÍDA DE DEBUG PARA DIAGNÓSTICO DE INVIABILIDADE ---
  print("--- Dados do Modelo LP para Debug ---")
  print("Variáveis de Decisão (vars_map e var_names):")
  print(vars_map)
  print(var_names)
  
  print("Coeficientes da Função Objetivo (f.obj):")
  print(f.obj)
  
  print("Matriz de Restrições (f.con):")
  print(f.con)
  
  print("Direções das Restrições (f.dir):")
  print(f.dir)
  
  print("Lado Direito das Restrições (f.rhs):")
  print(f.rhs)
  print("--- FIM: SAÍDA DE DEBUG ---")

  # 5. Resolver o problema de programação linear
  # O lpSolve assume automaticamente que as variáveis são não-negativas (lower bound = 0)
  sol <- lp(
    direction = "min", # Minimizar o custo (pode ser "max" para maximizar lucro, por exemplo)
    objective.in = f.obj,
    const.mat = f.con,
    const.dir = f.dir,
    const.rhs = f.rhs,
    all.int = FALSE    # Define se as variáveis de decisão devem ser inteiras (TRUE) ou podem ser decimais (FALSE)
  )

  # 6. Retornar os resultados
  if (sol$status == 0) { # Status 0 indica que uma solução ótima foi encontrada
    # Mapeia as soluções numéricas para os nomes descritivos das variáveis
    solucao_nomeada <- setNames(sol$solution, var_names)
    list(
      status = "Sucesso",
      custo_minimo_total = sol$objval,
      quantidades_produzidas = solucao_nomeada
    )
  } else if (sol$status == 2) { # Status 2 indica que o problema é inviável (sem solução que atenda todas as restrições)
    list(
      status = "Falha: Problema inviável",
      mensagem = "Não foi possível encontrar uma solução que satisfaça todas as restrições com os dados fornecidos. Verifique as capacidades e demandas."
    )
  } else { # Outros status indicam falha ou erro
    list(
      status = paste("Falha com código:", sol$status),
      mensagem = "Ocorreu um erro inesperado ao resolver o problema de programação linear. Consulte a documentação do lpSolve para códigos de status."
    )
  }
}