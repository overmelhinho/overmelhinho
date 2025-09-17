import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ReactQueryProvider from "@/contexts/ReactQueryProvider"; // ✅ Importa aqui

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider> {/* ✅ Envolve tudo */}
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ReactQueryProvider>
  </React.StrictMode>
);
