# api.R - API para resolver Programação Linear com R + SQLite usando Plumber (Versão Otimizada e Genérica)

library(plumber)
library(DBI)
library(RSQLite)
library(dplyr)
library(lpSolve)

# Conecta ao banco de dados SQLite
# CERTIFIQUE-SE DE QUE "motorsdb.db" FOI CRIADO USANDO O SCRIPT motorsdb.sql
# E ESTEJA NO MESMO DIRETÓRIO DO api.R
con <- dbConnect(RSQLite::SQLite(), "motorsdb.db")

# Função para criar as tabelas se não existirem (garante a estrutura em caso de execução sem o script SQL externo)
# É uma boa prática tê-la, mas a ideia é que o schema_lcl.sql seja executado primeiro.
#create_tables <- function(con) {
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS Modelos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, demanda_terceirizada_minima INTEGER DEFAULT 0)")
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS ModosProducao (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL)")
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS Recursos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, capacidade REAL NOT NULL)")
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS Demandas (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, quantidade INTEGER NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id))")
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS Custos (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, modo_id INTEGER, custo_unitario REAL NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id), FOREIGN KEY (modo_id) REFERENCES ModosProducao(id))")
#  dbExecute(con, "CREATE TABLE IF NOT EXISTS ConsumoRecursos (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo_id INTEGER, modo_id INTEGER, recurso_id INTEGER, consumo_unitario REAL NOT NULL, FOREIGN KEY (modelo_id) REFERENCES Modelos(id), FOREIGN KEY (modo_id) REFERENCES ModosProducao(id), FOREIGN KEY (recurso_id) REFERENCES Recursos(id))")
#}

# Garante que as tabelas sejam criadas ao iniciar a API
#create_tables(con)


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
    produtos = dbReadTable(con, "Produtos"),
    modos_producao = dbReadTable(con, "ModosProducao"),
    recursos = dbReadTable(con, "Recursos"),
    custos = dbReadTable(con, "Custos"),
    consumo_recursos = dbReadTable(con, "ConsumoRecursos")
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

# --- Rotas de Controle de Dados (CRUD) ---
# ---------------------------------------

# --- Produtos (CRUD) ---
# -----------------------

#* Adicionar produto
#* Cria um produto com demandas, custos/lucros e consumo de recursos (modo interno).
#* @param nome O nome do produto.
#* @param demanda_terceirizada_minima A quantidade mínima exigida de produção terceirizada.
#* @param demanda_minima_total A quantidade mínima total a ser produzida (todos os modos).
#* @param custos Lista de objetos: {modo_id, custo_unitario, lucro_unitario}.
#* @param consumos Lista de objetos: {recurso_id, consumo_unitario} (modo interno).
#* @post /produto
function(nome, demanda_terceirizada_minima = 0, demanda_minima_total = 0, custos = NULL, consumos = NULL) {
  demanda_terceirizada_minima <- as.integer(demanda_terceirizada_minima)
  demanda_minima_total <- as.integer(demanda_minima_total)

  dbExecute(con,
    "INSERT INTO Produtos (nome, demanda_terceirizada_minima, demanda_minima_total) VALUES (?, ?, ?)",
    params = list(nome, demanda_terceirizada_minima, demanda_minima_total)
  )

  id <- dbGetQuery(con, "SELECT last_insert_rowid() AS id")$id

  if (is.data.frame(custos)) {
    custos <- split(custos, seq(nrow(custos)))
  }
  if (!is.null(custos)) {
    for (custo in custos) {
      dbExecute(con,
        "INSERT INTO Custos (produto_id, modo_id, custo_unitario, lucro_unitario) VALUES (?, ?, ?, ?)",
        params = list(
          id,
          as.integer(custo$modo_id),
          as.numeric(custo$custo_unitario),
          as.numeric(custo$lucro_unitario)
        )
      )
    }
  }

  if (is.data.frame(consumos)) {
    consumos <- split(consumos, seq(nrow(consumos)))
  }
  if (!is.null(consumos)) {
    for (consumo in consumos) {
      dbExecute(con,
        "INSERT INTO ConsumoRecursos (produto_id, modo_id, recurso_id, consumo_unitario) VALUES (?, 1, ?, ?)",
        params = list(
          id,
          as.integer(consumo$recurso_id),
          as.numeric(consumo$consumo_unitario)
        )
      )
    }
  }

  list(status = "Produto criado com sucesso", produto_id = id)
}


