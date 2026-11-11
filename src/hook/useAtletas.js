import { useState } from 'react';
import podApi from '../api/podApi';

export const useAtletas = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const registrarAtleta = async (datos) => {
        setIsLoading(true);
        setError(null); 

        try {
            // ⚡ SANITIZADO: Sin cabeceras manuales. podApi intercepta de forma transparente.
            const resp = await podApi.post('/v1/users/atletas/', datos);

            console.log("Registro exitoso en el POD:", resp.data);
            return { ok: true, data: resp.data };

        } catch (err) {
            let mensajeError = "Error de conexión con el servidor POD.";

            if (err.response) {
                if (typeof err.response.data === 'object') {
                    mensajeError = Object.entries(err.response.data)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ");
                } else {
                    mensajeError = err.response.data.detail || mensajeError;
                }
            }

            console.error("Fallo en el registro de atleta:", err.response?.data);
            setError(mensajeError);
            return { ok: false, mensaje: mensajeError };

        } finally {
            setIsLoading(false);
        }
    };

    return { registrarAtleta, isLoading, error };
};