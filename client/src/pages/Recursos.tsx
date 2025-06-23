import { Puzzle, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import RecursoModal from "../components/RecursoModal";

interface Recurso {
    id?: number;
    nome: string;
    capacidade: number;
}

const Recursos = () => {
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [recursoParaExcluir, setRecursoParaExcluir] =
        useState<Recurso | null>(null);
    const [recursoEmEdicao, setRecursoEmEdicao] = useState<Recurso | null>(
        null
    );
    const [mostrarModalRecurso, setMostrarModalRecurso] = useState(false);

    useEffect(() => {
        const fetchRecursos = async () => {
            try {
                const response = await fetch("/api/recursos");
                const data = await response.json();
                setRecursos(data.recursos);
            } catch (error) {
                console.error("Erro ao buscar recursos:", error);
            }
        };

        fetchRecursos();
    }, []);

    const handleConfirmarExclusao = () => {
        if (!recursoParaExcluir) return;
        console.log("Excluir recurso:", recursoParaExcluir);
        setRecursoParaExcluir(null);
    };

    const handleSalvarRecurso = (recurso: Recurso) => {
        console.log("Salvar recurso:", recurso);
        setMostrarModalRecurso(false);
    };

    return (
        <div className="w-full min-h-screen px-15 py-8">
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-3 items-center">
                    <Puzzle size={30} color="#8B0000" />
                    <h1 className="text-3xl font-bold text-[#8B0000]">
                        Recursos
                    </h1>
                </div>
                <button
                    className="w-10 h-10 rounded-full bg-[#8B0000] text-white flex items-center justify-center hover:bg-[#a52a2a] transition-all shadow-md"
                    aria-label="Adicionar Recurso"
                    onClick={() => {
                        setRecursoEmEdicao(null);
                        setMostrarModalRecurso(true);
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
                            <th className="px-6 py-4">Capacidade</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recursos.map((recurso, idx) => (
                            <tr
                                key={recurso.id}
                                className={`transition-all ${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-[#f5eaea]`}
                            >
                                <td className="px-6 py-4">{recurso.id}</td>
                                <td className="px-6 py-4">{recurso.nome}</td>
                                <td className="px-6 py-4">
                                    {recurso.capacidade}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            title="Editar"
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            onClick={() => {
                                                setRecursoEmEdicao(recurso);
                                                setMostrarModalRecurso(true);
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            title="Excluir"
                                            className="text-red-600 hover:text-red-800 transition"
                                            onClick={() =>
                                                setRecursoParaExcluir(recurso)
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
                isOpen={!!recursoParaExcluir}
                title="Confirmação de Exclusão"
                subtitle="Deseja realmente remover o recurso?"
                onConfirm={handleConfirmarExclusao}
                onCancel={() => setRecursoParaExcluir(null)}
            />

            <RecursoModal
                isOpen={mostrarModalRecurso}
                onClose={() => setMostrarModalRecurso(false)}
                onSave={handleSalvarRecurso}
                recurso={recursoEmEdicao}
            />
        </div>
    );
};

export default Recursos;
