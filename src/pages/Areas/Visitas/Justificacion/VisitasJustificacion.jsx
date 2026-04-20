import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { TextUI } from "components/UI/Components/TextUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { CardUI } from "components/UI/Components/CardUI";
import { useTheme } from "context/ThemeContext";

import { ListarUsuariosSistema } from "services/administracionService";
import { ModalUI } from "components/UI/Components/ModalUI";

const Container = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 10px 0;
`;

const MOTIVO_OPTIONS = [
  { value: "Falta Laboral", label: "Falta Laboral" },
  { value: "Permiso Medico", label: "Permiso Medico" },
  { value: "Vacaciones", label: "Vacaciones" },
  { value: "Cartera", label: "Cartera" },
  { value: "Siniestro", label: "Siniestro" },
  { value: "Otros", label: "Otros" },
];

export const VisitasJustificacion = () => {
  const { theme } = useTheme();

  // Fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    nombre: null,
    motivo: null,
    comentarios: "",
    fecha: today,
  });

  const [justificaciones, setJustificaciones] = useState([]);

  const [usuarios, setUsuarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await ListarUsuariosSistema();
        const options = data.map(u => ({
          value: u.NOMBRE_COMPLETO || u.NOMBRE || u.USUARIO,
          label: u.NOMBRE_COMPLETO || u.NOMBRE || u.USUARIO
        }));
        setUsuarios(options);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    };
    cargarUsuarios();
  }, []);

  const isComentariosRequired = formData.motivo?.value === "Otros";

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgregar = () => {
    if (!formData.nombre || !formData.motivo || !formData.fecha) {
      alert("Por favor complete nombre, motivo y fecha.");
      return;
    }

    if (isComentariosRequired && !formData.comentarios.trim()) {
      alert("El campo comentarios es obligatorio cuando el motivo es 'Otros'.");
      return;
    }

    const nuevaJustificacion = {
      id: Date.now(),
      nombre: formData.nombre.value,
      motivo: formData.motivo.value,
      comentarios: formData.comentarios,
      fecha: formData.fecha,
    };

    setJustificaciones((prev) => [nuevaJustificacion, ...prev]);
    setFormData({ nombre: null, motivo: null, comentarios: "", fecha: today });
    setIsModalOpen(false);
  };

  const columns = [
    { header: "Fecha", field: "fecha", width: "15%", editType: "date" },
    { header: "Nombre", field: "nombre", width: "25%" },
    { header: "Motivo", field: "motivo", width: "20%" },
    { header: "Comentarios", field: "comentarios", width: "40%" },
  ];

  return (
    <ContenedorPadre direccion="c">
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextUI variant="h1" weight="bold">Justificación de Visitas</TextUI>
          <ButtonUI
            text="Nueva Justificación +"
            onClick={() => setIsModalOpen(true)}
            pcolor={theme.colors.primary}
            pcolortext={theme.colors.white}
          />
        </div>

        <ModalUI
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nueva Justificación de Visita"
          onSave={handleAgregar}
          saveText="Agregar"
          maxWidth="500px"
        >
          <FormGrid>
            <InputUI
              label="Fecha"
              type="date"
              value={formData.fecha}
              onChange={(val) => handleInputChange("fecha", val)}
            />
            <SelectUI
              label="Seleccionar Nombre"
              options={usuarios}
              value={formData.nombre}
              onChange={(val) => handleInputChange("nombre", val)}
              placeholder="Seleccione un usuario..."
              maxWidth="100%"
              minWidth="100%"
            />
            <SelectUI
              label="Motivo"
              options={MOTIVO_OPTIONS}
              value={formData.motivo}
              onChange={(val) => handleInputChange("motivo", val)}
              placeholder="Seleccione un motivo..."
              maxWidth="100%"
              minWidth="100%"
            />
            <InputUI
              label={`Comentarios ${isComentariosRequired ? "(Obligatorio)" : "(Opcional)"}`}
              placeholder="Ingrese comentarios adicionales"
              value={formData.comentarios}
              onChange={(val) => handleInputChange("comentarios", val)}
              required={isComentariosRequired}
            />
          </FormGrid>
        </ModalUI>

        <div style={{ flex: 1, minHeight: '400px' }}>
          <TablaInfoUI
            data={justificaciones}
            columns={columns}
            defaultFilters={["fecha", "nombre", "motivo"]}
            filenameExcel="Justificaciones_Visitas"
            excel={true}
            showFilters={true}
          />
        </div>
      </Container>
    </ContenedorPadre>
  );
};
