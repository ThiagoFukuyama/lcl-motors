import { useState } from "react";
import Definicao from "../components/Definicao";
import Resultado from "../components/Resultado";

export interface ResultadoPL {
    status: string[];
    valor_objetivo: number[];
    quantidades_produzidas: { [key: string]: number[] };
    mensagem?: string;
    produtos_data: {
        id: number;
        nome: string;
        demanda_terceirizada_minima: number;
        demanda_minima_total: number;
    }[];
    modos_producao_data: { id: number; nome: string }[];
    recursos_data: { id: number; nome: string; capacidade: number }[];
}

export default function Problema() {
    const [resultado, setResultado] = useState<ResultadoPL | null>(null);

    const handleResolver = (res: ResultadoPL) => {
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
                <Definicao onResolver={handleResolver} />
            )}
        </>
    );
}
