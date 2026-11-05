# Gaveta de efectivo POS

La gaveta conectada por RJ11 a una impresora térmica se abre con un pulso
ESC/POS enviado **a la impresora**, no desde el navegador. Por ello Clienty
usa un puente POS local en el equipo de caja.

## Regla de negocio

- La orden se solicita únicamente después de registrar la venta.
- Se solicita si la venta tiene un pago `CASH`, incluso cuando se combinan
  medios de pago.
- Yape/Plin, transferencia y tarjeta nunca generan la orden.
- Si la impresora o el puente no responden, la venta ya confirmada no se
  revierte ni se bloquea.

## Contrato del puente local

Configura el frontend en el equipo de caja:

```env
VITE_POS_DRAWER_ENABLED="true"
VITE_POS_DRAWER_BRIDGE_URL="http://127.0.0.1:9415/api/v1/cash-drawer/open"
```

El puente debe escuchar solamente en `127.0.0.1`, aceptar `POST` con CORS para
la URL de Clienty y responder `2xx` cuando haya enviado correctamente el pulso.

```json
{
  "saleId": "uuid",
  "saleNumber": "V-000001",
  "reason": "cash-payment"
}
```

El puente es el único componente con acceso al driver de Windows. También recibe
el ticket que Clienty ya renderizó, lo imprime en RAW ESC/POS y aplica el corte
sin pasar por el diálogo de impresión del navegador. No se debe exponer ni
desplegar en Render.
