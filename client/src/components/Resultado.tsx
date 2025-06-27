import type { ResultadoPL } from "../pages/Problema";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

type ResultadoProps = {
    resultado: ResultadoPL;
    onVoltar: () => void;
};

export default function Resultado({ resultado, onVoltar }: ResultadoProps) {
    const {
        quantidades_produzidas,
        valor_objetivo,
        produtos_data,
        modos_producao_data,
        recursos_data,
        status,
        mensagem,
    } = resultado;

    // Agrupamento da produção por modelo e modo
    const producaoDetalhada: {
        [modeloId: number]: {
            nome: string;
            producao: { modo: string; quantidade: number }[];
            totalProduzido: number;
            demandaAtendida: boolean;
            demandaOriginal: number;
        };
    } = {};

    produtos_data.forEach((produto) => {
        producaoDetalhada[produto.id] = {
            nome: produto.nome,
            producao: [],
            totalProduzido: 0,
            demandaAtendida: false,
            demandaOriginal: produto.demanda_minima_total,
        };
    });

    Object.entries(quantidades_produzidas).forEach(([nomeVar, valorArray]) => {
        const valor = valorArray[0];
        const partes = nomeVar.split("_"); // Exemplo: Qtd_Modelo 2_Interno

        const modeloNomeCompleto = partes[1];
        const modoNome = partes[2];

        const produto = produtos_data.find(
            (p) => p.nome === modeloNomeCompleto
        );
        const modo = modos_producao_data.find((mp) => mp.nome === modoNome);

        if (produto && modo) {
            producaoDetalhada[produto.id].producao.push({
                modo: modo.nome,
                quantidade: valor,
            });
            producaoDetalhada[produto.id].totalProduzido += valor;
        }
    });

    // Checar se demanda foi atendida
    Object.values(producaoDetalhada).forEach((modelo) => {
        modelo.demandaAtendida =
            modelo.totalProduzido >= modelo.demandaOriginal;
    });

    // Cálculo de utilização dos recursos (simplificado, já que não há dados de consumo)
    const utilizacaoRecursos: {
        [recursoId: number]: {
            nome: string;
            capacidade: number;
            utilizado: number;
            ocupacao: number;
        };
    } = {};

    recursos_data.forEach((recurso) => {
        utilizacaoRecursos[recurso.id] = {
            nome: recurso.nome,
            capacidade: recurso.capacidade,
            utilizado: 0, // Sem dados para cálculo real
            ocupacao: 0,
        };
    });

    // Dados para gráfico de produção
    const chartLabels = produtos_data.map((p) => p.nome);
    const producaoInternaData = produtos_data.map((produto) => {
        const p = producaoDetalhada[produto.id].producao.find(
            (p) => p.modo === "Interno"
        );
        return p ? p.quantidade : 0;
    });
    const producaoTerceirizadaData = produtos_data.map((produto) => {
        const p = producaoDetalhada[produto.id].producao.find(
            (p) => p.modo === "Terceirizado"
        );
        return p ? p.quantidade : 0;
    });

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: "Produção Interna (unidades)",
                data: producaoInternaData,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
            {
                label: "Produção Terceirizada (unidades)",
                data: producaoTerceirizadaData,
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: {
                display: true,
                text: "Comparativo de Produção por Modelo (Interna vs. Terceirizada)",
            },
        },
        scales: {
            x: { title: { display: true, text: "Modelo de Motor" } },
            y: {
                title: { display: true, text: "Unidades Produzidas" },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg font-sans">
                <div className="flex items-center gap-4 mb-6 border-b border-gray-300 pb-4">
                    <button
                        onClick={onVoltar}
                        className="text-[#8B0000] text-3xl hover:text-red-900 transition-colors cursor-pointer"
                        aria-label="Voltar para definição"
                        title="Voltar"
                    >
                        ←
                    </button>
                    <h2 className="text-4xl font-bold text-[#8B0000]">
                        Resultado da Otimização
                    </h2>
                </div>

                {status[0] !== "Sucesso" && (
                    <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                        <p className="font-semibold">Falha na Solução:</p>
                        <p>{mensagem}</p>
                    </div>
                )}

                <div className="text-center mb-8 text-4xl font-extrabold text-gray-900">
                    Custo Mínimo Total (Z) ={" "}
                    <span className="text-[#8B0000]">
                        R$ {valor_objetivo[0].toFixed(2)}
                    </span>
                </div>

                {/* Demandas Inseridas */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Demandas Inseridas
                    </h3>
                    <ul className="space-y-2">
                        {produtos_data.map((produto) => {
                            const modelo = producaoDetalhada[produto.id];
                            return (
                                <li key={produto.id} className="text-gray-700">
                                    <span className="font-semibold">
                                        {modelo.nome}:
                                    </span>{" "}
                                    {modelo.demandaOriginal} unidades
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Capacidades de Recursos */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Capacidades de Recursos Definidas
                    </h3>
                    <ul className="space-y-2">
                        {recursos_data.map((recurso) => (
                            <li key={recurso.id} className="text-gray-700">
                                <span className="font-semibold">
                                    {recurso.nome}:
                                </span>{" "}
                                {recurso.capacidade.toFixed(2)} horas
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Produção Detalhada por Modelo */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Distribuição da Produção por Modelo
                    </h3>
                    {Object.values(producaoDetalhada).map((modelo) => (
                        <div key={modelo.nome} className="mb-5 last:mb-0">
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">
                                {modelo.nome}{" "}
                                <span
                                    className={`text-sm font-normal px-2 py-1 rounded-full ${
                                        modelo.demandaAtendida
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    Demanda: {modelo.demandaOriginal} unidades (
                                    {modelo.demandaAtendida
                                        ? "Atendida"
                                        : "Não Atendida"}
                                    )
                                </span>
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                {modelo.producao.map((item, idx) => (
                                    <li key={idx} className="text-gray-700">
                                        <strong>{item.modo}:</strong>{" "}
                                        {item.quantidade.toFixed(0)} unidades
                                    </li>
                                ))}
                                <li className="font-bold text-gray-800 mt-2">
                                    Total Produzido:{" "}
                                    {modelo.totalProduzido.toFixed(0)} unidades
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Utilização de Recursos */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Utilização de Recursos
                    </h3>
                    <ul className="space-y-3">
                        {Object.values(utilizacaoRecursos).map((recurso) => (
                            <li key={recurso.nome} className="text-gray-700">
                                <span className="font-semibold">
                                    {recurso.nome}:
                                </span>{" "}
                                {recurso.utilizado.toFixed(2)}h utilizadas /{" "}
                                {recurso.capacidade.toFixed(2)}h disponíveis (
                                {recurso.ocupacao.toFixed(2)}% de ocupação)
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gráfico */}
                {/* Gráfico */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Gráfico Comparativo de Produção
                    </h3>
                    {produtos_data.length <= 10 ? (
                        <div className="h-96">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    ) : (
                        <p className="text-gray-600 text-lg italic">
                            O gráfico não está disponível para esse problema.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
