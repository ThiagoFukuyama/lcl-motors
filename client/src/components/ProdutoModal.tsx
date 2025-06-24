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
    const [lucroInterno, setLucroInterno] = useState(0);
    const [custoExterno, setCustoExterno] = useState(0);
    const [lucroExterno, setLucroExterno] = useState(0);
    const [demandaMinimaTerceirizada, setDemandaMinimaTerceirizada] =
        useState(0);
    const [demandaMinimaTotal, setDemandaMinimaTotal] = useState(0);

    useEffect(() => {
        if (produto) {
            setNome(produto.nome || "");
            setCustoInterno(produto.custoInterno || 0);
            setLucroInterno(produto.lucroInterno || 0);
            setCustoExterno(produto.custoExterno || 0);
            setLucroExterno(produto.lucroExterno || 0);
            setDemandaMinimaTerceirizada(
                produto.demandaMinimaTerceirizada || 0
            );
            setDemandaMinimaTotal(produto.demandaMinimaTotal || 0);
            setConsumos(produto.consumos || {});
        } else {
            setNome("");
            setCustoInterno(0);
            setLucroInterno(0);
            setCustoExterno(0);
            setLucroExterno(0);
            setDemandaMinimaTerceirizada(0);
            setDemandaMinimaTotal(0);
            setConsumos({});
        }
    }, [produto]);

    const handleChangeConsumo = (recursoId: number, valor: number) => {
        setConsumos((prev) => ({ ...prev, [recursoId]: valor }));
    };

    const handleSalvar = () => {
        onSave({
            id: produto?.id, // aqui o id se existir
            nome,
            consumos,
            custoInterno,
            lucroInterno,
            custoExterno,
            lucroExterno,
            demandaMinimaTerceirizada,
            demandaMinimaTotal,
        });
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

                    <div>
                        <label className="block mb-1 font-semibold">
                            Consumo de Recursos:
                        </label>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                            {recursos.map((recurso) => (
                                <div key={recurso.id}>
                                    <label className="text-sm">
                                        {recurso.nome}:
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
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                Lucro produção interna:
                            </label>
                            <input
                                type="number"
                                className="w-full mt-1 p-2 border rounded"
                                value={lucroInterno}
                                onChange={(e) =>
                                    setLucroInterno(Number(e.target.value))
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
                                Lucro produção externa:
                            </label>
                            <input
                                type="number"
                                className="w-full mt-1 p-2 border rounded"
                                value={lucroExterno}
                                onChange={(e) =>
                                    setLucroExterno(Number(e.target.value))
                                }
                            />
                        </div>

                        <div>
                            <label className="font-medium">
                                Demanda mínima terceirizada:
                            </label>
                            <input
                                type="number"
                                className="w-full mt-1 p-2 border rounded"
                                value={demandaMinimaTerceirizada}
                                onChange={(e) =>
                                    setDemandaMinimaTerceirizada(
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className="font-medium">
                                Demanda mínima total:
                            </label>
                            <input
                                type="number"
                                className="w-full mt-1 p-2 border rounded"
                                value={demandaMinimaTotal}
                                onChange={(e) =>
                                    setDemandaMinimaTotal(
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
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
