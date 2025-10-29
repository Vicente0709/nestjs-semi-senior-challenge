# Notification Service

El Notification Service es el microservicio encargado de procesar y simular el envío de eventos de notificación móvil.

## Responsabilidades Principales

* **Consumo de Eventos:** Escucha tópicos de Kafka y filtra los mensajes que contienen un campo `channel`.
* **Filtrado de Canal:** Identifica si la notificación debe ser enviada por `SMS` o `WhatsApp`.
* **Gestión de Plantillas:** Selecciona la plantilla correspondiente al canal desde la base de datos.
* **Procesamiento de Datos:** Reemplaza los valores dinámicos en el cuerpo del mensaje.
* **Simulación de Envío:** Simula el envío al canal indicado (SMS o WhatsApp).

## Gestión de Plantillas (API REST)

Provee una API REST para la gestión (CRUD) de las plantillas de mensajes prediseñados para los distintos canales.

* **Operaciones:** Crear, consultar, modificar o eliminar plantillas.
* **Plantillas Comunes:**
    * `otp-sms` (Códigos de seguridad por SMS)
    * `otp-whatsapp` (Códigos de seguridad por WhatsApp)
    * `login-sms` (Notificación de inicio de sesión)
    * `transaction-sms` (Notificación de movimientos financieros)

## Registro de Notificaciones

Mantiene un registro detallado de todas las notificaciones procesadas, independientemente de su estado.

**Información Almacenada:**

* Destinatario
* Plantilla utilizada
* Datos del evento original
* Estado de entrega

**Estados de Entrega Posibles:**

| Estado | Descripción |
| :--- | :--- |
| `SENT` | El mensaje fue procesado y simulado exitosamente. |
| `FAILED` | Ocurrió un error durante el procesamiento. |
| `QUEUED` | El mensaje está en cola para ser procesado. |

## Arquitectura

El servicio opera de forma autónoma y desacoplada del resto del sistema. Esto garantiza que la lógica de comunicación de cada canal (SMS, WhatsApp) pueda escalarse o modificarse individualmente sin afectar el funcionamiento global