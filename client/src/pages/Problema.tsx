import { useState } from "react";
import Definicao from "../components/Definicao";
import Resultado from "../components/Resultado";

export interface Variavel {
    motor: string;
    tipo: string;
    constante: number;
}

export interface Restricao {
    id: string;
    titulo: string;
    coeficientes: number[];
    operador: "<=" | ">=" | "=";
    valor: number;
}

export interface Resultado {
    status: string[];
    tipo_objetivo: string[];
    valor_objetivo: number[];
    variaveis: number[];
}

export default function Problema() {
    const [variaveis, setVariaveis] = useState<Variavel[]>([]);
    const [restricoes, setRestricoes] = useState<Restricao[]>([]);
    const [resultado, setResultado] = useState<Resultado | null>(null);

    const handleResolver = async (resultado: Resultado) => {
        setResultado(resultado);
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
                    variaveis={variaveis}
                    setVariaveis={setVariaveis}
                    restricoes={restricoes}
                    setRestricoes={setRestricoes}
                    onResolver={handleResolver}
                />
            )}
        </>
    );
}
