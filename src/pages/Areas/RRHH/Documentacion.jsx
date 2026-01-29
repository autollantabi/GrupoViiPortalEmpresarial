import React, { useState } from "react";
import styled from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { videos } from "./Videos/VideosRRHH";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";

const Gallery = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 30px;
  padding: 15px 18px;
  margin-top: 10px;
  overflow-y: auto;
  max-height: 81dvh;
`;
const InputBuscar = styled.input`
  padding: 4px 8px;
  border: none;
  border-bottom: solid 1px black;
  width: 350px;
  background-color: rgba(0, 0, 0, 0.05);
  outline: none;
  &:focus {
    border-bottom: solid 1px var(--secondary);
  }
`;

const ContenedorVideo = styled.div`
  width: 260px;
  min-width: 260px;
  height: 180px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: start;
  justify-content: flex-end;
  flex-direction: column;
  transition: all 0.3s ease;
  border-radius: 10px;
  & > .title {
    height: 70px;
    padding: 6px 10px;

    & > span {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2; // Limita el texto a dos líneas
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
      max-width: 250px; // Ajusta según tus necesidades
    }
  }

  & > .tbn {
    height: 110px;
    width: 100%;
    position: relative;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    
  }

  &:hover {
    transform: scale(1.06);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }

  img {
    width: 100%;
    height: auto;
  }
`;

const TypeLink = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 5px;
  padding: 4px 8px;
  border-radius: 20px;
  aspect-ratio: 1;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
`;

export const Documentacion = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();
  const dataFiltrada = () => {
    const filtered =
      searchTerm === ""
        ? videos
        : videos.filter((video) =>
            video.title.toLowerCase().includes(searchTerm.toLowerCase())
          );

    // Ordena los videos por el atributo 'id'
    const sortedVideos = filtered.sort((a, b) => a.id - b.id);
    return sortedVideos;
  };

  return (
    <ContenedorPadre direccion="c">
      <ContenedorPadre
        direccion="c"
        style={{ justifyContent: "center", padding: "20px 3%" }}
      >
        <InputBuscar
          type="text"
          placeholder="Buscar ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Gallery>
          {dataFiltrada().length > 0 ? (
            dataFiltrada().map((video) => (
              <ContenedorVideo
                key={video.id}
                onClick={() => window.open(video.videoPageUrl, "_blank")}
              >
                <div style={{background:`linear-gradient(rgba(0, 0, 0, 0.27), rgba(0, 0, 0, 0.27)), url('${video.thumbnail}')`}} className="tbn">
                  <TypeLink>
                    {video.type === "vid" ? (
                      <IconUI name="FaVideo" size={14} color={theme.colors.text} />
                    ) : (
                      <IconUI name="FaImage" size={14} color={theme.colors.text} />
                    )}
                  </TypeLink>
                </div>
                <div className="title" title={video.title}>
                  <span>{video.title}</span>
                </div>
                {/* <img src={video.thumbnail} alt="Video Thumbnail" /> */}
              </ContenedorVideo>
            ))
          ) : (
            <>No existen videos con esa cadena de búsqueda... </>
          )}
        </Gallery>
      </ContenedorPadre>
    </ContenedorPadre>
  );
};
