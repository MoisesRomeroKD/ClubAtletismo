import React, { useState } from "react";
import podApi from "../../api/podApi";

const EmailForm = ({ cedula, setStatus, setErrorMsg, setPaso, setUserEmail }) => {
  const [emailInput, setEmailInput] = useState("");

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const emailLimpio = emailInput.trim().toLowerCase();

      // Enviamos el correo al backend vinculándolo a la cédula previamente validada
      const response = await podApi.post("/asociar-correo/", {
        cedula: cedula,
        email: emailLimpio
      });

      // Si el backend responde con éxito (el correo se guardó y se disparó el OTP)
      if (response.status === 200 || response.status === 201) {
        setUserEmail(emailLimpio); // Guardamos el correo en el estado global de Registro.jsx
        setStatus("idle");
        setPaso(3); // Avanzamos al Paso 3: CodeVerify
      }
    } catch (error) {
      console.error("DEBUG TÉCNICO EN EMAILFORM:", error);
      setStatus("error");
      
      // Capturamos el mensaje de error del backend si existe (ej: "Este correo ya está en uso")
      const mensajeServidor = error.response?.data?.mensaje || "Error al asociar el correo electrónico.";
      setErrorMsg(mensajeServidor);
    }
  };

  return (
    <div className="email-setup-form">
      <h2>Completar Perfil</h2>
      <p style={{ marginBottom: "20px", color: "#555" }}>
        Tu cédula está registrada, pero aún no tienes un correo electrónico asociado. 
        Ingresa el correo donde deseas recibir tu código de seguridad.
      </p>

      <form onSubmit={handleSaveEmail}>
        <div className="input-group">
          <label htmlFor="user-email" style={{ display: "none" }}>Correo Electrónico</label>
          <input
            id="user-email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            required
            style={{ textTransform: 'lowercase' }}
          />
        </div>

        <button type="submit" className="btn-buscar" style={{ marginTop: "15px" }}>
          Enviar Código de Verificación
        </button>
      </form>
    </div>
  );
};

export default EmailForm;