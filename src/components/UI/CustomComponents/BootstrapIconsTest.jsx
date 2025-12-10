import React from "react";
import * as BiIcons from "react-icons/bi";

export const BootstrapIconsTest = () => {
  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5" }}>
      <h2>Test de Bootstrap Icons (Directo)</h2>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>Iconos directos de react-icons/bi:</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiUpload size={24} color="#007bff" />
          <span>BiUpload</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiDownload size={24} color="#28a745" />
          <span>BiDownload</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiTrash size={24} color="#dc3545" />
          <span>BiTrash</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiX size={24} color="#6c757d" />
          <span>BiX</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiFilePdf size={24} color="#dc3545" />
          <span>BiFilePdf</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiFileDoc size={24} color="#007bff" />
          <span>BiFileDoc</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <BiIcons.BiFile size={24} color="#6c757d" />
          <span>BiFile</span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Verificación de iconos disponibles:</h3>
        <p>BiUpload existe: {BiIcons.BiUpload ? "✅ Sí" : "❌ No"}</p>
        <p>BiDownload existe: {BiIcons.BiDownload ? "✅ Sí" : "❌ No"}</p>
        <p>BiTrash existe: {BiIcons.BiTrash ? "✅ Sí" : "❌ No"}</p>
        <p>BiX existe: {BiIcons.BiX ? "✅ Sí" : "❌ No"}</p>
        <p>BiFilePdf existe: {BiIcons.BiFilePdf ? "✅ Sí" : "❌ No"}</p>
        <p>BiFileDoc existe: {BiIcons.BiFileDoc ? "✅ Sí" : "❌ No"}</p>
        <p>BiFile existe: {BiIcons.BiFile ? "✅ Sí" : "❌ No"}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Lista de iconos disponibles (primeros 20):</h3>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {Object.keys(BiIcons).slice(0, 20).join(", ")}
        </div>
      </div>
    </div>
  );
};

export default BootstrapIconsTest; 