import {
    useState,
    useRef,
    useEffect,
    type SetStateAction,
    type Dispatch,
} from "react";
import { Plus, Trash2, Pencil, Eraser } from "lucide-react";
import type { Restricao, Resultado, Variavel } from "../pages/Problema";

interface Modelo {
    id: number;
    nome: string;
}

interface ModoProducao {
    id: number;
    nome: string;
}

interface DefinicaoProps {
    variaveis: Variavel[];
    setVariaveis: Dispatch<SetStateAction<Variavel[]>>;
    restricoes: Restricao[];
    setRestricoes: Dispatch<SetStateAction<Restricao[]>>;
    onResolver: (resultado: Resultado) => void;
}

export default function Definicao({
    variaveis,
    setVariaveis,
    restricoes,
    setRestricoes,
    onResolver,
}: DefinicaoProps) {
    const [restricaoSelecionada, setRestricaoSelecionada] =
        useState<Restricao | null>(null);

    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [modosProducao, setModosProducao] = useState<ModoProducao[]>([]);

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const [resModelos, resModos] = await Promise.all([
                    fetch("/api/modelos"),
                    fetch("/api/modos_producao"),
                ]);

                const dataModelos = await resModelos.json();
                const dataModos = await resModos.json();

                setModelos(dataModelos.modelos || []);
                setModosProducao(dataModos.modelos || []);
            } catch (error) {
                console.error("Erro ao buscar dados dos selects:", error);
            }
        };

        fetchDados();
    }, []);

    const variaveisListRef = useRef<HTMLUListElement>(null);
    const restricoesListRef = useRef<HTMLUListElement>(null);

    const handleAdicionarVariavel = () => {
        setVariaveis((old) => [...old, { motor: "", tipo: "", constante: 1 }]);

        setRestricoes((oldRestricoes) =>
            oldRestricoes.map((r) => ({
                ...r,
                coeficientes: [...r.coeficientes, 0],
            }))
        );
    };

    const handleExcluirVariavel = (index: number) => {
        const novasVariaveis = [...variaveis];
        novasVariaveis.splice(index, 1);
        setVariaveis(novasVariaveis);

        const novasRestricoes = restricoes.map((r) => {
            const novosCoef = [...r.coeficientes];
            novosCoef.splice(index, 1);
            return { ...r, coeficientes: novosCoef };
        });
        setRestricoes(novasRestricoes);
    };

    const handleAdicionarRestricao = () => {
        const nova: Restricao = {
            id: crypto.randomUUID(),
            titulo: `Restrição ${restricoes.length + 1}`,
            coeficientes: Array(variaveis.length).fill(0),
            operador: "<=",
            valor: 0,
        };
        setRestricoes((old) => [...old, nova]);
    };

    const handleEditarRestricao = (restricao: Restricao) => {
        setRestricaoSelecionada({ ...restricao });
    };

    const handleAtualizarRestricao = (dados: Partial<Restricao>) => {
        if (!restricaoSelecionada) return;
        setRestricaoSelecionada({ ...restricaoSelecionada, ...dados });
    };

    const handleSalvarRestricao = () => {
        if (!restricaoSelecionada) return;
        const atualizadas = restricoes.map((r) =>
            r.id === restricaoSelecionada.id ? restricaoSelecionada : r
        );
        setRestricoes(atualizadas);
        setRestricaoSelecionada(null);
    };

    const fecharModal = () => {
        setRestricaoSelecionada(null);
    };

    useEffect(() => {
        if (variaveisListRef.current) {
            variaveisListRef.current.scrollTo({
                top: variaveisListRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [variaveis]);

    useEffect(() => {
        if (restricoesListRef.current) {
            restricoesListRef.current.scrollTo({
                top: restricoesListRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [restricoes]);

    const variaveisInvalidas = variaveis.some(
        (v) => v.motor === "" || v.tipo === ""
    );

    const podeResolver =
        variaveis.length > 0 && restricoes.length > 0 && !variaveisInvalidas;

    const handleClickResolver = async () => {
        if (!podeResolver) return;

        try {
            const response = await fetch("api/solucionar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tipo_objetivo: "min",
                    variaveis,
                    restricoes,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }

            const resultado = await response.json();

            onResolver(resultado);
        } catch (error) {
            console.error("Erro ao resolver:", error);
            alert("Erro ao resolver o problema, veja o console.");
        }
    };

    return (
        <div className="min-h-screen bg-white py-10">
            <div className="max-w-6xl mx-auto px-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-[#8B0000]">
                        Definição do Problema
                    </h1>
                    <button
                        onClick={() => {
                            setVariaveis([]);
                            setRestricoes([]);
                        }}
                        title="Limpar"
                        className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition cursor-pointer"
                    >
                        <Eraser size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex gap-6">
                    {/* Box Variáveis */}
                    <div className="flex-1 border rounded-xl p-4 shadow-md bg-gray-50 flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Variáveis
                            </h2>
                            <button
                                onClick={handleAdicionarVariavel}
                                className="p-2 bg-[#8B0000] text-white rounded-full shadow-lg hover:bg-[#6e0000] transition cursor-pointer"
                                title="Adicionar variável"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <ul
                            ref={variaveisListRef}
                            className="space-y-2 overflow-y-auto flex-1 pr-1"
                        >
                            {variaveis.map((variavel, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <button
                                        onClick={() =>
                                            handleExcluirVariavel(index)
                                        }
                                        className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer"
                                        title="Excluir variável"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <select
                                        className="p-2 rounded bg-white shadow-sm flex-1 cursor-pointer"
                                        value={variavel.motor}
                                        onChange={(e) => {
                                            const updated = [...variaveis];
                                            updated[index].motor =
                                                e.target.value;
                                            setVariaveis(updated);
                                        }}
                                    >
                                        <option value="">
                                            -- Selecione motor --
                                        </option>
                                        {modelos.map((modelo) => (
                                            <option
                                                key={modelo.id}
                                                value={modelo.nome}
                                            >
                                                {modelo.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="p-2 rounded bg-white shadow-sm flex-1 cursor-pointer"
                                        value={variavel.tipo}
                                        onChange={(e) => {
                                            const updated = [...variaveis];
                                            updated[index].tipo =
                                                e.target.value;
                                            setVariaveis(updated);
                                        }}
                                    >
                                        <option value="">
                                            -- Selecione tipo --
                                        </option>
                                        {modosProducao.map((modo) => (
                                            <option
                                                key={modo.id}
                                                value={modo.nome}
                                            >
                                                {modo.nome}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        className="p-1.5 rounded bg-white shadow-sm w-20"
                                        value={
                                            isNaN(variavel.constante)
                                                ? ""
                                                : variavel.constante
                                        }
                                        onChange={(e) => {
                                            const updated = [...variaveis];
                                            updated[index].constante =
                                                e.target.valueAsNumber ?? 1;
                                            setVariaveis(updated);
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Box Restrições */}
                    <div className="flex-1 border rounded-xl p-4 shadow-md bg-gray-50 flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Restrições
                            </h2>
                            <button
                                onClick={handleAdicionarRestricao}
                                className="p-2 bg-[#8B0000] text-white rounded-full shadow-lg hover:bg-[#6e0000] transition cursor-pointer"
                                title="Adicionar restrição"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <ul
                            ref={restricoesListRef}
                            className="space-y-2 overflow-y-auto flex-1 pr-1"
                        >
                            {restricoes.map((restricao) => (
                                <li key={restricao.id}>
                                    <button
                                        onClick={() =>
                                            handleEditarRestricao(restricao)
                                        }
                                        className="w-full text-left p-2 bg-white rounded shadow hover:bg-gray-100 transition cursor-pointer"
                                        title="Editar restrição"
                                    >
                                        {restricao.titulo}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
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
                                ? "Preencha todas as variáveis e restrições antes de resolver"
                                : "Resolver"
                        }
                    >
                        Resolver
                    </button>
                </div>
            </div>

            {/* Modal */}
            {restricaoSelecionada && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-hidden shadow-lg flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Pencil size={20} className="text-[#8B0000]" />
                            <input
                                min={0}
                                className="border rounded p-2 flex-1"
                                value={restricaoSelecionada.titulo}
                                onChange={(e) =>
                                    handleAtualizarRestricao({
                                        titulo: e.target.value,
                                    })
                                }
                            />
                            <button
                                onClick={() => {
                                    setRestricoes((old) =>
                                        old.filter(
                                            (r) =>
                                                r.id !== restricaoSelecionada.id
                                        )
                                    );
                                    setRestricaoSelecionada(null);
                                }}
                                className="p-2 rounded bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer"
                                title="Remover restrição"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4 flex-1 overflow-y-auto pr-1">
                            {restricaoSelecionada.coeficientes.map(
                                (coef, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <label className="w-12 font-semibold text-gray-600">{`x${
                                            i + 1
                                        }`}</label>
                                        <input
                                            type="number"
                                            value={coef}
                                            onChange={(e) => {
                                                const novoCoef = Number(
                                                    e.target.value
                                                );
                                                const novosCoef =
                                                    restricaoSelecionada.coeficientes.slice();
                                                novosCoef[i] = novoCoef;
                                                handleAtualizarRestricao({
                                                    coeficientes: novosCoef,
                                                });
                                            }}
                                            className="p-1 rounded border w-full"
                                        />
                                    </div>
                                )
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <select
                                value={restricaoSelecionada.operador}
                                onChange={(e) =>
                                    handleAtualizarRestricao({
                                        operador: e.target.value as
                                            | "<="
                                            | ">="
                                            | "=",
                                    })
                                }
                                className="p-2 rounded border cursor-pointer flex-1"
                            >
                                <option value="<=">Menor ou igual (≤=)</option>
                                <option value="=">Igual (=)</option>
                                <option value=">=">Maior ou igual (≥=)</option>
                            </select>
                            <input
                                type="number"
                                value={restricaoSelecionada.valor}
                                onChange={(e) =>
                                    handleAtualizarRestricao({
                                        valor: Number(e.target.value),
                                    })
                                }
                                className="p-2 rounded border flex-1"
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={handleSalvarRestricao}
                                className="px-3 py-1 rounded bg-[#8B0000] text-white hover:bg-[#6e0000]"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={fecharModal}
                                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
