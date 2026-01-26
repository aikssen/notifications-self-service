# Notifications Self-Service Service

## Overview

The **Notifications Self-Service Service** is a client-facing API that allows consumers of the Notifications Platform to inspect notification events, review delivery attempts, and manually trigger replays for failed notifications.

This service provides **visibility and control** to clients without exposing internal dispatch, retry, or delivery mechanisms.

It is designed following **Hexagonal Architecture**, **DDD**, and **Clean Architecture** principles.

---

## Responsibilities

This service is responsible for:

- Listing notification events for a client
- Retrieving detailed information about a notification event
- Exposing delivery attempts and delivery results
- Allowing manual replay of failed notification events
- Publishing replay requests to Kafka

---

## High-Level Flow

1. Clients interact with the Self-Service API via HTTP
2. The service reads notification events and attempts from PostgreSQL
3. When a replay is requested:
   - The event is validated
   - The event state is updated to `RETRYING`
   - A replay message is published to Kafka
4. The Dispatch Service consumes the message and retries delivery

---

## API Endpoints

### GET /notification_events

Returns all notification events for the authenticated client.

---

### GET /notification_events/{notification_event_id}

Returns detailed information about a notification event, including all delivery attempts.

---

### POST /notification_events/{notification_event_id}/replay

Schedules a manual retry for a failed notification event.

Validation rules:
- The event must exist
- The event must belong to the requesting client
- The event must be in `FAILED` state

If valid, the event is marked as `RETRYING` and published to Kafka.

---

## Dependencies

This service depends on:

- PostgreSQL (shared database with Dispatch Service)
- Kafka (used to publish replay events)

Both services must be running before starting the Self-Service API.

---

## Configuration

Required environment variables:

- `PORT` – HTTP port (default: 3002)
- `DATABASE_URL` – PostgreSQL connection string
- `KAFKA_BROKERS` – Kafka broker list
- `KAFKA_CLIENT_ID` – Kafka client identifier
- `KAFKA_TOPIC` – Kafka topic for notification dispatch

---

## Running Locally

1. Start PostgreSQL and Kafka (via docker-compose or local setup)
2. Configure environment variables
3. Install dependencies
4. Start the service in development mode

The service will be available at:

- `http://localhost:3002`

---

## Relationship with Other Services

This service works together with:

- **Notifications Dispatch Service**
  - Consumes replay events from Kafka
  - Handles webhook delivery and retry logic

- **Subscriptions Service**
  - Manages webhook subscriptions
  - Resolves subscriptions during dispatch

---

## Design Notes

- This service **does not send webhooks**
- This service **does not perform retries**
- This service **does not mutate delivery attempts**
- All delivery logic lives in the Dispatch Service

The Self-Service API is intentionally read-heavy and command-light.

---

## License

Internal project – for evaluation and technical demonstration purposes only.