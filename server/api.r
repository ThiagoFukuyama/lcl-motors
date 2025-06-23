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

# --- Rotas para Requisição de Dados ---
# --------------------------------------

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

#* Listar os Modelos
#* Retorna o nome e id dos modelos
#* @get /modelos
function() {
  list(
    modelos = dbReadTable(con, "Modelos")
  )
}

#* Listar os Modos de Produção
#* Retorna o nome e id dos modos
#* @get /modos_producao
function() {
  list(
    modos_producao = dbReadTable(con, "ModosProducao")
  )
}

#* Listar os Recursos
#* Retorna o nome, id e capacidade dos recursos
#* @get /recursos
function() {
  list(
    recursos = dbReadTable(con, "Recursos")
  )
}


# --- Rotas de Adição de Dados (CRUD) ---
# ---------------------------------------

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

# --- Rota Principal: Resolver o problema de Programação Linear (Adaptada) ---

#* Resolve o problema de programação linear da LCL Motors com dados personalizados
#* Este endpoint calcula a produção ideal de cada modelo/modo de produção para minimizar o custo total,
#* respeitando as restrições de recursos e atendendo às demandas (MAIOR OU IGUAL).
#* Espera um JSON com "tipo_objetivo" e "demandas_personalizadas" (array de {modelo_id, quantidade})
#* Opcionalmente, pode receber "capacidades_personalizadas" (array de {recurso_id, capacidade})
#* @post /solucionar
#* @json
function(req) {
  body <- jsonlite::fromJSON(req$postBody, simplifyVector = FALSE)
  
  tipo_objetivo <- tolower(body$tipo_objetivo)
  if (!(tipo_objetivo %in% c("min", "max"))) {
    stop("O tipo de objetivo deve ser 'min' ou 'max'")
  }
  
  # Parâmetros de entrada da requisição
  # CONVERTE AS LISTAS PARA DATA FRAMES AQUI
  demandas_personalizadas <- as.data.frame(do.call(rbind, body$demandas_personalizadas))
  if (is.null(demandas_personalizadas) || nrow(demandas_personalizadas) == 0) {
    stop("Demandas personalizadas são necessárias para resolver o problema e não foram fornecidas no formato correto.")
  }
  # Garante que as colunas 'modelo_id' e 'quantidade' tenham o tipo correto
  demandas_personalizadas$modelo_id <- as.integer(demandas_personalizadas$modelo_id)
  demandas_personalizadas$quantidade <- as.integer(demandas_personalizadas$quantidade)


  capacidades_personalizadas <- NULL
  if (!is.null(body$capacidades_personalizadas) && length(body$capacidades_personalizadas) > 0) {
      capacidades_personalizadas <- as.data.frame(do.call(rbind, body$capacidades_personalizadas))
      # Garante que as colunas 'recurso_id' e 'capacidade' tenham o tipo correto
      capacidades_personalizadas$recurso_id <- as.integer(capacidades_personalizadas$recurso_id)
      capacidades_personalizadas$capacidade <- as.numeric(capacidades_personalizadas$capacidade)
  }
  
  # 1. Carregar dados do banco de dados (garantindo a ordem para consistência)
  modelos <- dbGetQuery(con, "SELECT id, nome FROM Modelos ORDER BY id")
  modos_producao <- dbGetQuery(con, "SELECT id, nome FROM ModosProducao ORDER BY id")
  
  # Carregar recursos e aplicar capacidades personalizadas se existirem
  recursos <- dbGetQuery(con, "SELECT id, nome, capacidade FROM Recursos ORDER BY id")
  if (!is.null(capacidades_personalizadas) && nrow(capacidades_personalizadas) > 0) {
    for (i in 1:nrow(capacidades_personalizadas)) { # Loop pelas linhas do data frame
      cap_item <- capacidades_personalizadas[i, ]
      recurso_id_cap <- cap_item$recurso_id
      nova_capacidade <- cap_item$capacidade
      if (recurso_id_cap %in% recursos$id) {
        recursos$capacidade[recursos$id == recurso_id_cap] <- nova_capacidade
      } else {
        warning(paste0("Recurso ID ", recurso_id_cap, " para capacidade personalizada não encontrado."))
      }
    }
  }

  custos <- dbGetQuery(con, "SELECT modelo_id, modo_id, custo_unitario FROM Custos ORDER BY modelo_id, modo_id")
  consumo_recursos <- dbGetQuery(con, "SELECT modelo_id, modo_id, recurso_id, consumo_unitario FROM ConsumoRecursos ORDER BY modelo_id, modo_id, recurso_id")

  # Validação básica de dados essenciais
  if (nrow(modelos) == 0 || nrow(modos_producao) == 0 || nrow(recursos) == 0 || nrow(custos) == 0) {
    stop("Dados insuficientes para resolver o PL. Verifique se as tabelas Modelos, ModosProducao, Recursos e Custos estão preenchidas.")
  }

  # 2. Definir as variáveis de decisão (quantidades de cada modelo por modo de produção)
  vars_map <- expand.grid(modelo_id = modelos$id, modo_id = modos_producao$id)
  vars_map <- vars_map[order(vars_map$modelo_id, vars_map$modo_id), ]
  
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
  f.obj <- rep(0, num_vars)
  for (i in 1:num_vars) {
    current_modelo_id <- vars_map$modelo_id[i]
    current_modo_id <- vars_map$modo_id[i]
    
    custo_val <- custos %>% 
      filter(modelo_id == current_modelo_id & modo_id == current_modo_id) %>% 
      pull(custo_unitario)
    
    if (length(custo_val) > 0) {
      f.obj[i] <- custo_val[1]
    } else {
      warning(paste0("Custo não definido para Modelo ID ", current_modelo_id, " e Modo ID ", current_modo_id, ". Assumindo custo 0."))
    }
  }

  # 4. Construir a Matriz de Restrições (f.con), Direções (f.dir) e Lados Direitos (f.rhs)
  f.con <- NULL
  f.dir <- c()
  f.rhs <- c()

  # A. Restrições de Recursos (Consumo <= Capacidade)
  for (r_idx in 1:nrow(recursos)) {
    current_recurso_id <- recursos$id[r_idx]
    linha_restricao_recurso <- rep(0, num_vars)
    
    for (v_idx in 1:num_vars) {
      current_modelo_id_var <- vars_map$modelo_id[v_idx]
      current_modo_id_var <- vars_map$modo_id[v_idx]
      
      consumo_val <- consumo_recursos %>%
        filter(modelo_id == current_modelo_id_var & modo_id == current_modo_id_var & recurso_id == current_recurso_id) %>% 
        pull(consumo_unitario)
      
      if (length(consumo_val) > 0) {
        linha_restricao_recurso[v_idx] <- consumo_val[1]
      } else {
        linha_restricao_recurso[v_idx] <- 0
      }
    }
    
    f.con <- rbind(f.con, linha_restricao_recurso)
    f.dir <- c(f.dir, "<=")
    f.rhs <- c(f.rhs, recursos$capacidade[r_idx])
  }

  # B. Restrições de Demanda (Produção Total do Modelo >= Demanda)
  if (is.null(demandas_personalizadas) || nrow(demandas_personalizadas) == 0) {
    stop("Demandas personalizadas são necessárias para resolver o problema.")
  }

  for (m_idx in 1:nrow(modelos)) {
    current_modelo_id_demanda <- modelos$id[m_idx]
    
    linha_restricao_demanda <- rep(0, num_vars)
    
    for (v_idx in 1:num_vars) {
      if (vars_map$modelo_id[v_idx] == current_modelo_id_demanda) {
        linha_restricao_demanda[v_idx] <- 1 
      }
    }
    
    demanda_val_req <- demandas_personalizadas %>% 
      filter(modelo_id == current_modelo_id_demanda) %>%
      pull(quantidade)
    
    if (length(demanda_val_req) > 0) {
      f.con <- rbind(f.con, linha_restricao_demanda)
      f.dir <- c(f.dir, ">=") 
      f.rhs <- c(f.rhs, demanda_val_req[1])
    } else {
      # Se uma demanda não foi fornecida na requisição, mas o modelo existe, avisamos
      warning(paste0("Modelo '", modelos$nome[m_idx], "' (ID: ", current_modelo_id_demanda, ") não tem demanda definida na requisição. Restrição de demanda não adicionada para este modelo."))
    }
  }

  # --- SAÍDA DE DEBUG PARA DIAGNÓSTICO DE INVIABILIDADE ---
  # Comente ou remova estas linhas para produção
  # print("--- Dados do Modelo LP para Debug ---")
  # print("Variáveis de Decisão (vars_map e var_names):")
  # print(vars_map)
  # print("Coeficientes da Função Objetivo (f.obj):")
  # print(f.obj)
  # print("Matriz de Restrições (f.con):")
  # print(f.con)
  # print("Direções das Restrições (f.dir):")
  # print(f.dir)
  # print("Lado Direito das Restrições (f.rhs):")
  # print(f.rhs)
  # print("--- FIM: SAÍDA DE DEBUG ---")

  # 5. Resolver o problema de programação linear
  sol <- lp(
    direction = tipo_objetivo,
    objective.in = f.obj,
    const.mat = f.con,
    const.dir = f.dir,
    const.rhs = f.rhs,
    all.int = FALSE
  )

  # 6. Retornar os resultados
  if (sol$status == 0) {
    solucao_nomeada <- setNames(sol$solution, var_names)
    list(
      status = "Sucesso",
      valor_objetivo = sol$objval,
      quantidades_produzidas = as.list(solucao_nomeada), # CORREÇÃO AQUI para garantir objeto nomeado
      # --- NOVOS DADOS ADICIONADOS PARA O FRONTEND ---
      modelos_data = modelos,
      modos_producao_data = modos_producao,
      recursos_data = recursos, # Inclui as capacidades atualizadas
      consumo_recursos_data = consumo_recursos,
      demandas_input = demandas_personalizadas # Inclui as demandas que o usuário inseriu
      # --- FIM DOS NOVOS DADOS ---
    )
  } else if (sol$status == 2) {
    list(
      status = "Falha: Problema inviável",
      mensagem = "Não foi possível encontrar uma solução que satisfaça todas as restrições com os dados fornecidos. Verifique as capacidades e demandas."
    )
  } else {
    list(
      status = paste("Falha com código:", sol$status),
      mensagem = "Ocorreu um erro inesperado ao resolver o problema de programação linear. Consulte a documentação do lpSolve para códigos de status."
    )
  }
}

# Rota original /solucionar_old comentada para evitar conflitos.
# #* @post /solucionar_old
# #* @json
# # function(req) {
# #   body <- jsonlite::fromJSON(req$postBody, simplifyVector = FALSE)
# # # ... (restante do código original)
# # }