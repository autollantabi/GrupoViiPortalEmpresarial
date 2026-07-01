import * as XLSX from "xlsx";
import { getCodigoMarca, getTiposUnidades, getGruposUnidadesAlternativas } from "services/mdmService";


const PROPIEDADES = {
    "AUTOLLANTA": {
        "MAXTREK": "QryGroup1",
        "FARROAD": "QryGroup2",
        "FORTUNE LIVIANO": "QryGroup3",
        "FORTUNE PESADO": "QryGroup4",
        "MAXXIS": "QryGroup5",
        "CST": "QryGroup6",
        "ROADCRUZA": "QryGroup7",
        "APLUS": "QryGroup8",
        "HAOHUA": "QryGroup11",
        "OTRAS MARCAS": "QryGroup12",
        "MAXXIS PESADO": "QryGroup13",
        "CST PESADO": "QryGroup14",
        "APLUS PESADO": "QryGroup15",
        "CST MOTO": "QryGroup16",
        "MAXXIS MOTO": "QryGroup17",
        "ANSU": "QryGroup18",
        "ANTARES": "QryGroup19",
        "ROADWING": "QryGroup20"
    },
    "MAXXIMUNDO": {
        "SHELL": "QryGroup18",
        "PENNZOIL": "QryGroup19",
        "MAXXIS LIVIANO": "QryGroup1",
        "MAXXIS PESADO": "QryGroup2",
        "MAXXIX MOTO": "QryGroup3",
        "CST LIVIANO": "QryGroup4",
        "CST PESADO": "QryGroup5",
        "CST MOTO": "QryGroup6",
        "APLUS LIVIANO": "QryGroup7",
        "APLUS PESADO": "QryGroup8",
        "READCRUZA LIVIADNO": "QryGroup9",
        "BAYI": "QryGroup10",
        "ANSU": "QryGroup11",
        "WONDERLAND": "QryGroup12",
        "BYCROSS": "QryGroup13",
        "PETRONAS": "QryGroup14",
        "HAOHUA": "QryGroup15",
        "OTRAS MARCAS": "QryGroup16",
        "KEYSTONE": "QryGroup17"
    },
    "IKONIX": {
        "SATA": "QryGroup4",
        "UYUSTOOLS": "QryGroup1"
    },
    "STOX": {
        "CST LIVIANO": "QryGroup1",
        "CST PESADO": "QryGroup2",
        "FARROAD BRAND": "QryGroup3",
        "ANSU": "QryGroup4",
        "BAYI": "QryGroup5",
        "WONDERLAND": "QryGroup5",
        "CST MOTO": "QryGroup6",
        "ANTARES": "QryGroup7",
        "BYCROSS": "QryGroup8",
        "OTRAS MARCAS": "QryGroup9"
    }
}

/**
 * Estructura de encabezados con sus valores por defecto iniciales.
 * La clave debe de ser el nombre de la segunda fila.
*/

