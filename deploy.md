# Despliegue: análisis de Docker, pesos y plataformas gratuitas

Análisis hecho el 2026-10-13 sobre la rama `bauti_dev` (commit `fcfa06c`), con los dos contenedores levantados por `docker compose up -d --build`.

**Recomendación:** frontend como sitio estático en Cloudflare Pages y backend en Railway. Por peso y memoria entran sobrados; lo que realmente decide el hosting del backend es cómo llega a Oracle por Tailscale, y eso todavía no está resuelto en ninguna plataforma gratuita.

## Qué se midió en los contenedores

| | Backend | Frontend (como está hoy) | Frontend compilado |
|---|---|---|---|
| Imagen | 261 MB | 731 MB | 4,3 MB de archivos estáticos (14 archivos) |
| RAM en uso | 58 MB en reposo, 63 MB tras 80 pedidos | 420–467 MB | no corre proceso propio |
| Qué pesa | base Python ~130 MB, dependencias 64 MB, código 0,8 MB | Node ~250 MB, `node_modules` 273 MB, código 13 MB | un solo JS de 2,39 MB (934 kB gzip) |

- **Backend:** está bien armado para desplegar. Ya usa `${PORT}` y el `.dockerignore` deja afuera `recursos/` y `.venv/`.
- **Frontend:** el Dockerfile levanta el servidor de desarrollo de Vite (`npm run dev`). Sirve para trabajar en local, pero no para producción: consume casi los 512 MB que dan los planes gratis. Compilado no necesita contenedor.

## Plataformas gratuitas

| Plataforma | Límite gratis | ¿Entra el backend? | Problema |
|---|---|---|---|
| **Railway** | Prueba: 5 USD una vez, 1 GB RAM. Después: 1 USD por mes, 0,5 GB RAM, volumen de 0,5 GB, imagen hasta 4 GB | Sí | Pide tarjeta. El backend prendido todo el mes ronda 1 USD (estimación con tarifas de terceros), justo en el límite |
| **Render** | 512 MB RAM, 750 horas por mes, sitios estáticos gratis | Sí | Sin disco persistente: se pierden las imágenes de `uploads/` y `empresas_repo/`. Se duerme a los 15 min y tarda ~1 min en despertar. Bloquea los puertos SMTP 25, 465 y 587 |
| **Cloudflare Pages** | Solo estáticos, ancho de banda sin tope, 500 builds por mes | Solo frontend | No corre el backend |
| **Google Cloud Run** | 2 M de pedidos por mes | Sí | Sin disco persistente; no se verificó si pide tarjeta |
| **Oracle Cloud Always Free** | Máquina virtual con 1 GB RAM (AMD) | Sí, con el `docker-compose` tal cual | Es una VM: hay que administrarla. Permite Tailscale normal y disco real |
| **Fly.io** | Ya no tiene plan gratis, solo una prueba de horas | — | Descartada |
| **Koyeb** | Su página de precios ya no muestra servicio web gratis | — | Descartada |

Los límites de Railway y Render salen de su documentación oficial. Los de Cloudflare, Cloud Run, Fly y Oracle Cloud salen de comparativas de terceros que se contradicen en algunos números; conviene confirmarlos antes de crear la cuenta.

## ¿Railway aguanta un proyecto en Node?

Por peso sí; lo que no aguanta gratis es la memoria si se corre como está hoy.

- **Peso de la imagen:** la del frontend pesa 731 MB y Railway permite hasta 4 GB por imagen, incluso en el plan gratis.
- **Memoria:** el servidor de desarrollo de Vite usa entre 420 y 467 MB. El plan gratis corta en 0,5 GB por servicio, así que queda al borde de que lo maten. En la prueba inicial el tope es 1 GB y ahí sí entra.
- **Costo:** Railway cobra por memoria usada, cerca de 10 USD por GB al mes según tarifas de terceros. Esos ~450 MB prendidos todo el mes son unos 4,5 USD, contra 1 USD de crédito mensual del plan gratis. La prueba de 5 USD se iría en más o menos un mes solo con el frontend.

La salida es no correr Node en producción. El proyecto compilado son 4,3 MB de archivos estáticos, y servidos con un servidor liviano (Caddy o nginx) usan unas decenas de MB de RAM (estimación, no medido). Así el frontend entra en el plan gratis de Railway junto al backend, o directamente va a Cloudflare Pages sin gastar crédito.

Para eso hay que cambiar `frontend/Dockerfile` a uno de dos etapas (compilar con Node, servir con Caddy) y arreglar antes el error de `mapa.tsx` que rompe `npm run build`.

## Lo que bloquea el despliegue hoy

1. **Acceso a Oracle.** En Railway y Render, Tailscale solo corre en modo "userspace", que expone un proxy SOCKS5. Hasta donde sabemos, `oracledb` no usa proxies SOCKS, así que haría falta además un reenviador TCP dentro del contenedor. Es factible, pero hay que probarlo antes de comprometerse.
2. **`npm run build` falla** por `eventosFiltrados` sin usar en `frontend/src/components/mapa/mapa.tsx` línea 72. `vite build` solo sí compila; así se midieron los 4,3 MB.
3. **CORS** tiene solo `localhost:5173` fijo en `backend/main.py`.
4. **`VITE_API_URL`** queda grabada al compilar: hay que definirla en el build del hosting, no en el contenedor.
5. **Mails en Render:** solo saldrían por el puerto 2525 de Mailtrap.
6. **Estado en memoria:** la cola de exportación y las conexiones WebSocket se pierden si el servicio se duerme o reinicia. En Railway no se duerme.
7. **Imágenes subidas:** `uploads/` y `empresas_repo/` necesitan un volumen persistente.

## Alternativa sin el problema de la base

Correr el backend en el servidor propio que ya está en la red Tailscale y publicarlo con Tailscale Funnel o Cloudflare Tunnel, ambos gratis. Evita el punto 1 por completo. Falta saber si la cátedra exige una plataforma de despliegue y si se puede correr Docker en ese servidor.

## Próximo paso

Probar la conexión a Oracle desde un contenedor con Tailscale en modo userspace. Es lo que define si Railway sirve.

## Fuentes

- [Railway: planes y límites](https://docs.railway.com/reference/pricing/plans)
- [Render: servicios gratuitos](https://render.com/docs/free)
- [Koyeb: precios](https://www.koyeb.com/pricing)
- [Tailscale: modo userspace](https://tailscale.com/kb/1107/userspace-networking)
- [Comparativa de planes gratis (septiembre 2026)](https://flaviocopes.com/hosting-free-tiers/)
- [Fly.io: precios 2026](https://temps.sh/blog/fly-io-pricing-2026)
- [Cloud Run: plan gratis](https://agentdeals.dev/vendor/google-cloud-run)
- [Oracle Cloud: recorte del plan gratis](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [Railway: plan gratis 2026](https://kuberns.com/blogs/railway-free-tier/)
