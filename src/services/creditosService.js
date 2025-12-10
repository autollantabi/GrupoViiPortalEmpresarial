import { axiosInstance } from "config/axiosConfig";

export async function ListarCreditosProveedores() {
  try {
    const res = await axiosInstance.get(`/creditos/creditosproveedores/`);
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
