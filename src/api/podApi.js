import axios from 'axios';

const podApi = axios.create({
    baseURL: 'https://clubatletismo.onrender.com/api', 
    headers: {
        'Content-Type': 'application/json',
    }
});

let refreshPromise = null;

const isPublicRequest = (url = '') => url.startsWith('/v1/auth/')
    || url.startsWith('/v1/users/catalogos/discapacidades');

const expireSession = () => {
    const hasStoredSession = ['token', 'refresh_token', 'user_role']
        .some((key) => localStorage.getItem(key));

    if (hasStoredSession) {
        window.dispatchEvent(new Event('auth:session-expired'));
    }
};

const refreshAccessToken = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        return Promise.reject(new Error('No refresh token is available.'));
    }

    if (!refreshPromise) {
        refreshPromise = axios.post(
            `${podApi.defaults.baseURL}/v1/auth/token/refresh/`,
            { refresh: refreshToken }
        ).then(({ data }) => {
            if (!data?.access) {
                throw new Error('Refresh response did not contain an access token.');
            }

            localStorage.setItem('token', data.access);
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }

            return data.access;
        }).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

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

podApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const config = error.config;
        if (
            error.response?.status !== 401
            || !config
            || isPublicRequest(config.url)
        ) {
            return Promise.reject(error);
        }

        if (config._authRetry) {
            return Promise.reject(error);
        }

        const accessToken = localStorage.getItem('token');
        const authorization = config.headers?.Authorization
            || config.headers?.get?.('Authorization');
        if (accessToken && authorization && authorization !== `Bearer ${accessToken}`) {
            config._authRetry = true;
            return podApi(config).catch((retryError) => {
                expireSession();
                return Promise.reject(retryError);
            });
        }

        config._authRetry = true;

        return refreshAccessToken().then((accessToken) => {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
            return podApi(config);
        }).catch((refreshError) => {
            expireSession();
            return Promise.reject(refreshError);
        });
    }
);

export default podApi;
