import { FaStar } from 'react-icons/fa';
import { giveUniqueLabelFOR, midValue, toastHandler } from '../../utils/utils';
import styles from './Filters.module.css';

import { useFiltersContext } from '../../contexts/FiltersContextProvider';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { MdClose, MdFilterList } from 'react-icons/md';
import {
  FILTER_INPUT_TYPE,
  SORT_TYPE,
  ToastType,
  RATINGS,
  MIN_DISTANCE_BETWEEN_THUMBS,
} from '../../constants/constants';
import { Slider } from '@mui/material';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import { useState, useEffect } from 'react';

const Filters = ({
  isFilterContainerVisible,
  handleFilterToggle,
  isMobile,
}) => {
  const {
    minPrice: minPriceFromContext,
    maxPrice: maxPriceFromContext,
    filters,
    updateFilters,
    updatePriceFilter,
    updateCategoryFilter,
    clearFilters,
  } = useFiltersContext();

  const { products: productsFromProductContext } = useAllProductsContext();
  const { formatPrice } = useCurrencyContext();

  const [activeFilterSection, setActiveFilterSection] = useState(null);
  const [filterStats, setFilterStats] = useState({
    totalProducts: 0,
    categoriesCount: 0,
    companiesCount: 0,
    priceRange: { min: 0, max: 0 }
  });

  const {
    category: categoryFromContext,
    company: companyFromContext,
    price: priceFromContext,
    rating: ratingFromContext,
    sortByOption: sortByOptionFromContext,
  } = filters;

  // SINCRONIZACIÓN AUTOMÁTICA CON PRODUCTOS ACTUALIZADOS
  useEffect(() => {
    const updateFilterStats = () => {
      if (productsFromProductContext && productsFromProductContext.length > 0) {
        const enabledCategories = [...new Set(
          productsFromProductContext
            .map((product) => product.category)
            .filter(Boolean)
        )];

        const companies = [...new Set(
          productsFromProductContext
            .map((product) => product.company)
            .filter(Boolean)
        )];

        const prices = productsFromProductContext.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        setFilterStats({
          totalProducts: productsFromProductContext.length,
          categoriesCount: enabledCategories.length,
          companiesCount: companies.length,
          priceRange: { min: minPrice, max: maxPrice }
        });
      }
    };

    updateFilterStats();

    // Escuchar eventos de actualización de productos
    const handleProductsUpdate = () => {
      console.log('🔄 Actualizando estadísticas de filtros tras cambio de productos');
      setTimeout(updateFilterStats, 100);
    };

    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('adminConfigChanged', handleProductsUpdate);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('adminConfigChanged', handleProductsUpdate);
    };
  }, [productsFromProductContext]);

  // OBTENER CATEGORÍAS HABILITADAS DINÁMICAMENTE
  const getEnabledCategories = () => {
    return [...new Set(
      productsFromProductContext
        .map((product) => product.category)
        .filter(Boolean)
    )];
  };

  // OBTENER MARCAS DINÁMICAMENTE
  const getAvailableCompanies = () => {
    return [...new Set(
      productsFromProductContext
        .map((product) => product.company)
        .filter(Boolean)
    )];
  };

  const categoriesList = getEnabledCategories();
  const companiesList = getAvailableCompanies();

  const handleClearFilter = () => {
    clearFilters();
    setActiveFilterSection(null);
    toastHandler(ToastType.Success, 'Filtros limpiados exitosamente');
  };

  // FUNCIÓN MEJORADA PARA MANEJAR EL SLIDER DE PRECIOS CON MEJOR UX
  const handlePriceSliderChange = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    let adjustedValue = [...newValue];

    // Asegurar distancia mínima entre los valores
    const minDistance = Math.min(MIN_DISTANCE_BETWEEN_THUMBS, (maxPriceFromContext - minPriceFromContext) * 0.01);
    
    if (activeThumb === 0) {
      adjustedValue[0] = Math.min(
        newValue[0],
        adjustedValue[1] - minDistance
      );
    } else {
      adjustedValue[1] = Math.max(
        newValue[1],
        adjustedValue[0] + minDistance
      );
    }

    // Asegurar que los valores estén dentro del rango válido
    adjustedValue[0] = Math.max(minPriceFromContext, adjustedValue[0]);
    adjustedValue[1] = Math.min(maxPriceFromContext, adjustedValue[1]);

    updatePriceFilter(
      { target: { name: FILTER_INPUT_TYPE.PRICE } },
      adjustedValue,
      activeThumb
    );
  };

  // CALCULAR VALORES PARA EL SLIDER CON MEJOR DISTRIBUCIÓN
  const priceRange = maxPriceFromContext - minPriceFromContext;
  const priceStep = (() => {
    if (priceRange <= 1000) return 10;
    if (priceRange <= 10000) return 100;
    if (priceRange <= 100000) return 500;
    return 1000;
  })();

  const midPriceValue = midValue(minPriceFromContext, maxPriceFromContext);

  // CALCULAR MARCAS DEL SLIDER DE FORMA INTELIGENTE
  const getSliderMarks = () => {
    const marks = [
      {
        value: minPriceFromContext,
        label: formatPrice(minPriceFromContext),
      },
      {
        value: maxPriceFromContext,
        label: formatPrice(maxPriceFromContext),
      }
    ];

    if (priceRange > 2000) {
      marks.splice(1, 0, {
        value: midPriceValue,
        label: formatPrice(midPriceValue),
      });
    }

    return marks;
  };

  // FUNCIÓN PARA ALTERNAR SECCIONES EN MÓVIL
  const toggleFilterSection = (section) => {
    setActiveFilterSection(activeFilterSection === section ? null : section);
  };

  // OBTENER CONTEO DE FILTROS ACTIVOS
  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Categorías activas
    if (categoryFromContext) {
      count += Object.values(categoryFromContext).filter(Boolean).length;
    }
    
    // Marca seleccionada
    if (companyFromContext !== 'all') count++;
    
    // Rango de precio modificado
    if (priceFromContext[0] !== minPriceFromContext || priceFromContext[1] !== maxPriceFromContext) count++;
    
    // Calificación seleccionada
    if (ratingFromContext > -1) count++;
    
    // Ordenamiento seleccionado
    if (sortByOptionFromContext) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div
      className={`${styles.filtersContainer} ${
        isFilterContainerVisible && isMobile && styles.showFiltersContainer
      }`}
    >
      {/* HEADER MEJORADO PARA MÓVIL */}
      <div className={styles.filtersHeader}>
        {isMobile && (
          <button 
            className={styles.closeBtn}
            onClick={handleFilterToggle}
            aria-label="Cerrar filtros"
          >
            <MdClose />
          </button>
        )}
        
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <MdFilterList className={styles.filterIcon} />
            <h3>Filtros</h3>
            {activeFiltersCount > 0 && (
              <span className={styles.activeFiltersCount}>
                {activeFiltersCount}
              </span>
            )}
          </div>
          
          <div className={styles.filterStats}>
            <span>{filterStats.totalProducts} productos</span>
            <span>{filterStats.categoriesCount} categorías</span>
          </div>
        </div>

        <button 
          className={`${styles.clearBtn} btn btn-danger`} 
          onClick={handleClearFilter}
          disabled={activeFiltersCount === 0}
        >
          {isMobile ? 'Limpiar' : 'Limpiar Filtros'}
        </button>
      </div>

      <div className={styles.filtersContent}>
        {/* SECCIÓN DE PRECIO */}
        <div className={styles.filterSection}>
          <button
            className={`${styles.sectionHeader} ${
              isMobile && activeFilterSection === 'price' ? styles.active : ''
            }`}
            onClick={() => isMobile ? toggleFilterSection('price') : null}
          >
            <span className={styles.sectionTitle}>
              💰 Rango de Precio
            </span>
            {isMobile && (
              <span className={styles.toggleIcon}>
                {activeFilterSection === 'price' ? '−' : '+'}
              </span>
            )}
          </button>
          
          <div className={`${styles.sectionContent} ${
            !isMobile || activeFilterSection === 'price' ? styles.expanded : ''
          }`}>
            <div className={styles.priceInfo}>
              <div className={styles.priceInfoRow}>
                <strong>Seleccionado:</strong> 
                <span>{formatPrice(priceFromContext[0])} - {formatPrice(priceFromContext[1])}</span>
              </div>
              <div className={styles.priceInfoRow}>
                <strong>Disponible:</strong> 
                <span>{formatPrice(minPriceFromContext)} - {formatPrice(maxPriceFromContext)}</span>
              </div>
            </div>

            <div className={styles.sliderContainer}>
              <Slider
                name={FILTER_INPUT_TYPE.PRICE}
                getAriaLabel={() => 'Rango de precios'}
                value={priceFromContext}
                onChange={handlePriceSliderChange}
                valueLabelDisplay='auto'
                valueLabelFormat={(value) => formatPrice(value)}
                min={minPriceFromContext}
                max={maxPriceFromContext}
                step={priceStep}
                disableSwap
                marks={getSliderMarks()}
                sx={{
                  color: 'var(--primary-500)',
                  width: '100%',
                  margin: '1.5rem 0',
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(59, 130, 246, 0.16)',
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 6,
                  },
                  '& .MuiSlider-rail': {
                    height: 6,
                    opacity: 0.3,
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: 'var(--primary-300)',
                    height: 8,
                    width: 2,
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem',
                    color: 'var(--grey-600)',
                    fontWeight: 500,
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'var(--primary-600)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  },
                }}
              />
            </div>

            <div className={styles.priceInputs}>
              <div className={styles.priceInputGroup}>
                <label>Mínimo:</label>
                <input
                  type="number"
                  value={priceFromContext[0]}
                  onChange={(e) => {
                    const newMin = Math.max(minPriceFromContext, parseInt(e.target.value) || minPriceFromContext);
                    const newMax = Math.max(newMin + priceStep, priceFromContext[1]);
                    handlePriceSliderChange(null, [newMin, newMax], 0);
                  }}
                  className={styles.priceInput}
                  min={minPriceFromContext}
                  max={priceFromContext[1] - priceStep}
                  step={priceStep}
                />
              </div>
              <div className={styles.priceInputGroup}>
                <label>Máximo:</label>
                <input
                  type="number"
                  value={priceFromContext[1]}
                  onChange={(e) => {
                    const newMax = Math.min(maxPriceFromContext, parseInt(e.target.value) || maxPriceFromContext);
                    const newMin = Math.min(newMax - priceStep, priceFromContext[0]);
                    handlePriceSliderChange(null, [newMin, newMax], 1);
                  }}
                  className={styles.priceInput}
                  min={priceFromContext[0] + priceStep}
                  max={maxPriceFromContext}
                  step={priceStep}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE CATEGORÍAS */}
        <div className={styles.filterSection}>
          <button
            className={`${styles.sectionHeader} ${
              isMobile && activeFilterSection === 'category' ? styles.active : ''
            }`}
            onClick={() => isMobile ? toggleFilterSection('category') : null}
          >
            <span className={styles.sectionTitle}>
              📂 Categorías ({categoriesList.length})
            </span>
            {isMobile && (
              <span className={styles.toggleIcon}>
                {activeFilterSection === 'category' ? '−' : '+'}
              </span>
            )}
          </button>
          
          <div className={`${styles.sectionContent} ${
            !isMobile || activeFilterSection === 'category' ? styles.expanded : ''
          }`}>
            {categoriesList.length === 0 ? (
              <div className={styles.noOptions}>
                <span>📭 No hay categorías disponibles</span>
                <small>Los productos se actualizarán automáticamente</small>
              </div>
            ) : (
              <div className={styles.checkboxGrid}>
                {categoriesList.map((singleCategory, index) => (
                  <label 
                    key={index}
                    className={styles.checkboxLabel}
                    htmlFor={giveUniqueLabelFOR(singleCategory, index)}
                  >
                    <input
                      type='checkbox'
                      name={FILTER_INPUT_TYPE.CATEGORY}
                      id={giveUniqueLabelFOR(singleCategory, index)}
                      checked={categoryFromContext[singleCategory] || false}
                      onChange={() => updateCategoryFilter(singleCategory)}
                    />
                    <span className={styles.checkboxText}>
                      {singleCategory}
                    </span>
                    <span className={styles.categoryCount}>
                      ({productsFromProductContext.filter(p => p.category === singleCategory).length})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN DE MARCAS */}
        <div className={styles.filterSection}>
          <button
            className={`${styles.sectionHeader} ${
              isMobile && activeFilterSection === 'company' ? styles.active : ''
            }`}
            onClick={() => isMobile ? toggleFilterSection('company') : null}
          >
            <span className={styles.sectionTitle}>
              🏢 Marcas ({companiesList.length})
            </span>
            {isMobile && (
              <span className={styles.toggleIcon}>
                {activeFilterSection === 'company' ? '−' : '+'}
              </span>
            )}
          </button>
          
          <div className={`${styles.sectionContent} ${
            !isMobile || activeFilterSection === 'company' ? styles.expanded : ''
          }`}>
            <select
              name={FILTER_INPUT_TYPE.COMPANY}
              onChange={updateFilters}
              value={companyFromContext}
              className={styles.companySelect}
            >
              <option value='all'>Todas las marcas</option>
              {companiesList.map((company, index) => (
                <option key={giveUniqueLabelFOR(company, index)} value={company}>
                  {company} ({productsFromProductContext.filter(p => p.company === company).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECCIÓN DE CALIFICACIÓN */}
        <div className={styles.filterSection}>
          <button
            className={`${styles.sectionHeader} ${
              isMobile && activeFilterSection === 'rating' ? styles.active : ''
            }`}
            onClick={() => isMobile ? toggleFilterSection('rating') : null}
          >
            <span className={styles.sectionTitle}>
              ⭐ Calificación
            </span>
            {isMobile && (
              <span className={styles.toggleIcon}>
                {activeFilterSection === 'rating' ? '−' : '+'}
              </span>
            )}
          </button>
          
          <div className={`${styles.sectionContent} ${
            !isMobile || activeFilterSection === 'rating' ? styles.expanded : ''
          }`}>
            <div className={styles.ratingOptions}>
              {RATINGS.map((singleRating, index) => (
                <label 
                  key={singleRating}
                  className={styles.radioLabel}
                  htmlFor={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}
                >
                  <input
                    type='radio'
                    name={FILTER_INPUT_TYPE.RATING}
                    data-rating={singleRating}
                    onChange={updateFilters}
                    id={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}
                    checked={singleRating === ratingFromContext}
                  />
                  <span className={styles.radioText}>
                    {singleRating} <FaStar className={styles.starIcon} /> y más
                  </span>
                  <span className={styles.ratingCount}>
                    ({productsFromProductContext.filter(p => p.stars >= singleRating).length})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SECCIÓN DE ORDENAMIENTO */}
        <div className={styles.filterSection}>
          <button
            className={`${styles.sectionHeader} ${
              isMobile && activeFilterSection === 'sort' ? styles.active : ''
            }`}
            onClick={() => isMobile ? toggleFilterSection('sort') : null}
          >
            <span className={styles.sectionTitle}>
              🔄 Ordenar Por
            </span>
            {isMobile && (
              <span className={styles.toggleIcon}>
                {activeFilterSection === 'sort' ? '−' : '+'}
              </span>
            )}
          </button>
          
          <div className={`${styles.sectionContent} ${
            !isMobile || activeFilterSection === 'sort' ? styles.expanded : ''
          }`}>
            <div className={styles.sortOptions}>
              {Object.values(SORT_TYPE).map((singleSortValue, index) => (
                <label 
                  key={singleSortValue}
                  className={styles.radioLabel}
                  htmlFor={giveUniqueLabelFOR(singleSortValue, index)}
                >
                  <input
                    type='radio'
                    name={FILTER_INPUT_TYPE.SORT}
                    data-sort={singleSortValue}
                    onChange={updateFilters}
                    id={giveUniqueLabelFOR(singleSortValue, index)}
                    checked={singleSortValue === sortByOptionFromContext}
                  />
                  <span className={styles.radioText}>
                    {singleSortValue}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CON RESUMEN EN MÓVIL */}
      {isMobile && (
        <div className={styles.filtersFooter}>
          <div className={styles.footerStats}>
            <span>🔍 {filterStats.totalProducts} productos disponibles</span>
            {activeFiltersCount > 0 && (
              <span>📋 {activeFiltersCount} filtros activos</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;