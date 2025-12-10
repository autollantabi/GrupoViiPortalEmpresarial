import { useState, useEffect } from "react";

export const useFormSection = (initialData, validateFn, updateFn) => {
  const [data, setData] = useState(initialData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [operationState, setOperationState] = useState(0); // 0: inicial, 1: éxito, 2: error
  const [isValid, setIsValid] = useState(false);

  // Actualizar cuando cambian los datos iniciales
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Validar datos cuando cambian
  useEffect(() => {
    if (data) {
      const isDataValid = validateFn ? validateFn(data) : true;
      setIsValid(isDataValid);
    }
  }, [data, validateFn]);

  // Función para actualizar un campo
  const updateField = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para guardar los datos
  const saveData = async () => {
    try {
      const result = await updateFn(data);
      setOperationState(result ? 1 : 2);
    } catch (error) {
      console.error("Error saving data:", error);
      setOperationState(2);
    }
  };

  // Función para cerrar el diálogo
  const resetOperation = () => {
    setShowConfirmation(false);
    setOperationState(0);
  };

  return {
    data,
    updateField,
    isValid,
    showConfirmation,
    setShowConfirmation,
    operationState,
    saveData,
    resetOperation
  };
};