import { useState } from "react";
import Definicao from "../components/Definicao";
import Resultado from "../components/Resultado";

export default function Problema() {
    const [resultado, setResultado] = useState<any | null>(null);

    const handleResolver = async (dadosDoProblema: any) => {
        const resultadoFake = {
            variaveis: [
                { nome: "x1", valor: 5 },
                { nome: "x2", valor: 12 },
                { nome: "x3", valor: 7 },
            ],
            valorZ: 42,
            imagemUrl:
                "https://via.placeholder.com/300x200?text=Gr%C3%A1fico+Exemplo",
        };

        setResultado(resultadoFake);
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
