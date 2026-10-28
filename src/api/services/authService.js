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
                password,
                confirm_password
            }
            El backend devuelve también la sesión abierta (igual que el login): se guarda igual.
        */

        const response = await podApi.post(
            '/v1/auth/atletas/completar-registro/',
            payload
        );

        const data = response.data;
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
    // OLVIDÉ MI CONTRASEÑA (desde el login): correo o cédula → código → contraseña nueva.
    // Al cambiarla también se desbloquea la cuenta.
    // ============================================================
    solicitarRecuperacion: async (identificador) => {
        const response = await podApi.post('/v1/auth/olvido-password/solicitar/', { identificador });
        return response.data;
    },

    verificarRecuperacion: async (identificador, codigo) => {
        const response = await podApi.post('/v1/auth/olvido-password/verificar/', { identificador, codigo });
        return response.data;
    },

    confirmarRecuperacion: async ({ identificador, codigo, password, confirmPassword }) => {
        const response = await podApi.post('/v1/auth/olvido-password/confirmar/', {
            identificador,
            codigo,
            password,
            confirm_password: confirmPassword,
        });
        return response.data;
    }
};