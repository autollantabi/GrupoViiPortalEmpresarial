import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { hasAccessToResource } from "utils/permissionsValidator";
import { appShellService_obtenerInfluencers, appShellService_obtenerCatalogoTrivias, appShellService_asignarPuntosInfluencer } from "services/appShell_Service";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";

const OPCIONES_TIPOS = [
  { value: "influenciador", label: "Influenciador" }
];

const OPCIONES_GANANCIAS = [
  { value: "travia_futbol", label: "Trivia Futbol" }
];

const OPCIONES_TRIVIA = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" }
];

export default function AS_PuntosExtras() {
  const { theme } = useTheme();
  const { user } = useAuthContext();

  // Validación de Contexto en doble capa
  const tieneAcceso = useMemo(() => {
    return user?.CONTEXTOS && hasAccessToResource(user.CONTEXTOS, "appshell.puntosextra");
  }, [user]);

  // Estados para selectores - Pre-seleccionados por defecto
  const [tipoUsuario, setTipoUsuario] = useState(OPCIONES_TIPOS[0]);
  const [tipoGanancia, setTipoGanancia] = useState(OPCIONES_GANANCIAS[0]);

  // Estado de búsqueda para filtrar la tabla por nombre o correo
  const [busqueda, setBusqueda] = useState("");

  // Lista plana de usuarios — se llenará desde la API.
  // Cada usuario tiene: { nombre, correo, puntos_extras, trivia }
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const resp = await appShellService_obtenerInfluencers();
      if (resp.success && Array.isArray(resp.data)) {
        const influencers = resp.data.filter(u => u.ROLE?.NAME_ROLE === "INFLUENCIADOR");
        const mapped = influencers.map(u => ({
          nombre: `${u.NAME || ""} ${u.LASTNAME || ""}`.trim(),
          correo: u.EMAIL || "",
          puntos_extras: u.DINAMICAS?.reduce((sum, d) => sum + (d.EXTRA_POINTS || 0), 0) || 0,
          trivia: 1,
          id: u.ID,
          dinamicas_completadas: u.DINAMICAS?.map(d => d.DYNAMIC_ID) || []
        }));
        setUsuarios(mapped);
      } else {
        toast.error("Error al cargar los influenciadores");
      }
    };

    const fetchTrivias = async () => {
      const resp = await appShellService_obtenerCatalogoTrivias();
      if (resp.success && Array.isArray(resp.data)) {
        const trivias = resp.data.filter(t => t.CATEGORY === "TRIVIA");
        const mapped = trivias.map(t => ({ value: t.ID, label: t.NAME }));
        setOpcionesTrivia(mapped);
      } else {
        toast.error("Error al cargar el catálogo de dinámicas");
      }
    };

    if (tieneAcceso) {
      fetchUsuarios();
      fetchTrivias();
    }
  }, [tieneAcceso]);

  // Opciones para el selector de Trivia — se cargarán desde la API.
  const [opcionesTrivia, setOpcionesTrivia] = useState([]);

  // Mapa de trivia seleccionada por usuario: { [id]: value }
  const [triviaSeleccionada, setTriviaSeleccionada] = useState({});

  const handleCambiarTriviaColumna = (idUsuario, valor) => {
    setTriviaSeleccionada(prev => ({ ...prev, [idUsuario]: valor }));
  };

  // Manejar el cambio del selector Trivia para un usuario
  const handleCambiarTrivia = (idUsuario, nuevoValor) => {
    setUsuarios(prev =>
      prev.map(u =>
        u.id === idUsuario
          ? { ...u, trivia: nuevoValor }
          : u
      )
    );
  };

  // Lista filtrada reactivamente por búsqueda de nombre o correo (case-insensitive)
  const listaFiltrada = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    return query
      ? usuarios.filter(u =>
        u.nombre.toLowerCase().includes(query) ||
        u.correo.toLowerCase().includes(query)
      )
      : usuarios;
  }, [usuarios, busqueda]);

  const listadoHabilitado = tipoUsuario && tipoGanancia;

  // Manejar la asignación directa de puntos (sin modal)
  const handleAsignarPuntos = async (usr) => {
    const completedCount = parseInt(usr.trivia || 1, 10);
    const pts = completedCount * 5;

    const dynId = triviaSeleccionada[usr.id];
    if (!dynId) {
      toast.error("Por favor, seleccione una trivia para este usuario antes de asignar puntos.");
      return;
    }

    const payload = {
      influencerId: usr.id,
      dynamicId: parseInt(dynId, 10),
      completedCount: completedCount,
      extraPoints: pts
    };

    const resp = await appShellService_asignarPuntosInfluencer(payload);
    if (resp.success) {
      setUsuarios(prev =>
        prev.map(u =>
          u.id === usr.id
            ? { 
                ...u, 
                puntos_extras: (u.puntos_extras || 0) + pts,
                dinamicas_completadas: [...(u.dinamicas_completadas || []), payload.dynamicId]
              }
            : u
        )
      );

      toast.success(`Se asignaron +${pts.toLocaleString()} puntos a ${usr.nombre}!`);
    } else {
      toast.error(resp.message || "Error al asignar los puntos");
    }
  };

  // Si no tiene el contexto de seguridad requerido
  if (!tieneAcceso) {
    return (
      <ContainerUI width="100%" height="100%" flexDirection="column">
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
          backgroundColor: hexToRGBA({ hex: theme?.colors?.error || "#dc3545", alpha: 0.1 }),
          border: `1px solid ${hexToRGBA({ hex: theme?.colors?.error || "#dc3545", alpha: 0.25 })}`,
          borderRadius: 12,
          maxWidth: 500,
          margin: "80px auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)"
        }}>
          <IconUI name="FaTriangleExclamation" size={48} color={theme?.colors?.error || "#dc3545"} style={{ marginBottom: 16 }} />
          <TextUI size="20px" weight="600" color={theme?.colors?.error || "#dc3545"}>
            Acceso Restringido
          </TextUI>
          <TextUI size="14px" color={theme?.colors?.text} style={{ marginTop: 12, lineHeight: "1.6" }}>
            Su usuario no posee los permisos o el contexto de seguridad requerido (<strong>appshell.puntosextra</strong>) para administrar los puntos extras.
          </TextUI>
          <div style={{ marginTop: 24 }}>
            <ButtonUI
              text="Volver al Inicio"
              iconLeft="FaHouse"
              onClick={() => window.location.href = "/"}
              pcolor={theme?.colors?.primary}
            />
          </div>
        </div>
      </ContainerUI>
    );
  }

  const subtleBorder = `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.15 })}`;
  const cardShadow = "0 4px 20px rgba(0, 0, 0, 0.05)";
  const selectorStyle = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.2 })}`,
    backgroundColor: theme?.colors?.backgroundCard || "#ffffff",
    color: theme?.colors?.text || "#1e293b",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };

  return (
    <div style={{ padding: 24, overflow: "auto", width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Cabecera */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingBottom: 16,
        borderBottom: `2px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.08 })}`
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: hexToRGBA({ hex: theme?.colors?.secondary || "#6366f1", alpha: 0.15 }),
          color: theme?.colors?.secondary || "#6366f1"
        }}>
          <IconUI name="FaCoins" size={20} />
        </div>
        <TextUI size="22px" weight="700" color={theme?.colors?.text}>
          Puntos Extras
        </TextUI>
      </div>

      {/* Selectores y Búsqueda */}
      <div style={{
        padding: 24,
        borderRadius: 12,
        backgroundColor: theme?.colors?.backgroundCard || "#ffffff",
        border: subtleBorder,
        boxShadow: cardShadow,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        maxWidth: 900
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SelectUI
            label="Tipo de usuario"
            placeholder="Seleccione el tipo..."
            options={OPCIONES_TIPOS}
            value={tipoUsuario}
            onChange={setTipoUsuario}
            isSearchable={false}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SelectUI
            label="Tipo de ganancia"
            placeholder="Seleccione la ganancia..."
            options={OPCIONES_GANANCIAS}
            value={tipoGanancia}
            onChange={setTipoGanancia}
            isSearchable={false}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <TextUI size="14px" weight="600" color={theme?.colors?.text}>
            Buscar usuario
          </TextUI>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 12, color: theme?.colors?.textSecondary || "#64748b", display: "flex", alignItems: "center" }}>
              <IconUI name="FaSearch" size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                padding: "0 12px 0 34px",
                borderRadius: 8,
                border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.15 })}`,
                backgroundColor: theme?.colors?.background || "#fafafa",
                color: theme?.colors?.text || "#1e293b",
                fontSize: "14px",
                fontWeight: "500",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s ease"
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      {listadoHabilitado ? (
        <div style={{
          borderRadius: 12,
          backgroundColor: theme?.colors?.backgroundCard || "#ffffff",
          border: subtleBorder,
          boxShadow: cardShadow,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.1 })}`,
            backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.02 }),
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <TextUI size="16px" weight="600" color={theme?.colors?.text}>
                Listado de {tipoUsuario.label}s
              </TextUI>
              <TextUI size="12px" color={theme?.colors?.textSecondary || "#64748b"} style={{ marginTop: 2 }}>
                Puntos obtenidos por: <strong>{tipoGanancia.label}</strong>
              </TextUI>
            </div>
            <span style={{
              fontSize: "12px",
              padding: "4px 12px",
              borderRadius: "20px",
              fontWeight: "600",
              backgroundColor: hexToRGBA({ hex: theme?.colors?.secondary || "#6366f1", alpha: 0.1 }),
              color: theme?.colors?.secondary || "#6366f1"
            }}>
              {listaFiltrada.length} Registros
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{
                  borderBottom: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.1 })}`,
                  backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.04 })
                }}>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b" }}>Nombre</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b" }}>Correo Electrónico</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b", textAlign: "center" }}>Trivia</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b", textAlign: "center" }}>Aciertos</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b", textAlign: "right" }}>Puntos Extras</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: theme?.colors?.textSecondary || "#64748b", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 24px", textAlign: "center", color: theme?.colors?.textSecondary || "#64748b" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <IconUI name="FaUsers" size={28} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          {busqueda ? "No se encontraron usuarios con ese criterio de búsqueda." : "No hay usuarios disponibles."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listaFiltrada.map((usr, index) => (
                    <tr
                      key={usr.id}
                      style={{
                        borderBottom: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.06 })}`,
                        backgroundColor: index % 2 === 0 ? "transparent" : hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.015 }),
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hexToRGBA({ hex: theme?.colors?.primary || "#6366f1", alpha: 0.04 });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? "transparent" : hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.015 });
                      }}
                    >
                      <td style={{ padding: "16px 24px", fontWeight: "600", color: theme?.colors?.text }}>{usr.nombre}</td>
                      <td style={{ padding: "16px 24px", color: theme?.colors?.textSecondary || "#64748b" }}>{usr.correo}</td>
                      <td style={{ padding: "12px 24px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <select
                            value={triviaSeleccionada[usr.id] || ""}
                            onChange={(e) => handleCambiarTriviaColumna(usr.id, e.target.value)}
                            style={selectorStyle}
                          >
                            <option value="" disabled>—</option>
                            {opcionesTrivia
                              .filter(op => !(usr.dinamicas_completadas || []).includes(op.value))
                              .map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: "12px 24px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <select
                            value={usr.trivia || 1}
                            onChange={(e) => handleCambiarTrivia(usr.id, parseInt(e.target.value, 10))}
                            style={selectorStyle}
                          >
                            {OPCIONES_TRIVIA.map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: "700", color: theme?.name !== "light" ? "#38bdf8" : (theme?.colors?.secondary || "#6366f1"), textAlign: "right" }}>
                        {((usr.trivia || 1) * 5).toLocaleString()} pts
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <ButtonUI
                            text="Asignar Puntos"
                            iconLeft="FaPlus"
                            onClick={() => handleAsignarPuntos(usr)}
                            pcolor={theme?.colors?.primary}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          borderRadius: 12,
          backgroundColor: theme?.colors?.backgroundCard || "#ffffff",
          border: `1px dashed ${hexToRGBA({ hex: theme?.colors?.primary || "#334155", alpha: 0.2 })}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          maxWidth: 600
        }}>
          <IconUI name="FaUsers" size={32} color={theme?.colors?.textSecondary || "#64748b"} style={{ opacity: 0.6 }} />
          <TextUI size="15px" weight="500" color={theme?.colors?.textSecondary || "#64748b"}>
            Selecciona el tipo de usuario y el tipo de ganancia en el panel superior para visualizar el listado.
          </TextUI>
        </div>
      )}

    </div>
  );
}
