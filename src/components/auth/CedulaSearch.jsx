import React, { useState } from "react";
import podApi from "../../api/podApi";

const CedulaSearch = ({ setStatus, setErrorMsg, setPaso, setUserCedula, setUserEmail }) => {
  const [cedulaInput, setCedulaInput] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const cedulaLimpia = cedulaInput.trim();
      const response = await podApi.get(`/v1/auth/verificar-usuario/?cedula=${cedulaLimpia}`);

      if (response.data.existe === true) {
        setUserCedula(cedulaLimpia);

        if (response.data.rol) {
          localStorage.setItem("pod_user_role", response.data.rol);
        }

        // Si el backend ya tiene el correo, lo guardamos y saltamos directo a la verificación (Paso 3)
        if (response.data.email) {
          setUserEmail(response.data.email);
          setStatus("idle");
          setPaso(3); 
        } else {
          // Si no tiene correo, mandamos al componente independiente para que lo registre (Paso 2)
          setStatus("idle");
          setPaso(2); 
        }
      } else {
        setStatus("idle");
        setPaso(4); // No existe -> Pantalla de error
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setStatus("idle");
        setPaso(4); 
      } else {
        console.error("DEBUG TÉCNICO:", error);
        setStatus("error");
        setErrorMsg("Error de comunicación con el servidor.");
      }
    }
  };

  return (
    <div className="cedula-search-form">
      <h2>Verificar Registro</h2>
      <p>Introduce tu cédula de identidad para verificar tu vinculación con el POD.</p>

      <form onSubmit={handleSearch}>
        <div className="input-group">
          <input
            type="text"
            placeholder="Ej: 26123456"
            value={cedulaInput}
            onChange={(e) => setCedulaInput(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-buscar">
          Continuar
        </button>
      </form>
    </div>
  );
};

export default CedulaSearch;