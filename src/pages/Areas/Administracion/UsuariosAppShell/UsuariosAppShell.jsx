import React, { useState, useEffect } from "react";
import { CardUI } from "components/UI/Components/CardUI";
import { InputUI } from "components/UI/Components/InputUI";
import { DateSelectorUI } from "components/UI/Components/DateSelectorUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { useTheme } from "context/ThemeContext";
import { toast } from "react-toastify";
import { hexToRGBA } from "utils/colors";
import {
  appShellService_crearVendedor,
  appShellService_obtenerUsuarios,
} from "services/appShell_Service";

const ROLES_APP_SHELL = [
  { id: 1, name: "Manager" },
  { id: 2, name: "Vendedor" },
  { id: 3, name: "Influenciador" },
];

export const UsuariosAppShell = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    card_id: "",
    email: "",
    phone: "",
    roleId: 2,
    birth_date: null,
  });

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    const res = await appShellService_obtenerUsuarios();
    if (res.success) {
      setUsuarios(res.data || []);
    } else {
      toast.error(res.message || "Error al obtener los usuarios");
    }
    setCargandoUsuarios(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value) => {
    handleInputChange("phone", value.startsWith("+") ? value : "+" + value);
  };

  const formatPhoneValue = (value) => {
    if (!value) return "";
    return value.startsWith("+") ? value : "+" + value;
  };

  const handleDateChange = (date) => {
    handleInputChange("birth_date", date);
  };

  const filtrarUsuarios = () => {
    if (!busquedaUsuario.trim()) return usuarios;
    const busqueda = busquedaUsuario.toLowerCase().trim();
    return usuarios.filter((usuario) => {
      const nombre = (usuario.NAME || usuario.name || "").toLowerCase();
      const apellido = (usuario.LASTNAME || usuario.lastname || "").toLowerCase();
      const email = (usuario.EMAIL || usuario.email || "").toLowerCase();
      const cedula = (usuario.CARD_ID || usuario.card_id || "").toLowerCase();
      const telefono = (usuario.PHONE || usuario.phone || "").toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      return (
        nombre.includes(busqueda) ||
        apellido.includes(busqueda) ||
        nombreCompleto.includes(busqueda) ||
        email.includes(busqueda) ||
        cedula.includes(busqueda) ||
        telefono.includes(busqueda)
      );
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }
    if (!formData.lastname.trim()) {
      toast.error("El apellido es requerido");
      return false;
    }
    if (!formData.card_id.trim()) {
      toast.error("La cédula es requerida");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return false;
    }
    if (!formData.phone.trim() || !formData.phone.startsWith("+")) {
      toast.error("El teléfono debe tener el formato correcto (+...)");
      return false;
    }
    if (!formData.birth_date) {
      toast.error("La fecha de nacimiento es requerida");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const dataToSend = {
      name: formData.name.trim(),
      lastname: formData.lastname.trim(),
      card_id: formData.card_id.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      roleId: 2,
      birth_date: formData.birth_date,
    };
    const response = await appShellService_crearVendedor(dataToSend);
    if (response.success) {
      toast.success(response.message || "Vendedor creado exitosamente");
      setFormData({
        name: "",
        lastname: "",
        card_id: "",
        email: "",
        phone: "",
        roleId: 2,
        birth_date: null,
      });
      cargarUsuarios();
    } else {
      toast.error(response.message || "Error al crear el vendedor");
    }
    setLoading(false);
  };

  return (
    <ContainerUI
      width="100%"
      height="100%"
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: "20px", gap: "20px", flexWrap: "wrap" }}
    >
      <CardUI
        title="Crear Nuevo Vendedor"
        description="Complete el formulario para crear un nuevo vendedor en el app shell"
        body={
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <InputUI label="Nombre" placeholder="Ingrese el nombre" value={formData.name} onChange={(v) => handleInputChange("name", v)} />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <InputUI label="Apellido" placeholder="Ingrese el apellido" value={formData.lastname} onChange={(v) => handleInputChange("lastname", v)} />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <InputUI label="Cédula" placeholder="Ingrese la cédula" value={formData.card_id} onChange={(v) => handleInputChange("card_id", v)} />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <InputUI label="Email" type="email" placeholder="Ingrese el email" value={formData.email} onChange={(v) => handleInputChange("email", v)} />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <InputUI label="Teléfono" placeholder="+1234567890" value={formData.phone} onChange={handlePhoneChange} formatValue={formatPhoneValue} />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <DateSelectorUI label="Fecha de Nacimiento" fecha={formData.birth_date} onChange={handleDateChange} />
            </div>
          </div>
        }
        footer={
          <ButtonUI text="Crear Vendedor" onClick={handleSubmit} disabled={loading} isAsync={true} pcolor={theme.colors.secondary} width="200px" />
        }
        style={{ flex: "1", minWidth: "400px", maxWidth: "600px" }}
        theme={theme}
      />

      <CardUI
        title="Lista de Usuarios - App Shell"
        description="Usuarios registrados en el app shell"
        body={
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InputUI
              placeholder="Buscar por nombre, apellido, email, cédula o teléfono..."
              value={busquedaUsuario}
              onChange={setBusquedaUsuario}
              disabled={cargandoUsuarios}
              iconLeft="FaSistrix"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "500px", overflowY: "auto" }}>
              {cargandoUsuarios ? (
                <div style={{ textAlign: "center", padding: "40px", color: theme.colors.textSecondary, fontSize: "14px" }}>Cargando usuarios...</div>
              ) : usuarios.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: theme.colors.textSecondary, fontSize: "14px" }}>No hay usuarios registrados</div>
              ) : filtrarUsuarios().length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: theme.colors.textSecondary, fontSize: "14px" }}>No se encontraron usuarios que coincidan con la búsqueda</div>
              ) : (
                filtrarUsuarios().map((usuario, index) => {
                  const nombre = usuario.NAME || usuario.name || "";
                  const apellido = usuario.LASTNAME || usuario.lastname || "";
                  const email = usuario.EMAIL || usuario.email || "";
                  const cedula = usuario.CARD_ID || usuario.card_id || "";
                  const telefono = usuario.PHONE || usuario.phone || "";
                  const fechaNacimiento = usuario.BIRTH_DATE || usuario.birth_date;
                  const rol =
                    usuario.ROLE?.NAME_ROLE ||
                    (usuario.ROLE_ID && ROLES_APP_SHELL.find((r) => r.id === usuario.ROLE_ID)?.name) ||
                    "";
                  return (
                    <div
                      key={usuario.ID || usuario.id || index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "16px",
                        borderRadius: "8px",
                        backgroundColor: hexToRGBA({ hex: theme.colors.primary, alpha: index % 2 === 0 ? 0.05 : 0.02 }),
                        border: `1px solid ${hexToRGBA({ hex: theme.colors.primary, alpha: 0.15 })}`,
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <TextUI weight="600" size="15px" color={theme.colors.text}>{nombre} {apellido}</TextUI>
                        {rol && (
                          <div
                            style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              backgroundColor: hexToRGBA({ hex: theme.colors.secondary, alpha: 0.2 }),
                              border: `1px solid ${hexToRGBA({ hex: theme.colors.secondary, alpha: 0.3 })}`,
                            }}
                          >
                            <TextUI size="11px" weight="500" color={theme.colors.secondary}>{rol}</TextUI>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                        {email && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <TextUI size="11px" weight="500" color={theme.colors.textSecondary}>Email</TextUI>
                            <TextUI size="13px" color={theme.colors.text}>{email}</TextUI>
                          </div>
                        )}
                        {cedula && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <TextUI size="11px" weight="500" color={theme.colors.textSecondary}>Cédula</TextUI>
                            <TextUI size="13px" color={theme.colors.text}>{cedula}</TextUI>
                          </div>
                        )}
                        {telefono && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <TextUI size="11px" weight="500" color={theme.colors.textSecondary}>Teléfono</TextUI>
                            <TextUI size="13px" color={theme.colors.text}>{telefono}</TextUI>
                          </div>
                        )}
                        {fechaNacimiento && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <TextUI size="11px" weight="500" color={theme.colors.textSecondary}>Fecha de Nacimiento</TextUI>
                            <TextUI size="13px" color={theme.colors.text}>
                              {new Date(fechaNacimiento).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                            </TextUI>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        }
        footer={
          <ButtonUI text="Actualizar Lista" onClick={cargarUsuarios} disabled={cargandoUsuarios} pcolor={theme.colors.primary} width="150px" />
        }
        style={{ flex: "1", minWidth: "400px", maxWidth: "800px" }}
        theme={theme}
      />
    </ContainerUI>
  );
};
