import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface Recurso {
    id?: number;
    nome: string;
    capacidade: number;
}

interface RecursoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recurso: Recurso) => void;
    recurso: Recurso | null;
}

export default function RecursoModal({
    isOpen,
    onClose,
    onSave,
    recurso,
}: RecursoModalProps) {
    const [nome, setNome] = useState("");
    const [capacidade, setCapacidade] = useState(0);

    useEffect(() => {
        if (recurso) {
            setNome(recurso.nome);
            setCapacidade(recurso.capacidade);
        } else {
            setNome("");
            setCapacidade(0);
        }
    }, [recurso]);

    if (!isOpen) return null;

    const handleSalvar = () => {
        onSave({
            id: recurso?.id,
            nome,
            capacidade,
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#8B0000]">
                        {recurso ? "Editar Recurso" : "Novo Recurso"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Recurso
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full p-2 border rounded shadow-sm"
                            placeholder="Ex: Montagem"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacidade (horas)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={capacidade}
                            onChange={(e) =>
                                setCapacidade(Number(e.target.value))
                            }
                            className="w-full p-2 border rounded shadow-sm"
                            placeholder="Ex: 8000"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
