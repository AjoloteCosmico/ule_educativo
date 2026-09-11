# Política de Anuncios — ule educativo

Documento de reglas para la integración visual y los requisitos de contenido de los anuncios en el sitio.  
Complementa `identidad.md`, `arquitectura.md` y el esquema actual de `data/anuncios.json`.

---

## 1. Propósito de los anuncios

Los anuncios sirven para dar visibilidad a **actividades, talleres, encuentros, exhibiciones,emprendimientos de la comunidad y proyectos relacionados** con el juego de pelota mesoamericano (histórico o contemporáneo) y, de forma excepcional, a iniciativas de la comunidad local que refuercen el carácter educativo y cultural del sitio.

No son publicidad genérica ni un muro comercial. Deben sentirse parte del ecosistema del sitio: amigables, legibles y coherentes con la estética de piedra / identidad gráfica.

**Principios:**

- El contenido editorial (artículos, catálogos, bibliografía) siempre tiene prioridad visual y de espacio.
- Los anuncios no interrumpen la lectura de artículos largos. sin embargo se pueden posicionar al lado en pantalla horizontal, sobre todo en el buscador de articulos/bibliografia/colecciones
-la imagen y el card deben ajustarse perfectamente segun la situación independientemente de las dimensiones de la imagen
- El tono debe ser educativo-ligero, nunca agresivo ni clickbait.
- Todo anuncio visible debe estar vigente y marcado como activo.

---

## 2. Requisitos de un anuncio (contenido y datos)

### 2.1 Campos obligatorios (contrato actual + refuerzos)

| Campo              | Tipo     | Obligatorio | Notas |
|--------------------|----------|-------------|-------|
| `id`               | string   | Sí          | Único, kebab-case (`anuncio-001`) |
| `imagen`           | string   | Recomendado | Ruta relativa o URL absoluta. Ver §3 |
| `contacto`         | string   | Sí          | Nombre, correo, teléfono o handle. Corto |
| `slogan`           | string   | Sí          | Frase principal (máx. ~60–70 caracteres recomendados) |
| `descripcion`      | string   | Sí          | Texto adicional / condiciones. Más discreto |
| `vigencia_inicio`  | YYYY-MM-DD | No       | Inclusive |
| `vigencia_fin`     | YYYY-MM-DD | No        | Inclusive |
| `activo`           | boolean  | Sí          | `false` = nunca se muestra, aunque esté en rango |
| `peso`             | number   | Sí          | Entero ≥ 1. Mayor peso = más probabilidad de selección |
| `enlace`           | string   | No          | URL externa. Si existe, toda la card es clicable |

### 2.2 Campos propuestos (ampliar el JSON)

Estos campos para garantizan control, accesibilidad y futuro filtrado sin romper el contrato actual:

```json
{
  "id": "anuncio-003",
  "imagen": "/assets/images/anuncios/taller-cadera.jpg",
  "imagen_alt": "Grupo practicando golpe de cadera en cancha de tierra",
  "contacto": "talleres@ule.org · @ule_educativo",
  "slogan": "Taller de golpe de cadera — marzo 2026",
  "descripcion": "Cupo limitado. Inscripción gratuita para estudiantes.",
  "vigencia_inicio": "2026-02-15",
  "vigencia_fin": "2026-03-31",
  "activo": true,
  "peso": 3,
  "enlace": "https://ejemplo.org/taller",
  "tipo": "taller",
  "paginas": ["home", "articulos"],
  "prioridad_slot": "normal"
}
```

**Nuevos campos sugeridos:**

| Campo            | Tipo          | Default     | Uso |
|------------------|---------------|-------------|-----|
| `imagen_alt`     | string        | derivado de slogan | Texto alternativo real para accesibilidad |
| `tipo`           | string enum   | `"comunidad"` | `evento` · `taller` · `exhibicion` · `sponsor` · `comunidad` · `otro` |
| `paginas`        | array string  | `["home"]`  | Dónde puede aparecer: `home`, `articulos`, `catalogos`, `bibliografia`, `articulo`, `todas` |
| `prioridad_slot` | string enum   | `"normal"`  | `alta` · `normal` · `baja` (futuro: preferencia por slot) |

**Notas de implementación:**

- Los campos nuevos deben ser **opcionales** para no romper anuncios existentes.
- `ads.js` debe ignorar campos desconocidos con gracia.
- Cuando se migre a API, el mismo esquema se mantiene.

