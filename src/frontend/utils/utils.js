import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import {
  ALL_STATES,
  ToastType,
  CUSTOM_TOASTID,
  ITEMS_PER_PAGE,
} from '../constants/constants';
import confetti from 'canvas-confetti';
import { faker } from '@faker-js/faker';

// Optimización: Memoización para cálculos frecuentes
const memoCache = new Map();

const memoize = (fn, keyGenerator) => {
  return (...args) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const result = fn(...args);
    memoCache.set(key, result);
    
    // Limpiar cache si crece mucho
    if (memoCache.size > 100) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    return result;
  };
};

export const calculateDiscountPercent = (discountPrice, originalPrice) => {
  if (!discountPrice || !originalPrice || originalPrice <= 0) return 0;
  const percent = Math.floor(
    ((originalPrice - discountPrice) * 100) / originalPrice
  );
  return Math.max(0, percent);
};

// Optimización: Memoizar cálculo de descuento
export const calculateDiscountPercentMemo = memoize(
  calculateDiscountPercent,
  (discountPrice, originalPrice) => `${discountPrice}-${originalPrice}`
);

export const giveUniqueLabelFOR = (type, i) => `${type}-${i}`;

// Optimización: Debounce para toasts
let toastTimeouts = new Map();

export const toastHandler = (type, message, toastId = uuid()) => {
  // Evitar toasts duplicados
  const messageKey = `${type}-${message}`;
  if (toastTimeouts.has(messageKey)) {
    clearTimeout(toastTimeouts.get(messageKey));
  }
  
  const toastStyle = {
    position: 'top-left',
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    toastId,
  };

  const toastFunc = toast[type];
  toastFunc(message, toastStyle);
  
  // Limpiar timeout después de mostrar
  const timeoutId = setTimeout(() => {
    toastTimeouts.delete(messageKey);
  }, 1500);
  
  toastTimeouts.set(messageKey, timeoutId);
};

export const LOGIN_TOAST = () => {
  toastHandler(ToastType.Warn, 'Por favor inicia sesión para continuar', CUSTOM_TOASTID);
};

export const setIntoLocalStorage = (name, dataObj) => {
  try {
    localStorage.setItem(name, JSON.stringify(dataObj));
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
  }
};

export const getFromLocalStorage = (name) => {
  try {
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error leyendo de localStorage:', error);
    return null;
  }
};

export const removeLocalStorage = (name) => {
  try {
    localStorage.removeItem(name);
  } catch (error) {
    console.error('Error removiendo de localStorage:', error);
  }
};

export const wait = (delay) => new Promise((res) => setTimeout(res, delay));

export const lowerizeAndCheckIncludes = (text, userText) => {
  return text.toLowerCase().includes(userText.toLowerCase());
};

// Optimización: Memoizar conversión de array a objeto
export const convertArrayToObjectWithPropertyFALSEMemo = memoize(
  convertArrayToObjectWithPropertyFALSE,
  (listOfStrings) => listOfStrings.join(',')
);

export const convertArrayToObjectWithPropertyFALSE = (listOfStrings = []) => {
  return listOfStrings.reduce((acc, curr) => {
    acc[curr] = false;
    return acc;
  }, {});
};

// Optimización: Usar Map para búsquedas más rápidas
export const isPresent = (itemId, list) => {
  if (!Array.isArray(list) || !itemId) return false;
  return list.some(item => item._id === itemId);
};

// Optimización: Memoizar paginación
export const givePaginatedListMemo = memoize(
  givePaginatedList,
  (list) => `${list.length}-${ITEMS_PER_PAGE}`
);

export const givePaginatedList = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [[]];
  return Array.from(
    { length: Math.ceil(list.length / ITEMS_PER_PAGE) },
    (_, i) => list.slice(ITEMS_PER_PAGE * i, ITEMS_PER_PAGE * (i + 1))
  );
};

// Optimización: Confetti con mejor rendimiento
let confettiAnimationId = null;

export const Popper = () => {
  // Cancelar animación anterior si existe
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }
  
  const end = Date.now() + 1 * 1000;
  const colors = ['#392f5a', '#9583cf'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 40,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 140,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      confettiAnimationId = null;
    }
  })();
};

// Optimización: Datos aleatorios con cache
const randomDataCache = new Map();

export const giveRandomData = () => {
  const cacheKey = 'randomData';
  
  if (randomDataCache.has(cacheKey)) {
    const cached = randomDataCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 60000) { // Cache por 1 minuto
      return cached.data;
    }
  }
  
  const data = {
    username: faker.person.fullName(),
    pincode: faker.location.zipCode('######'),
    mobile: faker.phone.number('##########'),
    alternate: faker.phone.number('##########'),
    addressInfo: faker.location.streetAddress(true),
    city: faker.location.city(),
    state: ALL_STATES[Math.floor(Math.random() * ALL_STATES.length)],
  };
  
  randomDataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return {
    username: faker.person.fullName(),
    pincode: faker.location.zipCode('######'),
    mobile: faker.phone.number('##########'),
    alternate: faker.phone.number('##########'),
    addressInfo: faker.location.streetAddress(true),
    city: faker.location.city(),
    state: ALL_STATES[Math.floor(Math.random() * ALL_STATES.length)],
  };
};

export const midValue = (value1, value2) => {
  if (typeof value1 !== 'number' || typeof value2 !== 'number') {
    return 0;
  }
  return Math.floor((value1 + value2) / 2);
};

export const validateEmptyTextInput = ({ inputsObj, optionalInput }) => {
  for (const property in inputsObj) {
    if (typeof inputsObj[property] !== 'string' || property === optionalInput) {
      continue;
    }

    if (!inputsObj[property].trim()) {
      return true;
    }
  }

  return false;
};

// Generar número de orden aleatorio
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
};

// Limpiar cache periódicamente
setInterval(() => {
  if (memoCache.size > 50) {
    memoCache.clear();
  }
}, 300000); // Cada 5 minutos