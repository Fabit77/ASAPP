# ASAPP

**Colecciona los asados que viviste.**

ASAPP reúne recuerdos de encuentros reales. Un organizador publica un asado, comparte un QR o una palabra secreta y cada invitado lo guarda en su colección personal. Este MVP es una aplicación Web2: no requiere billeteras ni transacciones externas.

## Inicio rápido

Requiere Node.js **22.13+** (recomendado 24 LTS) y npm.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:3000. Sin `DATABASE_URL`, el entorno de desarrollo usa PostgreSQL embebido con PGlite, persiste en `.data/postgres` y crea datos de ejemplo automáticamente. No necesitas Docker ni una cuenta externa para recorrer el producto.

En `/login` puedes entrar como Fabio (organizador con recuerdos) o como un nuevo coleccionista (colección inicialmente vacía). La palabra de los asados del seed es **sobremesa**. Los códigos QR son aleatorios: obtén uno desde Studio. Los cambios realizados en la demo persisten entre reinicios.

El acceso de desarrollo está deshabilitado con `NODE_ENV=production`, en Vercel, cuando existe `DATABASE_URL` o cuando `ASAPP_LOCAL_DEMO=false`. Una preview pública puede activar explícitamente `ASAPP_HOSTED_DEMO=true`: usa PostgreSQL en memoria, datos ficticios y puede reiniciarse entre solicitudes o despliegues. Nunca debe usarse con datos reales.

## Qué incluye

- Landing, acceso por email, colección circular con búsqueda y filtros, exploración, detalle de recuerdos y perfil público configurable.
- Reclamo por QR o palabra secreta, retorno al reclamo después de iniciar sesión, animación de éxito y prevención de duplicados.
- Organizaciones y roles OWNER / ADMIN / EDITOR / VIEWER.
- Studio: crear y editar asados, subir imágenes, guardar borradores, publicar, pausar, reanudar, duplicar, archivar y descargar QR PNG.
- Crear/editar colecciones, ordenar sus asados y consultar progreso real.
- Participantes limitados a la organización y estadísticas calculadas desde las reclamaciones.
- Datos reproducibles: 20 usuarios, 2 organizaciones, 3 colecciones, 10 asados y 40 reclamaciones.

## Arquitectura

```text
apps/web/                 Next.js App Router: consumidor, Studio y endpoints
  src/app/                Rutas y Server Components
  src/components/         Interacciones, formularios, navegación
  src/lib/                Sesión Supabase y Server Actions
packages/core/src/        Servicios de dominio, validación, permisos y seguridad
packages/database/src/    Adaptadores PostgreSQL/PGlite y seed
packages/database/migrations/  Esquema versionado
packages/ui/src/          Primitivas visuales y artworks circulares
scripts/                  Migraciones, seed y herramientas locales
tests/                    Integración del dominio sobre PostgreSQL real en WASM
docs/                     Plan y validación
```

La UI llama a `claimService.claimDrop()`, `collectionService.getUserCollection()` y `dropService.createDrop()` a través de adaptadores de servidor. Las pantallas no consultan tablas de propiedad. `createServices(database)` inyecta una interfaz pequeña de persistencia y permite sustituir la implementación del servicio sin reescribir la UI. La nomenclatura interna es Organization → Collection → Drop → Claim; el producto usa Organizador → Colección → Asado → Coleccionar.

Stack: Next.js 16.3.4, React 19.3, TypeScript, Tailwind CSS 4, PostgreSQL, Supabase Auth/Storage, Zod, postgres.js, PGlite, Sharp, QRCode y Vitest. Los controles accesibles nativos y las primitivas propias mantienen pequeño el sistema visual. Se usa Webpack para evitar una restricción de procesos/puertos de Turbopack en el entorno local.

## Configurar Supabase

1. Crea un proyecto Supabase.
2. Copia `.env.example` a `.env.local` en la raíz para las herramientas de base de datos y a `apps/web/.env.local` para Next.js. Completa ambos con los mismos valores. Los archivos están excluidos de Git.
3. Obtén la URL PostgreSQL del **transaction pooler**. `postgres.js` usa `prepare: false`, pool pequeño y SSL obligatorio por defecto.
4. Ejecuta `npm run db:migrate` con la cuenta propietaria de las tablas.
5. Activa el proveedor Email de Supabase Auth, configura Site URL y agrega `https://TU-DOMINIO/auth/callback` a las URLs de redirección permitidas.
6. Configura SMTP para entregar emails reales. La plantilla estándar de magic link funciona con el callback PKCE. Para ingresar OTP en el formulario, incluye también `{{ .Token }}` en la plantilla de email. El usuario puede utilizar el código en el dispositivo donde inició el flujo.
7. Crea un bucket **privado** llamado `artworks`. Las subidas y lecturas se realizan desde el servidor con `SUPABASE_SERVICE_ROLE_KEY`. No agregues políticas de escritura pública. Los artworks se sirven mediante IDs aleatorios a través de `/api/artwork/[id]`; son medios compartibles y no deben contener información confidencial.

Los usuarios de la aplicación se crean después de verificar la identidad con Supabase. El seed usa cuentas de ejemplo independientes de `auth.users`; no son cuentas reales de Supabase.

### Variables

