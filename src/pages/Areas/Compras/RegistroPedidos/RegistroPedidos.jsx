import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";
import { toast } from "react-toastify";
import {
  ListarRegistroPedidosMensual,
  GenerarRegistroPedidosMensual,
  ActualizarRegistroPedido,
} from "services/importacionesService";

const ContenedorPrincipal = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;
  gap: 20px;
`;

const FiltrosContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SelectUI = styled.select`
  padding: 8px 30px 8px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.name === "dark" ? "rgba(0,0,0,0.2)" : theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:read-only {
    opacity: 0.7;
    background-color: ${({ theme }) =>
    theme.name === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
  };
    cursor: default;
    border-color: ${({ theme }) => theme.colors.borderLight || "transparent"};
  }
`;

const FiltroGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TablaContainer = styled.div`
  width: 100%;
  flex: 1;
  overflow: auto;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
`;

const TablaCustom = styled.table`
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: ${({ theme }) =>
    theme.name === "dark"
      ? theme.colors.backgroundHover || "#2a2a2a" // fallback to solid dark
      : theme.colors.secondary || "#f8f9fa" // fallback to solid light
  };
    color: ${({ theme }) =>
    theme.name === "dark" ? theme.colors.text : theme.colors.white
  };
    padding: 12px 16px;
    font-weight: 500;
    font-size: 13px;
    text-align: left;
    border-bottom: 2px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
    
    /* Previene bordes transparentes entre celdas */
    background-clip: padding-box;
  }

  tbody tr {
    transition: background-color 0.2s;

    &:nth-child(even) {
      background-color: ${({ theme }) =>
    theme.name === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)"
  };
    }

    &:hover {
      background-color: ${({ theme }) =>
    theme.name === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
  };
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`;

const InputCelda = styled.input`
  width: 100%;
  min-width: 120px;
  padding: 8px;
  border: 1px solid ${({ theme, error }) =>
    error ? theme.colors.danger : theme.colors.border
  };
  border-radius: 4px;
  background-color: ${({ theme }) =>
    theme.name === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.8)"
  };
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }
`;

const MensajeVacio = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
  font-size: 16px;
  font-weight: 500;
  width: 100%;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const TitleBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
    font-size: 20px;
    font-weight: 600;
  }
`;

const columnas = [
  { id: "REGI_MARCA", label: "MARCA", type: "text", width: "150px", disableEdit: true },
  { id: "REGI_RESPONSABLE", label: "RESPONSABLE", type: "text", width: "150px", disableEdit: true },
  { id: "REGI_FECHALIMITE", label: "FECHA LIMITE", type: "text", width: "140px", disableEdit: true },
  { id: "REGI_ORDEN", label: "ORDEN", type: "text", width: "120px" },
  { id: "REGI_CONTENEDORES", label: "CONTENEDOR", type: "number", width: "100px" },
  { id: "REGI_FECHA_ENVIO_PEDIDO", label: "FECHA ENVIO PEDIDO AL PROVEEDOR", type: "date", width: "160px" },
  { id: "REGI_FECHA_PEDIDO_ORDEN", label: "FECHA DE PEDIDO PROVEEDOR", type: "date", width: "160px" },
  { id: "REGI_FECHA_CONFIMACION_PROVEEDOR", label: "FECHA DE CONFIRMACION A PROVEEDOR", type: "date", width: "170px" },
  { id: "REGI_OBSERVACION", label: "OBSERVACION", type: "text", width: "250px" },
  { id: "REGI_INGRESO_SISTEMA", label: "REGISTRAR EN EL SISTEMA", type: "checkbox", width: "160px" }
];

const meses = [
  { valor: 1, nombre: "Enero" },
  { valor: 2, nombre: "Febrero" },
  { valor: 3, nombre: "Marzo" },
  { valor: 4, nombre: "Abril" },
  { valor: 5, nombre: "Mayo" },
  { valor: 6, nombre: "Junio" },
  { valor: 7, nombre: "Julio" },
  { valor: 8, nombre: "Agosto" },
  { valor: 9, nombre: "Septiembre" },
  { valor: 10, nombre: "Octubre" },
  { valor: 11, nombre: "Noviembre" },
  { valor: 12, nombre: "Diciembre" },
];

