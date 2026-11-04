import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import podApi from '../api/podApi';

const ApplicationPermissionsContext = createContext({
  permissions: [],
  hasPermission: () => false,
  isLoading: false,
});

export function ApplicationPermissionsProvider({ children, role }) {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!role || !localStorage.getItem('token')) {
      setPermissions([]);
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    setIsLoading(true);

    // inicial: la primera carga muestra "Cargando"; las siguientes se hacen sin interrumpir la pantalla
    // y, si fallan, se conservan los permisos que ya había.
    const cargar = (inicial) => podApi.get('/v1/users/permisos/mios/')
      .then(({ data }) => {
        if (!Array.isArray(data?.permissions)) {
          throw new Error('Respuesta inesperada al consultar permisos.');
        }
        if (active) {
          setPermissions((actuales) => (
            actuales.length === data.permissions.length && actuales.every((codename) => data.permissions.includes(codename))
              ? actuales
              : data.permissions
          ));
        }
      })
      .catch((error) => {
        console.error('Error al cargar permisos de usuario:', error);
        if (active && inicial) setPermissions([]);
      })
      .finally(() => {
        if (active && inicial) setIsLoading(false);
      });

    cargar(true);

    // Si a alguien le cambian los permisos con la sesión abierta, se ven sin recargar la página:
    // se vuelven a pedir al regresar a la pestaña y cada minuto.
    const alVolver = () => { if (document.visibilityState === 'visible') cargar(false); };
    const intervalo = setInterval(() => cargar(false), 60000);
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', alVolver);

    return () => {
      active = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', alVolver);
    };
  }, [role]);

  const value = useMemo(() => ({
    permissions,
    hasPermission: (codename) => permissions.includes(codename),
    isLoading,
  }), [permissions, isLoading]);

  return (
    <ApplicationPermissionsContext.Provider value={value}>
      {children}
    </ApplicationPermissionsContext.Provider>
  );
}

export function useApplicationPermissions() {
  return useContext(ApplicationPermissionsContext);
}
