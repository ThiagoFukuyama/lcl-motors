// src/components/ProdutoModal.tsx
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProdutoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (produto: any) => void;
    produto?: any;
    recursos: { id: number; nome: string }[];
}

const ProdutoModal = ({
    isOpen,
    onClose,
    onSave,
    produto,
    recursos,
}: ProdutoModalProps) => {
    const [nome, setNome] = useState("");
    const [consumos, setConsumos] = useState<Record<number, number>>({});
    const [custoInterno, setCustoInterno] = useState(0);
    const [custoExterno, setCustoExterno] = useState(0);
    const [demandaExterna, setDemandaExterna] = useState(0);

    useEffect(() => {
        if (produto) {
            setNome(produto.nome || "");
            setCustoInterno(produto.custoInterno || 0);
            setCustoExterno(produto.custoExterno || 0);
            setDemandaExterna(produto.demandaExterna || 0);
            setConsumos(produto.consumos || {});
        } else {
            setNome("");
            setCustoInterno(0);
            setCustoExterno(0);
            setDemandaExterna(0);
            setConsumos({});
        }
    }, [produto]);

    const handleChangeConsumo = (recursoId: number, valor: number) => {
        setConsumos((prev) => ({ ...prev, [recursoId]: valor }));
    };

    const handleSalvar = () => {
        onSave({ nome, consumos, custoInterno, custoExterno, demandaExterna });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {produto ? `Editar ${produto.nome}` : "Novo Produto"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="font-medium">Nome:</label>
                        <input
                            className="w-full mt-1 p-2 border rounded"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    {recursos.map((recurso) => (
                        <div key={recurso.id}>
                            <label className="font-medium">
                                Consumo {recurso.nome}:
                            </label>
                            <input
                                type="number"
                                className="w-full mt-1 p-2 border rounded"
                                value={consumos[recurso.id] || ""}
                                onChange={(e) =>
                                    handleChangeConsumo(
                                        recurso.id,
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    ))}

                    <div>
                        <label className="font-medium">
                            Custo produção interna:
                        </label>
                        <input
                            type="number"
                            className="w-full mt-1 p-2 border rounded"
                            value={custoInterno}
                            onChange={(e) =>
                                setCustoInterno(Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Custo produção externa:
                        </label>
                        <input
                            type="number"
                            className="w-full mt-1 p-2 border rounded"
                            value={custoExterno}
                            onChange={(e) =>
                                setCustoExterno(Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Demanda produção externa:
                        </label>
                        <input
                            type="number"
                            className="w-full mt-1 p-2 border rounded"
                            value={demandaExterna}
                            onChange={(e) =>
                                setDemandaExterna(Number(e.target.value))
                            }
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProdutoModal;
