# En esta entrega todos los cambios de código y vistas en general se encuentran en la rama "dev" ya que aún no se encuentran en estado de pasar a la rama "main"

# 🌾 Córdoba Vidriera Productiva — Digitalización y Gestión Integral

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Oracle](https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

Aplicación web integral diseñada para la modernización, automatización y centralización del programa provincial **“Córdoba Vidriera Productiva”**, impulsado por el **Ministerio de Bioagroindustria** en conjunto con el **Ministerio de Producción, Ciencia e Innovación Tecnológica** de la Provincia de Córdoba.

---

## 📌 Descripción del Proyecto

El sistema sustituye los procesos manuales y descentralizados (Google Forms / Sheets) por una plataforma web automatizada de alto rendimiento que administra todo el ciclo de vida de los expositores (PyMEs agroalimentarias y agroindustriales).

### 🚀 Módulos Principales
1. **Autogestión del Productor / Expositor:**
   - Registro de nexo y autenticación de usuarios.
   - Carga dinámica del perfil de la PyME, catálogo de productos, puntos de venta y redes.
   - Repositorio de activos digitales (subida de logotipos editables y galería fotográfica de 1 a 5 imágenes).
   - Aceptación digital obligatoria del *Manual del Expositor 2026*.
   - Sistema ágil de reempadronamiento anual de datos.
2. **Dashboard de Gestión Administrativa (Ministerio):**
   - Panel de control de estados: *Nuevos, Pendientes de Validación, Registrados y Rechazados*.
   - Previsualización y validación humana de documentación y activos.
   - Filtrado avanzado por geolocalización (departamentos) y rubros para organización de ferias.
   - Automatización del envío de correos electrónicos con resoluciones de estado.
   - Exportación de listados de expositores en tiempo real.
3. **Expositor Digital (Consulta Pública y Ciudadana):**
   - Mapa interactivo provincial dividido por departamentos con renderizado rápido.
   - Fichas interactivas de oferta productiva y visualización pública del catálogo regional.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | **React (SPA)** | Arquitectura modular basada en componentes, Virtual DOM y navegación fluida sin recargas. |
| **Backend** | **FastAPI (Python)** | Framework asíncrono de alto rendimiento, comunicación en tiempo real con WebSockets y documentación OpenAPI/Swagger. |
| **Base de Datos** | **Oracle Database** | Motor relacional robusto para garantizar integridad, seguridad y disponibilidad de datos gubernamentales. |
| **DevOps / Despliegue** | **Docker & Docker Compose** | Empaquetado en contenedores y despliegue modular/monolítico adaptado a la infraestructura ministerial. |

---

## 🌿 Flujo y Sistema de Ramas (Git Branching)

```mermaid
flowchart TD
    %% Nodos de desarrolladores con nombres exactos de ramas
    subgraph DEV_TEAM ["👥 Ramas Personales de Desarrollo"]
        F["🌿 Franco-dev<br/>(Frontend)"]
        V["🌿 valen-dev<br/>(Dashboard/QA)"]
        B["🌿 bauti_dev<br/>(Backend/PM)"]
        L["🌿 lcanas-dev<br/>(Fullstack/Doc)"]
        G["🌿 guillermo_dev<br/>(DevOps/Docker)"]
        H["🌿 heyme_dev<br/>(Database/DBA)"]
    end

    %% Nodos principales
    DEV["🚀 dev<br/>(Integración / QA)"]
    MAIN["⭐ main<br/>(Producción)"]

    %% Conexiones
    F --> DEV
    V --> DEV
    B --> DEV
    L --> DEV
    G --> DEV
    H --> DEV

    DEV -- "Pull Request" --> MAIN

    %% Estilos de colores y resaltado
    style DEV_TEAM fill:#f8f9fa,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4
    style F fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style V fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style B fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style L fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style G fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style H fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1

    style DEV fill:#fef3c7,stroke:#d97706,stroke-width:3px,color:#92400e
    style MAIN fill:#dcfce7,stroke:#16a34a,stroke-width:3px,color:#15803d
```

### Descripción Detallada del Sistema de Ramas

#### 1. ⭐ `main` (Rama Principal)
*   **Propósito:** Contiene el código de producción completamente estable, revisado y listo para lanzamiento.
*   **Regla:** Es una rama protegida. No se permite realizar `commits` directos.
*   **Integración:** Solo recibe código de la rama `dev` a través de un Pull Request (PR) aprobado por el equipo, tras verificar que todos los tests pasen.

#### 2. 🚀 `dev` (Rama de Integración y Desarrollo Central)
*   **Propósito:** Punto de convergencia de todas las ramas personales para pruebas de integración y QA.
*   **Regla:** Es la rama central de trabajo colaborativo.
*   **Integración:** Recibe los cambios de los desarrolladores individuales a través de PRs.

#### 3. 👥 Ramas Personales de Desarrollo
*   **Propósito:** Trabajo aislado de cada desarrollador para implementar características y tareas específicas.
*   **Regla:** El trabajo se desarrolla en la rama personal (ej. `guillermo_dev`).
*   **Integración:** Una vez finalizada la tarea, el desarrollador debe abrir un PR hacia `dev`.
*   **Ramas Personales:**
    *   **🌿 Franco-dev:** Frontend / Interfaz de Usuario (UI) con React.
    *   **🌿 valen-dev:** Dashboard de Administración y QA Testing.
    *   **🌿 bauti_dev:** Backend API con FastAPI y Gestión de Proyecto.
    *   **🌿 lcanas-dev:** Fullstack Development y Documentación Técnica (OpenAPI).
    *   **🌿 guillermo_dev:** DevOps, Dockerización de Microservicios y Cloud Infrastructure.
    *   **🌿 heyme_dev:** Database Administration (DBA), Modelado Relacional y Oracle SQL.
