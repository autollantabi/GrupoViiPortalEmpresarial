# Índice de la documentación técnica

Este documento es el **índice general** de la documentación del proyecto. Sirve como punto de entrada y como **plantilla de estructura** para documentar otros proyectos: se mantiene la misma organización de archivos y se adapta el contenido a cada repositorio.

---

## Cómo está organizada la documentación

La documentación está **segmentada por tema** para que un desarrollador encuentre rápido lo que necesita sin leer un único archivo largo. Cada documento tiene una responsabilidad clara y enlaza a los demás cuando hace falta.

| Documento | Propósito | Cuándo usarlo |
|------------|-----------|----------------|
| [indice.md](indice.md) | Índice y guía de la estructura de docs (este archivo). | Entender cómo está organizada la documentación. |
| [setup.md](setup.md) | Requisitos del sistema, variables de entorno, pasos para ejecutar localmente, errores comunes. | Primera vez en el proyecto, configurar entorno, resolver fallos de instalación o ejecución. |
| [arquitectura.md](arquitectura.md) | Arquitectura general, carpetas, responsabilidades, patrones, árbol de carpetas, módulos, cómo añadir una pantalla. | Entender la estructura del código y dónde tocar para nuevas funcionalidades. |
| [apis.md](apis.md) | Integración con APIs externas: instancias HTTP, endpoints representativos, servicios que usan cada API, riesgos. | Conectar con backends, depurar llamadas HTTP, añadir nuevos servicios. |
| [flujo-funcional.md](flujo-funcional.md) | Flujos principales paso a paso: login, recuperación de contraseña, navegación protegida, gestión de canjes, auth/autorización, permisos en tabla. | Entender qué ocurre en cada flujo de usuario o de sistema. |
| [decisiones-tecnicas.md](decisiones-tecnicas.md) | Justificación de tecnologías, alternativas consideradas, trade-offs. | Entender por qué se eligieron ciertas opciones y qué sacrificios implican. |
| [despliegue.md](despliegue.md) | Proceso de build, configuración de ambientes, consideraciones para producción. | Hacer build, desplegar, configurar producción. |
| [pendientes.md](pendientes.md) | Mejoras técnicas sugeridas, deuda técnica detectada, suposiciones o partes no claras. | Planificar mejoras y aclarar dudas. |
| [guia-proyecto.md](guia-proyecto.md) | Resumen ejecutivo para onboarding: qué es el proyecto, cómo empezar, dónde está cada cosa, flujo para añadir pantalla, decisiones históricas, contacto. | Incorporación de un nuevo desarrollador o consulta rápida. |

---

## Orden de lectura recomendado

1. **Nuevo en el proyecto:** [setup.md](setup.md) → [guia-proyecto.md](guia-proyecto.md) → [arquitectura.md](arquitectura.md).
2. **Vas a tocar APIs o servicios:** [apis.md](apis.md) y [arquitectura.md](arquitectura.md) (sección de servicios y “cómo añadir una pantalla”).
3. **Vas a desplegar:** [setup.md](setup.md) (variables de entorno) y [despliegue.md](despliegue.md).
4. **Quieres entender un flujo concreto:** [flujo-funcional.md](flujo-funcional.md).

---

## Uso como plantilla en otros proyectos

Para replicar esta estructura en otro repositorio:

1. Crear la carpeta `docs/` y copiar este **indice.md** (adaptando la tabla de documentos a los archivos que existan).
2. Crear o adaptar: **setup.md**, **arquitectura.md**, **apis.md** (si hay integración con APIs), **flujo-funcional.md**, **decisiones-tecnicas.md**, **despliegue.md**, **pendientes.md**, **guia-proyecto.md**.
3. En la raíz, un **README.md** que enlace a `docs/indice.md` o a `docs/setup.md` como punto de entrada.
4. Mantener la convención: un documento por tema, sin duplicar bloques largos; usar enlaces entre documentos.

---

*Última actualización: al segmentar la documentación y eliminar el documento técnico único. Ante nuevos documentos o cambios de estructura, actualizar este índice.*