// Generar años (desde 2020 hasta el actual)
const generarAnios = (anioActual) => {
  const anios = [];
  for (let i = 2024; i <= anioActual; i++) {
    anios.push(i);
  }
  return anios.sort((a, b) => b - a); // Mostrar primero los más recientes
};

export const RegistroPedidos = () => {
  const { theme } = useTheme();

  // Variables de tiempo actuales
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1; // getMonth es 0 indexado
  const anioActual = fechaActual.getFullYear();

  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [datosOriginales, setDatosOriginales] = useState({}); // Para comparar cambios

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);

  const opcionesAnios = useMemo(() => generarAnios(anioActual), [anioActual]);

  // Validaciones: ¿Qué meses están disponibles para el año seleccionado?
  const mesesDisponibles = useMemo(() => {
    if (anioSeleccionado === anioActual) {
      // Si el año es el actual, solo permitir meses hasta el mes actual
      return meses.filter(m => m.valor <= mesActual);
    }
    // Si es un año anterior, permitir todos
    return meses;
  }, [anioSeleccionado, anioActual, mesActual]);

  // Asegurar que al cambiar de año a uno donde el mes es inválido (ej: estaba en dic2023, cambia a 2024 donde solo estamos en marzo) se ajuste
  useEffect(() => {
    if (anioSeleccionado === anioActual && mesSeleccionado > mesActual) {
      setMesSeleccionado(mesActual);
    }
  }, [anioSeleccionado, anioActual, mesActual, mesSeleccionado]);


  const fetchDatosDesdeAPI = async (mes, anio, yaGenerado = false) => {
    try {
      const response = await ListarRegistroPedidosMensual({ mes, anio });

      // Si la API retorna estado exitoso y existen datos
      if (response && response.status === "Ok!" && Array.isArray(response.data) && response.data.length > 0) {
        setDatos(response.data);

        // Guardar copia inmutable de los datos originales
        const copiaOriginal = {};
        response.data.forEach(item => {
          copiaOriginal[item.REGI_ID] = { ...item };
        });
        setDatosOriginales(copiaOriginal);

        return true;
      }

      // Si llegamos aquí y no habíamos intentado generar, generamos
      if (!yaGenerado) {
        toast.info("Generando registros del periodo...");
        const responseGeneracion = await GenerarRegistroPedidosMensual({ mes, anio });

        if (responseGeneracion && responseGeneracion.status === "Ok!") {
          // Intentar obtener datos denuevo ahora que fueron creados
          return await fetchDatosDesdeAPI(mes, anio, true);
        } else {
          toast.warning("No se pudieron generar los registros para este mes.");
          setDatos([]);
          return false;
        }
      }

      // Si ya habíamos intentado autogenerar y sigue fallando
      setDatos([]);
      return false;
    } catch (error) {
      console.error("Error al comunicarse con la API de Pedidos", error);
      toast.error("Error conectando con el servidor");
      setDatos([]);
      return false;
    }
  };

  // Endpoint real
  const cargarDatos = async (mes, anio) => {
    setCargando(true);
    setDatos([]);

    await fetchDatosDesdeAPI(mes, anio);

    setCargando(false);
  };

  // Cargar al montar y cuando cambian los filtros
  useEffect(() => {
    cargarDatos(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado]);

  const handleChange = (idCapa, colId, valor) => {
    // Solo permitir edición en celdas numéricas si son dígitos positivos, si la key aplica
    if (colId === "REGI_CONTENEDORES" && valor !== "") {
      const parsed = Number(valor);
      if (isNaN(parsed) || parsed < 0) return;
    }

    if (colId === "REGI_ORDEN" && valor !== "") {
      // Bloquear cualquier caracter que no sea un número (0-9)
      if (!/^\d+$/.test(valor)) return;
    }

    const original = datosOriginales[idCapa];
    if (colId === "REGI_INGRESO_SISTEMA" && original?.REGI_INGRESO_SISTEMA) {
      return; // Si ya venía firmado de base de datos, no permitir desmarcar
    }

    setDatos((prev) =>
      prev.map((fila) =>
        fila.REGI_ID === idCapa
          ? { ...fila, [colId]: valor }
          : fila
      )
    );
  };

  // Verifica si un registro ha sido modificado y si la fila está protegida para edición (ya tiene datos)
  const filaEsEditable = (idFila) => {
    const original = datosOriginales[idFila];
    if (!original) return true;

    // Si la fila ya fue ingresada al sistema oficial (simulación con "REGI_INGRESO_SISTEMA" == true/1)
    // O si las fechas y órdenes no eran nulas en la base
    if (original.REGI_INGRESO_SISTEMA) {
      return false;
    }

    /* Nota extra: Si deseas otra lógica de bloqueo (ej: si fecha pedido ya está, no editar nada mas) 
       descomenta y adapta esto:
    if (original.REGI_FECHA_PEDIDO_ORDEN) {
      return false;
    }
    */
    return true;
  };

  const handleGuardar = async () => {
    if (datos.length === 0) {
      toast.warning("No hay datos para guardar.");
      return;
    }

    // Filtrar los registros que han tenido alguna modificación (comparación sencilla contra copia)
    const datosModificados = datos.filter(fila => {
      const orig = datosOriginales[fila.REGI_ID];
      if (!orig) return false;

      // Comparamos los campos editables relevantes
      return (
        fila.REGI_ORDEN !== orig.REGI_ORDEN ||
        fila.REGI_CONTENEDORES !== orig.REGI_CONTENEDORES ||
        fila.REGI_FECHA_ENVIO_PEDIDO !== orig.REGI_FECHA_ENVIO_PEDIDO ||
        fila.REGI_FECHA_PEDIDO_ORDEN !== orig.REGI_FECHA_PEDIDO_ORDEN ||
        fila.REGI_FECHA_CONFIMACION_PROVEEDOR !== orig.REGI_FECHA_CONFIMACION_PROVEEDOR ||
        fila.REGI_OBSERVACION !== orig.REGI_OBSERVACION ||
        !!fila.REGI_INGRESO_SISTEMA !== !!orig.REGI_INGRESO_SISTEMA
      );
    });

    if (datosModificados.length === 0) {
      toast.info("No hay modificaciones para registrar.");
      return;
    }

    try {

      let errores = 0;

      for (const fila of datosModificados) {
        // Formatear payload para este registro
        const payload = {
          REGI_ORDEN: fila.REGI_ORDEN || null,
          REGI_CONTENEDORES: fila.REGI_CONTENEDORES ? Number(fila.REGI_CONTENEDORES) : null,
          REGI_FECHA_ENVIO_PEDIDO: fila.REGI_FECHA_ENVIO_PEDIDO || null,
          REGI_FECHA_PEDIDO_ORDEN: fila.REGI_FECHA_PEDIDO_ORDEN || null,
          REGI_FECHA_CONFIMACION_PROVEEDOR: fila.REGI_FECHA_CONFIMACION_PROVEEDOR || null,
          REGI_OBSERVACION: fila.REGI_OBSERVACION || null,
          REGI_INGRESO_SISTEMA: !!fila.REGI_INGRESO_SISTEMA
        };

        const resp = await ActualizarRegistroPedido(fila.REGI_ID, payload);
        if (!resp || resp.status !== "Ok!") {
          errores++;
        }
      }

      if (errores > 0) {
        toast.warning(`Aviso: ${errores} registros no pudieron actualizarse.`);
      } else {
        toast.success("Los datos se guardaron correctamente.");
      }

      // Refrescar para obtener el estatus inmaculado
      cargarDatos(mesSeleccionado, anioSeleccionado);
    } catch (err) {
      toast.error("Error al guardar los datos.");
      console.error(err);
      setCargando(false);
    }
  };

  return (
    <ContainerUI
      flexDirection="column"
      width="100%"
      height="100%"
      justifyContent="flex-start"
    >
      <ContenedorPrincipal>
        <TitleBar>
          <h2>Registro Pedidos</h2>
        </TitleBar>

        <FiltrosContainer theme={theme}>
          <FiltroGrupo theme={theme}>
            <label>Año</label>
            <SelectUI
              theme={theme}
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            >
              {opcionesAnios.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </SelectUI>
          </FiltroGrupo>

          <FiltroGrupo theme={theme}>
            <label>Mes</label>
            <SelectUI
              theme={theme}
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            >
              {mesesDisponibles.map(mes => (
                <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
              ))}
            </SelectUI>
          </FiltroGrupo>

          <div style={{ marginTop: "auto" }}>
            <ButtonUI
              text="Buscar"
              iconLeft="FaMagnifyingGlass"
              variant="outlined"
              onClick={() => cargarDatos(mesSeleccionado, anioSeleccionado)}
              disabled={cargando}
            />
          </div>
        </FiltrosContainer>

        <TablaContainer theme={theme}>
          <TablaCustom theme={theme}>
            <thead>
              <tr>
                {columnas.map((col) => (
                  <th key={col.id} style={{ minWidth: col.width }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!cargando && datos.length > 0 && datos.map((fila) => {
                const esEditable = filaEsEditable(fila.REGI_ID);
                return (
                  <tr key={fila.REGI_ID}>
                    {columnas.map((col) => {
                      const isDisabled = col.disableEdit === true || !esEditable;

                      if (col.type === "checkbox") {
                        const original = datosOriginales[fila.REGI_ID];
                        const yaEstabaRegistrado = original?.REGI_INGRESO_SISTEMA;
                        return (
                          <td key={`${fila.REGI_ID}-${col.id}`} style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <input
                              type="checkbox"
                              checked={!!fila[col.id]}
                              onChange={(e) => handleChange(fila.REGI_ID, col.id, e.target.checked)}
                              disabled={isDisabled || yaEstabaRegistrado}
                              style={{ transform: "scale(1.2)", cursor: (isDisabled || yaEstabaRegistrado) ? "not-allowed" : "pointer" }}
                            />
                          </td>
                        );
                      }

                      // Prevenir valores null/indefinidos en el input
                      const valorDelEstado = fila[col.id];
                      const valorFinal = (valorDelEstado === null || valorDelEstado === undefined) ? "" : valorDelEstado;

                      if (col.disableEdit) {
                        return (
                          <td key={`${fila.REGI_ID}-${col.id}`}>
                            <div style={{ padding: "8px", fontSize: "13px", color: theme.colors.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {valorFinal !== "" ? valorFinal : "-"}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={`${fila.REGI_ID}-${col.id}`}>
                          <InputCelda
                            type={col.type}
                            value={valorFinal}
                            onChange={(e) =>
                              handleChange(fila.REGI_ID, col.id, e.target.value)
                            }
                            placeholder={isDisabled ? "-" : `Ingresar ${col.label.toLowerCase()}`}
                            theme={theme}
                            readOnly={isDisabled}
                            disabled={isDisabled}
                            min={col.type === "number" ? "0" : undefined}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </TablaCustom>

          {/* Estado vacío o de Carga centrado en la tabla */}
          {cargando && (
            <MensajeVacio theme={theme}>Cargando información...</MensajeVacio>
          )}

          {!cargando && datos.length === 0 && (
            <MensajeVacio theme={theme}>Sin datos registrados</MensajeVacio>
          )}

        </TablaContainer>

        <ActionContainer theme={theme}>
          <ButtonUI
            text="Guardar"
            iconLeft="FaFloppyDisk"
            pcolor={theme.colors.primary}
            pcolortext={theme.colors.white}
            onClick={handleGuardar}
            disabled={cargando || datos.length === 0}
          />
        </ActionContainer>
      </ContenedorPrincipal>
    </ContainerUI>
  );
};
