import type { Resultado } from "../pages/Problema";

type ResultadoProps = {
    resultado: Resultado;
    onVoltar: () => void;
};

export default function Resultado({ resultado, onVoltar }: ResultadoProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-3xl p-6 bg-white rounded-xl shadow-md font-sans">
                <div className="flex items-center gap-4 mb-6 border-b border-gray-300 pb-2">
                    <button
                        onClick={onVoltar}
                        className="text-[#8B0000] text-3xl hover:text-red-900 transition-colors cursor-pointer"
                        aria-label="Voltar para definição"
                        title="Voltar"
                    >
                        ←
                    </button>
                    <h2 className="text-4xl font-bold text-[#8B0000]">
                        Resultado
                    </h2>
                </div>

                <div className="flex flex-wrap gap-4 mb-10 justify-center">
                    {resultado.variaveis.map((valor, i) => (
                        <div
                            key={i}
                            className="border border-gray-300 bg-gray-100 text-gray-800 rounded-lg min-w-[70px] text-center p-3 font-semibold shadow-sm"
                        >
                            <div className="text-sm mb-1">{`X${i + 1}`}</div>
                            <div className="text-lg">{valor}</div>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-12 text-4xl font-extrabold text-gray-900">
                    Z ={" "}
                    <span className="text-[#8B0000]">
                        {resultado.valor_objetivo[0]}
                    </span>
                </div>

                <div className="flex justify-center">
                    <img
                        src={""}
                        alt="Gráfico do resultado"
                        className="max-w-full max-h-64 rounded-lg shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
}
