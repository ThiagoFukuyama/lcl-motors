# run_api.R
library(plumber)

# Carrega o arquivo da API
pr <- plumb("api.r")

# Inicia o servidor na porta 8000 (por exemplo)
pr$run(port = 8000)