const DEFAULT_VALUES = {
    "ItemCode": "",
    "ItemName": "",
    "FrgnName": "",
    "SuppCatNum": "",
    "ItmsGrpCod": "",
    "CodeBars": "",
    "VATLiable": "tYES",
    "PrchseItem": "tYES",
    "SellItem": "tYES",
    "InvntItem": "tYES",
    "TreeType": "iNotATree",
    "AssetItem": "tNO",
    "ManSerNum": "tNO",
    "ManBtchNum": "tNO",
    "validFor": "tYES",
    "frozenFor": "tNO",
    "SalUnitMsr": "UNIDAD",
    "NumInSale": "1",
    "SalPackMsr": "",
    "SalPackUn": "1",
    "SVolume": "0",
    "SVolUnit": "4",
    "SWeight1": "",
    "SWght1Unit": "",
    "BuyUnitMsr": "UNIDAD",
    "NumInBuy": "1",
    "PurPackMsr": "",
    "PurPackUn": "1",
    "BVolume": "0",
    "BVolUnit": "4",
    "BWeight1": "",
    "BWght1Unit": "",
    "SalFactor1": "1",
    "SalFactor2": "1",
    "SalFactor3": "1",
    "SalFactor4": "1",
    "PurFactor1": "1",
    "PurFactor2": "1",
    "PurFactor3": "1",
    "PurFactor4": "1",
    "DfltWH": "2",
    "GLMethod": "glm_ItemClass",
    "ByWh": "tYES",
    "WTLiable": "tYES",
    "EvalSystem": "bis_MovingAverage",
    "IndirctTax": "tYES",
    "TaxCodeAR": "IVAVB15",
    "TaxCodeAP": "IVACM00",
    "IssueMthd": "im_Manual", //Cambiado de manual a backflush - Mentirota no se cambio nada
    "MngMethod": "bomm_OnEveryTransaction",
    "Phantom": "tNO",
    "InvntryUom": "UNIDAD",
    "PlaningSys": "bop_None",
    "PrcrmntMtd": "bom_Buy",
    "ItemType": "itItems",
    "ItemClass": "itcMaterial",
    "QryGroup1": "tNO",
    "QryGroup2": "tNO",
    "QryGroup3": "tNO",
    "QryGroup4": "tNO",
    "QryGroup5": "tNO",
    "QryGroup6": "tNO",
    "QryGroup7": "tNO",
    "QryGroup8": "tNO",
    "QryGroup9": "tNO",
    "QryGroup10": "tNO",
    "QryGroup11": "tNO",
    "QryGroup12": "tNO",
    "QryGroup13": "tNO",
    "QryGroup14": "tNO",
    "QryGroup15": "tNO",
    "QryGroup16": "tNO",
    "QryGroup17": "tNO",
    "QryGroup18": "tNO",
    "QryGroup19": "tNO",
    "QryGroup20": "tNO",
    "Series": "184",
    "NoDiscount": "tNO",
    "U_MA_ECOVALOR": "",
    //Para llantas
    "U_MA_DISENO": "",
    "U_MA_RIN": "",
    "U_MA_SERIE": "",
    "U_MA_ANCHO": "",
    "U_MA_NOMENCLATURA": "",
    "U_MA_CATEGORIA": "",
    "U_MA_SEGMENTO": "",
    "U_MA_APL_TER": "",
    "U_MA_EJE": "",
    "U_MA_LONAS": "",
    "U_MA_VELOCIDAD": "",
    "U_MA_ITM_EASY": "SI",
    "U_MA_PRT_ARA": "",
    "U_MA_FAMILIA": "",
    "U_MA_CUBICAJE": "",
    "FirmCode": "",
    "U_MA_CARGA": "",
    //Para lubricantes
    "U_MA_PESO": "",

    //Para Herramientas - Mentirota no existen campos para herramientas (creo) (resultado: Si existe e importan mucho muchito)

    "UoMGroupEntry": "-1",
    "InventoryUoMEntry": "",
    "DefaultSalesUoMEntry": "", //En herramientas esto siempre es 43.
    "DefaultPurchasingUoMEntry": "",
    "PricingUnit": ""


};
//Clave: Segunda fila
//Valor: Primera Fila
const MAIN_HEADERS = {
    "ItemCode": "ItemCode",
    "ItemName": "ItemName",
    "FrgnName": "ForeignName",
    "SuppCatNum": "SupplierCatalogNo",
    "ItmsGrpCod": "ItemsGroupCode",
    "CodeBars": "BarCode",
    "VATLiable": "VatLiable",
    "PrchseItem": "PurchaseItem",
    "SellItem": "SalesItem",
    "InvntItem": "InventoryItem",
    "TreeType": "TreeType",
    "AssetItem": "AssetItem",
    "ManSerNum": "ManageSerialNumbers",
    "ManBtchNum": "ManageBatchNumbers",
    "validFor": "Valid",
    "frozenFor": "Frozen",
    "SalUnitMsr": "SalesUnit",
    "NumInSale": "SalesItemsPerUnit",
    "SalPackMsr": "SalesPackagingUnit",
    "SalPackUn": "SalesQtyPerPackUnit",
    "SVolume": "SalesUnitVolume",
    "SVolUnit": "SalesVolumeUnit",
    "SWeight1": "SalesUnitWeight",
    "SWght1Unit": "SalesWeightUnit",
    "BuyUnitMsr": "PurchaseUnit",
    "NumInBuy": "PurchaseItemsPerUnit",
    "PurPackMsr": "PurchasePackagingUnit",
    "PurPackUn": "PurchaseQtyPerPackUnit",
    "BVolume": "PurchaseUnitVolume",
    "BVolUnit": "PurchaseVolumeUnit",
    "BWeight1": "PurchaseUnitWeight",
    "BWght1Unit": "PurchaseWeightUnit",
    "SalFactor1": "SalesFactor1",
    "SalFactor2": "SalesFactor2",
    "SalFactor3": "SalesFactor3",
    "SalFactor4": "SalesFactor4",
    "PurFactor1": "PurchaseFactor1",
    "PurFactor2": "PurchaseFactor2",
    "PurFactor3": "PurchaseFactor3",
    "PurFactor4": "PurchaseFactor4",
    "DfltWH": "DefaultWarehouse",
    "GLMethod": "GLMethod",
    "ByWh": "ManageStockByWarehouse",
    "WTLiable": "WTLiable",
    "EvalSystem": "CostAccountingMethod",
    "IndirctTax": "IndirectTax",
    "TaxCodeAR": "ArTaxCode",
    "TaxCodeAP": "ApTaxCode",
    "IssueMthd": "IssueMethod",
    "MngMethod": "SRIAndBatchManageMethod",
    "Phantom": "IsPhantom",
    "InvntryUom": "InventoryUOM",
    "PlaningSys": "PlanningSystem",
    "PrcrmntMtd": "ProcurementMethod",
    "ItemType": "ItemType",
    "ItemClass": "ItemClass",
    "QryGroup1": "Properties1",
    "QryGroup2": "Properties2",
    "QryGroup3": "Properties3",
    "QryGroup4": "Properties4",
    "QryGroup5": "Properties5",
    "QryGroup6": "Properties6",
    "QryGroup7": "Properties7",
    "QryGroup8": "Properties8",
    "QryGroup9": "Properties9",
    "QryGroup10": "Properties10",
    "QryGroup11": "Properties11",
    "QryGroup12": "Properties12",
    "QryGroup13": "Properties13",
    "QryGroup14": "Properties14",
    "QryGroup15": "Properties15",
    "QryGroup16": "Properties16",
    "QryGroup17": "Properties17",
    "QryGroup18": "Properties18",
    "QryGroup19": "Properties19",
    "QryGroup20": "Properties20",
    "Series": "Series",
    "NoDiscount": "NoDiscounts",
    "U_MA_ECOVALOR": "U_MA_ECOVALOR",
    //Para llantas
    "U_MA_DISENO": "U_MA_DISENO",
    "U_MA_RIN": "U_MA_RIN",
    "U_MA_SERIE": "U_MA_SERIE",
    "U_MA_ANCHO": "U_MA_ANCHO",
    "U_MA_NOMENCLATURA": "U_MA_NOMENCLATURA",
    "U_MA_CATEGORIA": "U_MA_CATEGORIA",
    "U_MA_SEGMENTO": "U_MA_SEGMENTO",
    "U_MA_APL_TER": "U_MA_APL_TER",
    "U_MA_EJE": "U_MA_EJE",
    "U_MA_LONAS": "U_MA_LONAS",
    "U_MA_VELOCIDAD": "U_MA_VELOCIDAD",
    "U_MA_ITM_EASY": "U_MA_ITM_EASY",
    "U_MA_PRT_ARA": "U_MA_PRT_ARA",
    "U_MA_FAMILIA": "U_MA_FAMILIA",
    "U_MA_CUBICAJE": "U_MA_CUBICAJE",
    "FirmCode": "Manufacturer",
    "U_MA_CARGA": "U_MA_CARGA",
    //Para lubricantes
    "U_MA_PESO": "U_MA_PESO",

    "UoMGroupEntry": "UoMGroupEntry",
    "InventoryUoMEntry": "InventoryUoMEntry",
    "DefaultSalesUoMEntry": "DefaultSalesUoMEntry",
    "DefaultPurchasingUoMEntry": "DefaultPurchasingUoMEntry",
    "PricingUnit": "PricingUnit"


};
const NOMENCLATURA_MAPPING = {
    "MILIMETRICA": "3",
    "DECIMAL": "2",
    "AMERICANA": "1"
};