#* @get /produtos
function() {
  # Buscar todos os produtos básicos
  produtos <- dbGetQuery(con, "
    SELECT id, nome, demanda_terceirizada_minima, demanda_minima_total
    FROM Produtos
  ")

  # Para cada produto, buscar custos, consumos e montar objeto completo
  lista_completa <- lapply(produtos$id, function(pid) {
    # Dados básicos do produto
    prod <- produtos[produtos$id == pid, ]

    # Buscar custos e lucros por modo (1 = interno, 2 = externo)
    custos <- dbGetQuery(con, "
      SELECT modo_id, custo_unitario, lucro_unitario
      FROM Custos
      WHERE produto_id = ?", params = list(pid)
    )

    # Extrair custos e lucros para interno e externo
    custoInterno <- ifelse(any(custos$modo_id == 1), custos$custo_unitario[custos$modo_id == 1], 0)
    lucroInterno <- ifelse(any(custos$modo_id == 1), custos$lucro_unitario[custos$modo_id == 1], 0)
    custoExterno <- ifelse(any(custos$modo_id == 2), custos$custo_unitario[custos$modo_id == 2], 0)
    lucroExterno <- ifelse(any(custos$modo_id == 2), custos$lucro_unitario[custos$modo_id == 2], 0)

    # Buscar consumos internos (modo_id = 1)
    consumos_df <- dbGetQuery(con, "
      SELECT recurso_id, consumo_unitario
      FROM ConsumoRecursos
      WHERE produto_id = ? AND modo_id = 1
    ", params = list(pid))

    # Transformar consumos em named list: recurso_id -> consumo_unitario
    consumos <- setNames(as.list(consumos_df$consumo_unitario), consumos_df$recurso_id)

    # Montar e retornar objeto completo do produto
    list(
      id = prod$id,
      nome = prod$nome,
      custoInterno = ifelse(length(custoInterno) > 0, custoInterno, 0),
      lucroInterno = ifelse(length(lucroInterno) > 0, lucroInterno, 0),
      custoExterno = ifelse(length(custoExterno) > 0, custoExterno, 0),
      lucroExterno = ifelse(length(lucroExterno) > 0, lucroExterno, 0),
      demandaMinimaTerceirizada = ifelse(is.na(prod$demanda_terceirizada_minima), 0, prod$demanda_terceirizada_minima),
      demandaMinimaTotal = ifelse(is.na(prod$demanda_minima_total), 0, prod$demanda_minima_total),
      consumos = consumos
    )
  })

  # Retornar lista completa
  list(produtos = lista_completa)
}




#* Obter produto por ID com dados completos
#* @serializer json
#* @get /produto/<id:int>
function(id) {
  id <- as.integer(id)

  # Buscar produto
  produto <- dbGetQuery(con, "SELECT * FROM Produtos WHERE id = ?", params = list(id))
  if (nrow(produto) == 0) {
    return(list(error = "Produto não encontrado"))
  }

  # Buscar custos e lucros
  custos <- dbGetQuery(con, "
    SELECT modo_id, custo_unitario, lucro_unitario
    FROM Custos
    WHERE produto_id = ?", params = list(id))

  # Buscar consumo interno (modo_id = 1)
  consumos <- dbGetQuery(con, "
    SELECT recurso_id, consumo_unitario
    FROM ConsumoRecursos
    WHERE produto_id = ? AND modo_id = 1", params = list(id))

  # Buscar demanda
  demanda <- dbGetQuery(con, "
    SELECT quantidade
    FROM Demandas
    WHERE produto_id = ?", params = list(id))

  list(
    produto = produto[1, ],
    custos = custos,
    consumo_interno = consumos,
    demanda = if (nrow(demanda) > 0) demanda$quantidade[1] else NA
  )
}

#* Atualizar produto
#* @put /produto/<id:int>
function(id, nome, demanda_terceirizada_minima = 0, demanda_minima_total = 0, custos = NULL, consumos = NULL) {
  id <- as.integer(id)
  demanda_terceirizada_minima <- as.integer(demanda_terceirizada_minima)
  demanda_minima_total <- as.integer(demanda_minima_total)

  if (is.null(nome) || nome == "") {
    stop("O nome do produto é obrigatório.")
  }

  # Atualiza o produto
  dbExecute(con,
    "UPDATE Produtos SET nome = ?, demanda_terceirizada_minima = ?, demanda_minima_total = ? WHERE id = ?",
    params = list(nome, demanda_terceirizada_minima, demanda_minima_total, id)
  )

  # Atualiza custos
  if (!is.null(custos)) {
    if (is.data.frame(custos)) {
      custos <- split(custos, seq(nrow(custos)))
    }

    dbExecute(con, "DELETE FROM Custos WHERE produto_id = ?", params = list(id))

    for (custo in custos) {
      dbExecute(con,
        "INSERT INTO Custos (produto_id, modo_id, custo_unitario, lucro_unitario) VALUES (?, ?, ?, ?)",
        params = list(
          id,
          as.integer(custo$modo_id),
          as.numeric(custo$custo_unitario),
          as.numeric(custo$lucro_unitario)
        )
      )
    }
  }

  # Atualiza consumos (modo interno)
  if (!is.null(consumos)) {
    if (is.data.frame(consumos)) {
      consumos <- split(consumos, seq(nrow(consumos)))
    }

    dbExecute(con, "DELETE FROM ConsumoRecursos WHERE produto_id = ? AND modo_id = 1", params = list(id))

    for (consumo in consumos) {
      dbExecute(con,
        "INSERT INTO ConsumoRecursos (produto_id, modo_id, recurso_id, consumo_unitario) VALUES (?, 1, ?, ?)",
        params = list(
          id,
          as.integer(consumo$recurso_id),
          as.numeric(consumo$consumo_unitario)
        )
      )
    }
  }

  list(status = "Produto atualizado com sucesso", produto_id = id)
}



#* Deletar produto e dados relacionados
#* @delete /produto/<id:int>
function(id) {
  id <- as.integer(id)

  # Remove registros dependentes usando produto_id
  dbExecute(con, "DELETE FROM Custos WHERE produto_id = ?", params = list(id))
  dbExecute(con, "DELETE FROM ConsumoRecursos WHERE produto_id = ?", params = list(id))

  # Remove o produto (produto)
  dbExecute(con, "DELETE FROM Produtos WHERE id = ?", params = list(id))

  list(status = "Produto e dados relacionados deletados com sucesso")
}




# --- Recursos (CRUD) ---
# -----------------------

#* Adicionar recurso
#* Adiciona um novo recurso disponível (ex: 'Montagem', 'Acabamento', 'Energia').
#* @param nome O nome do recurso.
#* @param capacidade A capacidade total disponível para este recurso.
#* @post /recurso
function(nome, capacidade) {

  dbExecute(con, "INSERT INTO Recursos (nome, capacidade) VALUES (?, ?)", 
  params = list(nome, as.numeric(capacidade)))

  recurso_id <- dbGetQuery(con, "SELECT last_insert_rowid() AS id")$id

  produtos <- dbGetQuery(con, "SELECT id FROM Produtos")
  modos <- dbGetQuery(con, "SELECT id FROM ModosProducao")

  for (produto_id in produtos$id) {
    for (modo_id in modos$id) {
      dbExecute(con,
        "INSERT INTO ConsumoRecursos (produto_id, modo_id, recurso_id, consumo_unitario) VALUES (?, ?, ?, 0)",
        params = list(produto_id, modo_id, recurso_id)
      )
    }
  }

  list(status = "Recurso adicionado com sucesso e consumo inicializado")
}

#* Atualizar recurso
#* @param nome O nome do recurso.
#* @param capacidade A capacidade total disponível para este recurso.
#* @put /recursos/<id:int>
function(id, nome, capacidade) {

  dbExecute(con, "UPDATE Recursos SET nome = ?, capacidade = ? WHERE id = ?", 
  params = list(nome, as.numeric(capacidade), as.integer(id)))

  list(status = "Recurso atualizado com sucesso")
}

#* Deletar recurso
#* Remove também registros dependentes do recurso (consumos).
#* @delete /recursos/<id:int>
function(id) {
  id <- as.integer(id)

  # Remove registros dependentes
  dbExecute(con, "DELETE FROM ConsumoRecursos WHERE recurso_id = ?", params = list(id))

  # Remove o produto
  dbExecute(con, "DELETE FROM Recursos WHERE id = ?", params = list(id))

  list(status = "Produto e dados relacionados deletados com sucesso")
}

# --- Fim das Rotas CRUD ---
# --------------------------

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

# --- Rota Principal: Resolver o problema de Programação Linear (Adaptada) ---
# ----------------------------------------------------------------------------

#* Resolve problema de PL com base em nomes de produtos e banco atualizado
#* @post /resolver
#* @json
function(req) {
  library(dplyr)
  body <- jsonlite::fromJSON(req$postBody)
  
  tipo_objetivo <- tolower(body$tipo_objetivo)
  nomes_produtos <- body$produtos
  demanda_total <- as.numeric(body$demanda_total)

  if (!(tipo_objetivo %in% c("min", "max"))) {
    stop("tipo_objetivo deve ser 'min' ou 'max'")
  }

  # Consulta básica do banco
  produtos <- dbGetQuery(con, sprintf("SELECT * FROM Produtos WHERE nome IN ('%s')", paste(nomes_produtos, collapse = "', '")))
  if (nrow(produtos) == 0) stop("Nenhum produto encontrado.")

  modos <- dbGetQuery(con, "SELECT * FROM ModosProducao ORDER BY id")
  recursos <- dbGetQuery(con, "SELECT * FROM Recursos ORDER BY id")
  custos <- dbGetQuery(con, "SELECT * FROM Custos")
  consumo <- dbGetQuery(con, "SELECT * FROM ConsumoRecursos")
  demandas <- dbGetQuery(con, "SELECT * FROM Demandas")

  # Variáveis de decisão
  vars_map <- expand.grid(produto_id = produtos$id, modo_id = modos$id)
  vars_map <- vars_map[order(vars_map$produto_id, vars_map$modo_id), ]
  num_vars <- nrow(vars_map)

  var_names <- apply(vars_map, 1, function(row) {
    nome_produto <- produtos$nome[produtos$id == row["produto_id"]]
    nome_modo <- modos$nome[modos$id == row["modo_id"]]
    paste0("Qtd_", nome_produto, "_", nome_modo)
  })

  # Função objetivo
  f.obj <- numeric(num_vars)
  for (i in 1:num_vars) {
    linha <- vars_map[i, ]
    row_custo <- custos %>%
      filter(produto_id == linha$produto_id, modo_id == linha$modo_id)
    f.obj[i] <- ifelse(tipo_objetivo == "min", row_custo$custo_unitario, -row_custo$lucro_unitario)
  }

  # Restrições
  f.con <- list()
  f.dir <- c()
  f.rhs <- c()

  # Recursos
  for (r in seq_len(nrow(recursos))) {
    linha <- numeric(num_vars)
    for (i in 1:num_vars) {
      linha[i] <- consumo %>%
        filter(
          produto_id == vars_map$produto_id[i],
          modo_id == vars_map$modo_id[i],
          recurso_id == recursos$id[r]
        ) %>%
        pull(consumo_unitario) %>%
        { if (length(.) == 0) 0 else . }
    }
    f.con[[length(f.con) + 1]] <- linha
    f.dir <- c(f.dir, "<=")
    f.rhs <- c(f.rhs, recursos$capacidade[r])
  }

  # Demanda terceirizada mínima por produto
  for (m in seq_len(nrow(produtos))) {
    linha <- numeric(num_vars)
    for (i in 1:num_vars) {
      if (vars_map$produto_id[i] == produtos$id[m] && vars_map$modo_id[i] == 2) {
        linha[i] <- 1
      }
    }
    f.con[[length(f.con) + 1]] <- linha
    f.dir <- c(f.dir, ">=")
    f.rhs <- c(f.rhs, produtos$demanda_terceirizada_minima[m])
  }

  # Demanda mínima total por produto
  for (m in seq_len(nrow(produtos))) {
    linha <- numeric(num_vars)
    for (i in 1:num_vars) {
      if (vars_map$produto_id[i] == produtos$id[m]) {
        linha[i] <- 1
      }
    }
    f.con[[length(f.con) + 1]] <- linha
    f.dir <- c(f.dir, ">=")
    f.rhs <- c(f.rhs, produtos$demanda_minima_total[m])
  }

  # Demanda total (todos os modos)
  linha_demanda_total <- rep(1, num_vars)
  f.con[[length(f.con) + 1]] <- linha_demanda_total
  f.dir <- c(f.dir, ">=")
  f.rhs <- c(f.rhs, demanda_total)

  # Resolução
  f.con <- do.call(rbind, f.con)
  sol <- lpSolve::lp(
    direction = tipo_objetivo,
    objective.in = f.obj,
    const.mat = f.con,
    const.dir = f.dir,
    const.rhs = f.rhs,
    all.int = FALSE
  )

  if (sol$status == 0) {
    resultado <- setNames(sol$solution, var_names)
    if (tipo_objetivo == "max") sol$objval <- -sol$objval
    list(
      status = "Sucesso",
      valor_objetivo = sol$objval,
      quantidades_produzidas = as.list(resultado),
      produtos_data = produtos,
      modos_producao_data = modos,
      recursos_data = recursos
    )
  } else {
    list(
      status = paste("Falha - código", sol$status),
      mensagem = "Solução inviável. Verifique as demandas e capacidades."
    )
  }
}
