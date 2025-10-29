# 1. Arquitectura General del Sistema

El sistema implementa una arquitectura de **microservicios** desarrollada con **NestJS**, **Kafka** y **PostgreSQL**, desplegada mediante **Docker Compose**.  
El objetivo principal es simular un flujo de notificaciones bancarias que cubre eventos de transacciones, autenticaciones e incluso códigos de verificación (OTP), enviando las notificaciones correspondientes por correo electrónico o canales móviles.

Cada microservicio se ejecuta de forma aislada y se comunica con los demás de manera **asíncrona** a través de Kafka, utilizando tópicos diferenciados según el tipo de evento.

---

## 1.1 Componentes Principales

| Servicio | Rol principal | Tipo de comunicación | Puerto | Base de datos |
|-----------|----------------|----------------------|---------|----------------|
| **auth-service** | Publica eventos de inicio de sesión y códigos OTP (One-Time Password) | Productor Kafka | 3001 | — |
| **transaction-service** | Publica eventos de transacciones bancarias (DEPOSIT, DEBIT) | Productor Kafka | 3002 | — |
| **mail-service** | Consume eventos de autenticación y transacciones para renderizar plantillas y enviar correos | Consumidor Kafka | 3003 | `mail_db` |
| **notification-service** | Consume eventos con canal `sms` o `whatsapp` y simula notificaciones móviles | Consumidor Kafka | 3004 | `notifications_db` |

---

## 1.2 Flujo General de Información

El flujo de datos entre servicios sigue el patrón **event-driven** (basado en eventos), donde los servicios emisores publican mensajes JSON en Kafka y los receptores los procesan según su naturaleza.

```text
[transaction-service] ──► topic: transactions ──► [mail-service]
                                              └──► [notification-service]

[auth-service] ──► topic: auth ──► [mail-service]
                                └──► [notification-service]


transaction-service: emite eventos cada 5 segundos con información de depósitos y retiros simulados.
auth-service: emite eventos cada 8 segundos para inicios de sesión y cada 15 segundos para códigos OTP con canal sms o whatsapp.
mail-service: escucha ambos tópicos (auth y transactions) y genera correos electrónicos basados en plantillas.
notification-service: escucha los mismos tópicos, pero solo procesa los eventos que contienen channel.                                