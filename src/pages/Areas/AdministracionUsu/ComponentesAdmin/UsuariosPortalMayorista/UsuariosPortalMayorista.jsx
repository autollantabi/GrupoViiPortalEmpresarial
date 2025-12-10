import React, { useState, useEffect } from "react";
import { CustomCard } from "components/UI/CustomComponents/CustomCard";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomDateSelector } from "components/UI/CustomComponents/CustomDateSelector";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";
import { toast } from "react-toastify";
import { hexToRGBA } from "utils/colors";
import {
  portalMayoristaService_crearVendedor,
  portalMayoristaService_obtenerUsuarios,
} from "services/portalMayorista_Service";

const ROLES_PORTAL_MAYORISTA = [
  { id: 1, name: "Manager" },
  { id: 2, name: "Vendedor" },
  { id: 3, name: "Influenciador" },
];

export const UsuariosPortalMayorista = () => {
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
    const usuariosAppShell = await portalMayoristaService_obtenerUsuarios();

    if (usuariosAppShell.success) {
      setUsuarios(usuariosAppShell.data || []);
    } else {
      toast.error(usuariosAppShell.message || "Error al obtener los usuarios");
    }
    setCargandoUsuarios(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneChange = (value) => {
    let phoneValue = value;
    if (!phoneValue.startsWith("+")) {
      phoneValue = "+" + phoneValue;
    }
    handleInputChange("phone", phoneValue);
  };

  const formatPhoneValue = (value) => {
    if (!value) return "";
    if (value.startsWith("+")) {
      return value;
    }
    return "+" + value;
  };

  const handleDateChange = (date) => {
    handleInputChange("birth_date", date);
  };

  const filtrarUsuarios = () => {
    if (!busquedaUsuario.trim()) return usuarios;

    const busqueda = busquedaUsuario.toLowerCase().trim();

    return usuarios.filter((usuario) => {
      const nombre = (usuario.NAME || usuario.name || "").toLowerCase();
      const apellido = (
        usuario.LASTNAME ||
        usuario.lastname ||
        ""
      ).toLowerCase();
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
    if (!validateForm()) {
      return;
    }

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

    const response = await portalMayoristaService_crearVendedor(dataToSend);

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
    <CustomContainer
      width="100%"
      height="100%"
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{
        padding: "20px",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <CustomCard
        title="Crear Nuevo Vendedor"
        description="Complete el formulario para crear un nuevo vendedor en el portal mayorista"
        body={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              width: "100%",
            }}
          >
            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomInput
                label="Nombre"
                placeholder="Ingrese el nombre"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
              />
            </div>

            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomInput
                label="Apellido"
                placeholder="Ingrese el apellido"
                value={formData.lastname}
                onChange={(value) => handleInputChange("lastname", value)}
              />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomInput
                label="Cédula"
                placeholder="Ingrese la cédula"
                value={formData.card_id}
                onChange={(value) => handleInputChange("card_id", value)}
              />
            </div>

            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomInput
                label="Email"
                type="email"
                placeholder="Ingrese el email"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
              />
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomInput
                label="Teléfono"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={handlePhoneChange}
                formatValue={formatPhoneValue}
              />
            </div>

            <div style={{ flex: "1", minWidth: "250px" }}>
              <CustomDateSelector
                label="Fecha de Nacimiento"
                fecha={formData.birth_date}
                onChange={handleDateChange}
              />
            </div>
          </div>
        }
        footer={
          <CustomButton
            text="Crear Vendedor"
            onClick={handleSubmit}
            disabled={loading}
            isAsync={true}
            pcolor={theme.colors.secondary}
            width="200px"
          />
        }
        style={{ flex: "1", minWidth: "400px", maxWidth: "600px" }}
        theme={theme}
      />

      <CustomCard
        title="Lista de Usuarios - Portal Mayorista"
        description="Usuarios registrados en el portal mayorista"
        body={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <CustomInput
              placeholder="Buscar por nombre, apellido, email, cédula o teléfono..."
              value={busquedaUsuario}
              onChange={setBusquedaUsuario}
              disabled={cargandoUsuarios}
              iconLeft="bi bi-search"
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {cargandoUsuarios ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: theme.colors.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  Cargando usuarios...
                </div>
              ) : usuarios.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: theme.colors.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  No hay usuarios registrados
                </div>
              ) : filtrarUsuarios().length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: theme.colors.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  No se encontraron usuarios que coincidan con la búsqueda
                </div>
              ) : (
                filtrarUsuarios().map((usuario, index) => {
                  const nombre = usuario.NAME || usuario.name || "";
                  const apellido = usuario.LASTNAME || usuario.lastname || "";
                  const email = usuario.EMAIL || usuario.email || "";
                  const cedula = usuario.CARD_ID || usuario.card_id || "";
                  const telefono = usuario.PHONE || usuario.phone || "";
                  const fechaNacimiento =
                    usuario.BIRTH_DATE || usuario.birth_date;
                  const rol =
                    usuario.ROLE?.NAME_ROLE ||
                    (usuario.ROLE_ID &&
                      ROLES_PORTAL_MAYORISTA.find(
                        (r) => r.id === usuario.ROLE_ID
                      )?.name) ||
                    "";

                  return (
                    <div
                      key={usuario.ID || usuario.id || index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "16px",
                        borderRadius: "8px",
                        backgroundColor: hexToRGBA({
                          hex: theme.colors.primary,
                          alpha: index % 2 === 0 ? 0.05 : 0.02,
                        }),
                        border: `1px solid ${hexToRGBA({
                          hex: theme.colors.primary,
                          alpha: 0.15,
                        })}`,
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <CustomText
                          weight="600"
                          size="15px"
                          color={theme.colors.text}
                        >
                          {nombre} {apellido}
                        </CustomText>
                        {rol && (
                          <div
                            style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              backgroundColor: hexToRGBA({
                                hex: theme.colors.secondary,
                                alpha: 0.2,
                              }),
                              border: `1px solid ${hexToRGBA({
                                hex: theme.colors.secondary,
                                alpha: 0.3,
                              })}`,
                            }}
                          >
                            <CustomText
                              size="11px"
                              weight="500"
                              color={theme.colors.secondary}
                            >
                              {rol}
                            </CustomText>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "8px",
                        }}
                      >
                        {email && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <CustomText
                              size="11px"
                              weight="500"
                              color={theme.colors.textSecondary}
                            >
                              Email
                            </CustomText>
                            <CustomText size="13px" color={theme.colors.text}>
                              {email}
                            </CustomText>
                          </div>
                        )}

                        {cedula && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <CustomText
                              size="11px"
                              weight="500"
                              color={theme.colors.textSecondary}
                            >
                              Cédula
                            </CustomText>
                            <CustomText size="13px" color={theme.colors.text}>
                              {cedula}
                            </CustomText>
                          </div>
                        )}

                        {telefono && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <CustomText
                              size="11px"
                              weight="500"
                              color={theme.colors.textSecondary}
                            >
                              Teléfono
                            </CustomText>
                            <CustomText size="13px" color={theme.colors.text}>
                              {telefono}
                            </CustomText>
                          </div>
                        )}

                        {fechaNacimiento && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <CustomText
                              size="11px"
                              weight="500"
                              color={theme.colors.textSecondary}
                            >
                              Fecha de Nacimiento
                            </CustomText>
                            <CustomText size="13px" color={theme.colors.text}>
                              {new Date(fechaNacimiento).toLocaleDateString(
                                "es-ES",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </CustomText>
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
          <CustomButton
            text="Actualizar Lista"
            onClick={cargarUsuarios}
            disabled={cargandoUsuarios}
            pcolor={theme.colors.primary}
            width="150px"
          />
        }
        style={{ flex: "1", minWidth: "400px", maxWidth: "800px" }}
        theme={theme}
      />
    </CustomContainer>
  );
};
