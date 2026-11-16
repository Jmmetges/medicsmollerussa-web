# Área privada de profesionales — Mèdics Mollerussa

Área donde cada profesional que da servicio en Mèdics Mollerussa:

- **Edita su ficha para la web**: nombre, título (catalán y castellano), número de colegiado, presentación, idiomas, horario, mutuas, servicios y foto. Los cambios **no se publican hasta que dirección los aprueba**.
- **Descarga documentos internos** que sube dirección: protocolos, circulares, formularios…

Dirección (los correos de `ADMIN_EMAILS`) además:

- **Aprueba o rechaza** los cambios de las fichas, viendo lado a lado lo que hay ahora en la web y lo que se propone. Si los rechaza, puede indicar un motivo que verá el profesional.
- **Da de alta y de baja** a los profesionales, y decide si cada uno se ve en la web y si tiene agenda online.
- **Sube y borra documentos.**

Para entrar no hace falta contraseña. El profesional pone su correo y recibe un código de un solo uso (Cloudflare Access). Solo entran los correos dados de alta por dirección.

> El área de profesionales **no guarda datos de pacientes**. No subáis documentos con datos de pacientes.

## Cómo funciona

| Pieza | Para qué |
|---|---|
| Cloudflare Worker (`src/`) | La aplicación del área |
| Cloudflare Access | Controla quién entra (código por correo) |
| Cloudflare KV | Guarda las fichas, las fotos y los documentos |
| GitHub Actions (`.github/workflows/area.yml`) | Publica el área cada vez que cambia el código |

Las fichas aprobadas y marcadas como «visibles» se publican en
`https://<dirección-del-área>/public/professionals.json`, y la web pública las podrá leer para mostrar el cuadro médico.

## Puesta en marcha (una sola vez, unos 20 minutos)

### 1. Cuenta de Cloudflare
1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up> con el correo del centro.
2. Copia el **Account ID**: aparece en **Workers & Pages**, en la columna de la derecha.

### 2. Almacenamiento (KV)
1. **Storage & Databases → Workers KV → Create a namespace**. Nombre: `area-professionals`.
2. Copia su **ID**.

### 3. Token para que GitHub pueda publicar
1. **My Profile → API Tokens → Create Token → plantilla «Edit Cloudflare Workers»**.
2. En *Account Resources* elige vuestra cuenta. Crea el token y **cópialo**: solo se muestra una vez.

### 4. Datos en GitHub
En el repositorio, **Settings → Secrets and variables → Actions**:

- Pestaña **Secrets**:
  - `CLOUDFLARE_API_TOKEN` → el token del paso 3
  - `CLOUDFLARE_ACCOUNT_ID` → el Account ID del paso 1
- Pestaña **Variables**:
  - `KV_ID` → el ID del paso 2
  - `ADMIN_EMAILS` → correos de dirección separados por comas (p. ej. `jmmetges@jmmetges.com`)
  - `ACCESS_TEAM` y `ACCESS_AUD` → los pondrás en el paso 6

### 5. Primera publicación
**Actions → «Desplega l'àrea de professionals» → Run workflow**. Al terminar, el área estará en
`https://area-medics-mollerussa.<vuestro-subdominio>.workers.dev`. De momento responderá «Accés no autoritzat»: es correcto, porque falta el paso 6.

### 6. Control de acceso (Cloudflare Access)
1. En **Workers & Pages → area-medics-mollerussa → Settings → Domains & Routes**, en la fila de *workers.dev*, activa **Cloudflare Access**. Cloudflare te pedirá elegir un nombre de equipo (*team name*): ese nombre es `ACCESS_TEAM`.
2. Ve a **Zero Trust → Access → Applications** y abre la aplicación creada:
   - En **Overview**, copia el **Application Audience (AUD) Tag**: es `ACCESS_AUD`.
   - En **Policies**, deja una regla **Allow** con *Include → Everyone*. Así cualquier correo puede pedir el código, pero solo entran los que dirección ha dado de alta dentro del área.
   - En **Login methods**, deja activado **One-time PIN**.
3. Crea **otra aplicación** (*Add an application → Self-hosted*) para la misma dirección con la ruta `public`, con una regla **Bypass → Everyone**. Así la web pública puede leer el cuadro médico aprobado.
4. Pon `ACCESS_TEAM` y `ACCESS_AUD` en las **Variables** de GitHub y vuelve a ejecutar el workflow (paso 5).

### 7. Prueba
1. Entra en la dirección del área con un correo de `ADMIN_EMAILS`. Recibirás un código por correo.
2. En **Professionals**, da de alta a un profesional con su correo.
3. El profesional entra con su correo, rellena la ficha y la envía.
4. Dirección la ve en **Per aprovar** y la aprueba. Marca «Visible a la web» si debe salir en el cuadro médico.

## Consentimiento informado de pacientes

Las páginas `consentiment-informat.html` y `es/consentimiento-informado.html` de la web envían el formulario a esta misma área (`/public/consentiment`). Cada envío:

- **Se registra** con la fecha y la hora, la versión del texto aceptado, la IP y el navegador. Dirección lo ve en la pestaña **Consentiments** y lo puede exportar a Excel (CSV).
- **Se envía por correo** al centro, y una copia al paciente o a su tutor, a través de **Brevo** (proveedor de correo europeo, gratuito hasta 300 correos al día).
- Si el paciente es **menor de 16 años** (según la fecha de nacimiento), firma el padre, la madre o el tutor legal. El límite se cambia en `EDAT_MAJOR` (aquí y en `assets/consentiment.js`).

Configuración, además de lo anterior:
1. Crea una cuenta en <https://www.brevo.com>, verifica el remitente (p. ej. `no-reply@medicsmollerussa.com` o el correo del centro) y crea una **API key** (*SMTP & API → API Keys*).
2. En GitHub: secreto `BREVO_API_KEY`; variables `CONSENT_TO` (correo del centro que recibe los consentimientos) y `CONSENT_FROM` (remitente verificado en Brevo).
3. En `assets/consentiment.js`, pon en `ENDPOINT` la dirección del área + `/public/consentiment`.
4. **Antes de publicar:** sustituye el texto provisional por el que facilite el delegado de protección de datos (DPD), crea las páginas de política de privacidad (`politica-privacitat.html` y `es/politica-privacidad.html`) y cambia `data-versio` del formulario cada vez que cambie el texto.

Sin `BREVO_API_KEY`, los consentimientos se siguen registrando, pero no se envía ningún correo.

## Más adelante
- **Dirección propia** (p. ej. `area.medicsmollerussa.com`): requiere gestionar los DNS del dominio en Cloudflare en lugar de en dinahosting.
- **Cuadro médico en la web**: mostrar en medicsmollerussa.com los profesionales aprobados a partir de `/public/professionals.json`.
- **Área de pacientes**: depende de la API de Infomed (citas, resultados). Va aparte y con requisitos de seguridad más estrictos, porque son datos de salud.

## Desarrollo
```
cd area
npm test     # pruebas de la API y de la verificación del acceso
```