/**
 * Genera y descarga la plantilla de Excel.
 * @param {string} lineaNombre - Nombre de la línea para el archivo.
 * @param {Object} userValues - Diccionario con los valores que el usuario desea asignar a los encabezados.
 */
export const generateMDMTemplate = (lineaNombre, userValues = {}) => {
    const headers = Object.keys(DEFAULT_VALUES);

    // Primera fila: Encabezados principales específicos por columna
    const mainHeaderRow = headers.map(header => MAIN_HEADERS[header] || "");

    // Tercera fila: Datos del diccionario
    const finalDataRow = headers.map(header => {
        return userValues[header] !== undefined ? userValues[header] : DEFAULT_VALUES[header];
    });

    const aoaData = [
        mainHeaderRow, // Fila 1: Encabezados descriptivos
        headers,       // Fila 2: Claves del diccionario
        finalDataRow   // Fila 3: Valores
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Ajustar el ancho de las columnas
    ws["!cols"] = headers.map(() => ({ wch: 25 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

    const fileName = `plantilla_importacion_${lineaNombre.toLowerCase().replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

/**
 * Genera y descarga un archivo Excel para SAP con múltiples ítems.
 * @param {string} companyName - Nombre de la empresa para el nombre del archivo.
 * @param {Array} items - Lista de ítems a exportar.
 * @param {Object} mappingData - Datos de mapeo dinámicos (CATEGORIAS, SEGMENTOS, APLICACIONES, EJES).
 */
export const generateSAPExport = async (companyName, items, mappingData = {}, grupEntry = {}) => {
    const headers = Object.keys(DEFAULT_VALUES);

    // Preparar funciones de mapeo dinámico
    const getCode = (listName, name) => {
        if (!mappingData[listName] || !name) return "";
        const mappingItem = mappingData[listName].find(
            (it) => String(it.name).trim().toUpperCase() === String(name).trim().toUpperCase()
        );
        return mappingItem ? mappingItem.code : "";
    };

    const codigosMarca = await getCodigoMarca(companyName);
    const codigosUnidades = await getTiposUnidades(companyName);
    const mainHeaderRow = headers.map(header => MAIN_HEADERS[header] || "");





    const lineasEmpresas = {
        "AUTLLANTAS": 103,
        "AUTLUBRICANTES": 104,
        "MAXLLANTAS": 103,
        "MAXLUBRICANTES": 104,
        "MAXHERRAMIENTAS": 168,
        "IKOHERRAMIENTAS": 103,
        "IKOLUBRICANTES": 178,
        "STOLLANTAS": 103
    }

    // Preparar las filas de datos
    const dataRows = await Promise.all(items.map(async item => {
        let ecovalor = item.LINEA_NEGOCIO === "LLANTAS" ? "1" : item.LINEA_NEGOCIO === "LLANTAS MOTO" ? "2" : "";
        let gruposUnidadesAlternativas = '';
        let unidadesDeVenta = '';
        let familia = '-1';
        const unidad = codigosUnidades.data.find(c => c.OUM_NAME.toUpperCase() === "UNIDAD")?.OUM_ENTRY;

        let marcaUpper = item.MARCA.toUpperCase() || "";


        // Propiedades por marca dinámicas basadas en la constante PROPIEDADES
        let qryProps = {
            QryGroup1: "tNO",
            QryGroup2: "tNO",
            QryGroup3: "tNO",
            QryGroup4: "tNO",
            QryGroup5: "tNO",
            QryGroup6: "tNO",
            QryGroup7: "tNO",
            QryGroup8: "tNO",
            QryGroup9: "tNO",
            QryGroup10: "tNO",
            QryGroup11: "tNO",
            QryGroup12: "tNO",
            QryGroup13: "tNO",
            QryGroup14: "tNO",
            QryGroup15: "tNO",
            QryGroup16: "tNO",
            QryGroup17: "tNO",
            QryGroup18: "tNO",
            QryGroup19: "tNO"
        };

        const propsEmpresa = PROPIEDADES[companyName];

        if (propsEmpresa) {
            const sufijos = {
                "CAMION PESADO": " PESADO",
                "CAMION LIVIANO": " LIVIANO",
                "2WHEEL & UTV": " MOTO"
            };
            const sufijo = item.CATEGORIA ? sufijos[item.CATEGORIA] : undefined;

            if (propsEmpresa[marcaUpper]) {
                qryProps[propsEmpresa[marcaUpper]] = "tYES";
            } else if (sufijo && propsEmpresa[marcaUpper + sufijo]) {
                marcaUpper += sufijo;
                qryProps[propsEmpresa[marcaUpper]] = "tYES";
            }
            if (item.CATEGORIA && item.CATEGORIA !== "" && !Object.values(qryProps).includes("tYES") && companyName !== 'IKONIX') {
                qryProps[propsEmpresa['OTRAS MARCAS']] = 'tYES';
            }
        }

        if (item.LINEA_NEGOCIO === 'LUBRICANTES') {

            if (item.CLASIFICACION === 'PREMIUM') {
                qryProps["QryGroup20"] = "tYES";
            }

            switch (item.CLASIFICACION) {
                case 'PREMIUM':
                    familia = '18';
                    break;
                case 'CONVENCIONAL':
                    familia = '20';
                    break;
                case 'REFRIGERANTE':
                    familia = '21';
                    break;
                default:
                    familia = '';
                    break;
            }

            if (item.GRADO_DE_LA_GRASA && item.GRADO_DE_LA_GRASA !== "0") {
                ecovalor = 'N';
            }

            if (item.CLASIFICACION && item.CLASIFICACION === 'REFRIGERANTE') {
                ecovalor = 'N';
            }

            if (item.CLASIFICACION !== 'REFIGERANTE' && item.GRADO_DE_LA_GRASA === "0") {
                ecovalor = "1";
            }

            if (item.PALLETS) {
                gruposUnidadesAlternativas = await getGruposUnidadesAlternativas(companyName, item.PALLETS);
                unidadesDeVenta = gruposUnidadesAlternativas.data.find(g => g.UOM_NAME.toUpperCase().includes("CAJA"))?.UOM_ENTRY || unidad;
            }
        }

        if (item.LINEA_NEGOCIO === 'HERRAMIENTAS') {
            unidadesDeVenta = unidad;
        }

        const rawOum = item.OUM || item.oum || "";
        const peso = rawOum && !isNaN(parseFloat(rawOum)) ? Math.ceil(parseFloat(rawOum)) : "";
        const grupCode = lineasEmpresas[companyName.substring(0, 3).toUpperCase() + item.LINEA_NEGOCIO.split(" ")[0].toUpperCase().trim()] || "";

        let groupEntry = "";
        switch (item.LINEA_NEGOCIO.toUpperCase()) {
            case "LLANTAS":
                groupEntry = unidad;
                break;
            case "LLANTAS MOTO":
                groupEntry = unidad;
                break;
            case "LUBRICANTES":
                groupEntry = item.PALLETS || '-1';
                break;
            case "HERRAMIENTAS":
                groupEntry = item.PALLETS || "-1";
                break;
            default:
                groupEntry = "";
                break;
        }


        let frmCode = "";

        if (codigosMarca.data.length > 0) {
            const found = codigosMarca.data.find(c =>
                String(c.DCM_MARCA).trim().toUpperCase() === String(marcaUpper).trim().toUpperCase()
            );
            if (found) {
                frmCode = found.DCM_CODIGOSAP;
            }
        }

        const userValues = {
            "ItemCode": item.CODIGO_SAP || item.codigoSap || "",
            "ItemName": item.NOMBRE || item.DESCRIPCION || "",
            "FrgnName": item.NOMBRE_EXTRANJERO || item.NOMBRE_FORANEO || item.NOMBRE_EXT || "",
            "SuppCatNum": item.CODIGO_PROVEEDOR || "",
            "ItmsGrpCod": grupCode || "",
            "CodeBars": item.LINEA_NEGOCIO === 'HERRAMIENTAS' ? '' : item.CODIGO_BARRAS || item.ITEM_CODIGO_BARRAS || "",
            "U_MA_ECOVALOR": ecovalor || "",
            "U_MA_DISENO": item.DISENIO || item.diseño || "",
            "U_MA_RIN": item.RIN || item.rin || "",
            "U_MA_SERIE": item.SERIE || item.serie || "",
            "U_MA_ANCHO": item.ANCHO || item.ancho || "",
            "U_MA_FAMILIA": familia,
            "U_MA_NOMENCLATURA": NOMENCLATURA_MAPPING[item.NOMENCLATURA || item.nomenclatura] || "",
            "U_MA_CATEGORIA": getCode("CATEGORIAS", item.CATEGORIA || item.categoria) || "",
            "U_MA_SEGMENTO": getCode("SEGMENTOS", item.SEGMENTO || item.segmento) || "",
            "U_MA_APL_TER": getCode("APLICACIONES", item.APLICACION || item.aplicacion) || "",
            "U_MA_EJE": getCode("EJES", item.EJE || item.eje) || "",
            "U_MA_LONAS": item.LONAS || item.lonas || "",
            "U_MA_VELOCIDAD": item.VELOCIDAD || item.velocidad || "",
            "U_MA_PRT_ARA": item.PARTIDA_ARANCELARIA || item.partidaArancelaria || "",
            "U_MA_CUBICAJE": item.CUBICAJE || item.cubicaje || "",
            "FirmCode": frmCode || "",
            "U_MA_CARGA": item.CARGA || item.carga || "",
            "U_MA_PESO": peso || "",
            "UoMGroupEntry": groupEntry || "",
            "InventoryUoMEntry": item.LINEA_NEGOCIO.trim().toUpperCase() === "LUBRICANTES" || "HERRAMIENTAS" ? unidad : "",
            "DefaultSalesUoMEntry": unidadesDeVenta || "",
            "DefaultPurchasingUoMEntry": unidadesDeVenta || "",
            "PricingUnit": unidad,
            ...qryProps
        };

        console.log(userValues);

        return headers.map(header => {
            return userValues[header] !== undefined ? userValues[header] : DEFAULT_VALUES[header];
        });
    }));

    const aoaData = [
        mainHeaderRow, // Fila 1: Encabezados descriptivos
        headers,       // Fila 2: Claves del diccionario
        ...dataRows    // Filas de datos
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Generar contenido separado por tabulaciones (TSV)
    const content = XLSX.utils.sheet_to_csv(ws, { FS: "\t" });

    // Crear y descargar el archivo .txt
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const fechaActual = `${dd}-${mm}-${yyyy}`;

    link.setAttribute("download", `${companyName}_${fechaActual}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Genera y descarga el archivo para guardar los codigos de barras en SAP. (Unicamente se utiliza con herramientas)
 * @param {string} companyName - Nombre de la empresa para el nombre del archivo.
 * @param {Array} items - Lista de ítems a exportar.
 */
export const generateSAPExportSecondaryFile = async (companyName, items) => {
    const header1 = ["ItemNo", "BarCode", "UoMEntry"];
    const header2 = ["ItemNo", "CodeBars", "UoMEntry"];

    const dataRows = [];

    for (const item of items) {
        let caja = '';
        if (item.PALLETS) {
            try {
                const gruposUnidadesAlternativas = await getGruposUnidadesAlternativas(companyName, item.PALLETS);
                if (gruposUnidadesAlternativas && gruposUnidadesAlternativas.data) {
                    caja = gruposUnidadesAlternativas.data.find(g => g.UOM_NAME.toUpperCase().includes("CAJA"))?.UOM_ENTRY || '';
                }
            } catch (error) {
                console.error("Error obteniendo grupos de unidades alternativas:", error);
            }
        } else {
            try {
                const gruposUnidadesAlternativas = await getGruposUnidadesAlternativas(companyName, "");
                if (gruposUnidadesAlternativas && gruposUnidadesAlternativas.data) {
                    caja = gruposUnidadesAlternativas.data.find(g => g.UOM_NAME.toUpperCase().includes("CAJA"))?.UOM_ENTRY || '';
                }
            } catch (error) {
                console.error("Error obteniendo grupos de unidades alternativas (sin pallets):", error);
            }
        }

        const codigoSap = item.CODIGO_SAP || item.codigoSap || "";
        const cartonCodigoBarras = item.CARTON_CODIGO_BARRAS || item.cartonCodigoBarras || "";
        const itemCodigoBarras = item.ITEM_CODIGO_BARRAS || item.itemCodigoBarras || item.CODIGO_BARRAS || item.codigo || "";

        // Primer valor
        dataRows.push([
            codigoSap,
            cartonCodigoBarras,
            caja
        ]);

        // Segundo valor
        dataRows.push([
            codigoSap,
            itemCodigoBarras,
            "43"
        ]);

    }

    const aoaData = [
        header1,
        header2,
        ...dataRows
    ];


    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const content = XLSX.utils.sheet_to_csv(ws, { FS: "\t" });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const fechaActual = `${dd}-${mm}-${yyyy}`;

    link.setAttribute("download", `${companyName}_CodigoBarras_${fechaActual}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
