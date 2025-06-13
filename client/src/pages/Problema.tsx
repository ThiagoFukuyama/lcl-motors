// client/src/pages/Problema.tsx
import { useState } from "react";
import Definicao from "../components/Definicao";
import Resultado from "../components/Resultado";

// Interfaces para os dados que o frontend vai gerenciar e enviar
export interface DemandaInput {
    modelo_id: number;
    quantidade: number;
}

export interface CapacidadeInput {
    recurso_id: number;
    capacidade: number;
}

// Interface para o resultado da PL retornado pelo backend (ATUALIZADA)
export interface ResultadoPL {
    status: string[]; // Continua como array (ex: ["Sucesso"])
    valor_objetivo: number[]; // Continua como array de 1 elemento
    quantidades_produzidas: { [key: string]: number[] }; // Objeto nomeado com valores que são arrays de 1 número
    mensagem?: string; // Para mensagens de erro ou inviabilidade
    // --- NOVAS PROPRIEDADES ADICIONADAS ---
    modelos_data: { id: number; nome: string }[];
    modos_producao_data: { id: number; nome: string }[];
    recursos_data: { id: number; nome: string; capacidade: number }[];
    consumo_recursos_data: { modelo_id: number; modo_id: number; recurso_id: number; consumo_unitario: number }[];
    demandas_input: DemandaInput[]; // Demandas que o usuário inseriu
    // --- FIM DAS NOVAS PROPRIEDADES ---
}


export default function Problema() {
    const [resultado, setResultado] = useState<ResultadoPL | null>(null);

    const handleResolver = async (res: ResultadoPL) => {
        setResultado(res);
    };

    const handleVoltar = () => {
        setResultado(null);
    };

    return (
        <>
            {resultado ? (
                <Resultado resultado={resultado} onVoltar={handleVoltar} />
            ) : (
                <Definicao
                    onResolver={handleResolver}
                />
            )}
        </>
    );
}