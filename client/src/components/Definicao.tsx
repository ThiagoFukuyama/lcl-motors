// client/src/components/Definicao.tsx
import { useState, useEffect } from "react";
import type {
    DemandaInput,
    CapacidadeInput,
    ResultadoPL,
} from "../pages/Problema";
import { Eraser } from "lucide-react";

interface Modelo {
    id: number;
    nome: string;
}

interface Recurso {
    id: number;
    nome: string;
    capacidade: number;
}

interface DefinicaoProps {
    onResolver: (resultado: ResultadoPL) => void;
}

export default function Definicao({ onResolver }: DefinicaoProps) {
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [demandas, setDemandas] = useState<DemandaInput[]>([]);
    const [capacidades, setCapacidades] = useState<CapacidadeInput[]>([]);
    const [tipoObjetivo, setTipoObjetivo] = useState<"min" | "max">("min");

    // Carrega modelos e recursos do backend ao iniciar o componente
    useEffect(() => {
        const fetchDadosIniciais = async () => {
            try {
                const [resModelos, resRecursos] = await Promise.all([
                    fetch("/api/modelos"),
                    fetch("/api/recursos"),
                ]);

                const dataModelos = await resModelos.json();
                const dataRecursos = await resRecursos.json();

                const fetchedModelos: Modelo[] = dataModelos.modelos || [];
                const fetchedRecursos: Recurso[] = dataRecursos.recursos || [];

                setModelos(fetchedModelos);
                setRecursos(fetchedRecursos);

                // Inicializa as demandas com base nos modelos carregados
                const initialDemandas: DemandaInput[] = fetchedModelos.map(
                    (m) => ({
                        modelo_id: m.id,
                        quantidade: 0, // Valor inicial da demanda
                    })
                );
                setDemandas(initialDemandas);

                // Inicializa as capacidades com base nos recursos carregados
                const initialCapacidades: CapacidadeInput[] =
                    fetchedRecursos.map((r) => ({
                        recurso_id: r.id,
                        capacidade: r.capacidade, // Usa a capacidade padrão do DB
                    }));
                setCapacidades(initialCapacidades);
            } catch (error) {
                console.error(
                    "Erro ao buscar dados iniciais (modelos/recursos):",
                    error
                );
            }
        };

        fetchDadosIniciais();
    }, []);

    const handleDemandaChange = (modeloId: number, quantidade: number) => {
        setDemandas((prev) =>
            prev.map((d) =>
                d.modelo_id === modeloId ? { ...d, quantidade } : d
            )
        );
    };

    const handleCapacidadeChange = (recursoId: number, capacidade: number) => {
        setCapacidades((prev) =>
            prev.map((c) =>
                c.recurso_id === recursoId ? { ...c, capacidade } : c
            )
        );
    };

    const handleLimpar = () => {
        // Reinicializa as demandas e capacidades para seus estados originais
        setDemandas(modelos.map((m) => ({ modelo_id: m.id, quantidade: 0 })));
        setCapacidades(
            recursos.map((r) => ({
                recurso_id: r.id,
                capacidade: r.capacidade,
            }))
        );
        setTipoObjetivo("min");
    };

    const podeResolver =
        demandas.length > 0 && demandas.every((d) => d.quantidade >= 0);

    const handleClickResolver = async () => {
        if (!podeResolver) return;

        try {
            const payload = {
                tipo_objetivo: tipoObjetivo,
                demandas_personalizadas: demandas,
                capacidades_personalizadas: capacidades, // Envia as capacidades também
            };

            const response = await fetch("api/solucionar", {
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

                {/* Seção de Demandas */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border-1 border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Demandas de Modelos (unidades)
                    </h2>
                    <div className="space-y-3">
                        {modelos.map((modelo) => (
                            <div
                                key={modelo.id}
                                className="flex items-center gap-4"
                            >
                                <label className="w-24 text-gray-700 font-medium">
                                    {modelo.nome}:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        demandas.find(
                                            (d) => d.modelo_id === modelo.id
                                        )?.quantidade || ""
                                    }
                                    onChange={(e) =>
                                        handleDemandaChange(
                                            modelo.id,
                                            Number(e.target.value)
                                        )
                                    }
                                    className="p-2 rounded border shadow-sm flex-1 w-full"
                                    placeholder="Quantidade demandada"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção de Capacidades de Recursos */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border-1 border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Capacidades de Recursos (horas)
                    </h2>
                    <div className="space-y-3">
                        {recursos.map((recurso) => (
                            <div
                                key={recurso.id}
                                className="flex items-center gap-4"
                            >
                                <label className="w-24 text-gray-700 font-medium">
                                    {recurso.nome}:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        capacidades.find(
                                            (c) => c.recurso_id === recurso.id
                                        )?.capacidade || ""
                                    }
                                    onChange={(e) =>
                                        handleCapacidadeChange(
                                            recurso.id,
                                            Number(e.target.value)
                                        )
                                    }
                                    className="p-2 rounded border shadow-sm flex-1 w-full"
                                    placeholder="Capacidade disponível"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tipo de Objetivo */}
                <div className="rounded-xl shadow-md p-4 mb-6 bg-white border-1 border-gray-300">
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
                                ? "Preencha as demandas antes de resolver"
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
