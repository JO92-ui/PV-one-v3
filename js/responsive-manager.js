/**
 * RESPONSIVE LOGIC HANDLER PARA PV-ONE v3 LITE
 * Maneja la lógica específica de responsive design y adaptaciones dinámicas
 */

class ResponsiveManager {
  constructor() {
    this.currentBreakpoint = null;
    this.isTouch = 'ontouchstart' in window;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isAndroid = /Android/.test(navigator.userAgent);
    
    this.breakpoints = {
      mobile: 767,
      tablet: 1024,
      desktop: 1200
    };
    
    this.init();
  }

  init() {
    this.detectDevice();
    this.setupViewportMeta();
    this.bindEvents();
    this.handleOrientationChange();
    this.optimizeForDevice();
    this.setupTouchHandlers();
  }

  detectDevice() {
    const width = window.innerWidth;
    
    if (width <= this.breakpoints.mobile) {
      this.currentBreakpoint = 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      this.currentBreakpoint = 'tablet';
    } else {
      this.currentBreakpoint = 'desktop';
    }
    
    // Agregar clases al body
    document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
    document.body.classList.add(`is-${this.currentBreakpoint}`);
    
    if (this.isTouch) {
      document.body.classList.add('is-touch');
    }
    
    if (this.isIOS) {
      document.body.classList.add('is-ios');
    }
    
    if (this.isAndroid) {
      document.body.classList.add('is-android');
    }
  }

  setupViewportMeta() {
    // Asegurar que el viewport meta está optimizado
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // Configuración optimizada para cada dispositivo
    if (this.currentBreakpoint === 'mobile') {
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    } else {
      viewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    }
  }

