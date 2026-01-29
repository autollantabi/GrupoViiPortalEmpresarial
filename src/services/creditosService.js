import { axiosInstance } from "config/axiosConfig";

export async function ListarCreditosProveedores() {
  try {
    const res = await axiosInstance.get(`/creditos/creditosproveedores/`);
    return res.data;
  } catch (e) {
    return [];
  }
}
