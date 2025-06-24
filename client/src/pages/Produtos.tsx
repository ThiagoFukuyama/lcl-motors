import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import ProdutoModal from "../components/ProdutoModal";

interface Custo {
    modo_id: number;
    custo_unitario: number;
    lucro_unitario: number;
}

interface Produto {
    id: number;
    nome: string;
    demandaMinimaTotal?: number;
    demandaMinimaTerceirizada?: number;
    custos?: Custo[];
    consumos?: Record<number, number>; // recurso_id => consumo_unitario
}

const Produtos = () => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [produtoParaExcluir, setProdutoParaExcluir] =
        useState<Produto | null>(null);
    const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(
        null
    );
    const [mostrarModalProduto, setMostrarModalProduto] = useState(false);
    const [recursos, setRecursos] = useState<{ id: number; nome: string }[]>(
        []
    );

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const [resProdutos, resRecursos] = await Promise.all([
                    fetch("/api/produtos"),
                    fetch("/api/recursos"),
                ]);

                const dataProdutos = await resProdutos.json();
                const dataRecursos = await resRecursos.json();

                setProdutos(dataProdutos.produtos);
                setRecursos(dataRecursos.recursos);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };

        fetchDados();
    }, []);

    const handleConfirmarExclusao = async () => {
        if (!produtoParaExcluir || !produtoParaExcluir.id) return;

        try {
            const response = await fetch(
                `/api/produto/${produtoParaExcluir.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Erro ao excluir o produto.");
            }

            setProdutos((prev) =>
                prev.filter((p) => p.id !== produtoParaExcluir.id)
            );

            setProdutoParaExcluir(null);
            setMostrarModalProduto(false);
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao excluir o produto.");
        }
    };

    const handleSalvarProduto = async (produto: any) => {
        try {
            const payload = {
                nome: produto.nome,
                demanda_terceirizada_minima:
                    produto.demandaMinimaTerceirizada || 0,
                demanda_minima_total: produto.demandaMinimaTotal || 0,
                custos: [
                    {
                        modo_id: 1,
                        custo_unitario: produto.custoInterno || 0,
                        lucro_unitario: produto.lucroInterno || 0,
                    },
                    {
                        modo_id: 2,
                        custo_unitario: produto.custoExterno || 0,
                        lucro_unitario: produto.lucroExterno || 0,
                    },
                ],
                consumos: Object.entries(produto.consumos || {})
                    .filter(([_, v]) => !isNaN(v as number) && v !== null)
                    .map(([recursoId, consumoUnitario]) => ({
                        recurso_id: Number(recursoId),
                        consumo_unitario: Number(consumoUnitario),
                    })),
            };

            let response;
            if (produto.id) {
                // Update
                response = await fetch(`/api/produto/${produto.id}`, {
                    method: "PUT", // ou PATCH, dependendo do backend
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                // Insert
                response = await fetch("/api/produto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (!response.ok) {
                throw new Error("Erro ao salvar o produto.");
            }

            // Atualiza lista
            const resProdutos = await fetch("/api/produtos");
            const dataProdutos = await resProdutos.json();
            setProdutos(dataProdutos.produtos);

            setMostrarModalProduto(false);
            setProdutoEmEdicao(null);
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao salvar o produto.");
        }
    };

    // Função para adaptar o produto bruto para o formato esperado pelo modal
    const adaptarProdutoParaModal = (produto: Produto) => {
        return {
            ...produto,
            custoInterno:
                produto.custos?.find((c) => c.modo_id === 1)?.custo_unitario ||
                0,
            lucroInterno:
                produto.custos?.find((c) => c.modo_id === 1)?.lucro_unitario ||
                0,
            custoExterno:
                produto.custos?.find((c) => c.modo_id === 2)?.custo_unitario ||
                0,
            lucroExterno:
                produto.custos?.find((c) => c.modo_id === 2)?.lucro_unitario ||
                0,
            demandaMinimaTerceirizada: produto.demandaMinimaTerceirizada || 0,
            demandaMinimaTotal: produto.demandaMinimaTotal || 0,
            consumos: produto.consumos || {},
        };
    };

    return (
        <div className="w-full min-h-screen px-15 py-8">
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-3 items-center">
                    <Package size={30} color="#8B0000" />
                    <h1 className="text-3xl font-bold text-[#8B0000]">
                        Produtos
                    </h1>
                </div>
                <button
                    className="w-10 h-10 rounded-full bg-[#8B0000] text-white flex items-center justify-center hover:bg-[#a52a2a] transition-all shadow-md"
                    aria-label="Adicionar Produto"
                    onClick={() => {
                        setProdutoEmEdicao(null);
                        setMostrarModalProduto(true);
                    }}
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl shadow-md">
                <table className="min-w-full text-sm text-left bg-white">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Demanda Ext.</th>
                            <th className="px-6 py-4">Custo Int.</th>
                            <th className="px-6 py-4">Custo Ext.</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produtos?.map((produto, idx) => (
                            <tr
                                key={produto.id?.[0] || idx}
                                className={`transition-all ${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-[#f5eaea]`}
                            >
                                <td className="px-6 py-4">
                                    {produto.id?.[0] ?? "-"}
                                </td>
                                <td className="px-6 py-4">
                                    {produto.nome?.[0] ?? "-"}
                                </td>
                                <td className="px-6 py-4">
                                    {produto.demandaMinimaTerceirizada?.[0] ??
                                        "-"}
                                </td>
                                <td className="px-6 py-4">
                                    {produto.custoInterno?.[0] ?? "-"}
                                </td>
                                <td className="px-6 py-4">
                                    {produto.custoExterno?.[0] ?? "-"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            title="Editar"
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            onClick={() => {
                                                setProdutoEmEdicao(produto);
                                                setMostrarModalProduto(true);
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            title="Excluir"
                                            className="text-red-600 hover:text-red-800 transition"
                                            onClick={() =>
                                                setProdutoParaExcluir(produto)
                                            }
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!produtoParaExcluir}
                title="Confirmação de Exclusão"
                subtitle="Deseja realmente remover o produto?"
                onConfirm={handleConfirmarExclusao}
                onCancel={() => setProdutoParaExcluir(null)}
            />

            <ProdutoModal
                isOpen={mostrarModalProduto}
                onClose={() => setMostrarModalProduto(false)}
                onSave={handleSalvarProduto}
                produto={produtoEmEdicao || undefined}
                recursos={recursos}
            />
        </div>
    );
};

export default Produtos;
