export const transformarDataAValueLabel = ({
  data,
  valueField,
  labelField,
}) => {
  try {
    // Verificar si data es vacío, null o undefined
    if (!data || data.length === 0) {
      return []; // Retornar un array vacío si data no tiene elementos
    } else {
      return data.map((item) => {
        if (typeof item === 'object' && item !== null) {
          // Si el item es un objeto, utiliza los campos valueField y labelField
          return {
            value: item[valueField],
            label: item[labelField],
          };
        } else {
          // Si el item es un valor simple, usa el mismo valor para value y label
          return {
            value: item,
            label: item,
          };
        }
      });
    }
  } catch (e) {
    return [];
  }
};

export const obtenerAniosDesde2020 = (anioInicio = 2020) => {
  const anioActual = new Date().getFullYear();
  const anios = [];

  for (let i = anioActual; i >= anioInicio; i--) {
    anios.push({ ANIO: i });
  }

  return anios;
};
