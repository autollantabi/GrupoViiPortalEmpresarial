import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import {
  ConsultarClientesPorEmpresa,
  ConsultarVendedoresPorEmpresa,
} from "services/carteraService";
import {
  getNombreEstado,
  getColorEstado,
  formatFecha,
} from "./configTablaTransacciones";
import { hexToRGBA } from "utils/colors";
import { useAuthContext } from "context/authContext";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.overlay, alpha: 0.5 })};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.modalBackground || theme.colors.backgroundCard};
  border-radius: 8px;
  padding: 24px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => 
    theme.name === "dark" 
      ? "0 4px 6px rgba(0, 0, 0, 0.5)"
      : "0 4px 6px rgba(0, 0, 0, 0.1)"
  };
  color: ${({ theme }) => theme.colors.text};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border || theme.colors.divider};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
`;

const InfoSection = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundLight || theme.colors.background};
  padding: 16px;
  border-radius: 6px;
  grid-column: 1 / -1;
  border: 1px solid ${({ theme }) => theme.colors.border || theme.colors.divider};
`;

const InfoTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

const ChipEstado = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  background-color: ${(props) => props.$bgColor};
  color: ${(props) => props.$textColor};
  white-space: nowrap;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border || theme.colors.divider};
`;

export const ModalEdicionTransaccion = ({
  isOpen,
  transaccion,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const [formData, setFormData] = useState({
    clienteSeleccionado: null,
    cedula: "",
    vendedorSeleccionado: null,
    comentario: "",
    ingreso: "",
    estadoSeleccionado: null, // Siempre inicia en null (sin cambio)
  });

  // Estados para opciones de clientes y vendedores
  const [clientesCompletos, setClientesCompletos] = useState([]);
  const [vendedoresCompletos, setVendedoresCompletos] = useState([]);
  const [clientesOptions, setClientesOptions] = useState([]);
  const [vendedoresOptions, setVendedoresOptions] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Opciones de estado (solo los permitidos para cambiar)
  const estadosOptions = [
    { value: null, label: "- Sin cambio -" },
    { value: -1, label: "No Identificado" },
    { value: 3, label: "Garantía" },
    { value: 4, label: "Tarjeta" },
  ];

  // Consultar clientes y vendedores cuando se abre el modal
  useEffect(() => {
    const cargarDatos = async () => {
      if (transaccion && transaccion.NOMBRE_EMPRESA) {
        setCargandoDatos(true);
        try {
          // Consultar TODOS los clientes
          const clientes = await ConsultarClientesPorEmpresa(
            user.USUARIO.USUA_CORREO,
            transaccion.NOMBRE_EMPRESA
          );
          const clientesOpts = clientes.map((cliente) => ({
            value: cliente.NOMBRE_SOCIO,
            label: `${cliente.NOMBRE_SOCIO} - ${cliente.CODIGO_SOCIO}`,
            codigo: cliente.CODIGO_SOCIO,
          }));
          setClientesCompletos(clientesOpts);
          // Inicialmente mostrar solo los primeros 20
          setClientesOptions(clientesOpts.slice(0, 20));

          // Consultar TODOS los vendedores
          const vendedores = await ConsultarVendedoresPorEmpresa(
            transaccion.NOMBRE_EMPRESA
          );
          const vendedoresOpts = vendedores.map((vendedor) => ({
            value: vendedor.VENDEDOR,
            label: vendedor.VENDEDOR,
          }));
          setVendedoresCompletos(vendedoresOpts);
          // Inicialmente mostrar solo los primeros 20
          setVendedoresOptions(vendedoresOpts.slice(0, 20));
        } catch (error) {
          console.error("Error al cargar datos:", error);
        } finally {
          setCargandoDatos(false);
        }
      }
    };

    cargarDatos();
  }, [transaccion]);

  // Inicializar formulario con los datos de la transacción
  useEffect(() => {
    if (
      transaccion &&
      clientesCompletos.length > 0 &&
      vendedoresCompletos.length > 0
    ) {
      const clienteEncontrado = clientesCompletos.find(
        (opt) => opt.value === transaccion.CLIENTE
      );
      const vendedorEncontrado = vendedoresCompletos.find(
        (opt) => opt.value === transaccion.VENDEDOR
      );

      setFormData({
        clienteSeleccionado: clienteEncontrado || null,
        cedula: transaccion.CODIGO_SOCIO || "",
        vendedorSeleccionado: vendedorEncontrado || null,
        comentario: transaccion.COMENTARIO || "",
        ingreso: transaccion.INGRESO || "",
        estadoSeleccionado: null, // Siempre inicia en null
      });
    }
  }, [transaccion, clientesCompletos, vendedoresCompletos]);

  // Filtrar clientes mientras el usuario escribe
  const handleClienteInputChange = (inputValue, actionMeta) => {
    // Solo filtrar si el usuario está escribiendo, no cuando selecciona
    if (actionMeta.action === "input-change") {
      if (!inputValue || inputValue.trim() === "") {
        // Si no hay búsqueda, mostrar primeros 20
        setClientesOptions(clientesCompletos.slice(0, 20));
      } else {
        // Filtrar de la lista completa y limitar a 20
        const filtrados = clientesCompletos
          .filter((cliente) =>
            cliente.label.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 20);
        setClientesOptions(filtrados);
      }
    }
  };

  // Filtrar vendedores mientras el usuario escribe
  const handleVendedorInputChange = (inputValue, actionMeta) => {
    // Solo filtrar si el usuario está escribiendo, no cuando selecciona
    if (actionMeta.action === "input-change") {
      if (!inputValue || inputValue.trim() === "") {
        // Si no hay búsqueda, mostrar primeros 20
        setVendedoresOptions(vendedoresCompletos.slice(0, 20));
      } else {
        // Filtrar de la lista completa y limitar a 20
        const filtrados = vendedoresCompletos
          .filter((vendedor) =>
            vendedor.label.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 20);
        setVendedoresOptions(filtrados);
      }
    }
  };

  const handleClienteChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      clienteSeleccionado: option,
      cedula: option?.codigo || "",
    }));
  };

  const handleVendedorChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      vendedorSeleccionado: option,
    }));
  };

  const handleEstadoChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      estadoSeleccionado: option,
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Preparar datos para guardar
    const datosParaGuardar = {
      cliente: formData.clienteSeleccionado?.value || "",
      cedula: formData.cedula,
      vendedor: formData.vendedorSeleccionado?.value || "",
      comentario: formData.comentario || "",
      ingreso: formData.ingreso || "",
      estado: formData.estadoSeleccionado?.value || null,
      identificador: transaccion.IDENTIFICADOR,
    };

    // Solo incluir estado si se seleccionó uno (diferente de null)
    if (
      formData.estadoSeleccionado?.value !== null &&
      formData.estadoSeleccionado?.value !== undefined
    ) {
      datosParaGuardar.estado = formData.estadoSeleccionado.value;
    }

    onSave(datosParaGuardar);
  };

  if (!isOpen || !transaccion) return null;

  return (
    <ModalOverlay theme={theme} onClick={onClose}>
      <ModalContainer theme={theme} onClick={(e) => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>Editar Transacción</ModalTitle>
          <ButtonUI iconLeft="FaXmark" onClick={onClose} variant="text" />
        </ModalHeader>

        <ModalBody>
          {/* Información de la transacción */}
          <InfoSection theme={theme}>
            <InfoTitle theme={theme}>Información de la Transacción</InfoTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel theme={theme}>ID</InfoLabel>
                <InfoValue theme={theme}>{transaccion.IDENTIFICADOR}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>N. Documento</InfoLabel>
                <InfoValue theme={theme}>{transaccion.NUMERO_DOCUMENTO}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Fecha</InfoLabel>
                <InfoValue theme={theme}>{formatFecha(transaccion.FECHA)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Valor</InfoLabel>
                <InfoValue theme={theme}>
                  ${parseFloat(transaccion.VALOR || 0).toFixed(2)}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Agencia</InfoLabel>
                <InfoValue theme={theme}>{transaccion.AGENCIA}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Tipo Transacción</InfoLabel>
                <InfoValue theme={theme}>{transaccion.TIPO_TRANSACCION}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Concepto</InfoLabel>
                <InfoValue theme={theme}>{transaccion.CONCEPTO_TRANSACCION}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Referencia Banco</InfoLabel>
                <InfoValue theme={theme}>{transaccion.REFERENCIA_BANCO}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Cliente Banco</InfoLabel>
                <InfoValue theme={theme}>{transaccion.CLIENTE_BANCO}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Banco</InfoLabel>
                <InfoValue theme={theme}>{transaccion.NOMBRE_BANCO}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Empresa</InfoLabel>
                <InfoValue theme={theme}>{transaccion.NOMBRE_EMPRESA}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel theme={theme}>Estado Actual</InfoLabel>
                <div>
                  <ChipEstado
                    $bgColor={getColorEstado(parseInt(transaccion.ESTADO)).bg}
                    $textColor={
                      getColorEstado(parseInt(transaccion.ESTADO)).text
                    }
                  >
                    <span>{getNombreEstado(parseInt(transaccion.ESTADO))}</span>
                  </ChipEstado>
                </div>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          {/* Campos editables */}
          <FormField>
            <Label theme={theme}>Cliente</Label>
            <SelectUI
              options={clientesOptions}
              value={formData.clienteSeleccionado}
              onChange={handleClienteChange}
              onInputChange={handleClienteInputChange}
              placeholder={
                cargandoDatos ? "Cargando clientes..." : "Buscar cliente..."
              }
              label=""
              isSearchable={true}
              isDisabled={cargandoDatos}
              minWidth="100%"
              maxWidth="100%"
              menuWidth="100%"
              menuMaxWidth="100%"
              menuMaxHeight="180px"
            />
          </FormField>

          <FormField>
            <Label theme={theme}>Cédula / RUC</Label>
            <InputUI
              type="text"
              value={formData.cedula}
              onChange={(value) => {}}
              placeholder="Se completa automáticamente"
              inputStyle={{
                backgroundColor: theme.colors.backgroundLight || theme.colors.background,
                cursor: "not-allowed",
              }}
              containerStyle={{ pointerEvents: "none" }}
            />
          </FormField>

          <FormField>
            <Label theme={theme}>Vendedor</Label>
            <SelectUI
              options={[
                { value: "GARANTIA", label: "GARANTIA" },
                { value: "CAJA", label: "CAJA" },
                ...vendedoresOptions,
              ]}
              value={formData.vendedorSeleccionado}
              onChange={handleVendedorChange}
              onInputChange={handleVendedorInputChange}
              placeholder={
                cargandoDatos ? "Cargando vendedores..." : "Buscar vendedor o tipo..."
              }
              label=""
              isSearchable={true}
              isDisabled={cargandoDatos}
              minWidth="100%"
              maxWidth="100%"
              menuWidth="100%"
              menuMaxWidth="100%"
              menuMaxHeight="120px"
            />
          </FormField>

          <FormField>
            <Label theme={theme}>Ingreso</Label>
            <InputUI
              type="text"
              value={formData.ingreso}
              onChange={(value) => handleChange("ingreso", value)}
              placeholder="Ingreso"
            />
          </FormField>

          <FormField>
            <Label theme={theme}>Comentario</Label>
            <InputUI
              type="text"
              value={formData.comentario}
              onChange={(value) => handleChange("comentario", value)}
              placeholder="Comentarios adicionales"
            />
          </FormField>

          <FormField>
            <Label theme={theme}>Nuevo Estado</Label>
            <SelectUI
              options={estadosOptions}
              value={formData.estadoSeleccionado || estadosOptions[0]}
              onChange={handleEstadoChange}
              placeholder="Cambiar estado..."
              label=""
              isSearchable={false}
              minWidth="100%"
              maxWidth="100%"
              menuMaxHeight="80px"
            />
          </FormField>
        </ModalBody>

        <ModalFooter theme={theme}>
          <ButtonUI text="Cancelar" onClick={onClose} variant="outlined" />
          <ButtonUI
            text="Guardar Cambios"
            iconLeft="FaFloppyDisk"
            onClick={handleSave}
            isAsync
          />
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};
