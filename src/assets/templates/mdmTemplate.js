import * as XLSX from "xlsx";
import { getCodigoMarca, getTiposUnidades } from "services/mdmService";

/**
 * Estructura de encabezados con sus valores por defecto iniciales.
 * La clave debe de ser el nombre de la segunda fila.
*/

const DEFAULT_VALUES = {
    "ItemCode": "",
    "ItemName": "",
    "FrgnName": "",
    "SuppCatNum": "",
    "ItmsGrpCod": "", //104 lubricantes - 103 LLANTAS - 
    "CodeBars": "",
    "VATLiable": "tYES",
    "PrchseItem": "tYES",
    "SellItem": "tYES",
    "InvntItem": "tYES",
    "TreeType": "iNotATree",
    "AssetItem": "tNO",
    "ManSerNum": "tNO",
    "ManBtchNum": "tYES", //Cambiado de tYes a tNo
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
    "QryGroup1": "tNO", //Cambiado de tNO a tYES - Mentirota no se cambio nada
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
    "QryGroup20": "tYES",
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
    "U_MA_FAMILIA": "-1",
    "U_MA_CUBICAJE": "",
    "FirmCode": "",
    "U_MA_CARGA": "",
    //Para lubricantes
    "U_MA_PESO": "",

    //Para Herramientas - Mentirota no existen campos para herramientas (creo) (resultado: Si existe e importan mucho muchito)

    "UoMGroupEntry": "",
    "InventoryUoMEntry": "",
    "DefaultSalesUoMEntry": "", //Cambiado de nada a 1
    "DefaultPurchasingUoMEntry": "",


    //Campos extra
    "PUoMEntry": "1",
    "SUoMEntry": "1",
    "IUoMEntry": "1",
    "CntUnitMsr": "UNIDAD",
    "INUoMEntry": "1",
    "PriceUnit": "1",
    "UgpEntry": "1"

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


    //Campos extra
    "PUoMEntry": "PUoMEntry",
    "SUoMEntry": "SUoMEntry",
    "IUoMEntry": "IUoMEntry",
    "CntUnitMsr": "CntUnitMsr",
    "INUoMEntry": "INUoMEntry",
    "PriceUnit": "PriceUnit",
    "UgpEntry": "UgpEntry",


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
export const generateSAPExport = async (companyName, items, mappingData = {}) => {
    const headers = Object.keys(DEFAULT_VALUES);

    // Preparar funciones de mapeo dinámico
    const getCode = (listName, name) => {
        if (!mappingData[listName] || !name) return "";
        const mappingItem = mappingData[listName].find(
            (it) => String(it.name).trim().toUpperCase() === String(name).trim().toUpperCase()
        );
        return mappingItem ? mappingItem.code : "";
    };

    const codigosMarca = await getCodigoMarca();

    const codigosUnidades = await getTiposUnidades(companyName);


    console.log(codigosMarca);
    console.log(codigosUnidades);
    // Primera fila: Encabezados descriptivos (de SAP)
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
    const dataRows = items.map(item => {
        // Mapeo específico solicitado por el usuario
        const ecovalor = item.LINEA_NEGOCIO === "LLANTAS" ? "1" : item.LINEA_NEGOCIO === "LLANTAS MOTO" ? "2" : "";
        const rawOum = item.OUM || item.oum || "";
        const peso = rawOum && !isNaN(parseFloat(rawOum)) ? Math.ceil(parseFloat(rawOum)) : "";
        const grupCode = lineasEmpresas[companyName.substring(0, 3).toUpperCase() + item.LINEA_NEGOCIO.split(" ")[0].toUpperCase().trim()] || "";
        const groupEntry = item.LINEA_NEGOCIO === "LLANTAS" || item.LINEA_NEGOCIO === "LLANTAS MOTO" ? codigosUnidades.data.find(c => c.OUM_NAME.toUpperCase() === "UNIDAD")?.OUM_ENTRY : "";
        const marcaName = item.MARCA || item.marca || "";

        let frmCode = "";
        if (codigosMarca.data.length > 0) {
            const found = codigosMarca.data.find(c =>
                String(c.DCM_EMPRESA).trim().toUpperCase() === String(companyName).trim().toUpperCase() &&
                String(c.DCM_MARCA).trim().toUpperCase() === String(marcaName).trim().toUpperCase()
            );
            if (found) {
                frmCode = found.DCM_CODIGOSAP;
            }
        }

        const userValues = {
            "ItemCode": item.CODIGO_SAP || item.codigoSap || "",
            "ItemName": item.DESCRIPCION || item.NOMBRE || "",
            "FrgnName": item.NOMBRE_EXTRANJERO || item.NOMBRE_FORANEO || item.NOMBRE_EXT || "",
            "SuppCatNum": item.CODIGO_PROVEEDOR || "",
            "ItmsGrpCod": grupCode,
            "CodeBars": item.CODIGO_BARRAS || item.ITEM_CODIGO_BARRAS || "",
            "U_MA_ECOVALOR": ecovalor,
            "U_MA_DISENO": item.DISENIO || item.diseño || "",
            "U_MA_RIN": item.RIN || item.rin || "",
            "U_MA_SERIE": item.SERIE || item.serie || "",
            "U_MA_ANCHO": item.ANCHO || item.ancho || "",
            "U_MA_NOMENCLATURA": NOMENCLATURA_MAPPING[item.NOMENCLATURA || item.nomenclatura] || "",
            "U_MA_CATEGORIA": getCode("CATEGORIAS", item.CATEGORIA || item.categoria),
            "U_MA_SEGMENTO": getCode("SEGMENTOS", item.SEGMENTO || item.segmento),
            "U_MA_APL_TER": getCode("APLICACIONES", item.APLICACION || item.aplicacion),
            "U_MA_EJE": getCode("EJES", item.EJE || item.eje),
            "U_MA_LONAS": item.LONAS || item.lonas || "",
            "U_MA_VELOCIDAD": item.VELOCIDAD || item.velocidad || "",
            "U_MA_PRT_ARA": item.PARTIDA_ARANCELARIA || item.partidaArancelaria || "",
            "U_MA_CUBICAJE": item.CUBICAJE || item.cubicaje || "",
            "FirmCode": frmCode || "",
            "U_MA_CARGA": item.CARGA || item.carga || "",
            "U_MA_PESO": peso || "",
            "UoMGroupEntry": groupEntry || "",
        };

        console.log(userValues);

        return headers.map(header => {
            return userValues[header] !== undefined ? userValues[header] : DEFAULT_VALUES[header];
        });
    });

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