  bindEvents() {
    // Escuchar cambios de tamaño de ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.detectDevice();
        this.optimizeForDevice();
        this.handleOrientationChange();
      }, 150);
    });

    // Escuchar cambios de orientación
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
        this.optimizeForDevice();
      }, 100);
    });
  }

  handleOrientationChange() {
    const orientation = window.orientation || (window.innerWidth > window.innerHeight ? 90 : 0);
    const isLandscape = Math.abs(orientation) === 90;
    
    document.body.classList.toggle('is-landscape', isLandscape);
    document.body.classList.toggle('is-portrait', !isLandscape);
    
    // Ajustes específicos para orientación
    if (this.currentBreakpoint === 'tablet') {
      this.optimizeTabletLayout(isLandscape);
    } else if (this.currentBreakpoint === 'mobile') {
      this.optimizeMobileLayout(isLandscape);
    }
  }

  optimizeTabletLayout(isLandscape) {
    const grid = document.querySelector('.grid');
    const clinicGrid = document.querySelector('.clinic-grid');
    
    if (isLandscape) {
      // En landscape, mantener dos columnas pero más compactas
      if (grid) grid.style.gridTemplateColumns = '1.8fr 1fr';
      if (clinicGrid) clinicGrid.style.gridTemplateColumns = '320px 1fr';
    } else {
      // En portrait, una sola columna
      if (grid) grid.style.gridTemplateColumns = '1fr';
      if (clinicGrid) grid.style.gridTemplateColumns = '1fr';
    }
  }

  optimizeMobileLayout(isLandscape) {
    const header = document.querySelector('.top-header');
    const tabs = document.querySelector('.tabs');
    
    if (isLandscape && this.currentBreakpoint === 'mobile') {
      // En landscape móvil, header más compacto
      if (header) header.style.height = '48px';
      document.body.style.paddingTop = '52px';
      
      // Tabs horizontales en landscape
      if (tabs) {
        tabs.style.flexDirection = 'row';
        tabs.style.overflow = 'auto';
      }
    } else {
      // Portrait normal
      if (header) header.style.height = '56px';
      document.body.style.paddingTop = '60px';
    }
  }

  optimizeForDevice() {
    this.optimizePlots();
    this.optimizeGauges();
    this.optimizeTables();
    this.optimizeTimepoints();
    this.optimizeModals();
  }

  optimizePlots() {
    const plots = document.querySelectorAll('#plotPV, #clinicPVPlot, #plotHemo, #plotTr, #plotStage');
    
    plots.forEach(plot => {
      if (!plot) return;
      
      switch (this.currentBreakpoint) {
        case 'mobile':
          this.optimizePlotForMobile(plot);
          break;
        case 'tablet':
          this.optimizePlotForTablet(plot);
          break;
        case 'desktop':
          this.optimizePlotForDesktop(plot);
          break;
      }
    });
  }

  optimizePlotForMobile(plot) {
    // Configuración específica para móviles
    plot.style.fontSize = '11px';
    
    // Si es Plotly, ajustar configuración
    if (window.Plotly && plot._fullLayout) {
      const update = {
        'font.size': 10,
        'margin.l': 40,
        'margin.r': 20,
        'margin.t': 30,
        'margin.b': 40
      };
      
      window.Plotly.update(plot, {}, update).catch(() => {});
    }
  }

  optimizePlotForTablet(plot) {
    plot.style.fontSize = '12px';
    
    if (window.Plotly && plot._fullLayout) {
      const update = {
        'font.size': 11,
        'margin.l': 50,
        'margin.r': 30,
        'margin.t': 40,
        'margin.b': 50
      };
      
      window.Plotly.update(plot, {}, update).catch(() => {});
    }
  }

  optimizePlotForDesktop(plot) {
    plot.style.fontSize = '13px';
    
    if (window.Plotly && plot._fullLayout) {
      const update = {
        'font.size': 12,
        'margin.l': 60,
        'margin.r': 40,
        'margin.t': 50,
        'margin.b': 60
      };
      
      window.Plotly.update(plot, {}, update).catch(() => {});
    }
  }

  optimizeGauges() {
    const gaugeGrid = document.querySelector('.gaugeGrid');
    if (!gaugeGrid) return;
    
    const gauges = gaugeGrid.querySelectorAll('[id^="gauge_"]');
    
    gauges.forEach(gauge => {
      switch (this.currentBreakpoint) {
        case 'mobile':
          gauge.style.minHeight = '160px';
          break;
        case 'tablet':
          gauge.style.minHeight = '180px';
          break;
        case 'desktop':
          gauge.style.minHeight = '240px';
          break;
      }
    });
  }

  optimizeTables() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      if (this.currentBreakpoint === 'mobile') {
        // Agregar wrapper con scroll horizontal
        if (!table.closest('.table-responsive')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-responsive';
          wrapper.style.overflowX = 'auto';
          wrapper.style.webkitOverflowScrolling = 'touch';
          
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      }
    });
  }

  optimizeTimepoints() {
    const tpWrap = document.querySelector('.tpWrap');
    if (!tpWrap) return;
    
    const tpCards = tpWrap.querySelectorAll('.tpCard');
    
    tpCards.forEach(card => {
      if (this.currentBreakpoint === 'mobile') {
        // Colapsar automáticamente en móvil excepto la primera
        const isFirst = Array.from(tpCards).indexOf(card) === 0;
        if (!isFirst && !card.classList.contains('collapsed')) {
          card.classList.add('collapsed');
        }
      }
    });
  }

  optimizeModals() {
    const modals = document.querySelectorAll('.modal-content');
    
    modals.forEach(modal => {
      if (this.currentBreakpoint === 'mobile') {
        modal.style.width = '95%';
        modal.style.maxWidth = 'none';
        modal.style.margin = '2% auto';
        modal.style.maxHeight = '96vh';
        modal.style.overflowY = 'auto';
      } else {
        // Restaurar tamaños originales
        modal.style.width = '';
        modal.style.maxWidth = '';
        modal.style.margin = '';
        modal.style.maxHeight = '';
        modal.style.overflowY = '';
      }
    });
  }

  setupTouchHandlers() {
    if (!this.isTouch) return;
    
    // Mejorar feedback táctil
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.btn, .tab, button, .template-card, .variable-item');
      if (target) {
        target.classList.add('touch-active');
      }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('.btn, .tab, button, .template-card, .variable-item');
      if (target) {
        setTimeout(() => {
          target.classList.remove('touch-active');
        }, 150);
      }
    }, { passive: true });
    
    // Prevenir doble-tap zoom en elementos específicos
    const preventDoubleTap = document.querySelectorAll('.btn, .tab, button, input, select');
    preventDoubleTap.forEach(el => {
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.target.click();
      });
    });
  }

  // Método para forzar recálculo de layouts
  recalculateLayouts() {
    // Forzar recálculo de Plotly plots
    if (window.Plotly) {
      const plots = document.querySelectorAll('[id^="plot"], [id*="Plot"]');
      plots.forEach(plot => {
        if (plot._fullLayout) {
          window.Plotly.Plots.resize(plot).catch(() => {});
        }
      });
    }
    
    // Recalcular grids CSS
    const grids = document.querySelectorAll('.grid, .clinic-grid, .gaugeGrid, .tpWrap');
    grids.forEach(grid => {
      const display = grid.style.display;
      grid.style.display = 'none';
      grid.offsetHeight; // Forzar reflow
      grid.style.display = display || '';
    });
  }

  // Método público para obtener información del dispositivo
  getDeviceInfo() {
    return {
      breakpoint: this.currentBreakpoint,
      isTouch: this.isTouch,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      orientation: window.orientation || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
}

// CSS adicional dinámico para feedback táctil
const touchStyles = document.createElement('style');
touchStyles.textContent = `
  .touch-active {
    transform: scale(0.98) !important;
    opacity: 0.8 !important;
    transition: all 0.1s ease !important;
  }
  
  .is-touch .btn:hover {
    transform: none !important;
    box-shadow: none !important;
  }
  
  .is-mobile .card {
    margin-bottom: 8px !important;
  }
  
  .is-tablet.is-landscape .clinic-grid {
    grid-template-columns: 320px 1fr !important;
  }
  
  .table-responsive {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  
  .table-responsive::-webkit-scrollbar {
    height: 6px;
  }
  
  .table-responsive::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .table-responsive::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  .table-responsive::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;
document.head.appendChild(touchStyles);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.responsiveManager = new ResponsiveManager();
  });
} else {
  window.responsiveManager = new ResponsiveManager();
}

// Exportar para uso global
window.ResponsiveManager = ResponsiveManager;