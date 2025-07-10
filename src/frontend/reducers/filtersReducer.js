import { SORT_TYPE } from '../constants/constants';
import { FILTERS_ACTION } from '../utils/actions';
import {
  convertArrayToObjectWithPropertyFALSE,
  givePaginatedList,
  lowerizeAndCheckIncludes,
} from '../utils/utils';

export const initialFiltersState = {
  allProducts: [],
  filteredProducts: [],
  minPrice: 0,
  maxPrice: Infinity,
  filters: {
    search: '',
    category: null,
    company: 'all',
    price: [0, 0],
    rating: -1,
    sortByOption: '',
  },
  paginateIndex: 0,
  displayableProductsLength: 0,
};

// FUNCIÓN MEJORADA PARA CALCULAR RANGOS DE PRECIO DINÁMICOS Y AMIGABLES
const calculatePriceRange = (products) => {
  if (!products || products.length === 0) {
    return { minPrice: 0, maxPrice: 100000 };
  }

  const prices = products.map(({ price }) => price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  console.log(`📊 Precios originales: ${minPrice} - ${maxPrice} CUP`);
  
  // Función para redondear hacia abajo a números "amigables"
  const roundDownToFriendly = (value) => {
    if (value <= 100) return Math.floor(value / 10) * 10; // Redondear a decenas
    if (value <= 1000) return Math.floor(value / 100) * 100; // Redondear a centenas
    if (value <= 10000) return Math.floor(value / 1000) * 1000; // Redondear a miles
    if (value <= 100000) return Math.floor(value / 5000) * 5000; // Redondear a 5 miles
    return Math.floor(value / 10000) * 10000; // Redondear a 10 miles
  };

  // Función para redondear hacia arriba a números "amigables"
  const roundUpToFriendly = (value) => {
    if (value <= 100) return Math.ceil(value / 10) * 10; // Redondear a decenas
    if (value <= 1000) return Math.ceil(value / 100) * 100; // Redondear a centenas
    if (value <= 10000) return Math.ceil(value / 1000) * 1000; // Redondear a miles
    if (value <= 100000) return Math.ceil(value / 5000) * 5000; // Redondear a 5 miles
    return Math.ceil(value / 10000) * 10000; // Redondear a 10 miles
  };

  // Aplicar redondeo amigable
  const adjustedMin = Math.max(0, roundDownToFriendly(minPrice));
  const adjustedMax = roundUpToFriendly(maxPrice);
  
  console.log(`📊 Rango de precios ajustado: ${adjustedMin} - ${adjustedMax} CUP`);
  
  return {
    minPrice: adjustedMin,
    maxPrice: adjustedMax
  };
};

// FUNCIÓN PARA OBTENER CATEGORÍAS HABILITADAS DINÁMICAMENTE
const getEnabledCategories = (products, categories = []) => {
  // Obtener categorías desde productos (siempre actualizado)
  const categoriesFromProducts = [...new Set(
    products
      .map(product => product.category)
      .filter(Boolean)
  )];

  // Si tenemos información de categorías con estado disabled, filtrar
  if (categories && categories.length > 0) {
    const enabledCategoryNames = categories
      .filter(category => !category.disabled)
      .map(category => category.categoryName);
    
    // Retornar solo las categorías que están habilitadas Y tienen productos
    return categoriesFromProducts.filter(categoryName => 
      enabledCategoryNames.includes(categoryName)
    );
  }

  // Si no hay información de categorías, retornar todas las que tienen productos
  return categoriesFromProducts;
};

// FUNCIÓN PARA OBTENER MARCAS DISPONIBLES DINÁMICAMENTE
const getAvailableCompanies = (products) => {
  return [...new Set(
    products
      .map(product => product.company)
      .filter(Boolean)
  )];
};

export const filtersReducer = (state, action) => {
  switch (action.type) {
    case FILTERS_ACTION.GET_PRODUCTS_FROM_PRODUCT_CONTEXT:
      const allProductsCloned = structuredClone(action.payload?.products || []);
      const categoriesData = action.payload?.categories || [];
      
      // CÁLCULO DINÁMICO DE RANGOS DE PRECIO MEJORADO Y AMIGABLE
      const { minPrice, maxPrice } = calculatePriceRange(allProductsCloned);

      const filteredProducts = givePaginatedList(allProductsCloned);

      // OBTENER CATEGORÍAS HABILITADAS DINÁMICAMENTE
      const enabledCategoryNames = getEnabledCategories(allProductsCloned, categoriesData);

      console.log(`🔄 Filtros actualizados: ${allProductsCloned.length} productos, ${enabledCategoryNames.length} categorías habilitadas`);

      return {
        ...state,
        allProducts: allProductsCloned,
        filteredProducts,
        minPrice,
        maxPrice,
        filters: {
          ...state.filters,
          category: convertArrayToObjectWithPropertyFALSE(enabledCategoryNames),
          price: [minPrice, maxPrice],
        },
        displayableProductsLength: allProductsCloned.length,
      };

    case FILTERS_ACTION.UPDATE_CATEGORY:
      return {
        ...state,
        filters: {
          ...state.filters,
          category: {
            ...state.filters.category,
            [action.payloadCategory]:
              !state.filters.category[action.payloadCategory],
          },
        },
      };

    case FILTERS_ACTION.UPDATE_SEARCH_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          search: action.payloadSearch,
        },
      };

    case FILTERS_ACTION.UPDATE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.payloadName]: action.payload.payloadValue,
        },
        paginateIndex: 0,
      };

    case FILTERS_ACTION.CHECK_CATEGORY:
      return {
        ...state,
        filters: {
          ...state.filters,
          category: {
            ...state.filters.category,
            [action.payloadCategory]: true,
          },
        },
      };

    case FILTERS_ACTION.CLEAR_FILTERS:
      const { category } = state.filters;
      const allUncheckedCategoryObj = convertArrayToObjectWithPropertyFALSE(
        Object.keys(category || {})
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          search: '',
          category: allUncheckedCategoryObj,
          company: 'all',
          price: [state.minPrice, state.maxPrice],
          rating: -1,
          sortByOption: '',
        },
        paginateIndex: 0,
      };

    case FILTERS_ACTION.UPDATE_PAGINATION:
      return {
        ...state,
        paginateIndex: action.payloadIndex,
      };

    case FILTERS_ACTION.APPLY_FILTERS:
      const { allProducts, filters } = state;

      const {
        search: searchText,
        category: categoryObjInState,
        company: companyInState,
        price: priceInState,
        rating: ratingInState,
        sortByOption,
      } = filters;

      const isAnyCheckboxChecked = categoryObjInState && Object.values(categoryObjInState).some(
        (categoryBool) => categoryBool
      );

      let tempProducts = allProducts;

      // FILTRO DE BÚSQUEDA MEJORADO
      tempProducts = allProducts.filter(({ name, description, company, category }) => {
        const trimmedSearchText = searchText.trim();
        if (!trimmedSearchText) return true;
        
        return (
          lowerizeAndCheckIncludes(name, trimmedSearchText) ||
          lowerizeAndCheckIncludes(description || '', trimmedSearchText) ||
          lowerizeAndCheckIncludes(company, trimmedSearchText) ||
          lowerizeAndCheckIncludes(category, trimmedSearchText)
        );
      });

      // FILTRO DE CATEGORÍA MEJORADO CON VALIDACIÓN
      if (isAnyCheckboxChecked && categoryObjInState) {
        tempProducts = tempProducts.filter(
          ({ category: categoryPropertyOfProduct }) =>
            categoryObjInState[categoryPropertyOfProduct]
        );
      }

      // FILTRO DE MARCA MEJORADO CON VALIDACIÓN
      if (companyInState && companyInState !== 'all') {
        tempProducts = tempProducts.filter(
          ({ company: companyPropertyOfProduct }) =>
            companyPropertyOfProduct === companyInState
        );
      }

      // FILTRO DE PRECIO MEJORADO CON VALIDACIÓN
      if (priceInState && Array.isArray(priceInState) && priceInState.length === 2) {
        tempProducts = tempProducts.filter(
          ({ price: pricePropertyOfProduct }) => {
            const [currMinPriceRange, currMaxPriceRange] = priceInState;
            return (
              pricePropertyOfProduct >= currMinPriceRange &&
              pricePropertyOfProduct <= currMaxPriceRange
            );
          }
        );
      }

      // FILTRO DE CALIFICACIÓN MEJORADO
      if (ratingInState > -1) {
        tempProducts = tempProducts.filter(({ stars }) => 
          stars && stars >= ratingInState
        );
      }

      // ORDENAMIENTO MEJORADO CON VALIDACIÓN
      if (sortByOption) {
        switch (sortByOption) {
          case SORT_TYPE.PRICE_LOW_TO_HIGH: {
            tempProducts = [...tempProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          }

          case SORT_TYPE.PRICE_HIGH_TO_LOW: {
            tempProducts = [...tempProducts].sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          }

          case SORT_TYPE.NAME_A_TO_Z: {
            tempProducts = [...tempProducts].sort((a, b) => {
              const nameA = (a.name || '').toLowerCase();
              const nameB = (b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });
            break;
          }

          case SORT_TYPE.NAME_Z_TO_A: {
            tempProducts = [...tempProducts].sort((a, b) => {
              const nameA = (a.name || '').toLowerCase();
              const nameB = (b.name || '').toLowerCase();
              return nameB.localeCompare(nameA);
            });
            break;
          }

          default:
            console.warn(`Tipo de ordenamiento no reconocido: ${sortByOption}`);
        }
      }

      // PAGINACIÓN
      const paginatedProducts = givePaginatedList(tempProducts);

      console.log(`🔍 Filtros aplicados: ${tempProducts.length} productos encontrados de ${allProducts.length} totales`);

      return {
        ...state,
        filteredProducts: paginatedProducts,
        displayableProductsLength: tempProducts.length,
        paginateIndex: 0,
      };

    // NUEVA ACCIÓN PARA SINCRONIZACIÓN AUTOMÁTICA
    case FILTERS_ACTION.SYNC_WITH_UPDATED_PRODUCTS:
      const updatedProducts = action.payload?.products || [];
      const updatedCategories = action.payload?.categories || [];
      
      // Recalcular rangos de precio
      const { minPrice: newMinPrice, maxPrice: newMaxPrice } = calculatePriceRange(updatedProducts);
      
      // Obtener nuevas categorías habilitadas
      const newEnabledCategories = getEnabledCategories(updatedProducts, updatedCategories);
      
      // Mantener filtros existentes pero actualizar opciones disponibles
      const currentCategoryFilters = state.filters.category || {};
      const updatedCategoryFilters = {};
      
      // Mantener filtros de categorías que aún existen
      newEnabledCategories.forEach(categoryName => {
        updatedCategoryFilters[categoryName] = currentCategoryFilters[categoryName] || false;
      });
      
      // Ajustar rango de precio si está fuera de los nuevos límites
      let adjustedPriceRange = [...(state.filters.price || [newMinPrice, newMaxPrice])];
      if (adjustedPriceRange[0] < newMinPrice) adjustedPriceRange[0] = newMinPrice;
      if (adjustedPriceRange[1] > newMaxPrice) adjustedPriceRange[1] = newMaxPrice;
      
      console.log(`🔄 Sincronización automática: ${updatedProducts.length} productos, ${newEnabledCategories.length} categorías`);
      
      return {
        ...state,
        allProducts: updatedProducts,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
        filters: {
          ...state.filters,
          category: updatedCategoryFilters,
          price: adjustedPriceRange,
        },
        displayableProductsLength: updatedProducts.length,
      };

    default:
      throw new Error(`Error: ${action.type} en filtersReducer no existe`);
  }
};