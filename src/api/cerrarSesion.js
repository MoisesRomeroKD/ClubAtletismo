import podApi from './podApi.js';

// Módulo 9.7.3: avisa al servidor que revoque el refresh token antes de borrar la sesión local.
// keepalive: la petición termina aunque la página cambie de inmediato a /login.
export const revocarSesionEnServidor = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return;
    try {
        fetch(`${podApi.defaults.baseURL}/v1/auth/logout/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Sin conexión: la sesión local se borra igual y el refresh vence solo.
    }
};
