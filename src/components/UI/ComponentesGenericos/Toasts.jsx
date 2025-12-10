import { ToastContainer } from "react-toastify";

export const ToastContainerCustom = () => {
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
        backgroundColor: 'var(--primary)', // Cambiar el color de fondo
        color: '#fff',              // Cambiar el color del texto
        padding: '10px',
        borderRadius: '8px',
      }}
    />
  );
};
