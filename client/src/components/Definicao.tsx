// client/src/components/Definicao.tsx
import { useState, useEffect } from "react";
import { Eraser } from "lucide-react";

interface Modelo {
    id: number;
    nome: string;
}

interface DefinicaoProps {
    onResolver: (resultado: any) => void;
}

export default function Definicao({ onResolver }: DefinicaoProps) {
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
        []
    );
    const [tipoObjetivo, setTipoObjetivo] = useState<"min" | "max">("min");
    const [demandaTotal, setDemandaTotal] = useState<number>(0);

    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                const res = await fetch("/api/produtos");
                const data = await res.json();

                const fetchedModelos = (data.produtos || []).map((p: any) => ({
                    id: p.id[0],
                    nome: p.nome[0],
                }));

                setModelos(fetchedModelos);
                setProdutosSelecionados([]); // limpa seleção
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
            }
        };

        fetchProdutos();
    }, []);

    const handleSelecionarProdutos = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const options = Array.from(e.target.selectedOptions);
        const valores = options.map((opt) => opt.value);
        setProdutosSelecionados(valores);
    };

    const handleLimpar = () => {
        setProdutosSelecionados([]);
        setDemandaTotal(0);
        setTipoObjetivo("min");
    };

    const podeResolver =
        produtosSelecionados.length > 0 &&
        demandaTotal > 0 &&
        demandaTotal >= 0;

    const handleClickResolver = async () => {
        if (!podeResolver) return;

        try {
            const payload = {
                tipo_objetivo: tipoObjetivo,
                produtos: produtosSelecionados,
                demanda_total: demandaTotal,
            };

            const response = await fetch("/api/resolver", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.mensagem ||
                        `Erro na requisição: ${response.statusText}`
                );
            }

            const resultado = await response.json();
            onResolver(resultado);
        } catch (error: any) {
            console.error("Erro ao resolver:", error);
            alert(
                `Erro ao resolver o problema: ${
                    error.message || "Verifique o console."
                }`
            );
        }
    };

    return (
        <div className="min-h-screen py-10 bg-motors">
            <div className="max-w-4xl mx-auto px-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-[#8B0000]">
                        Definição do Problema LCL Motors
                    </h1>
                    <button
                        onClick={handleLimpar}
                        title="Limpar todos os campos"
                        className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition cursor-pointer"
                    >
                        <Eraser size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Select múltiplo produtos */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Selecione os Produtos
                    </h2>
                    <select
                        multiple
                        size={10}
                        value={produtosSelecionados}
                        onChange={handleSelecionarProdutos}
                        className="w-full p-2 border rounded shadow-sm cursor-pointer h-28 overflow-y-auto"
                    >
                        {modelos.map((modelo) => (
                            <option key={modelo.id} value={modelo.nome}>
                                {modelo.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Input demanda total */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Demanda Total (unidades)
                    </h2>
                    <input
                        type="number"
                        min={0}
                        value={demandaTotal || ""}
                        onChange={(e) =>
                            setDemandaTotal(Number(e.target.value))
                        }
                        placeholder="Digite a demanda total"
                        className="w-full p-2 border rounded shadow-sm"
                    />
                </div>

                {/* Tipo de Objetivo */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Tipo de Objetivo
                    </h2>
                    <select
                        value={tipoObjetivo}
                        onChange={(e) =>
                            setTipoObjetivo(e.target.value as "min" | "max")
                        }
                        className="p-2 rounded border shadow-sm w-full cursor-pointer"
                    >
                        <option value="min">Minimizar Custo Total</option>
                        {/* <option value="max">Maximizar Lucro</option> */}
                    </select>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        disabled={!podeResolver}
                        onClick={handleClickResolver}
                        className={`px-20 py-3 font-semibold rounded transition ${
                            !podeResolver
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                        }`}
                        title={
                            !podeResolver
                                ? "Selecione produtos e informe demanda total antes de resolver"
                                : "Resolver"
                        }
                    >
                        Resolver
                    </button>
                </div>
            </div>
        </div>
    );
}
