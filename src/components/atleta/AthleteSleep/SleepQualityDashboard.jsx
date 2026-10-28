import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import SleepRegistrationView from '../../trainer/sleeptracker/SleepRegistrationView';

// Registro de sueño del día, con la misma pantalla de "Registrar Sueño" del administrador y del entrenador.
// El promedio y el historial están en "Mi análisis de sueño".
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

const SleepQualityDashboard = ({ historial = [], onRegistrado }) => {
    const [resultado, setResultado] = useState(null);
    // Si ya registró el sueño de hoy, no se vuelve a mostrar el formulario: solo el aviso.
    const registroDeHoy = (Array.isArray(historial) ? historial : [])
        .find((registro) => String(registro.date || '').slice(0, 10) === hoyCaracas());
    const storedId = localStorage.getItem('user_id') || localStorage.getItem('userId');

    const guardar = async (athleteId, calidad) => {
        const response = await UserService.registerSleep(athleteId, calidad);
        if (response.status !== 'success') {
            throw new Error(response.message || 'No se pudo realizar el registro.');
        }
        setResultado(`Registraste tu sueño de hoy: ${calidad}/10.`);
        onRegistrado?.();
    };

    const textoRegistrado = resultado
        || (registroDeHoy ? `Ya registraste tu sueño de hoy: ${registroDeHoy.calidad}/10.` : '');

    if (textoRegistrado) {
        return (
            <div className="sleep-registration-view">
                <div className="sl-card sl-card--centered sl-reg-form">
                    <div className="sl-reg-alert" role="status">
                        <CheckCircle size={18} />
                        <span>{textoRegistrado}</span>
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
            modoAtleta
        />
    );
};

export default SleepQualityDashboard;
