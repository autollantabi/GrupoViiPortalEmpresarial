
export const obtenerCorreosAEnviar = (correos, empresa, marca) => {
  const marcasArray = marca.split(',').map(m => m.trim());
  return correos
    .filter((destinatario) => {
      return destinatario.empresas.some((e) => {
        const empresaMatch = e.EMPRESA === empresa;
        const marcaMatch = e.MARCAS && marcasArray.some(marca => e.MARCAS.includes(marca));
        return empresaMatch && marcaMatch;
      });
    })
    .map((destinatario) => destinatario.correo);
};
