import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ListarVisitasHoy, GuardarVisitasModificadas } from "services/visitasService";
import { useTheme } from "context/ThemeContext";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
`;

const SelectSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  background: ${({ theme }) => theme.colors.container};
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailsContainer = styled.div`
  background: ${({ theme }) => theme.colors.container};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.container} 0%,
    ${({ theme }) => theme.colors.container} 95%,
    ${({ theme }) => theme.colors.primary}08 100%
  );
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow-y: auto;
  flex: 1;

  /* Estilo para el scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary}50;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${({ theme }) => theme.colors.primary};
    position: sticky;
    top: 0;
  }
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 40px;
  background: ${({ theme }) => theme.colors.container};
  border-radius: 16px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}50;
    background: ${({ theme }) => theme.colors.primary}05;
  }
`;

export const VisitasAsignadas = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [observacion, setObservacion] = useState("");
  const [dynamicTimes, setDynamicTimes] = useState({ inicio: "", fin: "" });

  const formattedDate = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('es-ES', { weekday: 'long' });
    let capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNumber = now.getDate();
    const monthName = now.toLocaleDateString('es-ES', { month: 'long' });

    return `${capitalizedDay} ${dayNumber} de ${monthName}`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await ListarVisitasHoy();
        setData(result);
      } catch (error) {
        toast.error("Error al cargar las visitas de hoy");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Opciones para el selector de vendedor
  const sellerOptions = useMemo(() => {
    return data.map((item) => ({
      value: item.vendedorReemplazado,
      label: `${item.vendedorReemplazado}`,
      original: item
    }));
  }, [data]);

  // Opciones para el selector de cliente basándose en el vendedor seleccionado
  const clientOptions = useMemo(() => {
    if (!selectedSeller) return [];
    return selectedSeller.original.visitas.map((visita, index) => ({
      value: visita.hvi_idvisita || index,
      label: visita.hvi_nombrecliente,
      original: visita
    }));
  }, [selectedSeller]);

  const visitDetails = selectedClient?.original || null;

  useEffect(() => {
    let interval = null;

    if (visitDetails) {
      setObservacion("");
      
      const updateTimes = () => {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        
        const formatTime = (date) => {
          return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        };

        setDynamicTimes({
          inicio: formatTime(oneMinuteAgo),
          fin: formatTime(now)
        });
      };

      // Inicializar inmediatamente
      updateTimes();
      
      // Actualizar cada segundo
      interval = setInterval(updateTimes, 1000);
    } else {
      setDynamicTimes({ inicio: "", fin: "" });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visitDetails]);

  const handleAccept = async () => {
    if (!visitDetails) return;

    const payload = [
      {
        vmr_nombrevendedor: visitDetails.hvi_nombrevendedor,
        vmr_nombrecliente: visitDetails.hvi_nombrecliente,
        vmr_cuenta: visitDetails.hvi_cuenta,
        vmr_fechavisita: visitDetails.hvi_fechavisita,
        vmr_horaincio: dynamicTimes.inicio,
        vmr_horafin: dynamicTimes.fin,
        vmr_tiempototal: visitDetails.hvi_tiempototal,
        vmr_tiempomovilizacion: visitDetails.hvi_tiempomovilizacion,
        vmr_latitudcliente: visitDetails.hvi_latitudcliente,
        vmr_longitudcliente: visitDetails.hvi_longitudcliente,
        vmr_latitudvisita: visitDetails.hvi_latitudvisita,
        vmr_longitudvisita: visitDetails.hvi_longitudvisita,
        vmr_distanciavisita: visitDetails.hvi_distanciavisita,
        vmr_tipovisita: "VISITA PRESENCIAL",
        vmr_resultadovisita: "NO_GESTION",
        vmr_valorpedido: visitDetails.hvi_valorpedido,
        vmr_valorrecaudo: visitDetails.hvi_valorrecaudo,
        vmr_visitaextra: visitDetails.hvi_visitaextra,
        vmr_hora: visitDetails.hvi_hora,
        vmr_empresa: visitDetails.hvi_empresa,
        vmr_idvisita: visitDetails.hvi_idvisita,
        vmr_ciudad: visitDetails.hvi_ciudad,
        vmr_provincia: visitDetails.hvi_provincia,
        vmr_ubicacion: visitDetails.hvi_ubicacion,
        vmr_horacreacionBD: visitDetails.hvi_horacreacionBD,
        vmr_lineanegocio: visitDetails.hvi_lineanegocio,
        vmr_motivonogestion: "PORTAL",
        vmr_observacion: observacion || ""
      }
    ];

    setLoading(true);
    try {
      const success = await GuardarVisitasModificadas(payload);
      if (success) {
        toast.success("Visita guardada exitosamente");
        setSelectedClient(null);
        setObservacion("");
      } else {
        toast.error("Error al guardar la visita");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, value) => (
    <FieldWrapper>
      <Label>{label}</Label>
      <InputUI
        value={value || "N/A"}
        readOnly
        disabled
        fullWidth
      />
    </FieldWrapper>
  );

  return (
    <ContainerUI height="100%" width="100%" translate="no" className="notranslate" id="visitas-asignadas-container">
      <ContenedorPadre direccion="c" ovy="hidden" theme={theme} style={{ height: "100%", width: "100%", padding: "0", alignItems: "stretch" }}>
        <Container theme={theme}>
          <TextUI variant="h1" weight="bold" style={{ color: theme.colors.text }}>Visitas Asignadas - {formattedDate}</TextUI>

          <SelectSection theme={theme}>
            <FieldWrapper>
              <Label theme={theme}>Vendedor</Label>
              <SelectUI
                placeholder="Seleccione Vendedor"
                options={sellerOptions}
                value={selectedSeller}
                onChange={(val) => {
                  setSelectedSeller(val);
                  setSelectedClient(null);
                }}
                isLoading={loading}
                isClearable
                theme={theme}
              />
            </FieldWrapper>

            <FieldWrapper>
              <Label theme={theme}>Cliente</Label>
              <SelectUI
                placeholder="Seleccione Cliente"
                options={clientOptions}
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                isDisabled={!selectedSeller}
                isClearable
                theme={theme}
              />
            </FieldWrapper>
          </SelectSection>

          {visitDetails ? (
            <DetailsContainer theme={theme}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  background: theme.colors.primary + '15',
                  padding: '8px',
                  borderRadius: '8px',
                  color: theme.colors.primary,
                  display: 'flex'
                }}>
                  <i className="fa-solid fa-circle-info" style={{ fontSize: '20px' }}></i>
                </div>
                <TextUI variant="h2" weight="bold" style={{ margin: 0, color: theme.colors.text }}>Detalles de la Visita</TextUI>
              </div>
              <InfoGrid>
                {renderField("Hora Inicio", dynamicTimes.inicio)}
                {renderField("Hora Fin", dynamicTimes.fin)}
                
                {renderField("Tipo Visita", "VISITA PRESENCIAL")}
                {renderField("Resultado", "NO_GESTION")}
                {renderField("Motivo No Gestión", "PORTAL")}

                <FieldWrapper>
                  <Label theme={theme}>Observación</Label>
                  <InputUI
                    placeholder="Ingrese una observación..."
                    value={observacion}
                    onChange={(val) => setObservacion(val)}
                    fullWidth
                  />
                </FieldWrapper>

                <FieldWrapper style={{ gridColumn: '2' }}>
                  <ButtonUI
                    text="Aceptar"
                    onClick={handleAccept}
                    variant="primary"
                    fullWidth
                    iconLeft="FaCheck"
                    isLoading={loading}
                    disabled={loading}
                  />
                </FieldWrapper>
              </InfoGrid>
            </DetailsContainer>
          ) : (
            !loading && (
              <EmptyState theme={theme}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: theme.colors.primary + '10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <i className="fa-solid fa-user-check" style={{ fontSize: '28px', color: theme.colors.primary }}></i>
                </div>
                <TextUI variant="p" color="secondary" style={{ maxWidth: '400px', fontSize: '16px' }}>
                  {selectedSeller
                    ? "Seleccione un cliente para visualizar el detalle completo de su visita."
                    : "Seleccione un vendedor para comenzar."
                  }
                </TextUI>
              </EmptyState>
            )
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <TextUI variant="p">Cargando información...</TextUI>
            </div>
          )}
        </Container>
      </ContenedorPadre>
    </ContainerUI>
  );
};
