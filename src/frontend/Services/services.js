import axios from 'axios';

// Optimización: Configurar interceptores de axios
axios.defaults.timeout = 10000; // 10 segundos timeout

// Interceptor para requests
axios.interceptors.request.use(
  (config) => {
    // Agregar timestamp para evitar cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo mejorado de errores
    if (error.code === 'ECONNABORTED') {
      error.message = 'La solicitud tardó demasiado tiempo. Intenta nuevamente.';
    } else if (!error.response) {
      error.message = 'Error de conexión. Verifica tu internet.';
    }
    return Promise.reject(error);
  }
);

export const loginUserService = async (userData) => {
  try {
    const response = await axios.post('/api/auth/login', {
      // email, password
      ...userData,
    });

    const { encodedToken, foundUser } = response.data;

    return {
      user: foundUser,
      token: encodedToken,
    };
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el componente
    throw error;
  }
};

export const signupService = async (userData) => {
  try {
    const response = await axios.post('/api/auth/signup', {
      // email, password, firstName, lastName
      ...userData,
    });

    if (response.status === 200 || response.status === 201) {
      const { encodedToken, createdUser } = response.data;

      return {
        user: createdUser,
        token: encodedToken,
      };
    }
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el componente
    throw error;
  }
};

// Cache para productos y categorías
let productsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getAllProductsCategoriesService = async () => {
  try {
    // Verificar cache
    if (productsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return productsCache;
    }

    const productsPromise = axios.get('/api/products');
    const categoriesPromise = axios.get('/api/categories');

    const [productsResponse, categoriesResponse] = await Promise.all([
      productsPromise,
      categoriesPromise,
    ]);
    
    const { products } = productsResponse.data;
    const { categories } = categoriesResponse.data;

    const result = { products, categories };
    
    // Guardar en cache
    productsCache = result;
    cacheTimestamp = Date.now();
    
    return result;
  } catch (error) {
    console.error('Error obteniendo productos y categorías:', error);
    throw error;
  }
};

// Cache para búsquedas
const searchCache = new Map();

export const getProductsOnSearch = async ({ query }) => {
  try {
    // Verificar cache de búsqueda
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // Cache por 30 segundos
        return cached.data;
      }
    }

    const res = await axios.get(`/api/products/search?query=${encodeURIComponent(query)}`);
    const data = res.data.products.models;
    
    // Guardar en cache
    searchCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Limpiar cache si crece mucho
    if (searchCache.size > 50) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    return data;
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    throw error;
  }
};

export const getSingleProductService = async (productID) => {
  try {
    const {
      status,
      data: { product },
    } = await axios.get(`/api/products/${productID}`);

    if (!product) {
      throw new Error('Error: Product not found!');
    }

    if (status === 200 || status === 201) {
      return product;
    }
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw error;
  }
};

// Funciones optimizadas para el carrito
export const postAddToCartService = async (productToAdd, token) => {
  try {
    const response = await axios.post(
      '/api/user/cart',
      { product: productToAdd },
      { headers: { authorization: token } }
    );

    const { cart } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return cart;
    }
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    throw error;
  }
};

export const deleteFromCartService = async (productId, token) => {
  try {
    const response = await axios.delete(`/api/user/cart/${encodeURIComponent(productId)}`, {
      headers: { authorization: token },
    });

    const { cart } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return cart;
    }
  } catch (error) {
    console.error('Error removiendo del carrito:', error);
    throw error;
  }
};

export const incDecItemInCartService = async ({
  productId,
  token,
  type,
  colorBody,
}) => {
  try {
    const response = await axios.post(
      `/api/user/cart/${encodeURIComponent(productId)}`,
      {
        action: { type, colorBody },
      },
      { headers: { authorization: token } }
    );

    const { cart } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return cart;
    }
  } catch (error) {
    console.error('Error actualizando cantidad en carrito:', error);
    throw error;
  }
};

// Funciones optimizadas para wishlist
export const postAddToWishlistService = async (productToAdd, token) => {
  try {
    const response = await axios.post(
      '/api/user/wishlist',
      { product: productToAdd },
      { headers: { authorization: token } }
    );
    const { wishlist } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return wishlist;
    }
  } catch (error) {
    console.error('Error agregando a wishlist:', error);
    throw error;
  }
};

export const deleteFromWishlistService = async (productId, token) => {
  try {
    const response = await axios.delete(`/api/user/wishlist/${encodeURIComponent(productId)}`, {
      headers: { authorization: token },
    });

    const { wishlist } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return wishlist;
    }
  } catch (error) {
    console.error('Error removiendo de wishlist:', error);
    throw error;
  }
};

export const deleteCartDataService = async (token) => {
  try {
    const response = await axios.delete('/api/user/cart', {
      headers: { authorization: token },
    });

    const { cart } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return cart;
    }
  } catch (error) {
    console.error('Error limpiando carrito:', error);
    throw error;
  }
};

export const deleteWishlistDataService = async (token) => {
  try {
    const response = await axios.delete('/api/user/wishlist', {
      headers: { authorization: token },
    });

    const { wishlist } = response.data;
    const { status } = response;
    if (status === 200 || status === 201) {
      return wishlist;
    }
  } catch (error) {
    console.error('Error limpiando wishlist:', error);
    throw error;
  }
};

// Limpiar caches periódicamente
setInterval(() => {
  // Limpiar cache de productos si es muy viejo
  if (cacheTimestamp && (Date.now() - cacheTimestamp > CACHE_DURATION)) {
    productsCache = null;
    cacheTimestamp = null;
  }
  
  // Limpiar cache de búsquedas
  searchCache.clear();
}, 300000); // Cada 5 minutos