### 2.3 Reglas de contenido

- El anuncio debe tener relación clara (temática o comunitaria) con el juego de pelota o con la difusión cultural del sitio.
- No se aceptan anuncios de productos ajenos, política partidista, contenido engañoso o que contradiga el tono educativo.
- `slogan` y `contacto` no deben contener HTML. Solo texto plano.
- `descripcion` puede incluir fechas, condiciones o “vigente hasta…”, pero el sistema ya muestra la vigencia de forma automática cuando hay `vigencia_fin`.
- Preferir imágenes propias o con permiso de uso. Evitar hotlinking frágil a CDNs externos de redes sociales (pueden caducar).

---

## 3. Integración visual

### 3.1 Jerarquía visual fija (identidad)

1. **Imagen** (mayor peso visual) — proporción **4:5** vertical.
2. **Slogan** (destacado, peso 700).
3. **Contacto**.
4. **Texto legal / descripción** (siempre el más discreto: tamaño anotación, itálica, opacidad reducida).

Esta prioridad ya está reflejada en el Web Component `<ad-card>` y en `components.css`.

### 3.2 Variantes de layout

| Variante     | Cuándo usarla                          | CSS / atributo |
|--------------|----------------------------------------|----------------|
| Vertical     | Por defecto (móvil y slots estrechos)  | sin atributo   |
| Horizontal   | Contenedores anchos (≥ ~640 px)        | `horizontal` o `data-ad-horizontal="true"` en el slot |

En horizontal la imagen ocupa ~40 % (máx. 220 px) y mantiene 4:5.

### 3.3 Estilos que ya cubre el CSS actual

- Fondo de card (`--color-card`), radio (`--radius-md`), sombra (`--shadow-card`).
- Aspect-ratio 4/5 + `object-fit: cover`.
- Tipografía y colores de título/cuerpo/anotación según variables.
- Variante horizontal responsive.
- Encapsulación en Shadow DOM (variables globales atraviesan el boundary).
- `loading="lazy"` en la imagen.
- Focus visible cuando hay enlace.

### 3.4 ¿Qué falta o conviene reforzar en CSS / componente?

| Aspecto                        | Estado actual                          | Recomendación |
|--------------------------------|----------------------------------------|---------------|
| Alt de imagen                  | Se genera desde slogan                 | Preferir `imagen_alt` del JSON; fallback a slogan |
| Placeholder cuando no hay imagen | La card se renderiza sin `<img>`     | Añadir un fondo sutil o icono de cancha como fallback visual (opcional) |
| Estado vacío del slot          | `slot.hidden = true`                   | Correcto. Mantener |
| Contraste en modo oscuro       | Usa variables de tema                  | Verificar WCAG AA con los textos reales de ejemplo |
| Tamaño máximo de la card       | No limitado explícitamente             | En home conviene un `max-width` razonable (ej. 320–360 px en vertical) para no dominar la sección |
| Separación entre múltiples slots | Depende del contenedor padre         | En la sección “Patrocinadores” usar `cluster` o grid con `gap: var(--space-md)` |
| Indicador de “anuncio” / label | No existe                              | No agregar por ahora (mantener minimalista). Si en el futuro se necesita, un badge pequeño “Comunidad” o “Evento” según `tipo` |

**Conclusión CSS:** el sistema actual cubre lo esencial de la identidad. Los huecos principales son de **datos** (`imagen_alt`, `tipo`, `paginas`) y de **política de colocación**, no de estilos base.

---

## 4. Reglas de colocación por página

| Página            | ¿Anuncios? | Cantidad sugerida | Orientación recomendada | Notas |
|-------------------|------------|-------------------|--------------------------|-------|
| `index.html` (Home) | Sí       | 1–2 slots         | Vertical (móvil) / horizontal si el contenedor lo permite | Sección “Patrocinadores” o “Comunidad”. Ya existen 2 slots. |
| `articulos.html`  | Opcional   | 0–1               | Vertical o sidebar futuro | Solo al final de la lista o en un área secundaria. No intercalar entre cards. |
| `articulo.html` (lectura) | No / muy restringido | 0            | —                        | Priorizar lectura. Evitar interrupciones. |
| `catalogos.html`  | Opcional   | 0–1               | Vertical                 | Debajo del grid o en footer de sección. |
| `bibliografia.html` | Opcional | 0–1             | Vertical                 | Igual que catálogos. |
| Recursos / simulador | No      | 0                 | —                        | Mantener foco en la herramienta. |

