import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (usuario === "admin" && senha === "1") {
            navigate("/problema");
        } else {
            alert("Credenciais inválidas");
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{
                backgroundImage: "url('/login-background.jpg')",
            }}
        >
            <div className="bg-white/90 shadow-lg rounded-2xl p-8 w-full max-w-sm backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    LCL Motors
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="usuario"
                            className="block text-sm font-medium text-gray-600"
                        >
                            Usuário
                        </label>
                        <input
                            id="usuario"
                            type="usuario"
                            required
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="senha"
                            className="block text-sm font-medium text-gray-600"
                        >
                            Senha
                        </label>
                        <input
                            id="senha"
                            type="password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#8B0000] text-white py-2 rounded-lg font-semibold hover:bg-[#6e0000] transition"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