| Variable                               | Uso                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | Conexión PostgreSQL del servidor; requerida en producción                                         |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto Supabase                                                                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable para Auth                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`            | Clave privada del servidor para Storage                                                           |
| `APP_URL`                              | Origen canónico, por ejemplo `https://asapp.example`; usado en QR, emails y validación de uploads |
| `ASAPP_LOCAL_DEMO`                     | `false` deshabilita la demo local                                                                 |
| `ASAPP_HOSTED_DEMO`                    | `true` activa una preview efímera con datos ficticios; omitir en producción real                  |
| `DATABASE_SSL`                         | Solo desarrollo PostgreSQL local: `false`; omitir en Supabase                                     |
| `ALLOW_DEMO_SEED`                      | Permite seed explícito si `NODE_ENV=production`; usar solo en staging                             |

Nunca agregues secretos al repositorio. El servidor no registra palabras secretas ni las devuelve al cliente.

## Migraciones y datos

```sh
npm run db:migrate
npm run db:seed
```

`db:migrate` registra la versión aplicada en `schema_migrations`. Ejecuta una sola instancia de la herramienta durante el despliegue. El seed es idempotente para una base vacía: si ya existen usuarios, no modifica datos reales. Las tablas tienen RLS activado sin políticas de acceso del cliente; únicamente el repositorio de servidor, con la cuenta propietaria, las consulta. No uses la clave publicable para consultar directamente tablas de la aplicación.

```sh
npm run db:reset                     # SOLO base PGlite de demo
npm run dev:tools -- user
npm run dev:tools -- organization "Mi mesa"
npm run dev:tools -- drop "Mi asado"
npm run dev:tools -- qr UUID_DEL_ASADO
npm run dev:tools -- claim CODIGO_QR
```

Detén el servidor antes de usar herramientas sobre el mismo directorio PGlite: una única instancia debe abrir la base embebida. Estas herramientas rechazan bases remotas y producción.

## Seguridad y semántica de reclamo

- El servidor deriva la identidad de `auth.getUser()`; jamás confía en un ID o rol enviado por el cliente.
- Los administradores ven emails solo de coleccionistas de su organización. Editores y lectores no pueden consultarlos.
- El perfil es público por defecto, pero solo publica recuerdos de asados públicos. No expone emails. Un perfil privado devuelve 404.
- Los enlaces no listados y privados habilitan la vista previa de reclamo como credencial de acceso. Un usuario que lo posee puede reclamar; no constituyen una invitación individual. Nunca aparecen en Explorar o perfiles públicos.
- Cada reclamo bloquea la fila del drop (`FOR UPDATE`), revalida el método activo, verifica estado/cupo y escribe Claim + contador dentro de una única transacción. `UNIQUE(user_id, drop_id)` refuerza la unicidad.
- QR: 192 bits de aleatoriedad criptográfica. Palabras: scrypt con sal independiente, comparación de tiempo constante, normalización NFKC, sin distinción de mayúsculas.
- Intentos de palabra limitados por usuario y asado, además de un límite por cuenta, con contador persistente PostgreSQL. Auth también aplica límites y Supabase añade sus protecciones. Las ventanas duran 15 minutos.
- Subidas limitadas a JPG/PNG/WebP cuadrados y 5 MB, decodificadas con límite de píxeles, reescaladas y recodificadas a WebP sin metadatos.
- La fecha del asado describe el encuentro, no expira automáticamente el reclamo. Publicar habilita reclamos; pausar, archivar o finalizar los deshabilita. El horario del editor corresponde a America/Santiago, con conversión por reglas IANA.

## Verificación

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm audit
```

Las pruebas verifican reclamos, duplicados entre métodos, contención concurrente, cupo 17/18, estados inactivos, palabra y hash, rate limiting persistente, resolución QR, permisos, aislamiento entre organizaciones, privacidad, estadísticas y progreso 3/8. PGlite ejecuta el mismo SQL PostgreSQL que el adaptador de producción.

Ver `docs/VALIDATION.md` para comprobaciones de interfaz y límites de la validación realizada.

## Desplegar en Vercel

1. Importa `Fabit77/ASAPP` en Vercel.
2. Selecciona **Root Directory: `apps/web`** y framework Next.js. Activa la inclusión de archivos fuera del directorio raíz (monorepo).
3. Selecciona Node.js 24.x. Usa instalación `npm install` y build `npm run build` desde ese root; npm resuelve los workspaces y el lockfile superior.
4. Agrega las cinco variables de producción indicadas arriba y `ASAPP_LOCAL_DEMO=false` al entorno correspondiente.
5. Ejecuta la migración contra el proyecto Supabase elegido antes de servir tráfico.
6. Ajusta `APP_URL`, Site URL y redirect URLs de Supabase al dominio definitivo y vuelve a desplegar.
7. Prueba con dos cuentas reales: crear/publicar un asado, abrir el QR desde otro dispositivo, iniciar sesión, coleccionar y confirmar el participante en Studio.

No copies `.data`, los datos de demo ni archivos `.env` al despliegue. El build no conecta a la base ni requiere credenciales; las rutas de datos son dinámicas y sí las requieren al atender solicitudes.

## Evolución del protocolo

Los campos `external_ownership_id`, `external_transaction_id`, `external_network` y `external_address` están presentes y permanecen nulos. Una futura integración Stellar puede implementar el servicio de claims/ownership y un outbox transaccional para un relayer, manteniendo el mismo contrato hacia la UI. No hay SDK, contratos ni relayer implementados. No se afirma que una transacción de red externa pueda formar parte de una transacción SQL; ese cambio requerirá estados de sincronización e idempotencia del backend.

No se implementan GPS, recompensas, puntos ni desbloqueos condicionados en esta versión.
