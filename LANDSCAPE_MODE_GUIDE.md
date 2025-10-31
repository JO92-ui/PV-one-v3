# Guía de Modo Landscape Forzado

## Descripción
Se han implementado controles para forzar el modo landscape en dispositivos móviles y bloquear completamente el uso en modo portrait.

## Cambios Realizados

### 1. **Script de Detección y Bloqueo de Orientación** (Head del HTML)
- **Ubicación**: `index.html` líneas ~20-85
- **Funcionamiento**:
  - Detecta si el dispositivo es móvil usando el User Agent
  - Intenta bloquear la orientación a `landscape-primary` usando la Screen Orientation API
  - Si el usuario intenta rotar el dispositivo a portrait, muestra un overlay bloqueante

### 2. **Overlay Bloqueante**
Cuando el dispositivo está en modo portrait:
- Se muestra un overlay visual con:
  - Gradiente azul (tema de la app)
  - Ícono de teléfono (📱)
  - Mensaje en español: "Gira el dispositivo"
  - Instrucción: "Esta aplicación solo funciona en modo horizontal (landscape)"
- El overlay tiene `z-index: 99999` para asegurar que esté siempre visible
- El contenido de fondo se desactiva (pointer-events: none)

### 3. **Estilos CSS Preventivos**
- **Ubicación**: `index.html` CSS styles (~línea 655)
- En modo portrait, el contenido se oscurece (opacity: 0.3)
- Se previene el scroll del contenido bloqueado

## Cómo Funciona

### Flujo de Ejecución:
1. **Página carga** → Script se ejecuta inmediatamente
2. **Detecta si es móvil** → Si es móvil, intenta bloquear orientation
3. **Verifica orientación actual**:
   - Si está en portrait → Muestra overlay bloqueante
   - Si está en landscape → Contenido normal
4. **Escucha cambios**:
   - `orientationchange` event → Verifica cada giro del dispositivo
   - `resize` event → Maneja cambios de tamaño de ventana
   - Remueve/agrega overlay según sea necesario

## Compatibilidad

### ✅ Funciona en:
- **iOS** (iPhone/iPad): Bloqueo de orientación funciona en apps PWA instaladas
- **Android**: Bloqueo funciona en apps PWA y navegadores soportados
- **Todos los navegadores modernos**: Fallback a overlay visual si el bloqueo falla

### 📝 Nota:
- El bloqueo de orientación (`screen.orientation.lock()`) requiere:
  - HTTPS o localhost (en desarrollo)
  - PWA instalada o full-screen mode
  - Si no funciona el bloqueo, el overlay visual sirve de barrera

## Dispositivos Detectados como Móviles:
```
Android, webOS, iPhone, iPad, iPod, BlackBerry, IEMobile, Opera Mini
```

## Pruebas Recomendadas

1. **En navegador de escritorio**:
   - Redimensiona la ventana a portrait (altura > ancho)
   - Debería mostrarse el overlay
   - Redimensiona a landscape → overlay desaparece

2. **En dispositivo real** (iOS):
   - Abre la app en Safari
   - Intenta rotar a portrait → Overlay bloqueante
   - Rota a landscape → App funciona normalmente

3. **En dispositivo real** (Android):
   - Abre en navegador o PWA instalada
   - Intenta rotar a portrait → Overlay bloqueante
   - Rota a landscape → App funciona normalmente

## Personalización

### Cambiar mensaje de overlay:
Edita el HTML dentro del script en `index.html` línea ~50-60

### Cambiar colores del overlay:
Modifica el `background` en `div.style.cssText` (línea ~48)

### Cambiar sensibilidad:
La detección de portrait usa: `window.innerHeight > window.innerWidth`
Puedes ajustar este cálculo según necesites

## Notas Técnicas

- El script se ejecuta en el `<head>` para detectar portrait **antes** de renderizar contenido
- El overlay se crea dinámicamente para evitar HTML adicional
- El `z-index: 99999` asegura que esté sobre cualquier modal o popup
- Se usa `requestAnimationFrame` internamente para cambios de tamaño

## Resolución de Problemas

### "El overlay no aparece en portrait"
- Verifica que JavaScript esté habilitado
- Revisa la consola del navegador (F12 → Console) para errores
- Asegúrate que el dispositivo sea detectado como móvil

### "Puedo girar el dispositivo a portrait en la app"
- Es comportamiento esperado en algunos navegadores no-PWA
- El overlay bloqueante debería estar visible y prevenir interacción
- Instala la app como PWA para mejor bloqueo de orientación

### "El overlay está pero puedo interactuar con la app"
- Se ha establecido `pointer-events: none` en el contenido
- Si algo aún es interactuable, verifica que el overlay esté sobre él en el DOM

---

**Última actualización**: 30 de octubre de 2025  
**Dispositivos soportados**: iOS, Android, navegadores móviles modernos
