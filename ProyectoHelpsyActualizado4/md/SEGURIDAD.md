# Estado de requisitos de seguridad

Evaluación del prototipo actual. La aplicación es estática y no tiene backend: las cuentas, las sesiones y los datos operativos se simulan en el navegador. Los controles del cliente pueden alterarse desde DevTools o modificando el almacenamiento local; por tanto, no equivalen a controles de seguridad de producción.

| Requisito | Estado actual | Evidencia y brecha |
| --- | --- | --- |
| RNF-01 · HTTPS/TLS 1.2+ | Pendiente de infraestructura | No hay configuración de servidor, proxy ni despliegue en el repositorio. HTTPS y la versión TLS se configuran en el punto de terminación TLS, no en HTML/JavaScript. |
| RNF-02 · Hash bcrypt o Argon2 | No cumple | [js/common.js](js/common.js) calcula SHA-256 sin salt para contraseñas. Las credenciales de demostración y sus hashes están en [js/data.js](js/data.js) y las contraseñas de demostración se muestran en [js/login.js](js/login.js). El hash y la verificación deben trasladarse al servidor; retirar las cuentas demo antes de producción. |
| RNF-03 · Cifrado AES-256 en reposo y claves externas | No cumple | [js/common.js](js/common.js) cifra algunas notas con AES-GCM, pero deriva la clave en el navegador a partir de la cédula y una sal fija. Otros datos sensibles, consentimientos y cuentas se guardan en `localStorage` sin cifrar. Se requiere almacenamiento de servidor y gestión de claves fuera del código, por ejemplo KMS/secret manager. |
| RNF-04 · Sesión ≤ 1 h e inactividad 30 min | Parcial, solo simulación | [js/data.js](js/data.js) aplica ambos tiempos con `sessionStorage` y el reloj del cliente. El usuario puede alterar esos valores; no hay token validado por un servidor. |
| RNF-05 · Autorización servidor por rol y relación | No cumple | Las comprobaciones de rol y relación están en JavaScript y los datos viven en el cliente. No existe servidor que proteja las consultas; un usuario puede modificar el estado local o invocar funciones desde la consola. |
| RNF-06 · Bloqueo tras 5 intentos | Parcial, solo simulación | [js/data.js](js/data.js) cuenta cinco fallos y bloquea temporalmente usando `localStorage`. El contador y el bloqueo se pueden editar o borrar desde el navegador; debe aplicarse con límites/rate limiting del servidor. |
| RNF-07 · Revisión OWASP por entrega | Pendiente de proceso | No se encontró pipeline, configuración de escaneo ni checklist de seguridad. No se ejecutó un escaneo OWASP en esta revisión, así que no se puede afirmar que haya cero vulnerabilidades críticas. |
| RNF-08 · Video DTLS-SRTP y sin grabación por defecto | No implementado | [js/videollamada.js](js/videollamada.js) simula cámara y micrófono; no integra WebRTC ni un proveedor de video. No se observó grabación en el flujo actual. La protección DTLS-SRTP debe confirmarse con el proveedor seleccionado. |

## Bloqueos para cerrar los requisitos

1. Definir backend, base de datos y despliegue. Aplicar HTTPS/TLS 1.2+, HSTS y configuración segura en el servidor.
2. Mover autenticación, hash de contraseñas, sesiones, bloqueo y autorización por relación al servidor. Usar bcrypt o Argon2id con salt generado por la biblioteca; no distribuir credenciales demo en el cliente.
3. Guardar datos sensibles en el backend con cifrado en reposo y claves administradas fuera del repositorio. Revisar también copias de seguridad, registros y consentimientos.
4. Elegir un proveedor de videollamada y verificar por contrato/configuración DTLS-SRTP y que la grabación esté desactivada por defecto.
5. Añadir pruebas de autorización y sesión, escaneo de dependencias/código y una checklist OWASP al proceso de entrega. Registrar resultados y corregir cualquier hallazgo crítico antes de desplegar.

## Verificación realizada

- Inspección de las rutas de autenticación, almacenamiento, sesión, cifrado y videollamada del cliente.
- Búsqueda de manifiestos, servidor y configuración de despliegue; no se encontraron en el workspace.
- No se ejecutó un escaneo OWASP ni pruebas funcionales de autorización contra un servidor, porque no existe backend configurado.