import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Puzzle, Calculator, LogOut } from "lucide-react";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        {
            label: "Calcular",
            path: "/problema",
            icon: <Calculator size={18} />,
        },
        { label: "Produtos", path: "/produtos", icon: <Package size={18} /> },
        { label: "Recursos", path: "/recursos", icon: <Puzzle size={18} /> },
    ];

    const handleLogout = () => {
        // Aqui você pode limpar tokens, resetar estados, etc.
        navigate("/"); // redireciona para o login
    };

    return (
        <aside className="h-screen w-64 bg-[#8B0000] text-white flex flex-col p-4 shadow-lg justify-between">
            <div>
                <h2 className="text-2xl font-bold mb-8">Menu</h2>
                <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex justify-between items-center py-2 px-4 rounded-lg transition-all ${
                                location.pathname === item.path
                                    ? "bg-white text-[#8B0000] font-semibold"
                                    : "hover:bg-[#a52a2a] hover:text-white"
                            }`}
                        >
                            <span>{item.label}</span>
                            {item.icon}
                        </Link>
                    ))}
                </nav>
            </div>

            <button
                onClick={handleLogout}
                className="flex justify-between items-center py-2 px-4 rounded-lg transition-all hover:bg-[#a52a2a] hover:text-white"
            >
                <span>Sair</span>
                <LogOut size={18} />
            </button>
        </aside>
    );
};

export default Sidebar;
