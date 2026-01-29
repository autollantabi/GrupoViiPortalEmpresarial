import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "router/SimpleRouter";
import { ThemeProvider } from "context/ThemeContext";
import { AuthContextProvider } from "context/authContext";
import { ToastUI } from "components/UI/Components/ToastUI";

export default function App() {
  return (
    <AuthContextProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
        <ToastUI />
      </ThemeProvider>
    </AuthContextProvider>
  );
}
