import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import RootLayout from "./RootLayout";
import Login from "./pages/Login";
import Problema from "./pages/Problema";
import Produtos from "./pages/Produtos";
import Recursos from "./pages/Recursos";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />, // login sem sidebar
    },
    {
        path: "/",
        element: <RootLayout />, // layout com sidebar
        children: [
            {
                path: "produtos",
                element: <Produtos />,
            },
            {
                path: "recursos",
                element: <Recursos />,
            },
            {
                path: "problema",
                element: <Problema />,
            },
        ],
    },
]);
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
