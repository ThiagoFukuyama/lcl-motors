import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import ProdutoModal from "../components/ProdutoModal";

interface Modelo {
    id: number;
    nome: string;
}

const Produtos = () => {
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [produtoParaExcluir, setProdutoParaExcluir] = useState<Modelo | null>(
        null
    );
    const [produtoEmEdicao, setProdutoEmEdicao] = useState<Modelo | null>(null);
    const [mostrarModalProduto, setMostrarModalProduto] = useState(false);
    const [recursos, setRecursos] = useState<{ id: number; nome: string }[]>(
        []
    );

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const [resModelos, resRecursos] = await Promise.all([
                    fetch("/api/modelos"),
                    fetch("/api/recursos"),
                ]);

                const dataModelos = await resModelos.json();
                const dataRecursos = await resRecursos.json();

                setModelos(dataModelos.modelos);
                setRecursos(dataRecursos.recursos);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };

        fetchDados();
    }, []);

    const handleConfirmarExclusao = () => {
        if (!produtoParaExcluir) return;
        console.log("Excluir produto:", produtoParaExcluir);
        setProdutoParaExcluir(null);
    };

    const handleSalvarProduto = (produto: any) => {
        console.log("Salvar produto:", produto);
        setMostrarModalProduto(false);
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
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modelos.map((modelo, idx) => (
                            <tr
                                key={modelo.id}
                                className={`transition-all ${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-[#f5eaea]`}
                            >
                                <td className="px-6 py-4">{modelo.id}</td>
                                <td className="px-6 py-4">{modelo.nome}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            title="Editar"
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            onClick={() => {
                                                setProdutoEmEdicao(modelo);
                                                setMostrarModalProduto(true);
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            title="Excluir"
                                            className="text-red-600 hover:text-red-800 transition"
                                            onClick={() =>
                                                setProdutoParaExcluir(modelo)
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
                produto={produtoEmEdicao}
                recursos={recursos}
            />
        </div>
    );
};

export default Produtos;
