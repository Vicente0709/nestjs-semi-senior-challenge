# Despliegue con Docker Compose

El despliegue se realiza íntegramente con Docker Compose, levantando los servicios de infraestructura y los microservicios de aplicación en una misma red interna.

---

## 1. Infraestructura (Kafka y Zookeeper)

El arranque de la infraestructura sigue un orden de dependencia:

1.  **Zookeeper:** Actúa como coordinador para Kafka. Se inicia primero y escucha en el puerto `2181` del host.
2.  **Kafka (Broker):** Se levanta después de Zookeeper y se configura con dos listeners:
    * **Interno (Contenedores):** `PLAINTEXT` en `kafka:9092`. Usado por los microservicios dentro de la red de Compose.
    * **Externo (Host):** `PLAINTEXT_HOST` en `localhost:29092`. Usado para administración desde la máquina anfitriona.

La variable de entorno para los microservicios se establece como `KAFKA_BROKER=kafka:9092`.

### Tópicos de Kafka

Una vez que Kafka está en pie, se crean o verifican los siguientes tópicos, que actúan como canales de difusión:

* `auth`
* `transactions`

---

## 2. Persistencia de Datos (PostgreSQL)

Se utilizan dos bases de datos PostgreSQL independientes, cada una con su propio volumen persistente para conservar los datos (plantillas y registros de entregas) incluso si se reconstruyen los contenedores.

| Servicio | Base de Datos | Puerto (Host -> Contenedor) | Volumen Persistente |
| :--- | :--- | :--- | :--- |
| Mail Service | `mail_db` | `5435:5432` | `mail_data` |
| Notification Service | `notifications_db` | `5436:5432` | `notifications_data` |

La inicialización de estos contenedores se gestiona con las variables `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD` definidas en el `docker-compose.yml`.

---

## 3. Microservicios de Aplicación

Se despliegan cuatro microservicios de aplicación, construidos desde sus Dockerfiles usando *multi-stage builds* para generar imágenes ligeras.

| Servicio | Puerto (Host) | Rol | Tópicos Kafka (Uso) |
| :--- | :--- | :--- | :--- |
| **auth-service** | `3001` | Productor (Publisher) | Publica en `auth` |
| **transaction-service**| `3002` | Productor (Publisher) | Publica en `transactions` |
| **mail-service** | `3003` | Consumidor (Consumer) | Consume de `auth` y `transactions` |
| **notification-service**| `3004` | Consumidor (Consumer) | Consume de `auth` y `transactions` |

### Configuración de Microservicios

Cada servicio obtiene su configuración de variables de entorno inyectadas desde Docker Compose:

* `KAFKA_BROKER=kafka:9092`
* `AUTH_TOPIC=auth`
* `TRANSACTIONS_TOPIC=transactions`
* Credenciales de Base de Datos (para `mail-service` y `notification-service`):
    * `DATABASE_HOST`
    * `DATABASE_PORT`
    * `DATABASE_USER`
    * `DATABASE_PASSWORD`
    * `DATABASE_NAME`

### Configuración Específica: Mail Service

El `mail-service` tiene una lógica de envío configurable:

* **`ENABLE_SMTP=false` (Default/Simulado):** No se conecta a un servidor SMTP. Realiza un envío simulado y registra el resultado en la tabla `email_deliveries`.
* **`ENABLE_SMTP=true` (Real):** Se conecta al servidor SMTP definido en `SMTP_HOST` y `SMTP_PORT` (ej. Mailpit en `1025`). Usa `DEFAULT_FROM` como remitente.

---

## 4. Ciclo de Vida y Verificación del Despliegue

### Comandos de Despliegue

1.  **Construir e Iniciar:**
    ```bash
    docker compose build --no-cache
    docker compose up -d
    ```

2.  **Verificar Estado General:**
    ```bash
    docker compose ps
    ```

3.  **Verificar Tópicos de Kafka (ejecutar dentro del contenedor de Kafka):**
    ```bash
    kafka-topics --bootstrap-server localhost:9092 --list
    ```
    *Salida esperada: `auth`, `transactions`*

4.  **Monitorear Logs (Flujo de eventos):**
    ```bash
    docker compose logs -f auth-service transaction-service mail-service notification-service
    ```
    *Se deben observar los productores publicando y los consumidores procesando.*

### Acceso a Endpoints

* **API:** Los servicios están expuestos en los puertos `3001` a `3004` del host.
* **Swagger (Documentación):** Si está habilitado, la UI de Swagger está disponible en `/docs`.
    * Mail Service: `http://localhost:3003/docs`
    * Notification Service: `http://localhost:3004/docs`

---

## 5. Mantenimiento y Limpieza

* **Reinicio Limpio (Reconstrucción):**
    Detiene y elimina contenedores, redes y volúmenes efímeros. Útil si se cambió el código fuente o las dependencias.
    ```bash
    docker compose down -v
    docker compose up -d --build
    ```

* **Limpieza Profunda del Host:**
    Elimina recursos de Docker no utilizados (imágenes, capas y volúmenes huérfanos).
    ```bash
    docker system prune -a
    docker volume prune
    ```