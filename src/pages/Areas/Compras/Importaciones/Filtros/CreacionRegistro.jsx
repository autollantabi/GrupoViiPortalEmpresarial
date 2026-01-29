import styled, { keyframes } from "styled-components";
import React, { useState, useEffect } from "react";
import {
  ListarEmpresas,
  ListarProveedores,
  ListarMarcas,
  ObtenerPedidosPorMarca,
  InsertarImportacion,
  ConsultarImportacionesQ,
  ListarImportaciones,
  ConsultarIMPSegunProveedor,
} from "services/importacionesService";
import { ListarClientesPorEmpresaCartera } from "services/carteraService";
import { hexToRGBA } from "utils/colors";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";
import IconUI from "components/UI/Components/IconsUI";
import { useAuthContext } from "context/authContext";

const intro = keyframes`
    from { opacity: 0; scale: 0.6; }
    to { opacity: 1; scale: 1; }
`;
const introFondo = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const ContenedorPrincipal = styled.div`
  display: flex;
  padding: 15px;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.overlay || theme.colors.black, alpha: 0.6 })};
  position: absolute;
  top: 10;
  left: 0;
  z-index: 100;
  animation: ${introFondo} 0.2s ease-in-out;
`;
const ContenedorVentana = styled.div`
  display: flex;
  padding: 15px;
  width: 40%;
  height: fit-content;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.modalBackground || theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.text};
  position: absolute;
  top: 20px;
  left: 50%;
  translate: -50%;
  z-index: 101;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 0 10px rgba(0, 0, 0, 0.3)"};
  animation: ${intro} 0.8s ease-in-out;
`;

const BotonCerrar = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  padding: 0 5px;
  margin: 0;
  border-radius: 0 5px 0 5px;
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.white};
  & > i {
    font-size: 20px;
  }
  
  &:hover {
    background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.error, alpha: 0.8 })};
  }
`;

const Titulo = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
`;

const SubTitulo = styled.div`
  font-size: 12px;
  font-weight: 100;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ContenedorContenido = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
`;

const FormularioDeCreacion = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  font-size: 14px;
  gap: 10px;
  padding: 5px;
`;
const ContenedorInput = styled.div`
  display: flex;
  width: fit-content;
  flex-direction: column;
  font-size: 13px;
  font-weight: 100;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  padding: 5px 10px;
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.text};
  gap: 4px;
  & > input {
    border-radius: 5px;
    padding-left: 10px;
    font-size: 14px;
    outline: none;
    border: none;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    &.texto {
      max-width: 250px;
    }
    &.numero {
      max-width: 120px;
    }
  }
`;
const ContenedorOrden = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  flex-direction: row;
  font-size: 14px;
  gap: 10px;
`;
const BotonAnadirMas = styled.button`
  width: fit-content;
  height: fit-content;
  border: none;
  border-radius: 5px;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 2px 4px rgba(0, 0, 0, 0.1)"};
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.white};
  
  &:hover {
    background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.secondary, alpha: 0.9 })};
  }
`;
const ContendorBotonCrear = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
  padding: 20px 0 0 0;
  & > button {
    border: none;
    border-radius: 5px;
    background-color: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.primary};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.backgroundLight};
    }
  }
`;

const ContendorConfirmacionCreacion = styled.div`
  position: absolute;
  min-width: 45vw;
  height: 75vh;
  width: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  top: 20px;
  left: 50%;
  translate: -50%;
  z-index: 110;
  background-color: ${({ theme }) => theme.colors.modalBackground || theme.colors.backgroundCard};
  padding: 35px;
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 0 10px rgba(0, 0, 0, 0.3)"};
  
  & > h4 {
    color: ${({ theme }) => theme.colors.text};
  }
  
  & > .contenedorBotones {
    display: flex;
    justify-content: center;
    gap: 15px;
    padding-top: 15px;
    & > button {
      border: none;
      border-radius: 5px;
      box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 2px 4px rgba(0, 0, 0, 0.1)"};
      padding: 5px 15px;
      outline: none;
      &.cancelar {
        border: solid 1px ${({ theme }) => theme.colors.error};
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.white};
      }
      &.aceptar {
        border: solid 1px ${({ theme }) => theme.colors.secondary};
        background-color: ${({ theme }) => theme.colors.white};
        color: ${({ theme }) => theme.colors.secondary};
      }
    }
  }
