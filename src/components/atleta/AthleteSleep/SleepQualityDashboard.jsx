import React, { useState } from 'react';
import { CheckCircle, CloudOff } from 'lucide-react';
import { registrarSueno } from '../../../api/services/suenoPendientes';
import SleepRegistrationView from '../../trainer/sleeptracker/SleepRegistrationView';

// Registro de sueño del día, con la misma pantalla de "Registrar Sueño" del administrador y del entrenador.
// El promedio y el historial están en "Historial de sueño".
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

const SleepQualityDashboard = ({ onRegistrado }) => {
    const [resultado, setResultado] = useState(null);
    const storedId = localStorage.getItem('user_id') || localStorage.getItem('userId');

    // Sin conexión, el registro queda guardado en el dispositivo y se envía al volver internet.
    const guardar = async (athleteId, calidad) => {
        const response = await registrarSueno(athleteId, calidad);
        if (response.pendiente) {
            setResultado({ pendiente: true, texto: response.message });
            return;
        }
        if (response.status !== 'success') {
            throw new Error(response.message || 'No se pudo realizar el registro.');
        }
        setResultado({ pendiente: false, texto: `Registraste tu sueño de hoy: ${calidad}/10.` });
        onRegistrado?.();
    };

    if (resultado) {
        return (
            <div className="sleep-registration-view">
                <div className="sl-card sl-card--centered sl-reg-form">
                    <div className="sl-reg-alert" role="status">
                        {resultado.pendiente ? <CloudOff size={18} /> : <CheckCircle size={18} />}
                        <span>{resultado.texto}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!storedId) {
        return <p role="alert">No se encontró la sesión del atleta. Vuelve a iniciar sesión.</p>;
    }

    return (
        <SleepRegistrationView
            athlete={{ id: storedId }}
            onSave={guardar}
            systemDate={hoyCaracas()}
            registrarRole="Atleta"
            modoAtleta
        />
    );
};

export default SleepQualityDashboard;
