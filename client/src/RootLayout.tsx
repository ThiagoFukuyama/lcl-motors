// RootLayout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

const RootLayout = () => {
    return (
        <div className="relative min-h-screen">
            {/* Sidebar fixa à esquerda */}
            <div className="fixed top-0 left-0 h-screen w-64 z-50">
                <Sidebar />
            </div>

            {/* Conteúdo com scroll ao lado da sidebar */}
            <main className="pl-64 p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default RootLayout;