`;

export const CreacionRegistro = ({
  mostrarVentana,
  actualizar,
  cambiar,
  varcambiar,
}) => {
  const { theme } = useTheme();
  const [infoCreacion, setInfoCreacion] = useState({
    empresa: {},
    proveedor: {},
    marca: [],
    clientes: [],
  });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [listaEmpresas, setListaEmpresas] = useState([]);
  const [listaProveedores, setListaProveedores] = useState([]);
  const [listaMarcas, setListaMarcas] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [idACrear, setIdACrear] = useState(1);
  const { user } = useAuthContext();

  // **Manejo correcto de actualización del estado**
  const handleUpdateCreacion = (nombreCampo, newValue) => {
    setInfoCreacion((prevState) => ({
      ...prevState,
      [nombreCampo]:
        newValue || (Array.isArray(prevState[nombreCampo]) ? [] : {}),
    }));
  };

  // **Carga inicial de datos**
  useEffect(() => {
    const fetchInitialData = async () => {
      const empresas = await ListarEmpresas();
      setListaEmpresas(
        empresas.map(({ empr_id, empr_nombre }) => ({
          value: empr_id,
          label: empr_nombre,
        }))
      );

      const importaciones = await ListarImportaciones();
      setIdACrear(
        importaciones.length
          ? Math.max(
              ...importaciones.map(({ ID_CARGA }) => parseInt(ID_CARGA))
            ) + 1
          : 1
      );
    };

    fetchInitialData();
  }, []);

  // **Carga dinámica de proveedores, marcas y clientes**
  useEffect(() => {
    if (!infoCreacion.empresa?.value) return;
    const fetchProveedores = async () => {
      handleUpdateCreacion("proveedor", {}); // Limpia el proveedor al cambiar la empresa

      try {
        const proveedoresData = await ListarProveedores(
          infoCreacion.empresa.value
        );
        setListaProveedores(
          proveedoresData.map(({ value, name }) => ({
            value,
            label: name,
          }))
        );
      } catch (error) {
        console.error("Error al obtener proveedores:", error);
      }
    };

    fetchProveedores();
  }, [infoCreacion.empresa]); // Se ejecuta cuando cambia la empresa

  useEffect(() => {
    const fetchMarcas = async () => {
      const emp = infoCreacion.empresa?.value;
      const pr = infoCreacion.proveedor?.value;

      if (!emp || !pr) return; // Si falta alguno, no ejecutar

      // Limpiar marcas antes de hacer la solicitud
      handleUpdateCreacion("marca", []);

      try {
        const marcasData = await ListarMarcas(emp, pr);
        setListaMarcas(
          marcasData.map(({ value, name }) => ({
            value,
            label: name,
          }))
        );
      } catch (error) {
        console.error("Error al obtener marcas:", error);
      }
    };

    fetchMarcas();
  }, [infoCreacion.empresa?.value, infoCreacion.proveedor?.value]); // Se ejecuta cuando cambia empresa o proveedor

  useEffect(() => {
    const fetchClientes = async () => {
      const emp = infoCreacion.empresa?.label;
      handleUpdateCreacion("clientes", []);

      if (!emp || !infoCreacion.marca?.some((m) => m.label === "SHELL")) return;

      try {
        const clientesData = await ListarClientesPorEmpresaCartera({
          correo: user.USUARIO.USUA_CORREO,
          empresaId: emp,
        });
        setListaClientes(
          clientesData.map(({ CODIGO_SOCIO, NOMBRE_SOCIO }) => ({
            value: CODIGO_SOCIO,
            label: NOMBRE_SOCIO,
          }))
        );
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    };

    fetchClientes();
  }, [infoCreacion.empresa?.value, infoCreacion.marca]); // Se ejecuta si cambia empresa o marca

  // **Validación del botón de creación**
  const isButtonDisabled =
    !infoCreacion.empresa.value ||
    !infoCreacion.proveedor.value ||
    infoCreacion.marca.length === 0;

  const InsertarImp = async () => {
    try {
      const IMP_DEF = `IMP.01/${new Date().getFullYear().toString().slice(-2)}`;
      let IMPSegProveedor = IMP_DEF;
      const respIMPdeProveedor = await ConsultarIMPSegunProveedor({
        codigoProveedor: infoCreacion.proveedor.value,
        empresa: infoCreacion.empresa.label,
      });

      if (respIMPdeProveedor.length > 0) {
        IMPSegProveedor = respIMPdeProveedor;
      }

      await InsertarImportacion({
        idempresa: infoCreacion.empresa.value,
        empresa: infoCreacion.empresa.label,
        idproveedor: infoCreacion.proveedor.value,
        proveedor: infoCreacion.proveedor.label,
        idsmarcas: infoCreacion.marca.map(({ value }) => value).join(", "),
        marcasN: infoCreacion.marca.map(({ label }) => label).join(", "),
        clientesU:
          infoCreacion.marca[0]?.label === "SHELL"
            ? infoCreacion.clientes
            : null,
        imp: IMPSegProveedor,
      });

      mostrarVentana(false);
      actualizar();
      cambiar(varcambiar === 0 ? 1 : varcambiar);
    } catch (error) {
      console.error("Error al insertar importación:", error);
    }
  };

  return (
    <ContenedorPrincipal>
      <ContenedorVentana>
        <BotonCerrar onClick={() => mostrarVentana(false)}>
          <IconUI name="FaXmark" size={14} color={theme.colors.text} />
        </BotonCerrar>
        <ContainerUI
          flexDirection="column"
          alignItems="flex-start"
          width="100%"
        >
          <ContainerUI style={{ gap: "20px" }}>
            <div style={{ padding: "10px" }}>{idACrear}</div>
            <div>
              <Titulo>Creación de Registro de Importación</Titulo>
              <SubTitulo>Los campos con * son obligatorios</SubTitulo>
            </div>
          </ContainerUI>

          <FormularioDeCreacion>
            <ContainerUI
              width="100%"
              flexDirection="column"
              alignItems="flex-start"
              style={{ gap: "10px" }}
            >
              <ContainerUI
                justifyContent="flex-start"
                width="100%"
                style={{ gap: "10px" }}
              >
                <TextUI style={{ width: "75px" }}>Empresa</TextUI>
                <SelectUI
                  options={listaEmpresas}
                  onChange={(value) => handleUpdateCreacion("empresa", value)}
                  value={infoCreacion.empresa}
                  placeholder="Empresa *"
                />
              </ContainerUI>
              <ContainerUI
                justifyContent="flex-start"
                width="100%"
                style={{ gap: "10px" }}
              >
                <TextUI style={{ width: "75px" }}>Proveedor</TextUI>
                <SelectUI
                  options={listaProveedores}
                  onChange={(value) => handleUpdateCreacion("proveedor", value)}
                  value={infoCreacion.proveedor}
                  placeholder="Proveedor *"
                />
              </ContainerUI>
              <ContainerUI
                justifyContent="flex-start"
                width="100%"
                style={{ gap: "10px" }}
              >
                <TextUI style={{ width: "75px" }}>Marca/s</TextUI>
                <SelectUI
                  options={listaMarcas}
                  onChange={(value) => handleUpdateCreacion("marca", value)}
                  value={infoCreacion.marca}
                  placeholder="Marca *"
                  isMulti={true}
                />
              </ContainerUI>
              {infoCreacion.marca?.some((m) => m.label === "SHELL") && (
                <ContainerUI
                  justifyContent="flex-start"
                  width="100%"
                  style={{ gap: "10px" }}
                >
                  <TextUI style={{ width: "75px" }}>Cliente/s</TextUI>
                  <SelectUI
                    options={listaClientes}
                    onChange={(value) =>
                      handleUpdateCreacion("clientes", value)
                    }
                    value={infoCreacion.clientes}
                    placeholder="Clientes *"
                    isMulti={true}
                    maxWidth="auto"
                  />
                </ContainerUI>
              )}
            </ContainerUI>
          </FormularioDeCreacion>
          {!isButtonDisabled && (
            <ContainerUI width="100%" justifyContent="flex-end">
              <ButtonUI
                onClick={() => setMostrarConfirmacion(true)}
                text={"Crear Importación"}
                pcolortext={theme.colors.secondary}
                variant="outlined"
              />
            </ContainerUI>
          )}
        </ContainerUI>
      </ContenedorVentana>
      {mostrarConfirmacion && (
        <ContendorConfirmacionCreacion>
          <h4>Desea guardar la siguiente información?</h4>
          <TextUI>Empresa: {infoCreacion.empresa.label}</TextUI>
          <TextUI>Proveedor: {infoCreacion.proveedor.label}</TextUI>
          <TextUI>
            Marca/s: {infoCreacion.marca.map((item) => item.label).join(", ")}
          </TextUI>
          {infoCreacion.clientes?.length > 0 && (
            <TextUI>
              Clientes/s:{" "}
              {infoCreacion.clientes.map((item) => item.label).join(", ")}
            </TextUI>
          )}
          <ContainerUI justifyContent="flex-end" style={{ gap: "10px" }}>
            <ButtonUI
              onClick={() => {
                setMostrarConfirmacion(false);
                actualizar();
              }}
              text={"Cancelar"}
              variant="outlined"
            />
            <ButtonUI onClick={InsertarImp} text="Crear" />
          </ContainerUI>
        </ContendorConfirmacionCreacion>
      )}
    </ContenedorPrincipal>
  );
};
