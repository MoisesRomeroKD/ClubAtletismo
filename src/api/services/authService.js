import podApi from '../podApi';

export const authService = {

    // ============================================================
    // LOGIN OFICIAL
    // POST /api/v1/auth/login/
    // ============================================================
    login: async (username, password) => {
        const response = await podApi.post('/v1/auth/login/', {
            username,
            password
        });

        const data = response.data;

        // ========================================================
        // GUARDAMOS LOS DATOS DEVUELTOS POR EL BACKEND
        // ========================================================
        if (data.access) {
            localStorage.setItem('token', data.access);
        }

        if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
        }

        if (data.id !== undefined && data.id !== null) {
            localStorage.setItem('user_id', String(data.id));
        }

        if (data.name) {
            localStorage.setItem('user_name', data.name);
        }

        if (data.role) {
            localStorage.setItem('user_role', data.role);
        }

        return data;
    },


    // ============================================================
    // PASO 1: Validar cédula y solicitar OTP
    // ============================================================
    requestOtp: async (cedula) => {
        const response = await podApi.post(
            '/v1/auth/atletas/registrar-credenciales/',
            {
                cedula
            }
        );

        return response.data;
    },


    // ============================================================
    // PASO 2: Verificar OTP
    // ============================================================
    verifyOtp: async (cedula, codigo) => {
        const response = await podApi.post(
            '/v1/auth/atletas/verificar-otp-registro/',
            {
                cedula,
                codigo
            }
        );

        return response.data;
    },


    // ============================================================
    // PASO 3: Completar registro
    // ============================================================
    completeRegistration: async (payload) => {
        /*
            payload:
            {
                cedula,
                codigo,
                username,
                password,
                confirm_password
            }
        */

        const response = await podApi.post(
            '/v1/auth/atletas/completar-registro/',
            payload
        );

        return response.data;
    }
};