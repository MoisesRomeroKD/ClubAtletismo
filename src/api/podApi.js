import axios from 'axios';

const podApi = axios.create({
    baseURL: 'https://clubatletismo.onrender.com/api', 
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor optimizado para inyectar y blindar el token en caliente
podApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // ⚡ Fuerza la sobreescritura estricta con el token real del LocalStorage
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forzamos que toda petición termine en / para evitar el error 301/304 de Django
    if (!config.url.endsWith('/')) {
        config.url += '/';
    }
    return config;
});

export default podApi;