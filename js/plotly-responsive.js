/**
 * PLOTLY RESPONSIVE CONFIGURATIONS
 * Configuraciones específicas de Plotly para diferentes dispositivos
 */

window.PlotlyResponsiveConfigs = {
  
  // Configuración base común
  getBaseConfig(deviceType) {
    const configs = {
      mobile: {
        displayModeBar: false,
        responsive: true,
        showTips: false,
        doubleClick: false,
        showAxisDragHandles: false,
        showAxisRangeEntryBoxes: false,
        editable: false
      },
      tablet: {
        displayModeBar: 'hover',
        responsive: true,
        modeBarButtonsToRemove: [
          'pan2d', 'lasso2d', 'select2d', 'autoScale2d',
          'hoverClosestCartesian', 'hoverCompareCartesian',
          'toggleSpikelines'
        ],
        doubleClick: 'reset',
        showTips: false
      },
      desktop: {
        displayModeBar: true,
        responsive: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        doubleClick: 'reset+autosize',
        showTips: true
      }
    };
    
    return configs[deviceType] || configs.desktop;
  },

  // Layout específico para PV Loops
  getPVLoopLayout(deviceType) {
    const layouts = {
      mobile: {
        font: { size: 10, family: 'Arial, sans-serif' },
        margin: { l: 45, r: 20, t: 30, b: 40 },
        xaxis: {
          title: { text: 'Volume (mL)', font: { size: 9 } },
          tickfont: { size: 8 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        yaxis: {
          title: { text: 'Pressure (mmHg)', font: { size: 9 } },
          tickfont: { size: 8 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        legend: {
          orientation: 'h',
          x: 0,
          y: -0.15,
          font: { size: 8 }
        },
        showlegend: true
      },
      tablet: {
        font: { size: 11, family: 'Arial, sans-serif' },
        margin: { l: 55, r: 30, t: 40, b: 50 },
        xaxis: {
          title: { text: 'Volume (mL)', font: { size: 10 } },
          tickfont: { size: 9 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        yaxis: {
          title: { text: 'Pressure (mmHg)', font: { size: 10 } },
          tickfont: { size: 9 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { size: 9 }
        }
      },
      desktop: {
        font: { size: 12, family: 'Arial, sans-serif' },
        margin: { l: 70, r: 40, t: 50, b: 60 },
        xaxis: {
          title: { text: 'Volume (mL)', font: { size: 12 } },
          tickfont: { size: 10 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        yaxis: {
          title: { text: 'Pressure (mmHg)', font: { size: 12 } },
          tickfont: { size: 10 },
          showgrid: true,
          gridwidth: 1,
          gridcolor: 'rgba(0,0,0,0.1)'
        },
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { size: 10 }
        }
      }
    };
    
    return layouts[deviceType] || layouts.desktop;
  },

  // Layout para Hemodynamic plots
  getHemoLayout(deviceType) {
    const layouts = {
      mobile: {
        font: { size: 9, family: 'Arial, sans-serif' },
        margin: { l: 40, r: 15, t: 25, b: 35 },
        xaxis: {
          title: { text: 'RAP (mmHg)', font: { size: 8 } },
          tickfont: { size: 7 }
        },
        yaxis: {
          title: { text: 'PCWP (mmHg)', font: { size: 8 } },
          tickfont: { size: 7 }
        },
        legend: {
          orientation: 'h',
          x: 0,
          y: -0.2,
          font: { size: 7 }
        }
      },
      tablet: {
        font: { size: 10, family: 'Arial, sans-serif' },
        margin: { l: 45, r: 25, t: 30, b: 40 },
        xaxis: {
          title: { text: 'RAP (mmHg)', font: { size: 9 } },
          tickfont: { size: 8 }
        },
        yaxis: {
          title: { text: 'PCWP (mmHg)', font: { size: 9 } },
          tickfont: { size: 8 }
        },
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { size: 8 }
        }
      },
      desktop: {
        font: { size: 11, family: 'Arial, sans-serif' },
        margin: { l: 50, r: 30, t: 35, b: 45 },
        xaxis: {
          title: { text: 'RAP (mmHg)', font: { size: 10 } },
          tickfont: { size: 9 }
        },
        yaxis: {
          title: { text: 'PCWP (mmHg)', font: { size: 10 } },
          tickfont: { size: 9 }
        },
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { size: 9 }
        }
      }
    };
    
    return layouts[deviceType] || layouts.desktop;
  },

  // Layout para Trends
  getTrendsLayout(deviceType) {
    const layouts = {
      mobile: {
        font: { size: 8, family: 'Arial, sans-serif' },
        margin: { l: 35, r: 10, t: 20, b: 30 },
        xaxis: {
          tickfont: { size: 7 },
          showgrid: true,
          gridwidth: 0.5
        },
        yaxis: {
          tickfont: { size: 7 },
          showgrid: true,
          gridwidth: 0.5
        },
        showlegend: false
      },
      tablet: {
        font: { size: 9, family: 'Arial, sans-serif' },
        margin: { l: 40, r: 15, t: 25, b: 35 },
        xaxis: {
          tickfont: { size: 8 },
          showgrid: true,
          gridwidth: 0.5
        },
        yaxis: {
          tickfont: { size: 8 },
          showgrid: true,
          gridwidth: 0.5
        },
        showlegend: true,
        legend: {
          orientation: 'h',
          x: 0,
          y: -0.15,
          font: { size: 7 }
        }
      },
      desktop: {
        font: { size: 10, family: 'Arial, sans-serif' },
        margin: { l: 45, r: 20, t: 30, b: 40 },
        xaxis: {
          tickfont: { size: 9 },
          showgrid: true,
          gridwidth: 0.5
        },
        yaxis: {
          tickfont: { size: 9 },
          showgrid: true,
          gridwidth: 0.5
        },
        showlegend: true,
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { size: 8 }
        }
      }
    };
    
    return layouts[deviceType] || layouts.desktop;
  },

  // Configuración para Gauges
  getGaugeLayout(deviceType) {
    const layouts = {
      mobile: {
        font: { size: 9, family: 'Arial, sans-serif' },
        margin: { l: 10, r: 10, t: 15, b: 15 },
        height: 160,
        showlegend: false
      },
      tablet: {
        font: { size: 10, family: 'Arial, sans-serif' },
        margin: { l: 15, r: 15, t: 20, b: 20 },
        height: 180,
        showlegend: false
      },
      desktop: {
        font: { size: 11, family: 'Arial, sans-serif' },
        margin: { l: 20, r: 20, t: 25, b: 25 },
        height: 240,
        showlegend: false
      }
    };
    
    return layouts[deviceType] || layouts.desktop;
  },

  // Función para aplicar configuración responsive a un plot
  applyResponsiveConfig(plotElement, plotType, deviceType) {
    if (!window.Plotly || !plotElement) return;

    let layout = {};
    let config = this.getBaseConfig(deviceType);

    switch (plotType) {
      case 'pv-loop':
        layout = this.getPVLoopLayout(deviceType);
        break;
      case 'hemo':
        layout = this.getHemoLayout(deviceType);
        break;
      case 'trends':
        layout = this.getTrendsLayout(deviceType);
        break;
      case 'gauge':
        layout = this.getGaugeLayout(deviceType);
        break;
      default:
        layout = this.getPVLoopLayout(deviceType);
    }

    // Aplicar tema dark si está activo
    if (document.body.classList.contains('dark')) {
      layout = this.applyDarkTheme(layout);
    }

    return { layout, config };
  },

  // Aplicar tema dark
  applyDarkTheme(layout) {
    const darkLayout = { ...layout };
    
    // Colores para tema dark
    darkLayout.paper_bgcolor = 'transparent';
    darkLayout.plot_bgcolor = 'transparent';
    
    if (darkLayout.font) {
      darkLayout.font.color = '#e6edf3';
    }
    
    if (darkLayout.xaxis) {
      darkLayout.xaxis.gridcolor = 'rgba(230,237,243,0.06)';
      darkLayout.xaxis.zerolinecolor = 'rgba(230,237,243,0.1)';
      darkLayout.xaxis.color = '#e6edf3';
    }
    
    if (darkLayout.yaxis) {
      darkLayout.yaxis.gridcolor = 'rgba(230,237,243,0.06)';
      darkLayout.yaxis.zerolinecolor = 'rgba(230,237,243,0.1)';
      darkLayout.yaxis.color = '#e6edf3';
    }
    
    if (darkLayout.legend && darkLayout.legend.font) {
      darkLayout.legend.font.color = '#e6edf3';
    }
    
    return darkLayout;
  },

  // Función para redimensionar todos los plots responsivamente
  resizeAllPlots() {
    if (!window.Plotly) return;
    
    const deviceInfo = window.responsiveManager ? window.responsiveManager.getDeviceInfo() : { breakpoint: 'desktop' };
    const deviceType = deviceInfo.breakpoint;
    
    // PV Loops
    const pvPlots = document.querySelectorAll('#plotPV, #clinicPVPlot');
    pvPlots.forEach(plot => {
      if (plot._fullLayout) {
        const { layout, config } = this.applyResponsiveConfig(plot, 'pv-loop', deviceType);
        window.Plotly.relayout(plot, layout).catch(console.warn);
      }
    });
    
    // Hemodynamic plots
    const hemoPlots = document.querySelectorAll('#plotHemo, #plotHemoClinic');
    hemoPlots.forEach(plot => {
      if (plot._fullLayout) {
        const { layout, config } = this.applyResponsiveConfig(plot, 'hemo', deviceType);
        window.Plotly.relayout(plot, layout).catch(console.warn);
      }
    });
    
    // Trends plots
    const trendsPlots = document.querySelectorAll('#plotTr, #clinicTrends [id^="plot"]');
    trendsPlots.forEach(plot => {
      if (plot._fullLayout) {
        const { layout, config } = this.applyResponsiveConfig(plot, 'trends', deviceType);
        window.Plotly.relayout(plot, layout).catch(console.warn);
      }
    });
    
    // Gauge plots
    const gaugePlots = document.querySelectorAll('[id^="gauge_"]');
    gaugePlots.forEach(plot => {
      if (plot._fullLayout) {
        const { layout, config } = this.applyResponsiveConfig(plot, 'gauge', deviceType);
        window.Plotly.relayout(plot, layout).catch(console.warn);
      }
    });
  }
};

// Función global para crear plots responsive
window.createResponsivePlot = function(elementId, data, plotType = 'pv-loop') {
  const element = document.getElementById(elementId);
  if (!element || !window.Plotly) return Promise.reject('Plotly not available');
  
  const deviceInfo = window.responsiveManager ? window.responsiveManager.getDeviceInfo() : { breakpoint: 'desktop' };
  const deviceType = deviceInfo.breakpoint;
  
  const { layout, config } = window.PlotlyResponsiveConfigs.applyResponsiveConfig(element, plotType, deviceType);
  
  return window.Plotly.newPlot(element, data, layout, config).then(() => {
    // Configurar auto-resize
    const resizeObserver = new ResizeObserver(() => {
      window.Plotly.Plots.resize(element).catch(console.warn);
    });
    resizeObserver.observe(element);
    
    return element;
  });
};

// Escuchar cambios de tema para actualizar plots
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (mutation.target === document.body) {
          setTimeout(() => {
            window.PlotlyResponsiveConfigs.resizeAllPlots();
          }, 100);
        }
      }
    });
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
});

// Redimensionar plots cuando cambie el tamaño de ventana
window.addEventListener('resize', () => {
  clearTimeout(window.plotResizeTimeout);
  window.plotResizeTimeout = setTimeout(() => {
    window.PlotlyResponsiveConfigs.resizeAllPlots();
  }, 200);
});