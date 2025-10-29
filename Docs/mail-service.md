# Mail Service

El Mail Service es el microservicio responsable de administrar y enviar las notificaciones por correo electrónico.

## Responsabilidades Principales

* **Consumo de Eventos:** Consume eventos publicados en Kafka por los servicios de autenticación y transacciones.
* **Gestión de Plantillas:** Selecciona la plantilla de correo correspondiente desde la base de datos.
* **Procesamiento de Datos:** Reemplaza los valores dinámicos (placeholders) en la plantilla con los datos del evento.
* **Envío de Correo:** Envía el correo procesado al destinatario.

## Gestión de Plantillas (API REST)

El servicio expone una API REST que permite la gestión completa (CRUD) de las plantillas de correo.

* **Operaciones:** Crear, leer, actualizar y eliminar plantillas.
* **Estructura de Plantilla:**
    * `Asunto`: El título del correo.
    * `Cuerpo`: El contenido del correo, que incluye placeholders en formato `{{variable}}` para la inserción de datos dinámicos.

## Lógica de Envío (SMTP)

El comportamiento del envío se controla mediante variables de entorno, permitiendo alternar entre entornos de desarrollo (simulación) y producción (real) sin modificar el código.

### Modo Simulado (`ENABLE_SMTP=false`)

* Este es el modo por defecto o para entornos de desarrollo.
* El servicio **no** establece una conexión SMTP real.
* Los envíos se registran como simulados en la base de datos para fines de auditoría y depuración.

### Modo Real (`ENABLE_SMTP=true`)

* Utilizado en entornos de producción.
* Establece una conexión con el servidor SMTP definido en las variables de entorno.
* Envía el correo utilizando el remitente configurado.

## Registro y Auditoría

Todos los intentos de envío (tanto reales como simulados) se almacenan en la tabla `email_deliveries`.

**Campos de la tabla:**

* Destinatario
* Plantilla utilizada
* Estado del envío (ej. `SENT`, `FAILED`, `SIMULATED`)

## Variables de Entorno Clave

| Variable | Descripción |
| :--- | :--- |
| `ENABLE_SMTP` | Activa (`true`) o desactiva (`false`) la conexión con el servidor SMTP real. |
| `SMTP_HOST` | Host del servidor SMTP (ej. `smtp.example.com`). |
| `SMTP_PORT` | Puerto del servidor SMTP (ej. `587`). |
| `DEFAULT_FROM`| Dirección de correo del remitente por defecto (ej. `no-reply@example.com`). |