import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { TextUI } from "components/UI/Components/TextUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";
import { appShellService_obtenerUsuariosInfo } from "services/appShell_Service";

const ROLES_APP_SHELL = [
  { id: 1, name: "Manager" },
  { id: 2, name: "Vendedor" },
  { id: 3, name: "Influenciador" },
];

function normalizarListaUsuarios(data) {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.users && Array.isArray(data.users)) return data.users;
  return [];
}

/** Tipo de asociación según el rol del usuario: INFLUENCIADOR → Manager; MANAGER → Vendedor */
function tipoAsociacionLabel(rolNombreUsuario) {
  const r = (rolNombreUsuario || "").toUpperCase();
  if (r === "INFLUENCIADOR") return "Manager asociado";
  if (r === "MANAGER") return "Vendedor asociado";
  return "Asociado";
}

/** Mensaje cuando la asociación está pendiente (arreglo vacío o sin datos) */
function mensajeAsociacionPendiente(rolNombreUsuario) {
  const r = (rolNombreUsuario || "").toUpperCase();
  if (r === "INFLUENCIADOR") return "Asociación con manager pendiente";
  if (r === "MANAGER") return "Asociación con vendedor pendiente";
  return "Asociación pendiente";
}

export default function AS_UsuariosApp() {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [filtroRol, setFiltroRol] = useState(null);

  const cargarUsuarios = async () => {
    setCargando(true);
    const res = await appShellService_obtenerUsuariosInfo();
    if (res.success) {
      setUsuarios(normalizarListaUsuarios(res.data));
    } else {
      toast.error(res.message || "Error al obtener los usuarios");
      setUsuarios([]);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);


  const rolNombre = (u) => {
    // Priorizar ROLE.NAME_ROLE si existe
    if (u.ROLE?.NAME_ROLE) return u.ROLE.NAME_ROLE;
    if (u.ROLE?.name) return u.ROLE.name;
    // Si no, buscar por ROLE_ID en el mapeo
    const roleId = u.ROLE_ID ?? u.roleId;
    if (roleId != null) return ROLES_APP_SHELL.find((r) => r.id === roleId)?.name ?? "";
    return "";
  };

  const opcionesRoles = useMemo(() => {
    const lista = [
      { value: "", label: "Todos los roles" },
      ...ROLES_APP_SHELL.map((r) => ({ value: r.name, label: r.name })),
    ];
    return lista;
  }, []);

  const usuariosFiltrados = useMemo(() => {
    let list = Array.isArray(usuarios) ? usuarios : [];
    if (filtroGlobal.trim()) {
      const busqueda = filtroGlobal.toLowerCase().trim();
      list = list.filter((u) => {
        const nombre = (u.NAME ?? u.name ?? "").toLowerCase();
        const apellido = (u.LASTNAME ?? u.lastname ?? "").toLowerCase();
        const email = (u.EMAIL ?? u.email ?? "").toLowerCase();
        const cedula = (u.CARD_ID ?? u.card_id ?? "").toLowerCase();
        const telefono = (u.PHONE ?? u.phone ?? "").toLowerCase();
        const sapCode = (u.SAP_CODE ?? u.sap_code ?? "").toLowerCase();
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        return (
          nombre.includes(busqueda) ||
          apellido.includes(busqueda) ||
          nombreCompleto.includes(busqueda) ||
          email.includes(busqueda) ||
          cedula.includes(busqueda) ||
          telefono.includes(busqueda) ||
          sapCode.includes(busqueda)
        );
      });
    }
    if (filtroRol?.value) {
      const rolBusqueda = String(filtroRol.value).trim();
      list = list.filter((u) => {
        const nombreRol = rolNombre(u);
        return nombreRol && nombreRol.toUpperCase() === rolBusqueda.toUpperCase();
      });
    }
    return [...list].sort((a, b) => {
      const dateA = a.createdAt ?? a.created_at ?? "";
      const dateB = b.createdAt ?? b.created_at ?? "";
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [usuarios, filtroGlobal, filtroRol]);

  return (
    <ContainerUI
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 20, gap: 16, overflow: "auto" }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
        <TextUI size="20px" weight="600">
          Usuarios App Shell
        </TextUI>
        <ButtonUI
          iconLeft="FaArrowsRotate"
          onClick={cargarUsuarios}
          disabled={cargando}
          pcolor={theme?.colors?.primary}
          title="Actualizar lista"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
          <div style={{ flex: "1", minWidth: 260 }}>
            <InputUI
              iconLeft="FaSistrix"
              placeholder="Buscar por nombre, apellido, email, cédula, teléfono o código SAP..."
              value={filtroGlobal}
              onChange={setFiltroGlobal}
              disabled={cargando}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <SelectUI
              label="Rol"
              placeholder="Todos los roles"
              options={opcionesRoles}
              value={filtroRol ?? opcionesRoles[0]}
              onChange={(opt) => setFiltroRol(opt?.value === "" ? null : opt)}
              isSearchable={false}
              minWidth="200px"
              maxWidth="240px"
            />
          </div>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
            Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
            No hay usuarios registrados.
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
            No hay usuarios que coincidan con el filtro.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: theme?.colors?.textSecondary }}>
              Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: "calc(100vh - 250px)",
                overflowY: "auto",
              }}
            >
              {usuariosFiltrados.map((usuario, index) => {
                const nombre = usuario.NAME ?? usuario.name ?? "";
                const apellido = usuario.LASTNAME ?? usuario.lastname ?? "";
                const email = usuario.EMAIL ?? usuario.email ?? "";
                const cedula = usuario.CARD_ID ?? usuario.card_id ?? "";
                const telefono = usuario.PHONE ?? usuario.phone ?? "";
                const sapCode = usuario.SAP_CODE ?? usuario.sap_code ?? "";
                const fechaNac = usuario.BIRTH_DATE ?? usuario.birth_date;
                const lastLogin = usuario.LAST_LOGIN ?? usuario.last_login;
                const access = usuario.ACCESS ?? usuario.access;
                const createdAt = usuario.createdAt ?? usuario.created_at;
                const rol = rolNombre(usuario);
                return (
                  <div
                    key={usuario.ID ?? usuario.id ?? index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: hexToRGBA({
                        hex: theme?.colors?.primary ?? "#334155",
                        alpha: index % 2 === 0 ? 0.05 : 0.02,
                      }),
                      border: `1px solid ${hexToRGBA({
                        hex: theme?.colors?.primary ?? "#334155",
                        alpha: 0.15,
                      })}`,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <TextUI weight="600" size="15px" color={theme?.colors?.text}>
                        {nombre} {apellido}
                      </TextUI>
                      {rol && (
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 12,
                            backgroundColor: hexToRGBA({
                              hex: theme?.colors?.secondary ?? "#6366f1",
                              alpha: 0.2,
                            }),
                            border: `1px solid ${hexToRGBA({
                              hex: theme?.colors?.secondary ?? "#6366f1",
                              alpha: 0.3,
                            })}`,
                            fontSize: 11,
                            fontWeight: 500,
                            color: theme?.colors?.secondary,
                          }}
                        >
                          {rol}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 8,
                        fontSize: 13,
                      }}
                    >
                      {email && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Email
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {email}
                          </TextUI>
                        </div>
                      )}
                      {cedula && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Cédula
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {cedula}
                          </TextUI>
                        </div>
                      )}
                      {telefono && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Teléfono
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {telefono}
                          </TextUI>
                        </div>
                      )}
                      {fechaNac && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Fecha de nacimiento
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {new Date(fechaNac).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </TextUI>
                        </div>
                      )}
                      {sapCode && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Código SAP
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {sapCode}
                          </TextUI>
                        </div>
                      )}
                      {createdAt && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Fecha de creación
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {new Date(createdAt).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TextUI>
                        </div>
                      )}
                      {lastLogin && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Último acceso
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {new Date(lastLogin).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TextUI>
                        </div>
                      )}
                      {access && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextUI size="11px" weight="500" color={theme?.colors?.textSecondary}>
                            Acceso
                          </TextUI>
                          <TextUI size="13px" color={theme?.colors?.text}>
                            {access}
                          </TextUI>
                        </div>
                      )}
                    </div>
                    {(["MANAGER", "INFLUENCIADOR"].includes((rol || "").toUpperCase()) && (() => {
                      const raw = usuario.ASSOCIATED ?? usuario.associated;
                      const esArregloVacio = Array.isArray(raw) && raw.length === 0;
                      const assoc = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
                      const tieneDatos = assoc && typeof assoc === "object" && (assoc.NAME ?? assoc.name ?? assoc.EMAIL ?? assoc.email);
                      const chipPendiente = {
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.warning ?? "#eab308", alpha: 0.4 })}`,
                        backgroundColor: hexToRGBA({ hex: theme?.colors?.warning ?? "#eab308", alpha: 0.12 }),
                        color: theme?.colors?.warning ?? "#b45309",
                      };
                      const chipStyle = {
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: 0.2 })}`,
                        backgroundColor: hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: 0.08 }),
                        color: theme?.colors?.text,
                      };
                      const chipSecondary = {
                        ...chipStyle,
                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.secondary ?? "#6366f1", alpha: 0.3 })}`,
                        backgroundColor: hexToRGBA({ hex: theme?.colors?.secondary ?? "#6366f1", alpha: 0.12 }),
                        color: theme?.colors?.secondary,
                      };
                      if (esArregloVacio || !tieneDatos) {
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                            <span style={chipPendiente}>{mensajeAsociacionPendiente(rol)}</span>
                          </div>
                        );
                      }
                      const nombreAssoc = [assoc.NAME ?? assoc.name, assoc.LASTNAME ?? assoc.lastname].filter(Boolean).join(" ") || "—";
                      const emailAssoc = assoc.EMAIL ?? assoc.email ?? "—";
                      const tipoLabel = tipoAsociacionLabel(rol);
                      return (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <span style={chipSecondary}>{tipoLabel}</span>
                          <span style={chipStyle}>{nombreAssoc}</span>
                          <span style={chipStyle}>{emailAssoc}</span>
                        </div>
                      );
                    })())}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ContainerUI>
  );
}
