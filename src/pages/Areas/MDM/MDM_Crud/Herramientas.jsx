import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { getItemsByRole, saveItemRole5, patchItemRole3, rejectItemPhase, approveItemMDM, uploadItemImages, uploadItemImagesSharepoint, getItemsDWHByLinea, createItemFromDWH, getGruposUnidades, getGruposHerramientas } from "services/mdmService";
import { generateSAPExport, generateSAPExportSecondaryFile } from "assets/templates/mdmTemplate";

const EMPRESA_HERRAMIENTAS = 'IKONIX';

const DICCIONARIO_ROLES = {
    1: 'Comercial', // Jefatura
    3: 'Técnico', // Supervisor
    4: 'Marketing',   // Coordinadora
    5: 'Compras'    // Usuario
};


const OPTIONS_UNIDAD = [
    { value: "PAIRS", label: "PAIRS" },
    { value: "SET", label: "SET" },
    { value: "SETS", label: "SETS" },
    { value: "PCS", label: "PCS" },
];

const OPTIONS_MARCA = [
    { value: "UYUSTOOLS", label: "UYUSTOOLS" },
    { value: "SATA", label: "SATA" }
];


function Herramientas() {
    const { theme } = useTheme();
    const { user } = useAuthContext();
    const isDark = theme?.name === 'dark';

    let rolPrincipal = null;
    let idRolPrincipal = null;

    if (user?.CONTEXTOS && Array.isArray(user.CONTEXTOS)) {
        const contextoMDM = user.CONTEXTOS.find(ctx => ctx.RECURSO === 'mdm.herramientas');
        if (contextoMDM && contextoMDM.ID_ROL) {
            const nombreRol = DICCIONARIO_ROLES[contextoMDM.ID_ROL];
            if (nombreRol) {
                rolPrincipal = nombreRol;
                idRolPrincipal = contextoMDM.ID_ROL;
            }
        }
    }

    const EMPRESA_HERRAMIENTAS = "IKONIX";

    const [opcionesPallets, setOpcionesPallets] = useState([]);
    const [gruposHerramientasRaw, setGruposHerramientasRaw] = useState([]);

    useEffect(() => {
        const fetchPalletsOptions = async () => {
            try {
                const response = await getGruposUnidades(EMPRESA_HERRAMIENTAS);
                if (response?.status === "Ok!" && Array.isArray(response?.data)) {
                    setOpcionesPallets(response.data.map(item => ({
                        value: item.UGP_ENTRY,
                        label: item.UGP_NAME
                    })));
                } else {
                    setOpcionesPallets([]);
                }
            } catch (error) {
                console.error(`Error fetching pallets options for ${EMPRESA_HERRAMIENTAS}:`, error);
                setOpcionesPallets([]);
            }
        };

        const fetchGruposHerramientas = async () => {
            try {
                const response = await getGruposHerramientas();
                setGruposHerramientasRaw(response);
            } catch (error) {
                console.error("Error fetching grupos herramientas:", error);
                setGruposHerramientasRaw([]);
            }
        };

        fetchPalletsOptions();
        fetchGruposHerramientas();
    }, []);
    const [isSAPModalOpen, setIsSAPModalOpen] = useState(false);
    const [groupedItemsByCompany, setGroupedItemsByCompany] = useState({});
    const [isSAPExportModalOpen, setIsSAPExportModalOpen] = useState(false);
    const [selectedApprovedItemIds, setSelectedApprovedItemIds] = useState(new Set());
    const [approvedItemsForExport, setApprovedItemsForExport] = useState([]);

    const [items, setItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvedItems, setApprovedItems] = useState([]);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const fileInputRef = useRef(null);
    const [isViewReasonModalOpen, setIsViewReasonModalOpen] = useState(false);
    const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectTargetRoles, setRejectTargetRoles] = useState(new Set());
    const [rejectObservations, setRejectObservations] = useState({});
    const [itemToReject, setItemToReject] = useState(null);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [itemsToReview, setItemsToReview] = useState([]);
    const [searchTermReview, setSearchTermReview] = useState("");
    const [selectedItemsToReviewIds, setSelectedItemsToReviewIds] = useState(new Set());

    const filteredItemsToReview = itemsToReview.filter(it =>
        (it.DIT_NUEVOIDENTIFICADOR && it.DIT_NUEVOIDENTIFICADOR.toLowerCase().includes(searchTermReview.toLowerCase())) ||
        (it.DIT_NOMBRE && it.DIT_NOMBRE.toLowerCase().includes(searchTermReview.toLowerCase())) ||
        (it.DIT_MARCA && it.DIT_MARCA.toLowerCase().includes(searchTermReview.toLowerCase())) ||
        (it.DIT_GRUPO && it.DIT_GRUPO.toLowerCase().includes(searchTermReview.toLowerCase()))
    );

    const fetchItems = useCallback(async () => {
        if (idRolPrincipal) {
            try {
                const rawData = await getItemsByRole(idRolPrincipal, "HERRAMIENTAS");
                if (rawData) {
                    let filteredData = rawData;
                    if (idRolPrincipal === 3) {
                        filteredData = rawData.filter(it =>
                            it.APROBADO_MDM ||
                            it.FASE_ACTUAL == 2 ||
                            (it.FASES && Array.isArray(it.FASES) && it.FASES.some(f => f.FASE == 2 && f.RECHAZO))
                        );
                    } else if (idRolPrincipal === 4) {
                        filteredData = rawData.filter(it =>
                            it.APROBADO_MDM ||
                            it.FASE_ACTUAL === 3 ||
                            (it.FASES && Array.isArray(it.FASES) && it.FASES.some(f => f.FASE === 3 && f.RECHAZO))
                        );
                    } else if (idRolPrincipal === 5) {
                        filteredData = rawData.filter(it =>
                            it.APROBADO_MDM ||
                            (it.FASES && Array.isArray(it.FASES) && it.FASES.some(f => f.FASE === 1 && f.RECHAZO))
                        );
                    } else if (idRolPrincipal === 1) {
                        filteredData = rawData.filter(it =>
                            it.FASE_ACTUAL === 4 && (!it.FASES || !it.FASES.some(f => f.RECHAZO))
                        );
                    }

                    const mappedItems = filteredData.map(it => {
                        const isRol3 = idRolPrincipal === 3;
                        const isRol4 = idRolPrincipal === 4;
                        const isRol5 = idRolPrincipal === 5;
                        const isRol1 = idRolPrincipal === 1;

                        let faseActual = 1;
                        if (isRol3) faseActual = 2;
                        if (isRol4) faseActual = 3;

                        const faseRechazo = (isRol3 || isRol4 || isRol5)
                            ? it.FASES?.find(f => f.FASE === faseActual && f.RECHAZO)
                            : null;

                        const f1 = it.FASES?.find(f => f.FASE === 1);
                        const f2 = it.FASES?.find(f => f.FASE === 2);
                        const f3 = it.FASES?.find(f => f.FASE === 3);

                        return {
                            id: it.ID,
                            codigoProveedor: it.CODIGO_PROVEEDOR || "",
                            partidaArancelaria: it.PARTIDA_ARANCELARIA || "",
                            nombreExt: it.NOMBRE_EXT || "",
                            descripcionExt: it.DESCRIPCION_EXT || "",
                            nombre: it.NOMBRE || "",
                            descripcion: it.DESCRIPCION || "",
                            unidad: it.UNIDAD || "",
                            unidadPaquete: it.UNIDAD_PAQUETE || "",
                            empaquesCarton: it.EMPAQUES_CARTON || "",
                            unidadesCarton: it.UNIDADES_CARTON || "",
                            largoCarton: it.LARGO_CARTON || "",
                            anchoCarton: it.ANCHO_CARTON || "",
                            altoCarton: it.ALTO_CARTON || "",
                            volumenCtn: it.VOLUMEN_CNT || "",
                            gwCtn: it.GW_CNT || "",
                            peso: it.PESO || "",
                            itemCodigoBarras: it.ITEM_CODIGO_BARRAS || "",
                            cartonCodigoBarras: it.CARTON_CODIGO_BARRAS || "",
                            paqueteCodigoBarras: it.PAQUETE_CODIGO_BARRAS || "",
                            grupo: it.GRUPO || "",
                            subgrupo: it.SUBGRUPO || "",
                            subgrupo1: it.SUBGRUPO1 || "",
                            pallets: it.PALLETS || "",
                            tipo: it.TIPO || "",
                            codigoSap: it.CODIGO_SAP || "",
                            marca: it.MARCA || "",
                            motivoRechazo: faseRechazo ? (faseRechazo.MOTIVO_RECHAZO || faseRechazo.OBSERVACIONES || "") : "",
                            fueRechazado: !!faseRechazo,
                            APROBADO_MDM: it.APROBADO_MDM,
                            comentarios: it.OBSERVACIONES || "",
                            imagenPng: null,
                            imagenWebp: null,
                            imagenUrl: it.RUTA_IMAGEN_WEBP || it.RUTA_IMAGEN_PNG || "",
                            comentariosRol5: f1?.OBSERVACIONES || "",
                            comentariosRol3: f2?.OBSERVACIONES || "",
                            comentariosRol4: f3?.OBSERVACIONES || "",
                            codigo: it.CODIGO_BARRAS || ""
                        };
                    });

                    setItems(mappedItems.filter(it => !it.APROBADO_MDM));
                    setApprovedItems(mappedItems.filter(it => it.APROBADO_MDM));

                    if (idRolPrincipal === 1) {
                        const approved = rawData.filter(it => it.APROBADO_MDM === true).map(it => ({ ...it, EMPRESA: EMPRESA_HERRAMIENTAS }));
                        setApprovedItemsForExport(approved.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
                    }
                }
            } catch (error) {
                console.error("Error al obtener items:", error);
                toast.error("Error al cargar los ítems pendientes.");
            }
        }
    }, [idRolPrincipal]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleFinalSubmit = async (currentItems) => {
        setIsSubmitting(true);
        try {
            for (const item of currentItems) {
                if (idRolPrincipal === 3) {
                    const payloadRole3 = {
                        ID: item.id,
                        LINEA_NEGOCIO: "HERRAMIENTAS",
                        GRUPO: item.grupo || "",
                        SUBGRUPO: item.subgrupo || "",
                        SUBGRUPO1: item.subgrupo1 || "",
                        PALLETS: item.pallets || "",
                        TIPO: item.tipo || "",
                        FASE: 2,
                        OBSERVACIONES: item.comentarios || "",
                        ...(item.fueRechazado && { RECHAZO: false })
                    };
                    await patchItemRole3(payloadRole3);
                } else if (idRolPrincipal === 4) {
                    if (item.imagenWebp) {
                        try {
                            await uploadItemImages("HERRAMIENTAS", item.id, item.marca, null, null, item.imagenWebp);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen WebP para el ítem ${item.id}:`, uploadError);
                            toast.error(`Error al subir imagen WebP`);
                        }
                    }
                    if (item.imagenPng) {
                        try {
                            const empresaToSend = "IKONIX"; // EMPRESA_HERRAMIENTAS
                            await uploadItemImagesSharepoint("HERRAMIENTAS", item.id, item.marca, empresaToSend, null, item.imagenPng, null);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen PNG para el ítem ${item.id}:`, uploadError);
                            toast.error(`Error al subir imagen PNG`);
                        }
                    }
                    await patchItemRole3({
                        ID: item.id,
                        FASE: 3,
                        OBSERVACIONES: item.comentarios || "",
                        LINEA_NEGOCIO: "HERRAMIENTAS",
                        ...(item.fueRechazado && { RECHAZO: false })
                    });
                } else {
                    const payload = {
                        LINEA_NEGOCIO: "HERRAMIENTAS",
                        EMPRESA: EMPRESA_HERRAMIENTAS,
                        CODIGO_PROVEEDOR: item.codigoProveedor || "",
                        PARTIDA_ARANCELARIA: item.partidaArancelaria || "",
                        NOMBRE_EXT: item.nombreExt || "",
                        DESCRIPCION_EXT: item.descripcionExt || "",
                        NOMBRE: item.nombre || "",
                        DESCRIPCION: item.descripcion || "",
                        UNIDAD: item.unidad || "",
                        UNIDAD_PAQUETE: item.unidadPaquete || "",
                        EMPAQUES_CARTON: item.empaquesCarton || "",
                        UNIDADES_CARTON: item.unidadesCarton || "",
                        LARGO_CARTON: item.largoCarton || "",
                        ANCHO_CARTON: item.anchoCarton || "",
                        ALTO_CARTON: item.altoCarton || "",
                        VOLUMEN_CNT: item.volumenCtn || "",
                        GW_CNT: item.gwCtn || "",
                        PESO: item.peso || "",
                        ITEM_CODIGO_BARRAS: item.itemCodigoBarras || "",
                        CARTON_CODIGO_BARRAS: item.cartonCodigoBarras || "",
                        PAQUETE_CODIGO_BARRAS: item.paqueteCodigoBarras || "",
                        MARCA: item.marca || "",
                        OBSERVACIONES: item.comentarios || ""
                    };

                    if (item.fueRechazado) {
                        await patchItemRole3({ ...payload, ID: item.id, RECHAZO: false, FASE: 1 });
                    } else {
                        await saveItemRole5(payload);
                    }
                }
            }
            toast.success(`Se enviaron a revisión ${currentItems.length} ítems seleccionados.`);
            setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
            setSelectedItemIds(new Set());
            setIsSAPModalOpen(false);
        } catch (error) {
            console.error("Error al enviar a revisión:", error);
            toast.error("Error al enviar los ítems a revisión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modal estado para descripcion
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [descModalTitle, setDescModalTitle] = useState("");
    const [descModalValue, setDescModalValue] = useState("");
    const [descModalField, setDescModalField] = useState("");
    const [descModalItemId, setDescModalItemId] = useState(null);

    const eliminarItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleActionRol1 = async (itemId, action, rolesRechazo = [], observaciones = {}) => {
        try {
            if (action === "reject") {
                const roleToPhase = { 5: 1, 3: 2, 4: 3 };
                for (const roleId of rolesRechazo) {
                    const phase = roleToPhase[roleId];
                    if (phase) {
                        const motivo = observaciones[roleId] || "Rechazado por Jefatura";
                        await rejectItemPhase(itemId, "HERRAMIENTAS", {
                            FASE: phase,
                            RECHAZO: true,
                            MOTIVO_RECHAZO: motivo
                        });
                    }
                }
            } else if (action === "approve") {
                const item = items.find(i => i.id === itemId);
                if (!item) return;

                await patchItemRole3({
                    ID: itemId,
                    CODIGO_BARRAS: item.codigo,
                    LINEA_NEGOCIO: "HERRAMIENTAS",
                    FASE: 2
                });
                await approveItemMDM(itemId, "HERRAMIENTAS");
                toast.success("Ítem aprobado correctamente.");
            }
            setItems(prev => prev.filter(i => i.id !== itemId));
            setCurrentItemIndex(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error al procesar acción:", error);
            toast.error("Error al procesar la acción.");
        }
    };

    const itemsFiltrados = items;

    // Funciones de restricción (usadas principalmente para importación Excel)
    const handleNumericInt = (val) => {
        if (!val) return "";
        return String(val).split('.')[0].replace(/[^0-9]/g, "");
    };

    const handleNumericDec = (val) => {
        if (!val) return "";
        let v = String(val).replace(/[^0-9.]/g, "");
        if (v.startsWith(".")) v = "0" + v;
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
        return v;
    };

    const actualizarCampoFila = (id, campo, valor) => {
        setItems(prev => prev.map(it => {
            if (it.id === id) {
                let val = valor;
                if (typeof valor === 'string' && !["descripcion", "descripcionExt"].includes(campo)) {
                    val = valor.toUpperCase();
                }

                // Aplicar restricciones estrictas para escritura
                if (["partidaArancelaria", "unidadPaquete", "empaquesCarton", "unidadesCarton", "itemCodigoBarras", "cartonCodigoBarras", "paqueteCodigoBarras", "codigoSap"].includes(campo)) {
                    if (val !== "" && !/^\d+$/.test(val)) {
                        return it; // Ignorar el tipeo inválido (ej: puntos o letras)
                    }
                } else if (["largoCarton", "anchoCarton", "altoCarton", "volumenCtn", "gwCtn", "peso"].includes(campo)) {
                    if (val !== "" && !/^\d+(\.\d*)?$/.test(val)) {
                        return it; // Ignorar si tiene letras o múltiples puntos
                    }
                }

                return { ...it, [campo]: val };
            }
            return it;
        }));
    };

    const openDescModal = (id, campo, currentVal, title) => {
        setDescModalItemId(id);
        setDescModalField(campo);
        setDescModalValue(currentVal || "");
        setDescModalTitle(title);
        setIsDescModalOpen(true);
    };

    const saveDescModal = () => {
        if (descModalItemId && descModalField) {
            actualizarCampoFila(descModalItemId, descModalField, descModalValue);
        }
        setIsDescModalOpen(false);
    };

    const handleDownloadTemplate = () => {
        const headers = [
            "Codigo Proveedor", "Partida Arancelaria", "Nombre Ext", "Descripcion Ext",
            "Nombre", "Descripcion", "Unidad", "Und x caja", "Cajas x empaque",
            "Und x empaque", "Largo de la caja", "Ancho de la caja", "Alto de la caja",
            "VOL/CTN", "GW/CTN", "Peso", "Item Codigo Barras", "Carton Codigo Barras", "Paquete codigo Barras",
            "Marca"
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "plantilla_importacion_herramientas.xlsx");
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) return;

                const newItems = data.map(row => ({
                    id: Date.now() + Math.random(),
                    codigoProveedor: String(row["Codigo Proveedor"] || "").trim().toUpperCase(),
                    partidaArancelaria: handleNumericInt(row["Partida Arancelaria"] || ""),
                    nombreExt: String(row["Nombre Ext"] || "").trim().toUpperCase(),
                    descripcionExt: String(row["Descripcion Ext"] || "").trim(),
                    nombre: String(row["Nombre"] || "").trim().toUpperCase(),
                    descripcion: String(row["Descripcion"] || "").trim(),
                    unidad: String(row["Unidad"] || "").trim().toUpperCase(),
                    unidadPaquete: handleNumericInt(row["Und x caja"] || ""),
                    empaquesCarton: handleNumericInt(row["Cajas x empaque"] || ""),
                    unidadesCarton: handleNumericInt(row["Und x empaque"] || ""),
                    largoCarton: handleNumericDec(row["Largo de la caja"] || ""),
                    anchoCarton: handleNumericDec(row["Ancho de la caja"] || ""),
                    altoCarton: handleNumericDec(row["Alto de la caja"] || ""),
                    volumenCtn: handleNumericDec(row["VOL/CTN"] || ""),
                    gwCtn: handleNumericDec(row["GW/CTN"] || ""),
                    peso: handleNumericDec(row["Peso"] || ""),
                    itemCodigoBarras: handleNumericInt(row["Item Codigo Barras"] || ""),
                    cartonCodigoBarras: handleNumericInt(row["Carton Codigo Barras"] || ""),
                    paqueteCodigoBarras: handleNumericInt(row["Paquete codigo Barras"] || ""),
                    marca: String(row["Marca"] || "").trim().toUpperCase(),
                }));

                setItems(prev => [...prev, ...newItems]);
            } catch (error) {
                console.error("Error importando Excel:", error);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsBinaryString(file);
    };

    if (!rolPrincipal) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: theme?.colors?.error || "#dc3545", fontWeight: "600", fontSize: "16px" }}>
                No tiene acceso a este recurso.
            </div>
        );
    }

    return (
        <div style={{ padding: 20, gap: 16, overflow: "auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {idRolPrincipal === 1 && (
                        <>
                            <ButtonUI
                                text="Revisar Items"
                                iconLeft="FaSearch"
                                variant="primary"
                                onClick={async () => {
                                    try {
                                        const data = await getItemsDWHByLinea("HERRAMIENTAS");
                                        setItemsToReview(data);
                                        setIsReviewModalOpen(true);
                                    } catch (error) {
                                        toast.error("Error al buscar ítems en el DWH.");
                                    }
                                }}
                            />
                            <ButtonUI
                                text="Exportar a SAP"
                                iconLeft="FaFileExport"
                                variant="outlined"
                                pcolor={theme?.colors?.info || "#17a2b8"}
                                onClick={() => setIsSAPExportModalOpen(true)}
                            />
                        </>
                    )}
                    {idRolPrincipal !== 1 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                        <div style={{ display: "flex", gap: 12 }}>
                            <ButtonUI
                                text="Agregar ítem"
                                iconLeft="FaPlus"
                                pcolor={theme?.colors?.primary}
                                onClick={() => {
                                    setItems(prev => [...prev, { id: Date.now() }]);
                                }}
                            />
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: "none" }}
                                ref={fileInputRef}
                                onChange={handleImportExcel}
                            />
                            <ButtonUI
                                text="Importar desde Excel"
                                iconLeft="FaFileExcel"
                                variant="outlined"
                                pcolor={theme?.colors?.success || "#28a745"}
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <ButtonUI
                                text="Descargar plantilla"
                                iconLeft="FaDownload"
                                variant="outlined"
                                pcolor={theme?.colors?.info || "#17a2b8"}
                                onClick={handleDownloadTemplate}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: "0 0 100%", backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TextUI size="14px" weight="600">
                        Ítems de Herramientas ({itemsFiltrados.length})
                    </TextUI>
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {(() => {
                        if (idRolPrincipal === 1) {
                            if (itemsFiltrados.length === 0) {
                                return (
                                    <div style={{ padding: "40px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                        No hay ítems pendientes de revisión
                                    </div>
                                );
                            }

                            const item = itemsFiltrados[currentItemIndex];
                            if (!item) return null;

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'auto' }}>
                                        <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{
                                                backgroundColor: isDark ? '#1f2937' : '#fff3e0',
                                                padding: '20px',
                                                borderRadius: '8px',
                                                border: `1px solid ${isDark ? '#374151' : '#fde68a'}`,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                                minHeight: '300px'
                                            }}>
                                                {item.imagenUrl && (
                                                    <img
                                                        key={`img-${item.id}`}
                                                        src={item.imagenUrl}
                                                        alt={item.descripcion}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            if (e.target.nextElementSibling) {
                                                                e.target.nextElementSibling.style.display = 'block';
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <div key={`text-${item.id}`} style={{ display: item.imagenUrl ? 'none' : 'block', textAlign: 'center' }}>
                                                    <TextUI color={theme?.colors?.textSecondary}>
                                                        {idRolPrincipal === 1 ? "Imagen no publicada" : "Sin Imagen"}
                                                    </TextUI>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ borderBottom: `1px solid ${theme?.colors?.border || '#eee'}`, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <TextUI size="20px" weight="600" style={{ wordBreak: 'break-word' }}>{item.nombre || "Nombre no disponible"}</TextUI>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                                                        {item.comentariosRol3 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#f97316' : '#2563eb'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[3]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol3}</TextUI>
                                                            </div>
                                                        )}
                                                        {item.comentariosRol4 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#94a3b8' : '#ea580c'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[4]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol4}</TextUI>
                                                            </div>
                                                        )}
                                                        {item.comentariosRol5 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#3b82f6' : '#16a34a'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[5]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol5}</TextUI>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <TextUI size="10px" weight="600" color={theme?.colors?.textSecondary} style={{ textTransform: 'uppercase', marginBottom: '2px' }}>Leyenda de Roles</TextUI>
                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#7c2d12' : '#e3f2fd', border: `1px solid ${isDark ? '#9a3412' : '#bfdbfe'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[3]}</TextUI>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#1f2937' : '#fff3e0', border: `1px solid ${isDark ? '#374151' : '#fde68a'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[4]}</TextUI>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#172554' : '#e8f5e9', border: `1px solid ${isDark ? '#1e3a8a' : '#a7f3d0'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[5]}</TextUI>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', overflow: 'auto', paddingRight: '8px' }}>
                                                {[
                                                    { key: 'codigoProveedor', label: "Codigo Proveedor", role: 5 },
                                                    { key: 'partidaArancelaria', label: "Partida Arancelaria", role: 5 },
                                                    { key: 'nombreExt', label: "Nombre Ext", role: 5 },
                                                    { key: 'descripcion', label: "Descripción", role: 5 },
                                                    { key: 'descripcionExt', label: "Descripción Ext", role: 5 },
                                                    { key: 'unidad', label: "Unidad", role: 5 },
                                                    { key: 'unidadPaquete', label: "Und x caja", role: 5 },
                                                    { key: 'empaquesCarton', label: "Cajas x empaque", role: 5 },
                                                    { key: 'unidadesCarton', label: "Und x empaque", role: 5 },
                                                    { key: 'largoCarton', label: "Largo de la caja", role: 5 },
                                                    { key: 'anchoCarton', label: "Ancho de la caja", role: 5 },
                                                    { key: 'altoCarton', label: "Alto de la caja", role: 5 },
                                                    { key: 'volumenCtn', label: "VOL/CTN", role: 5 },
                                                    { key: 'gwCtn', label: "GW/CTN", role: 5 },
                                                    { key: 'peso', label: "Peso", role: 5 },
                                                    { key: 'itemCodigoBarras', label: "Item Codigo Barras", role: 5 },
                                                    { key: 'cartonCodigoBarras', label: "Carton Codigo Barras", role: 5 },
                                                    { key: 'paqueteCodigoBarras', label: "Paquete codigo Barras", role: 5 },
                                                    { key: 'marca', label: "Marca", role: 5 },

                                                    { key: 'grupo', label: "Grupo", role: 3 },
                                                    { key: 'subgrupo', label: "Subgrupo", role: 3 },
                                                    { key: 'subgrupo1', label: "Subgrupo 1", role: 3 },
                                                    { key: 'cajas', label: "Cajas", role: 3 },
                                                    { key: 'pallets', label: "Pallets", role: 3 },
                                                    { key: 'tipo', label: "Tipo", role: 3 },
                                                ].map(({ key, label, role }) => {
                                                    const value = item[key];
                                                    let bgColor = isDark ? '#111827' : '#fafafa';
                                                    let borderColor = isDark ? '#1f2937' : '#eee';

                                                    if (role === 3) {
                                                        bgColor = isDark ? '#7c2d12' : '#e3f2fd'; // Azul claro
                                                        borderColor = isDark ? '#9a3412' : '#bfdbfe';
                                                    } else if (role === 5) {
                                                        bgColor = isDark ? '#172554' : '#e8f5e9'; // Verde claro
                                                        borderColor = isDark ? '#1e3a8a' : '#a7f3d0';
                                                    }

                                                    const isBarcode = key === 'codigo';

                                                    return (
                                                        <div key={key} style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '4px',
                                                            padding: '10px 12px',
                                                            backgroundColor: bgColor,
                                                            borderRadius: '6px',
                                                            border: `1px solid ${borderColor}`,
                                                        }}>
                                                            <TextUI size="11px" weight="600" color={theme?.colors?.textSecondary} style={{ textTransform: 'uppercase' }}>
                                                                {label}
                                                            </TextUI>
                                                            {isBarcode && idRolPrincipal !== 1 ? (
                                                                <InputUI
                                                                    value={item.codigo}
                                                                    onChange={(val) => {
                                                                        const upperVal = val.toUpperCase();
                                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, codigo: upperVal } : i));
                                                                    }}
                                                                    style={{ height: '28px', fontSize: '13px', backgroundColor: '#fff' }}
                                                                    placeholder="Digite el código"
                                                                />
                                                            ) : (
                                                                <TextUI size="13px" weight="500" style={{ wordBreak: 'break-word' }}>
                                                                    {value || "-"}
                                                                </TextUI>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: theme?.colors?.backgroundCard || '#fafafa', borderRadius: '8px', border: `1px solid ${theme?.colors?.border || '#eee'}` }}>
                                        <ButtonUI
                                            text="Rechazar"
                                            iconLeft="FaTimes"
                                            variant="outlined"
                                            pcolor={theme?.colors?.error || '#dc3545'}
                                            onClick={() => {
                                                setItemToReject(item);
                                                setIsRejectModalOpen(true);
                                            }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <ButtonUI
                                                text="Anterior ítem"
                                                iconLeft="FaChevronLeft"
                                                variant="outlined"
                                                disabled={currentItemIndex <= 0}
                                                onClick={() => setCurrentItemIndex(prev => prev - 1)}
                                            />
                                            <TextUI size="13px" weight="500" color={theme?.colors?.textSecondary}>
                                                Ítem {currentItemIndex + 1} de {itemsFiltrados.length}
                                            </TextUI>
                                            <ButtonUI
                                                text="Siguiente ítem"
                                                iconRight="FaChevronRight"
                                                variant="outlined"
                                                disabled={currentItemIndex >= itemsFiltrados.length - 1}
                                                onClick={() => setCurrentItemIndex(prev => prev + 1)}
                                            />
                                        </div>
                                        <ButtonUI
                                            text="Aceptar"
                                            iconLeft="FaCheck"
                                            pcolor={theme?.colors?.success || '#28a745'}
                                            onClick={() => handleActionRol1(item.id, "approve")}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", left: 0, zIndex: 11 }}>
                                            <CheckboxUI
                                                checked={itemsFiltrados.length > 0 && itemsFiltrados.every(i => selectedItemIds.has(i.id))}
                                                onChange={(_, checked) => {
                                                    if (checked) {
                                                        setSelectedItemIds(new Set([...selectedItemIds, ...itemsFiltrados.map(i => i.id)]));
                                                    } else {
                                                        setSelectedItemIds(prev => {
                                                            const newSet = new Set(prev);
                                                            itemsFiltrados.forEach(i => newSet.delete(i.id));
                                                            return newSet;
                                                        });
                                                    }
                                                }}
                                            />
                                        </th>
                                        {idRolPrincipal === 5 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Codigo Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Partida Arancelaria</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Ext</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripcion Ext</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripcion</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Unidad</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Und x caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cajas x empaque</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Und x empaque</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Largo de la caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Ancho de la caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Alto de la caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>VOL/CTN</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>GW/CTN</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Peso</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Item Codigo Barras</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Carton Codigo Barras</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Paquete codigo Barras</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Marca</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Acciones</th>
                                            </>
                                        )}
                                        {idRolPrincipal === 4 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen PNG</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen WEBP</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Acciones</th>
                                            </>
                                        )}
                                        {idRolPrincipal === 3 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Codigo Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Grupo</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Subgrupo</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Subgrupo 1</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Tipo</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cajas</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Pallets</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Acciones</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={25} style={{ padding: "40px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                No hay ítems para mostrar.
                                            </td>
                                        </tr>
                                    ) : (
                                        itemsFiltrados.map((item) => (
                                            <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    <CheckboxUI checked={selectedItemIds.has(item.id)} onChange={(e, checked) => {
                                                        const newSet = new Set(selectedItemIds);
                                                        if (checked) newSet.add(item.id);
                                                        else newSet.delete(item.id);
                                                        setSelectedItemIds(newSet);
                                                    }} />
                                                </td>
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.partidaArancelaria || ""} onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.nombreExt || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExt", v)} /></td>
                                                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <ButtonUI
                                                                    iconLeft="FaRegNoteSticky"
                                                                    variant="outlined"
                                                                    pcolortext={item.descripcionExt ? (theme?.colors?.success || '#28a745') : undefined}
                                                                    onClick={() => openDescModal(item.id, "descripcionExt", item.descripcionExt, "Descripción Ext")}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.nombre || ""} onChange={(v) => actualizarCampoFila(item.id, "nombre", v)} /></td>
                                                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <ButtonUI
                                                                    iconLeft="FaRegNoteSticky"
                                                                    variant="outlined"
                                                                    pcolortext={item.descripcion ? (theme?.colors?.success || '#28a745') : undefined}
                                                                    onClick={() => openDescModal(item.id, "descripcion", item.descripcion, "Descripción")}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI options={OPTIONS_UNIDAD} value={OPTIONS_UNIDAD.find(opt => opt.value === item.unidad) || null} onChange={(v) => actualizarCampoFila(item.id, "unidad", v ? v.value : "")} />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.unidadPaquete || ""} onChange={(v) => actualizarCampoFila(item.id, "unidadPaquete", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.empaquesCarton || ""} onChange={(v) => actualizarCampoFila(item.id, "empaquesCarton", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.unidadesCarton || ""} onChange={(v) => actualizarCampoFila(item.id, "unidadesCarton", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.largoCarton || ""} onChange={(v) => actualizarCampoFila(item.id, "largoCarton", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.anchoCarton || ""} onChange={(v) => actualizarCampoFila(item.id, "anchoCarton", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.altoCarton || ""} onChange={(v) => actualizarCampoFila(item.id, "altoCarton", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.volumenCtn || ""} onChange={(v) => actualizarCampoFila(item.id, "volumenCtn", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.gwCtn || ""} onChange={(v) => actualizarCampoFila(item.id, "gwCtn", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.peso || ""} onChange={(v) => actualizarCampoFila(item.id, "peso", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.itemCodigoBarras || ""} onChange={(v) => actualizarCampoFila(item.id, "itemCodigoBarras", v)} /></td>
                                                        <td style={{ padding: "10px 16px" }}><InputUI value={item.cartonCodigoBarras || ""} onChange={(v) => actualizarCampoFila(item.id, "cartonCodigoBarras", v)} /></td>
                                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                                            <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }} value={item.paqueteCodigoBarras || ""} onChange={(v) => actualizarCampoFila(item.id, "paqueteCodigoBarras", v)} />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI options={OPTIONS_MARCA} value={item.marca ? { value: item.marca, label: item.marca } : null} onChange={(v) => actualizarCampoFila(item.id, "marca", v ? v.value : "")} isCreatable={true} />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <InputUI value={item.comentarios || ""} onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)} placeholder="Comentarios..." />
                                                        </td>
                                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, textAlign: "center" }}>
                                                            {item.fueRechazado ? (
                                                                <ButtonUI
                                                                    text="Motivo de rechazo"
                                                                    variant="outlined"
                                                                    pcolor={theme?.colors?.warning || "#ffc107"}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                                    onClick={() => {
                                                                        setSelectedRejectionReason(item.motivoRechazo);
                                                                        setIsViewReasonModalOpen(true);
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 4 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "250px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.descripcion || item.nombre}>{item.descripcion || item.nombre || "N/A"}</div></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '100%',
                                                                height: '40px',
                                                                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                                border: `1px dashed ${isDark ? '#475569' : '#cbd5e1'}`,
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                overflow: 'hidden'
                                                            }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.borderColor = theme?.colors?.primary;
                                                                    e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                                                                    e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
                                                                }}
                                                                onClick={() => document.getElementById(`png-upload-${item.id}`).click()}
                                                            >
                                                                {item.imagenPng ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                        <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {item.imagenPng.name}
                                                                        </TextUI>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span style={{ color: theme?.colors?.primary, fontSize: '14px' }}>📄</span>
                                                                        <TextUI size="11px" color={theme?.colors?.textSecondary} weight="500">Subir PNG</TextUI>
                                                                    </div>
                                                                )}
                                                                <input
                                                                    id={`png-upload-${item.id}`}
                                                                    type="file"
                                                                    accept=".png"
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            if (file.type !== "image/png") {
                                                                                toast.error("Solo se permiten archivos PNG");
                                                                                return;
                                                                            }
                                                                            if (file.size > 2 * 1024 * 1024) {
                                                                                toast.error("La imagen PNG no debe superar 2MB");
                                                                                return;
                                                                            }
                                                                            actualizarCampoFila(item.id, "imagenPng", file);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '100%',
                                                                height: '40px',
                                                                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                                border: `1px dashed ${isDark ? '#475569' : '#cbd5e1'}`,
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                overflow: 'hidden'
                                                            }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.borderColor = theme?.colors?.primary;
                                                                    e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                                                                    e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
                                                                }}
                                                                onClick={() => document.getElementById(`webp-upload-${item.id}`).click()}
                                                            >
                                                                {item.imagenWebp ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                        <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {item.imagenWebp.name}
                                                                        </TextUI>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span style={{ color: theme?.colors?.primary, fontSize: '14px' }}>🖼️</span>
                                                                        <TextUI size="11px" color={theme?.colors?.textSecondary} weight="500">Subir WEBP</TextUI>
                                                                    </div>
                                                                )}
                                                                <input
                                                                    id={`webp-upload-${item.id}`}
                                                                    type="file"
                                                                    accept=".webp"
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            if (file.type !== "image/webp") {
                                                                                toast.error("Solo se permiten archivos WEBP");
                                                                                return;
                                                                            }
                                                                            if (file.size > 2 * 1024 * 1024) {
                                                                                toast.error("La imagen WEBP no debe superar 2MB");
                                                                                return;
                                                                            }
                                                                            actualizarCampoFila(item.id, "imagenWebp", file);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI style={{ height: "40px", fontSize: "12px", minHeight: "40px", textTransform: "uppercase", minWidth: "180px", width: "100%" }} value={item.comentarios || ""} onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)} placeholder="Escriba comentarios si es necesario..." />
                                                        </td>
                                                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <ButtonUI
                                                                    text="Motivo de rechazo"
                                                                    variant="outlined"
                                                                    pcolor={theme?.colors?.warning || "#ffc107"}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                                    disabled={!item.motivoRechazo}
                                                                    onClick={() => {
                                                                        setSelectedRejectionReason(item.motivoRechazo);
                                                                        setIsViewReasonModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 3 && (
                                                    <>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <TextUI size="13px">{item.codigoProveedor || "-"}</TextUI>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <TextUI size="13px">{item.nombre || "-"}</TextUI>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI
                                                                options={Array.from(new Set(gruposHerramientasRaw.map(g => g.DMH_GRUPO))).filter(Boolean).map(k => ({ value: k, label: k }))}
                                                                value={item.grupo ? { value: item.grupo, label: item.grupo } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "grupo", v?.value || "");
                                                                    actualizarCampoFila(item.id, "subgrupo", "");
                                                                    actualizarCampoFila(item.id, "subgrupo1", "");
                                                                    actualizarCampoFila(item.id, "tipo", "");
                                                                }}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI
                                                                options={Array.from(new Set(gruposHerramientasRaw.filter(g => g.DMH_GRUPO === item.grupo).map(g => g.DMH_SUBGRUPO))).filter(Boolean).map(k => ({ value: k, label: k }))}
                                                                value={item.subgrupo ? { value: item.subgrupo, label: item.subgrupo } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "subgrupo", v?.value || "");
                                                                    actualizarCampoFila(item.id, "subgrupo1", "");
                                                                    actualizarCampoFila(item.id, "tipo", "");
                                                                }}
                                                                disabled={!item.grupo}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI
                                                                options={Array.from(new Set(gruposHerramientasRaw.filter(g => g.DMH_GRUPO === item.grupo && g.DMH_SUBGRUPO === item.subgrupo).map(g => g.DMH_SUBGRUPO1))).filter(Boolean).map(k => ({ value: k, label: k }))}
                                                                value={item.subgrupo1 ? { value: item.subgrupo1, label: item.subgrupo1 } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "subgrupo1", v?.value || "");
                                                                    actualizarCampoFila(item.id, "tipo", "");
                                                                }}
                                                                disabled={!item.grupo || !item.subgrupo}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI
                                                                options={Array.from(new Set(gruposHerramientasRaw.filter(g => g.DMH_GRUPO === item.grupo && g.DMH_SUBGRUPO === item.subgrupo && g.DMH_SUBGRUPO1 === item.subgrupo1).map(g => g.DMH_TIPO))).filter(Boolean).map(k => ({ value: k, label: k }))}
                                                                value={item.tipo ? { value: item.tipo, label: item.tipo } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "tipo", v?.value || "")}
                                                                disabled={!item.grupo || !item.subgrupo || !item.subgrupo1}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <SelectUI
                                                                options={opcionesPallets}
                                                                value={item.pallets ? { value: item.pallets, label: (opcionesPallets.find(o => o.value == item.pallets)?.label) || item.pallets } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "cajas", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <InputUI value={item.comentarios || ""} onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)} placeholder="Comentarios..." />
                                                        </td>
                                                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <ButtonUI
                                                                    text="Motivo de rechazo"
                                                                    variant="outlined"
                                                                    pcolor={theme?.colors?.warning || "#ffc107"}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                                    disabled={!item.motivoRechazo}
                                                                    onClick={() => {
                                                                        setSelectedRejectionReason(item.motivoRechazo);
                                                                        setIsViewReasonModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>
                {(idRolPrincipal === 5 || idRolPrincipal === 3 || idRolPrincipal === 4) && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "flex-end" }}>
                        <ButtonUI
                            text={isSubmitting ? "Enviando..." : "Enviar a revisión"}
                            iconLeft="FaCheck"
                            disabled={isSubmitting || items.filter(i => selectedItemIds.has(i.id)).length === 0}
                            onClick={async () => {
                                const currentItems = items.filter(i => selectedItemIds.has(i.id));
                                if (currentItems.length === 0) return;

                                if (idRolPrincipal === 5) {
                                    const createdItems = currentItems.filter(i => !i.fueRechazado);
                                    if (createdItems.length > 0) {
                                        const grouped = {};
                                        createdItems.forEach(item => {
                                            const companyName = EMPRESA_HERRAMIENTAS;
                                            if (!grouped[companyName]) grouped[companyName] = [];
                                            grouped[companyName].push({
                                                CODIGO_PROVEEDOR: item.codigoProveedor,
                                                LINEA_NEGOCIO: "HERRAMIENTAS",
                                                NOMBRE_EXTRANJERO: item.nombreExt,
                                                DESCRIPCION: item.nombre,
                                                PARTIDA_ARANCELARIA: item.partidaArancelaria,
                                                CODIGO_BARRAS: item.itemCodigoBarras,
                                                CARTON_CODIGO_BARRAS: item.cartonCodigoBarras,
                                                PAQUETE_CODIGO_BARRAS: item.paqueteCodigoBarras,
                                                MARCA: item.marca
                                            });
                                        });
                                        setGroupedItemsByCompany(grouped);
                                        setIsSAPModalOpen(true);
                                    } else {
                                        await handleFinalSubmit(currentItems);
                                    }
                                } else {
                                    await handleFinalSubmit(currentItems);
                                }
                            }}
                            pcolor={theme?.colors?.primary}
                        />
                    </div>
                )}
            </div>

            {/* Sección de Aprobados */}
            {idRolPrincipal === 5 && approvedItems.length > 0 && (
                <div style={{ marginTop: "40px", backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column", flex: "0 0 100%", marginBottom: "80px" }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, backgroundColor: theme?.colors?.success + "11", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <TextUI size="14px" weight="600" color={theme?.colors?.success}>
                            Aprobados de HERRAMIENTAS ({approvedItems.length})
                        </TextUI>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Código Proveedor</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Partida Arancelaria</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "180px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Ext</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Item Código Barras</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItems.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <TextUI size="13px">{item.codigoProveedor || "-"}</TextUI>
                                        </td>
                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <TextUI size="13px">{item.partidaArancelaria || "-"}</TextUI>
                                        </td>
                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <TextUI size="13px">{item.nombreExt || "-"}</TextUI>
                                        </td>
                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <TextUI size="13px">{item.nombre || "-"}</TextUI>
                                        </td>
                                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <TextUI size="13px">{item.itemCodigoBarras || "-"}</TextUI>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ModalUI
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                title={descModalTitle}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
                    <textarea
                        value={descModalValue}
                        onChange={(e) => setDescModalValue(e.target.value)}
                        readOnly={!descModalField}
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme?.colors?.border || '#ccc'}`,
                            background: theme?.colors?.background || '#fff',
                            color: theme?.colors?.text || '#000',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <ButtonUI text={!descModalField ? "Cerrar" : "Cancelar"} variant="outlined" onClick={() => setIsDescModalOpen(false)} />
                        {descModalField && <ButtonUI text="Guardar" variant="primary" onClick={saveDescModal} />}
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isRejectModalOpen}
                onClose={() => {
                    setIsRejectModalOpen(false);
                    setRejectTargetRoles(new Set());
                    setItemToReject(null);
                }}
                title="Rechazar Ítem"
                saveText="Confirmar Rechazo"
                onSave={() => {
                    if (rejectTargetRoles.size === 0) {
                        toast.warning("Seleccione al menos un rol para rechazar");
                        return;
                    }

                    // Validar que todos los roles seleccionados tengan un motivo escrito
                    for (const roleId of rejectTargetRoles) {
                        if (!rejectObservations[roleId] || rejectObservations[roleId].trim() === "") {
                            toast.warning(`Debe ingresar un motivo de rechazo para el rol: ${DICCIONARIO_ROLES[roleId]}`);
                            return;
                        }
                    }

                    const rolesText = Array.from(rejectTargetRoles).map(r => DICCIONARIO_ROLES[r]).join(", ");
                    toast.error(`Ítem ${itemToReject?.codigo || itemToReject?.diseño} rechazado hacia: ${rolesText}.`);
                    handleActionRol1(itemToReject.id, "reject", Array.from(rejectTargetRoles), rejectObservations);
                    setIsRejectModalOpen(false);
                    setRejectTargetRoles(new Set());
                    setRejectObservations({});
                    setItemToReject(null);
                }}
            >
                <div style={{ padding: "10px 0" }}>
                    <TextUI style={{ marginBottom: "16px" }}>Seleccione a qué rol(es) desea retornar el ítem para corrección:</TextUI>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[3, 4, 5].map(roleId => (
                            <div key={roleId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <CheckboxUI
                                    label={DICCIONARIO_ROLES[roleId]}
                                    checked={rejectTargetRoles.has(roleId)}
                                    onChange={(_, checked) => {
                                        setRejectTargetRoles(prev => {
                                            const newSet = new Set(prev);
                                            if (checked) newSet.add(roleId);
                                            else {
                                                newSet.delete(roleId);
                                                setRejectObservations(obs => {
                                                    const newObs = { ...obs };
                                                    delete newObs[roleId];
                                                    return newObs;
                                                });
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                                {rejectTargetRoles.has(roleId) && (
                                    <InputUI
                                        placeholder={`Escriba el motivo de rechazo para ${DICCIONARIO_ROLES[roleId]}...`}
                                        value={rejectObservations[roleId] || ""}
                                        onChange={(v) => setRejectObservations(prev => ({ ...prev, [roleId]: v }))}
                                        style={{ marginLeft: '28px', fontSize: '12px' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isViewReasonModalOpen}
                onClose={() => {
                    setIsViewReasonModalOpen(false);
                    setSelectedRejectionReason("");
                }}
                title="Motivo de Rechazo"
                saveText="Cerrar"
                onSave={() => setIsViewReasonModalOpen(false)}
                showCancelButton={false}
            >
                <div style={{ padding: "16px", backgroundColor: isDark ? "#1e293b" : "#fff8e1", borderRadius: "8px", border: `1px solid ${isDark ? "#334155" : "#ffe082"}`, marginTop: "10px" }}>
                    <TextUI weight="600" color={theme?.colors?.warning || "#f57c00"} style={{ marginBottom: "8px", display: "block" }}>Observación del Aprobador:</TextUI>
                    <TextUI color={isDark ? "#cbd5e1" : "#5d4037"}>{selectedRejectionReason || "No se especificó un motivo detallado."}</TextUI>
                </div>
            </ModalUI>
            <ModalUI
                isOpen={isReviewModalOpen}
                onClose={() => {
                    setIsReviewModalOpen(false);
                    setSelectedItemsToReviewIds(new Set());
                }}
                title="Seleccionar ítems para revisar"
                width="800px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <InputUI
                        placeholder="Buscar por código, nombre, marca o grupo..."
                        value={searchTermReview}
                        onChange={(v) => setSearchTermReview(v)}
                        iconLeft="FaSearch"
                    />
                    <div style={{ maxHeight: "400px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}></th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: '80px' }}>Código</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Grupo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItemsToReview.map(item => (
                                    <tr
                                        key={item.DIT_NUEVOIDENTIFICADOR}
                                        style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, cursor: "pointer" }}
                                        onClick={() => {
                                            setSelectedItemsToReviewIds(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(item.DIT_NUEVOIDENTIFICADOR)) newSet.delete(item.DIT_NUEVOIDENTIFICADOR);
                                                else newSet.add(item.DIT_NUEVOIDENTIFICADOR);
                                                return newSet;
                                            });
                                        }}
                                    >
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            <CheckboxUI
                                                checked={selectedItemsToReviewIds.has(item.DIT_NUEVOIDENTIFICADOR)}
                                                onChange={() => { }} // handled by tr onClick
                                            />
                                        </td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NUEVOIDENTIFICADOR}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NOMBRE}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_MARCA}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_GRUPO}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <ButtonUI
                            text="Cancelar"
                            variant="outlined"
                            onClick={() => {
                                setIsReviewModalOpen(false);
                                setSelectedItemsToReviewIds(new Set());
                            }}
                        />
                        <ButtonUI
                            text={`Agregar (${selectedItemsToReviewIds.size})`}
                            variant="primary"
                            disabled={selectedItemsToReviewIds.size === 0}
                            onClick={async () => {
                                try {
                                    const selectedIds = Array.from(selectedItemsToReviewIds);

                                    // Crear ítems uno por uno en el backend
                                    const promises = selectedIds.map(id => createItemFromDWH("HERRAMIENTAS", id));
                                    const responses = await Promise.all(promises);

                                    let addedCount = 0;
                                    let skippedCount = 0;

                                    responses.forEach(resp => {
                                        if (resp && resp.action === "skipped") {
                                            skippedCount++;
                                        } else {
                                            addedCount++;
                                        }
                                    });

                                    if (addedCount > 0) {
                                        toast.success(`${addedCount} items creados desde DWH correctamente`);
                                    }
                                    if (skippedCount > 0) {
                                        toast.info(`${skippedCount} items ya existían y fueron omitidos`);
                                    }

                                    setIsReviewModalOpen(false);
                                    setSelectedItemsToReviewIds(new Set());
                                    setSearchTermReview("");

                                    // Recargar la lista principal para ver los nuevos ítems
                                    fetchItems();
                                } catch (error) {
                                    console.error("Error al crear ítems desde DWH:", error);
                                    toast.error("Error al procesar algunos ítems.");
                                }
                            }}
                        />
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isSAPModalOpen}
                onClose={() => setIsSAPModalOpen(false)}
                title="Descargar datos para subir a SAP"
                width="500px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <TextUI text="Se han generado los siguientes archivos por empresa. Por favor descargue cada uno para subir a SAP antes de continuar." variant="small" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                        {Object.keys(groupedItemsByCompany).map(companyName => (
                            <ButtonUI
                                key={EMPRESA_HERRAMIENTAS}
                                text={`Descargar ${EMPRESA_HERRAMIENTAS}`}
                                iconLeft="FaDownload"
                                onClick={() => {
                                    generateSAPExport(EMPRESA_HERRAMIENTAS, groupedItemsByCompany[companyName], {});
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${theme?.colors?.border || "#eee"}`, paddingTop: "16px", marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <ButtonUI
                            text="Cancelar"
                            variant="outlined"
                            onClick={() => setIsSAPModalOpen(false)}
                        />
                        <ButtonUI
                            text={isSubmitting ? "Enviando..." : "Continuar con el envío"}
                            pcolor={theme?.colors?.primary}
                            disabled={isSubmitting}
                            onClick={async () => {
                                const currentItems = items.filter(i => selectedItemIds.has(i.id));
                                handleFinalSubmit(currentItems);
                            }}
                        />
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isSAPExportModalOpen}
                onClose={() => setIsSAPExportModalOpen(false)}
                title="Exportar ítems aprobados a SAP"
                width="1000px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <TextUI size="14px" color={theme?.colors?.textSecondary}>
                        Se muestran todos los ítems aprobados ordenados por fecha de actualización.
                    </TextUI>
                    <div style={{ maxHeight: "500px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "50px" }}>
                                        <CheckboxUI
                                            checked={approvedItemsForExport.length > 0 && approvedItemsForExport.every(i => selectedApprovedItemIds.has(i.ID))}
                                            onChange={(_, checked) => {
                                                if (checked) {
                                                    setSelectedApprovedItemIds(new Set(approvedItemsForExport.map(i => i.ID)));
                                                } else {
                                                    setSelectedApprovedItemIds(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Actualizado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItemsForExport.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary }}>No hay ítems aprobados disponibles.</td></tr>
                                ) : (
                                    approvedItemsForExport.map(item => (
                                        <tr key={item.ID} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, cursor: "pointer", transition: "background 0.2s" }} onClick={() => {
                                            const newSet = new Set(selectedApprovedItemIds);
                                            if (newSet.has(item.ID)) newSet.delete(item.ID);
                                            else newSet.add(item.ID);
                                            setSelectedApprovedItemIds(newSet);
                                        }}>
                                            <td style={{ padding: "10px", textAlign: "center" }}>
                                                <CheckboxUI
                                                    checked={selectedApprovedItemIds.has(item.ID)}
                                                    onChange={() => { }}
                                                />
                                            </td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.EMPRESA}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.CODIGO_SAP || "-"}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text, fontSize: "12px" }}>{item.NOMBRE || item.DESCRIPCION}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.textSecondary, fontSize: "11px" }}>{new Date(item.updatedAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                        {Object.entries(
                            approvedItemsForExport
                                .filter(it => selectedApprovedItemIds.has(it.ID))
                                .reduce((acc, it) => {
                                    if (!acc[it.EMPRESA]) acc[it.EMPRESA] = [];
                                    acc[it.EMPRESA].push({
                                        ...it,
                                        LINEA_NEGOCIO: it.LINEA_NEGOCIO || "HERRAMIENTAS"
                                    });
                                    return acc;
                                }, {})
                        ).map(([empresa, items]) => (
                            <ButtonUI
                                key={EMPRESA_HERRAMIENTAS}
                                text={`Exportar ${EMPRESA_HERRAMIENTAS} (${items.length})`}
                                iconLeft="FaDownload"
                                onClick={() => {
                                    generateSAPExport(EMPRESA_HERRAMIENTAS, items, {});
                                    generateSAPExportSecondaryFile(EMPRESA_HERRAMIENTAS, items);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </ModalUI>
        </div>
    );
}

export default Herramientas;
