import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useAllProductsContext } from './ProductsContextProvider';

import { FILTERS_ACTION } from '../utils/actions';
import { filtersReducer } from '../reducers';
import { initialFiltersState } from '../reducers/filtersReducer';
import {
  FILTER_INPUT_TYPE,
  MIN_DISTANCE_BETWEEN_THUMBS,
} from '../constants/constants';

const FiltersContext = createContext(null);

export const useFiltersContext = () => useContext(FiltersContext);

const FiltersContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(filtersReducer, initialFiltersState);

  const {
    products: productsFromProductsContext,
    categories: categoriesFromProductsContext,
  } = useAllProductsContext();

  // SINCRONIZACIÓN INICIAL Y AUTOMÁTICA CON PRODUCTOS Y CATEGORÍAS
  useEffect(() => {
    console.log('🔄 Sincronizando filtros con productos y categorías actualizados');
    dispatch({
      type: FILTERS_ACTION.GET_PRODUCTS_FROM_PRODUCT_CONTEXT,
      payload: {
        products: productsFromProductsContext,
        categories: categoriesFromProductsContext,
      },
    });
  }, [categoriesFromProductsContext, productsFromProductsContext]);

  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN DE PRODUCTOS PARA SINCRONIZACIÓN AUTOMÁTICA
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      const { products: updatedProducts } = event.detail;
      console.log('📡 Evento de actualización de productos recibido en FiltersContext');
      
      // Sincronizar automáticamente con los nuevos productos
      dispatch({
        type: FILTERS_ACTION.SYNC_WITH_UPDATED_PRODUCTS,
        payload: {
          products: updatedProducts,
          categories: categoriesFromProductsContext,
        },
      });
    };

    const handleCategoriesUpdate = (event) => {
      const { categories: updatedCategories } = event.detail;
      console.log('📡 Evento de actualización de categorías recibido en FiltersContext');
      
      // Sincronizar automáticamente con las nuevas categorías
      dispatch({
        type: FILTERS_ACTION.SYNC_WITH_UPDATED_PRODUCTS,
        payload: {
          products: productsFromProductsContext,
          categories: updatedCategories,
        },
      });
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración recibido en FiltersContext');
      
      // Recargar desde localStorage para obtener los datos más actualizados
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          dispatch({
            type: FILTERS_ACTION.SYNC_WITH_UPDATED_PRODUCTS,
            payload: {
              products: parsedConfig.products || productsFromProductsContext,
              categories: parsedConfig.categories || categoriesFromProductsContext,
            },
          });
        } catch (error) {
          console.error('Error al cargar configuración en FiltersContext:', error);
        }
      }
    };

    // Agregar listeners para sincronización automática
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('categoriesConfigUpdated', handleCategoriesUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('categoriesConfigUpdated', handleCategoriesUpdate);
      window.removeEventListener('forceStoreUpdate', handleConfigUpdate);
      window.removeEventListener('adminConfigChanged', handleConfigUpdate);
    };
  }, [productsFromProductsContext, categoriesFromProductsContext]);

  // called due to the onChange of category checkbox in the Filters component!
  const updateCategoryFilter = (categoryClicked) => {
    dispatch({
      type: FILTERS_ACTION.UPDATE_CATEGORY,
      payloadCategory: categoryClicked,
    });
  };

  const updatePriceFilter = (e, newValue, activeThumb) => {
    const { name } = e.target;

    let value;

    value =
      activeThumb === 0
        ? [
            Math.min(newValue[0], newValue[1] - MIN_DISTANCE_BETWEEN_THUMBS),
            newValue[1],
          ]
        : [
            newValue[0],
            Math.max(newValue[1], newValue[0] + MIN_DISTANCE_BETWEEN_THUMBS),
          ];

    dispatch({
      type: FILTERS_ACTION.UPDATE_FILTERS,
      payload: {
        payloadName: name,
        payloadValue: value,
      },
    });
  };

  // called due to the onChange of all input (excluding category checkbox) in the Filters component!
  const updateFilters = (e) => {
    const targetEle = e.target;

    // also handles company
    const name = targetEle.name;
    let value = targetEle?.value;

    if (name === FILTER_INPUT_TYPE.RATING) {
      value = Number(targetEle.dataset.rating);
    }

    if (name === FILTER_INPUT_TYPE.SORT) {
      value = targetEle.dataset.sort;
    }

    dispatch({
      type: FILTERS_ACTION.UPDATE_FILTERS,
      payload: {
        payloadName: name,
        payloadValue: value,
      },
    });
  };

  //  called inside the Filters Component of the ProductListingPage
  const clearFilters = () => {
    dispatch({ type: FILTERS_ACTION.CLEAR_FILTERS });
  };

  // called in the Category component of the the Home Page
  const checkCategoryOnTabClick = (categoryCard) => {
    clearFilters();

    dispatch({
      type: FILTERS_ACTION.CHECK_CATEGORY,
      payloadCategory: categoryCard,
    });
  };

  // called inside the ProductsList Component of the ProductListing Page
  const applyFilters = () => {
    dispatch({
      type: FILTERS_ACTION.APPLY_FILTERS,
    });
  };

  // this searchText is coming from searchBar component, inside useSearchSuggestions hook!!

  // updateSearchFilterInContext is called on Clicking the 🔍 icon or pressing Enter in the searchInput (i.e. submit event)
  const updateSearchFilterInContext = (searchText) => {
    dispatch({
      type: FILTERS_ACTION.UPDATE_SEARCH_FILTER,
      payloadSearch: searchText,
    });
  };

  const updatePaginatedIndex = (paginateIndex) => {
    dispatch({
      type: FILTERS_ACTION.UPDATE_PAGINATION,
      payloadIndex: paginateIndex,
    });
  };

  // NUEVA FUNCIÓN PARA SINCRONIZACIÓN MANUAL
  const syncFiltersWithProducts = (products, categories) => {
    dispatch({
      type: FILTERS_ACTION.SYNC_WITH_UPDATED_PRODUCTS,
      payload: {
        products,
        categories,
      },
    });
  };

  return (
    <FiltersContext.Provider
      value={{
        ...state,
        updateFilters,
        updateCategoryFilter,
        clearFilters,
        checkCategoryOnTabClick,
        applyFilters,
        updateSearchFilterInContext,
        updatePaginatedIndex,
        updatePriceFilter,
        syncFiltersWithProducts,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
export default FiltersContextProvider;