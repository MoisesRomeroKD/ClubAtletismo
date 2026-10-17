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

    podApi.get('/v1/users/permisos/mios/')
      .then(({ data }) => {
        if (!Array.isArray(data?.permissions)) {
          throw new Error('Respuesta inesperada al consultar permisos.');
        }
        if (active) setPermissions(data.permissions);
      })
      .catch((error) => {
        console.error('Error al cargar permisos de usuario:', error);
        if (active) setPermissions([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
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
