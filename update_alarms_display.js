// Script para actualizar la visualización de alarmas con emojis y nombres clínicos
// Ejecutar este código en la consola del navegador

// 1. Limpiar localStorage para forzar recarga
localStorage.removeItem('pv-one-custom-alarms');
localStorage.removeItem('pv-one-alarms-bundle-code');
// console.log removed: Limpiado localStorage de alarmas

// 2. Definir las nuevas reglas con nombres clínicos (emojis se generan automáticamente por severity)
const newAlarmRules = [
  {
    id: 1,
    name: "RV Failure (Right Ventricular Failure)",
    tag: "RV_failure",
    severity: "critical",
    category: "congestion",
    expression: "RAP >= 12 && PAPI < 1.85",
    created: new Date().toLocaleString()
  },
  {
    id: 2, 
    name: "BiV Congestion (Biventricular Congestion)",
    tag: "BiV_congestion",
    severity: "warning", 
    category: "congestion",
    expression: "RAP >= 12 && PCWP >= 18",
    created: new Date().toLocaleString()
  },
  {
    id: 3,
    name: "Severe Cardiogenic Shock",
    tag: "severe_shock",
    severity: "critical",
    category: "perfusion", 
  expression: "CI < 2.2 && Lactate >= 5",
    created: new Date().toLocaleString()
  },
  {
    id: 4,
    name: "Impella Wean Ready (Weaning Criteria Met)",
    tag: "impella_wean_ready", 
    severity: "wean_ok",
    category: "weaning",
    expression: "Impella && Impella_flow_Lmin <= 1.0 && CountTrue([CI >= 2.0, SvO2 >= 55, Lactate <= 2.5, pH >= 7.30]) >= 3 && MAP >= 65",
    created: new Date().toLocaleString()
  }
];

// 3. Guardar las nuevas reglas
localStorage.setItem('pv-one-custom-alarms', JSON.stringify(newAlarmRules));
// console.log removed: Guardadas nuevas reglas de alarma con emojis

// 4. Regenerar el bundle automáticamente
if (typeof window.autoUpdateBundle === 'function') {
  window.autoUpdateBundle().then(() => {
  // console.log removed: Bundle regenerado con nuevos nombres
    // 5. Forzar actualización de la UI
    if (typeof generateAll === 'function') {
      generateAll();
    }
  // console.log removed: UI actualizada
  });
} else {
  // console.log removed: Función autoUpdateBundle no disponible - recarga la página
}