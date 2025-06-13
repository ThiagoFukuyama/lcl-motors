// client/src/components/Resultado.tsx
import type { ResultadoPL } from "../pages/Problema";
import { Bar } from 'react-chartjs-2'; // Importe o componente Bar
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'; // Importe os elementos necessários do Chart.js

// Registre os elementos do Chart.js que você vai usar
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
    // Extrair dados da resposta para facilitar o acesso
    const {
        quantidades_produzidas,
        valor_objetivo,
        modelos_data,
        modos_producao_data,
        recursos_data,
        consumo_recursos_data,
        demandas_input,
        status,
        mensagem
    } = resultado;

    // --- LÓGICA PARA AGRUPAMENTO E CÁLCULO ---

    // 1. Agrupar quantidades produzidas por modelo e modo
    const producaoDetalhada: {
        [modeloId: number]: {
            nome: string;
            producao: {
                modo: string;
                quantidade: number;
            }[];
            totalProduzido: number;
            demandaAtendida: boolean;
            demandaOriginal: number;
        };
    } = {};

    modelos_data.forEach(modelo => {
        producaoDetalhada[modelo.id] = {
            nome: modelo.nome,
            producao: [],
            totalProduzido: 0,
            demandaAtendida: false,
            demandaOriginal: 0
        };
    });

    Object.entries(quantidades_produzidas).forEach(([nomeVar, valorArray]) => {
        const valor = valorArray[0];
        const partes = nomeVar.split('_');

        const modeloNomeCompleto = partes[1];
        const modoNome = partes[2];

        const modelo = modelos_data.find(m => m.nome === modeloNomeCompleto);
        const modo = modos_producao_data.find(mp => mp.nome === modoNome);

        if (modelo && modo) {
            producaoDetalhada[modelo.id].producao.push({
                modo: modo.nome,
                quantidade: valor,
            });
            producaoDetalhada[modelo.id].totalProduzido += valor;
        }
    });

    demandas_input.forEach(demanda => {
        if (producaoDetalhada[demanda.modelo_id]) {
            producaoDetalhada[demanda.modelo_id].demandaOriginal = demanda.quantidade;
            producaoDetalhada[demanda.modelo_id].demandaAtendida =
                producaoDetalhada[demanda.modelo_id].totalProduzido >= demanda.quantidade;
        }
    });

    // 2. Calcular Utilização de Recursos
    const utilizacaoRecursos: {
        [recursoId: number]: {
            nome: string;
            capacidade: number;
            utilizado: number;
            ocupacao: number;
        };
    } = {};

    recursos_data.forEach(recurso => {
        utilizacaoRecursos[recurso.id] = {
            nome: recurso.nome,
            capacidade: recurso.capacidade,
            utilizado: 0,
            ocupacao: 0,
        };
    });

    Object.entries(quantidades_produzidas).forEach(([nomeVar, valorArray]) => {
        const valor = valorArray[0];
        const partes = nomeVar.split('_');

        const modeloNomeCompleto = partes[1];
        const modoNome = partes[2];

        const modelo = modelos_data.find(m => m.nome === modeloNomeCompleto);
        const modo = modos_producao_data.find(mp => mp.nome === modoNome);

        if (modelo && modo) {
            consumo_recursos_data
                .filter(cr => cr.modelo_id === modelo.id && cr.modo_id === modo.id)
                .forEach(cr => {
                    utilizacaoRecursos[cr.recurso_id].utilizado += valor * cr.consumo_unitario;
                });
        }
    });

    // Calcular porcentagem de ocupação
    recursos_data.forEach(recurso => {
        if (utilizacaoRecursos[recurso.id].capacidade > 0) {
            utilizacaoRecursos[recurso.id].ocupacao =
                (utilizacaoRecursos[recurso.id].utilizado / utilizacaoRecursos[recurso.id].capacidade) * 100;
        } else {
             utilizacaoRecursos[recurso.id].ocupacao = 0;
        }
    });

    // --- FIM DA LÓGICA DE CÁLCULO ---

    // --- PREPARAÇÃO DE DADOS PARA O GRÁFICO ---
    const chartLabels = modelos_data.map(m => m.nome);
    const producaoInternaData = modelos_data.map(modelo => {
        const producao = producaoDetalhada[modelo.id]?.producao.find(p => p.modo === 'Interno');
        return producao ? producao.quantidade : 0;
    });
    const producaoTerceirizadaData = modelos_data.map(modelo => {
        const producao = producaoDetalhada[modelo.id]?.producao.find(p => p.modo === 'Terceirizado');
        return producao ? producao.quantidade : 0;
    });

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Produção Interna (unidades)',
                data: producaoInternaData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Produção Terceirizada (unidades)',
                data: producaoTerceirizadaData,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Comparativo de Produção por Modelo (Interna vs. Terceirizada)',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Modelo de Motor',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Unidades Produzidas',
                },
                beginAtZero: true,
            },
        },
    };
    // --- FIM DA PREPARAÇÃO DE DADOS PARA O GRÁFICO ---


    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
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

                {/* Seção de Demandas Inseridas */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Demandas Inseridas
                    </h3>
                    <ul className="space-y-2">
                        {demandas_input.map(demanda => {
                            const modelo = modelos_data.find(m => m.id === demanda.modelo_id);
                            return (
                                <li key={demanda.modelo_id} className="text-gray-700">
                                    <span className="font-semibold">{modelo?.nome}:</span> {demanda.quantidade} unidades
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Seção de Capacidades de Recursos Definidas */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Capacidades de Recursos Definidas
                    </h3>
                    <ul className="space-y-2">
                        {recursos_data.map(recurso => (
                            <li key={recurso.id} className="text-gray-700">
                                <span className="font-semibold">{recurso.nome}:</span> {recurso.capacidade.toFixed(2)} horas
                            </li>
                        ))}
                    </ul>
                </div>


                {/* Seção de Produção Detalhada por Modelo */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Distribuição da Produção por Modelo
                    </h3>
                    {Object.values(producaoDetalhada).map((modelo) => (
                        <div key={modelo.nome} className="mb-5 last:mb-0">
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">
                                {modelo.nome}{" "}
                                <span className={`text-sm font-normal px-2 py-1 rounded-full ${
                                    modelo.demandaAtendida ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    Demanda: {modelo.demandaOriginal} unidades ({modelo.demandaAtendida ? "Atendida" : "Não Atendida"})
                                </span>
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                {modelo.producao.map((item, idx) => (
                                    <li key={idx} className="text-gray-700">
                                        **{item.modo}**: {item.quantidade.toFixed(0)} unidades
                                    </li>
                                ))}
                                <li className="font-bold text-gray-800 mt-2">
                                    Total Produzido: {modelo.totalProduzido.toFixed(0)} unidades
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Seção de Utilização de Recursos */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Utilização de Recursos
                    </h3>
                    <ul className="space-y-3">
                        {Object.values(utilizacaoRecursos).map((recurso) => (
                            <li key={recurso.nome} className="text-gray-700">
                                <span className="font-semibold">{recurso.nome}:</span>{" "}
                                {recurso.utilizado.toFixed(2)}h utilizadas / {recurso.capacidade.toFixed(2)}h disponíveis
                                ({recurso.ocupacao.toFixed(2)}% de ocupação)
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- NOVA SEÇÃO: GRÁFICO DE PRODUÇÃO --- */}
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Gráfico Comparativo de Produção
                    </h3>
                    <div className="h-96"> {/* Altura fixa para o gráfico */}
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>
                {/* --- FIM DA NOVA SEÇÃO --- */}


                <div className="flex justify-center mt-6">
                    <img
                        src={""}
                        alt="Gráfico do resultado (visualização futura)"
                        className="max-w-full max-h-64 rounded-lg shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
}