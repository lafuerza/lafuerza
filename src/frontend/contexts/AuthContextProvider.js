import { createContext, useContext, useEffect, useState } from 'react';
import { getFromLocalStorage, setIntoLocalStorage } from '../utils/utils';
import { LOCAL_STORAGE_KEYS, SUPER_ADMIN } from '../constants/constants';

const AuthContext = createContext(null);

export const useAuthContext = () => useContext(AuthContext);

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(
    getFromLocalStorage(LOCAL_STORAGE_KEYS.User)
  );
  const [token, setToken] = useState(
    getFromLocalStorage(LOCAL_STORAGE_KEYS.Token)
  );
  const [isAdmin, setIsAdmin] = useState(false);

  const updateUserAuth = ({ user, token }) => {
    setUser(user);
    setToken(token);
    
    // Verificar si es super administrador
    if (user && user.email === SUPER_ADMIN.email) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, updateUserAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;