**Reglas generales de colocación:**

- Los slots se marcan con `data-ad-slot` (y opcionalmente `data-ad-horizontal="true"`).
- `ads.js` selecciona **por slot** de forma independiente entre los anuncios vigentes (ponderación por `peso`).
- Si en el futuro se usa el campo `paginas`, filtrar antes de la selección ponderada.
- Nunca más de 2 anuncios visibles simultáneos en una misma vista en la fase actual.
- El contenedor padre decide el layout (flex/grid); la card solo se adapta.

---

## 5. Lógica de selección (recordatorio)

1. Cargar `data/anuncios.json`.
2. Filtrar: `activo === true` **y** fecha actual ∈ `[vigencia_inicio, vigencia_fin]`.
3. (Futuro) Filtrar por `paginas` si el campo existe.
4. Selección aleatoria ponderada por `peso`.
5. Renderizar en cada `data-ad-slot` un `<ad-card>` independiente.

No se guarda historial de impresiones ni clics en fase 1 (coherente con arquitectura estática).

---

## 6. Accesibilidad y rendimiento

- Toda imagen debe tener `alt` significativo (`imagen_alt` o fallback a slogan).
- Si la card es un enlace, `aria-label` descriptivo (ya implementado a partir de slogan + contacto).
- Contraste mínimo WCAG AA (ya asegurado por las variables de tema).
- `loading="lazy"` en imágenes.
- Respetar `prefers-reduced-motion` si en el futuro se añaden transiciones decorativas.
- No depender de JavaScript para el contenido editorial; los anuncios son complementarios.

---

## 7. Cómo agregar un anuncio (operativa)

1. Subir la imagen a `assets/images/anuncios/` (preferible formato moderno, dimensiones razonables para 4:5).
2. Añadir el objeto en `data/anuncios.json` respetando el esquema.
3. Definir `vigencia_inicio` / `vigencia_fin` y `peso`.
4. Hacer push. El anuncio aparece automáticamente si está activo y vigente.

**Checklist rápido de calidad:**

- [ ] Imagen 4:5 legible y sin texto excesivo dentro de la foto.
- [ ] Slogan ≤ ~70 caracteres.
- [ ] Contacto claro y actualizado.
- [ ] `activo: true` solo cuando realmente se quiere mostrar.
- [ ] Enlace (si existe) abre en nueva pestaña y es confiable.
- [ ] Relación temática con el sitio.

---

## 8. Evolución futura (sin implementar ahora)

- API Go que entregue el mismo JSON.
- Campo `paginas` y filtrado por vista.
- Panel mínimo de moderación (fase 2+).
- Posible contador de impresiones solo en backend (nunca en el frontend estático).
- Badge de `tipo` si la comunidad lo solicita.

---

## 9. Resumen de decisiones abiertas / preguntas para el equipo

1. **¿Imagen obligatoria?**  
   Actualmente se permite anuncio sin imagen. ¿Preferimos exigirla o mantener un fallback visual (icono de cancha + fondo de card)? No no debe ser obligatoria, si no se pasa el parametro se pone el fallback

2. **¿Campo `tipo` y `paginas` se añaden ya en fase 1.4 o se dejan para después?**  
   Recomendación: añadirlos como opcionales ahora; la lógica de filtrado por página puede implementarse después sin romper datos. si se añaden ahora

3. **¿Cuántos slots en home?**  
   Hoy hay 2. ¿Se mantiene o se reduce a 1 para no saturar la sección “Patrocinadores”? se reduce a 1

4. **¿Anuncios en páginas de listado (`articulos`, `catalogos`)?**  
   Por defecto se sugiere 0–1 y solo al final. Confirmar. no deben estar en una parte mas visible comviviendo con los componentes importantes, 

5. **Política editorial estricta:**  
   ¿Solo actividades directamente ligadas al juego de pelota, o también negocios locales afines (ej. el ejemplo actual de pulque) siempre que respeten el tono? si tambien emprendimientos de la comnuidad

Este documento debe actualizarse cuando se cambie el esquema de datos o se añadan nuevos tipos de página.  
Una vez aprobado, la implementación de fase 1.4 debe alinearse con estas reglas.
