// src/context/AlertasContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from "react";

const AlertasContext = createContext();

export const AlertasProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlerta = ({ usuario, tipo, severidad, mensaje }) => {
    const nuevaAlerta = {
      id: Date.now(),
      usuario,
      tipo,
      severidad,
      mensaje,
      fecha: new Date().toLocaleString(),
    };
    setAlerts((prev) => [nuevaAlerta, ...prev]);
  };

  const assignToMe = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, asignado: "Yo" } : a))
    );
  };

  const resolveAlerta = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AlertasContext.Provider
      value={{ alerts, addAlerta, assignToMe, resolveAlerta }}
    >
      {children}
    </AlertasContext.Provider>
  );
};

export const useAlertas = () => useContext(AlertasContext);
