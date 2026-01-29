import { ToastContainer } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { lightTheme } from "utils/theme";

export const ToastUI = () => {
  const context = useTheme();
  // Usar el tema del contexto si está disponible, sino usar lightTheme por defecto
  const theme = context?.theme || lightTheme;
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      toastStyle={{
        backgroundColor: theme?.colors?.secondary || "#3c3c3b",
        color: theme?.colors?.white || "#ffffff",
        padding: '10px',
        borderRadius: '8px',
      }}
    />
  );
};
