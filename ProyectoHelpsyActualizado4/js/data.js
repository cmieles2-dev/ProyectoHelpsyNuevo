/**
 * Datos de demostración para el avance de Helpsy.
 * No hay backend todavía: todo esto vive en el navegador
 * (localStorage) para simular persistencia entre páginas.
 */

const HelpsyData = (() => {

    const CLAVE_USUARIOS = "helpsyUsuarios";
    const CLAVE_PSICOLOGOS = "helpsyPsicologos";
    const CLAVE_SESION = "helpsySesion";
    const CLAVE_INTENTOS_LOGIN = "helpsyIntentosLogin";
    const CLAVE_TOKENS_CUENTA = "helpsyTokensCuenta";

    // RF-03 / RNF-04: el token de sesión expira a la hora de creado.
    const DURACION_SESION_MS = 60 * 60 * 1000;

    // RF-04 / RNF-04: la sesión se cierra sola tras 30 min sin actividad.
    const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000;

    // RNF-06: tras 5 intentos fallidos, la cuenta queda bloqueada
    // temporalmente (15 minutos) antes de poder volver a intentar.
    const MAX_INTENTOS_LOGIN = 5;
    const TIEMPO_BLOQUEO_MS = 15 * 60 * 1000;
    const CLAVE_CARGAS = "helpsyCargas";
    const CLAVE_REPORTES = "helpsyReportesGenerados";
    const CLAVE_CITAS = "helpsyCitas";
    const CLAVE_POLITICA_CITAS = "helpsyPoliticaCitas";
    const CLAVE_DIARIO = "helpsyDiario";
    const CLAVE_SEGUIMIENTOS = "helpsySeguimientos";
    const CLAVE_TAREAS = "helpsyTareas";
    const CLAVE_CUESTIONARIO = "helpsyCuestionario";
    const CLAVE_NOTIFICACIONES = "helpsyNotificaciones";
    const CLAVE_ALERTAS_RIESGO = "helpsyAlertasRiesgo";
    const CLAVE_CATEGORIAS_ATENCION = "helpsyCategoriasAtencion";
    const CLAVE_CATEGORIAS_ATENCION_INACTIVAS = "helpsyCategoriasAtencionInactivas";
    const MENSAJES_MOTIVACIONALES = [
        "Un paso pequeño hoy sigue siendo un paso.",
        "No tienes que sentirte bien para hacer las cosas bien.",
        "Está bien tener un día difícil. Mañana es otro intento.",
        "Pedir ayuda no es debilidad, es una decisión inteligente.",
        "Tu progreso no tiene que ser una línea recta hacia arriba.",
        "Respira. Estás haciendo lo que puedes con lo que tienes hoy.",
        "Cada sesión, cada registro en tu diario, suma — aunque no lo sientas.",
        "No compares tu capítulo 3 con el capítulo 20 de otra persona.",
        "Descansar también es parte de cuidarte.",
        "Lo que sientes es válido, incluso si no puedes explicarlo del todo.",
        "Hoy no tienes que resolverlo todo. Solo el siguiente paso.",
        "Eres más de lo que tu peor día dice de ti.",
        "Pequeños hábitos, sostenidos en el tiempo, cambian mucho.",
        "Estás aquí, intentando. Eso ya cuenta."
    ];

    function obtenerMensajeDelDia() {

        // Determinista: mismo mensaje todo el día, distinto cada día.
        const diasDesdeEpoca = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const indice = diasDesdeEpoca % MENSAJES_MOTIVACIONALES.length;

        return MENSAJES_MOTIVACIONALES[indice];

    }

    function buscarCuentaPorEmail(email) {

        const normalizado = email.trim().toLowerCase();
        const usuario = obtenerUsuarios().find((cuenta) => cuenta.email && cuenta.email.toLowerCase() === normalizado);

        if (usuario) return { tipo: "usuario", cuenta: usuario };

        const psicologo = obtenerPsicologos().find((cuenta) => cuenta.email && cuenta.email.toLowerCase() === normalizado);
        return psicologo ? { tipo: "psicologo", cuenta: psicologo } : null;

    }

    function actualizarCuenta(tipo, cedula, cambios) {

        const lista = tipo === "psicologo" ? obtenerPsicologos() : obtenerUsuarios();
        const indice = lista.findIndex((cuenta) => cuenta.cedula === cedula);

        if (indice === -1) return false;

        if (cambios.passwordHash && cambios.passwordHash !== lista[indice].passwordHash) {
            cambios = {
                ...cambios,
                versionCredenciales: (Number(lista[indice].versionCredenciales) || 0) + 1
            };
        }

        if (cambios.consentimiento) {
            const historialConsentimientos = lista[indice].historialConsentimientos ||
                (lista[indice].consentimiento ? [lista[indice].consentimiento] : []);
            cambios = {
                ...cambios,
                historialConsentimientos: [...historialConsentimientos, cambios.consentimiento]
            };
        }

        lista[indice] = { ...lista[indice], ...cambios };
        return tipo === "psicologo" ? guardarPsicologos(lista) : guardarUsuarios(lista);

    }

    function crearTokenCuenta(accion, tipo, cedula) {

        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");

        try {

            const tokens = JSON.parse(localStorage.getItem(CLAVE_TOKENS_CUENTA)) || [];
            const ahora = Date.now();

            const vigentes = tokens.filter((registro) =>
                !(registro.accion === accion && registro.tipo === tipo && registro.cedula === cedula)
            );
            vigentes.push({ token, accion, tipo, cedula, creadoEn: ahora, expiraEn: ahora + 15 * 60 * 1000 });
            localStorage.setItem(CLAVE_TOKENS_CUENTA, JSON.stringify(vigentes));
            return token;

        } catch (error) {
            console.error("No se pudo crear el enlace temporal:", error);
            return null;
        }

    }

    function obtenerTokenCuenta(token, accion) {

        try {

            const tokens = JSON.parse(localStorage.getItem(CLAVE_TOKENS_CUENTA)) || [];
            const ahora = Date.now();
            const vigentes = tokens.filter((registro) => registro.expiraEn > ahora);
            localStorage.setItem(CLAVE_TOKENS_CUENTA, JSON.stringify(vigentes));

            return vigentes.find((registro) => registro.token === token && registro.accion === accion) || null;

        } catch (error) {
            console.error("No se pudo validar el enlace temporal:", error);
            return null;
        }

    }

    function consumirTokenCuenta(token) {

        try {

            const tokens = JSON.parse(localStorage.getItem(CLAVE_TOKENS_CUENTA)) || [];
            localStorage.setItem(
                CLAVE_TOKENS_CUENTA,
                JSON.stringify(tokens.filter((registro) => registro.token !== token))
            );
            return true;

        } catch (error) {
            console.error("No se pudo consumir el enlace temporal:", error);
            return false;
        }

    }

    const CLAVE_PREFERENCIAS = "helpsyPreferencias";
    const CLAVE_PAGOS = "helpsyPagos";
    const CLAVE_ACTIVIDAD = "helpsyActividad";
    const CLAVE_TALLERES = "helpsyTalleres";
    const CLAVE_MENORES = "helpsyMenores";
    const CLAVE_AUDITORIA = "helpsyAuditoria";
    const ZONA_HORARIA = "America/Bogota";

    function fechaBogotaISO(fecha = new Date()) {

        const partes = new Intl.DateTimeFormat("en-CA", {
            timeZone: ZONA_HORARIA,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(fecha);
        const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
        return `${valores.year}-${valores.month}-${valores.day}`;

    }

    function sumarDiasFechaISO(fechaISO, dias) {

        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias, 12));
        return [fecha.getUTCFullYear(), String(fecha.getUTCMonth() + 1).padStart(2, "0"), String(fecha.getUTCDate()).padStart(2, "0")].join("-");

    }

    function formatearFechaBogota(valor, incluirHora = false) {

        if (!valor) return "";

        const opcionesFecha = {
            timeZone: ZONA_HORARIA,
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        };
        const opciones = incluirHora
            ? { ...opcionesFecha, hour: "2-digit", minute: "2-digit" }
            : opcionesFecha;
        const formatoFecha = new Intl.DateTimeFormat("es-CO", opcionesFecha);
        const formato = new Intl.DateTimeFormat("es-CO", opciones);
        const fechaAnterior = typeof valor === "string"
            ? valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(.*))?$/)
            : null;

        if (fechaAnterior) {
            const fecha = new Date(Date.UTC(Number(fechaAnterior[3]), Number(fechaAnterior[2]) - 1, Number(fechaAnterior[1]), 12));
            const fechaFormateada = formatoFecha.format(fecha);
            return incluirHora && fechaAnterior[4] ? `${fechaFormateada}, ${fechaAnterior[4]}` : fechaFormateada;
        }

        const fecha = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
            ? new Date(`${valor}T12:00:00.000Z`)
            : new Date(valor);
        if (Number.isNaN(fecha.getTime())) return String(valor);

        return formato.format(fecha);

    }

    function fechaHoraBogota(fechaISO, hora, minuto) {
        return new Date(`${fechaISO}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00-05:00`);
    }

    // RF-10 / RNF-11: versión vigente del texto de consentimiento
    // informado y de la autorización de tratamiento de datos. Si el
    // texto legal cambia, se sube este número — así queda registrado
    // exactamente qué versión aceptó cada persona, no solo que "aceptó".
    const VERSION_CONSENTIMIENTO = "2.0";
    const VERSION_AVISO_CONFIDENCIALIDAD = "1.0";

    function registrarActividad(tipo, descripcion) {

        try {

            const registros = JSON.parse(localStorage.getItem(CLAVE_ACTIVIDAD)) || [];

            registros.unshift({
                id: `act${Date.now()}${Math.floor(Math.random() * 1000)}`,
                tipo,
                descripcion,
                fecha: new Date().toISOString()
            });

            // Se limita a los últimos 200 para no inflar localStorage.
            localStorage.setItem(CLAVE_ACTIVIDAD, JSON.stringify(registros.slice(0, 200)));

        } catch (error) {

            console.error("No se pudo registrar actividad:", error);

        }

    }

    function obtenerActividad() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_ACTIVIDAD)) || [];
        } catch {
            return [];
        }

    }

    /* ------------------------------------------------------
       Copia de seguridad manual (equivalente honesto de
       "backups automáticos" sin un servidor que los programe).
    ------------------------------------------------------ */
    const CLAVES_RESPALDABLES = [
        "helpsyUsuarios", "helpsyPsicologos", "helpsyCitas", "helpsyDiario", "helpsyNotificaciones", "helpsyAlertasRiesgo", "helpsyCategoriasAtencion", "helpsyCategoriasAtencionInactivas",
        "helpsyTareas", "helpsyPagos", "helpsyCuestionario", "helpsySeguimientos", "helpsyReportesGenerados",
        "helpsyCargas", "helpsyPreferencias", "helpsyActividad"
    ];

    function generarCopiaSeguridad() {

        const copia = {};

        CLAVES_RESPALDABLES.forEach((clave) => {

            try {
                copia[clave] = JSON.parse(localStorage.getItem(clave)) || null;
            } catch {
                copia[clave] = null;
            }

        });

        return {
            generadoEl: new Date().toISOString(),
            version: 1,
            datos: copia
        };

    }

    function restaurarCopiaSeguridad(copia) {

        if (!copia || !copia.datos) {
            throw new Error("El archivo no tiene el formato esperado.");
        }

        Object.entries(copia.datos).forEach(([clave, valor]) => {

            if (CLAVES_RESPALDABLES.includes(clave) && valor !== null) {
                localStorage.setItem(clave, JSON.stringify(valor));
            }

        });

        return true;

    }

    function obtenerPreferencias(cedula) {

        try {

            const todas = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS)) || {};

            return todas[cedula] || {
                mensajesMotivacionales: true,
                notificacionesCorreo: false
            };

        } catch {

            return { mensajesMotivacionales: true, notificacionesCorreo: false };

        }

    }

    function guardarPreferencias(cedula, preferencias) {

        try {

            const todas = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS)) || {};
            todas[cedula] = preferencias;
            localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(todas));
            return true;

        } catch (error) {

            console.error(error);
            return false;

        }

    }

    function obtenerNotificaciones(destinatarioCedula) {

        try {
            const todas = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES)) || [];
            return todas
                .filter((notificacion) => notificacion.destinatarioCedula === destinatarioCedula)
                .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn));
        } catch {
            return [];
        }

    }

    function agregarNotificacion(notificacion) {

        try {
            const todas = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES)) || [];
            const existente = todas.find((registro) =>
                registro.destinatarioCedula === notificacion.destinatarioCedula &&
                registro.clave === notificacion.clave
            );
            if (existente) return existente;

            const nueva = {
                ...notificacion,
                id: notificacion.id || `n${Date.now()}${Math.floor(Math.random() * 1000)}`,
                creadaEn: notificacion.creadaEn || new Date().toISOString(),
                leida: false
            };
            todas.unshift(nueva);
            localStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(todas.slice(0, 1000)));
            return nueva;
        } catch (error) {
            console.error("No se pudo guardar la notificación:", error);
            return null;
        }

    }

    function marcarNotificacionLeida(id, destinatarioCedula) {

        try {
            const todas = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES)) || [];
            const notificacion = todas.find((registro) =>
                registro.id === id && registro.destinatarioCedula === destinatarioCedula
            );
            if (!notificacion) return false;
            notificacion.leida = true;
            localStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(todas));
            return true;
        } catch (error) {
            console.error("No se pudo actualizar la notificación:", error);
            return false;
        }

    }

    function obtenerAlertasRiesgo(pacienteCedula, especialistaCedula) {

        try {
            const todas = JSON.parse(localStorage.getItem(CLAVE_ALERTAS_RIESGO)) || [];
            return todas
                .filter((alerta) =>
                    (!pacienteCedula || alerta.pacienteCedula === pacienteCedula) &&
                    (!especialistaCedula || alerta.especialistaCedula === especialistaCedula)
                )
                .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn));
        } catch {
            return [];
        }

    }

    function agregarAlertaRiesgo(alerta) {

        try {
            const todas = JSON.parse(localStorage.getItem(CLAVE_ALERTAS_RIESGO)) || [];
            todas.unshift({ ...alerta, creadaEn: new Date().toISOString(), estado: "Abierta" });
            localStorage.setItem(CLAVE_ALERTAS_RIESGO, JSON.stringify(todas.slice(0, 500)));
            return true;
        } catch (error) {
            console.error("No se pudo guardar la alerta de riesgo:", error);
            return false;
        }

    }

    const CATEGORIAS_INDICADOR = [
        "Ansiedad", "Depresión", "Esquizofrenia", "Suicidio",
        "Trastornos", "Neuropsicología", "Psiquiatría", "Neurología"
    ];

    const INDICADORES_DISPONIBLES = [
        "Depresión", "Ansiedad", "Esquizofrenia", "Trastornos del ánimo"
    ];

    const NOMBRES_DEMO = [
        "Rimora Esmna", "Maria Chameranz", "Marina Anterez", "Maria Vimba",
        "Marva Harron", "Marina Marcie", "Maxia Lisaprez", "Maria Maya",
        "Carla Sotomayor", "Julian Restrepo", "Diana Pacheco", "Andres Solano"
    ];

    const ESPECIALISTAS_DEMO = [
        "Caraia Tuora", "Carola Santaria", "Cenaa Sirian", "Carcla Sacteira",
        "Canaa Sactavá", "Cesar Barría", "Cesar Barina"
    ];

    const IPS_DEMO = ["Los Robles La Paz", "Los Robles Norte", "Los Robles San Miguel"];

    // RF-16: catálogo de franjas que un especialista puede activar o
    // desactivar como su disponibilidad. Los días en español, como en
    // el resto de la interfaz (RNF-25: fechas y horarios en es-CO).
    const HORAS_CATALOGO = [
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ];

    const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    const DIAS_SEMANA_INDICE = {
        0: null, 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado"
    };

    function disponibilidadPorDefecto() {
        // Antes de RF-16 todos los psicólogos "ofrecían" cualquier hora
        // cualquier día; esta es esa misma disponibilidad, ahora
        // explícita, para que los psicólogos ya creados sigan agendables
        // exactamente igual hasta que la editen.
        return { dias: [...DIAS_SEMANA.slice(0, 5)], horas: [...HORAS_CATALOGO], bloqueos: [] };
    }

    function diaDeLaSemana(fechaISO) {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
        return DIAS_SEMANA_INDICE[fecha.getUTCDay()];
    }

    function obtenerPoliticaCitas() {

        try {
            const guardada = JSON.parse(localStorage.getItem(CLAVE_POLITICA_CITAS));
            const anticipacionHoras = guardada ? Number(guardada.anticipacionHoras) : 24;
            return {
                anticipacionHoras: Number.isInteger(anticipacionHoras) &&
                    anticipacionHoras >= 0 && anticipacionHoras <= 720
                    ? anticipacionHoras
                    : 24
            };
        } catch (error) {
            console.error("No se pudo leer la política de citas:", error);
            return { anticipacionHoras: 24 };
        }

    }

    function guardarPoliticaCitas(politica) {

        const anticipacionHoras = Number(politica && politica.anticipacionHoras);
        if (!Number.isInteger(anticipacionHoras) || anticipacionHoras < 0 || anticipacionHoras > 720) {
            return false;
        }

        try {
            localStorage.setItem(CLAVE_POLITICA_CITAS, JSON.stringify({ anticipacionHoras }));
            return true;
        } catch (error) {
            console.error("No se pudo guardar la política de citas:", error);
            return false;
        }

    }

    function horasHastaCita(cita) {

        if (!cita || !cita.fecha || typeof cita.hora !== "string") return Number.NEGATIVE_INFINITY;
        const coincidencia = cita.hora.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!coincidencia) return Number.NEGATIVE_INFINITY;

        let hora = Number(coincidencia[1]) % 12;
        if (coincidencia[3].toUpperCase() === "PM") hora += 12;
        const fecha = fechaHoraBogota(cita.fecha, hora, Number(coincidencia[2]));
        if (Number.isNaN(fecha.getTime())) return Number.NEGATIVE_INFINITY;
        return (fecha.getTime() - Date.now()) / (60 * 60 * 1000);

    }

    function cumpleAnticipacionCita(cita) {
        return horasHastaCita(cita) >= obtenerPoliticaCitas().anticipacionHoras;
    }

    function obtenerVentanaConsulta(cita, ahora = new Date()) {

        if (!cita || !cita.fecha || typeof cita.hora !== "string") return null;
        const coincidencia = cita.hora.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!coincidencia) return null;

        let hora = Number(coincidencia[1]) % 12;
        if (coincidencia[3].toUpperCase() === "PM") hora += 12;
        const inicio = fechaHoraBogota(cita.fecha, hora, Number(coincidencia[2]));
        if (Number.isNaN(inicio.getTime())) return null;

        const duracionMinutos = Number(cita.duracionMinutos) || 60;
        const abreEn = new Date(inicio.getTime() - 10 * 60 * 1000);
        const cierraEn = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);
        return {
            inicio,
            abreEn,
            cierraEn,
            duracionMinutos,
            puedeIngresar: ahora >= abreEn && ahora <= cierraEn
        };

    }

    function participanteAutorizadoConsulta(cita, usuario, rol) {

        if (!cita || !usuario || !rol) return false;
        const menor = obtenerMenorPorDocumento(cita.pacienteCedula);
        if (menor && (!menorTieneConsentimiento(cita.pacienteCedula) ||
            !cita.agendadaPorTutor || cita.agendadaPorTutor.cedula !== menor.tutorCedula)) return false;

        const esPacienteInvitado = Array.isArray(cita.pacientesAdicionales) &&
            cita.pacientesAdicionales.some((paciente) => paciente.cedula === usuario.cedula);
        const esPacienteDeLaCita = cita.pacienteCedula === usuario.cedula || esPacienteInvitado;
        if (rol === "Paciente" && esPacienteDeLaCita) {
            const cuentaPaciente = obtenerUsuarios().find((registro) => registro.cedula === usuario.cedula);
            if (!cuentaPaciente || cuentaPaciente.estado === "Inactivo" ||
                !consentimientoVigente(cuentaPaciente.consentimiento)) return false;
        }

        return (rol === "Paciente" && esPacienteDeLaCita) ||
            (rol === "Psicólogo" && cita.psicologoCedula === usuario.cedula) ||
            (rol === "Tutor" && cita.incluirTutorConsulta === true &&
                cita.agendadaPorTutor && cita.agendadaPorTutor.cedula === usuario.cedula &&
                menor && menor.tutorCedula === usuario.cedula &&
                menorTieneConsentimiento(cita.pacienteCedula));

    }

    function registrarEntradaConsulta(citaId, usuario, rol) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        const ventana = obtenerVentanaConsulta(cita);
        if (!cita || !ventana || !ventana.puedeIngresar ||
            !participanteAutorizadoConsulta(cita, usuario, rol) ||
            ["Cancelada", "Completada", "Asistió", "No asistió"].includes(cita.estado)) return false;

        const ahora = new Date().toISOString();
        cita.consulta = cita.consulta || { inicio: ahora, participantes: [] };
        cita.consulta.participantes = cita.consulta.participantes || [];
        let asistencia = cita.consulta.participantes.find((registro) =>
            registro.cedula === usuario.cedula && registro.rol === rol
        );
        if (!asistencia) {
            asistencia = { cedula: usuario.cedula, nombre: usuario.nombre, rol, entradas: [], duracionSegundos: 0 };
            cita.consulta.participantes.push(asistencia);
        }
        asistencia.entradas = asistencia.entradas || [];
        if (asistencia.entradas.some((entrada) => !entrada.salida)) return true;

        asistencia.entradas.push({ entrada: ahora, salida: null, duracionSegundos: 0 });
        cita.estado = "En curso";
        return guardarCitas(citas);

    }

    function configurarTutorConsulta(citaId, psicologoCedula, habilitado) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        if (!cita || cita.psicologoCedula !== psicologoCedula ||
            !cita.agendadaPorTutor || !menorTieneConsentimiento(cita.pacienteCedula)) return false;

        cita.incluirTutorConsulta = Boolean(habilitado);
        return guardarCitas(citas);

    }

    function agregarPacienteConsulta(citaId, psicologoCedula, pacienteCedula) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        const paciente = obtenerUsuarios().find((usuario) =>
            usuario.cedula === pacienteCedula && usuario.rol === "Paciente" && usuario.estado === "Activo"
        );
        if (!cita || cita.psicologoCedula !== psicologoCedula ||
            !["Terapia de pareja", "Terapia de pareja y familia"].includes(cita.especialidad) || !paciente ||
            !consentimientoVigente(paciente.consentimiento) ||
            paciente.cedula === cita.pacienteCedula) return false;

        cita.pacientesAdicionales = cita.pacientesAdicionales || [];
        if (cita.pacientesAdicionales.some((registro) => registro.cedula === paciente.cedula)) return false;
        cita.pacientesAdicionales.push({ id: paciente.id, cedula: paciente.cedula, nombre: paciente.nombre });
        cita.participante2_id = paciente.id;
        cita.participante2Cedula = paciente.cedula;
        if (!guardarCitas(citas)) return false;

        const fecha = formatearFechaBogota(cita.fecha);
        agregarNotificacion({
            clave: `cita:${cita.id}:participante2:${paciente.id}`,
            destinatarioCedula: paciente.cedula,
            tipo: "Invitación a consulta de pareja",
            titulo: "Te añadieron a una consulta",
            texto: `Te invitaron a la consulta con ${cita.psicologoNombre} el ${fecha} a las ${cita.hora}. Ingresa con tu cuenta; se requiere tu consentimiento vigente.`
        });
        agregarNotificacion({
            clave: `cita:${cita.id}:participante2-notifica-principal:${paciente.id}`,
            destinatarioCedula: cita.pacienteCedula,
            tipo: "Participante añadido",
            titulo: "Se añadió un participante a tu consulta",
            texto: `${paciente.nombre} fue añadido a tu consulta del ${fecha} a las ${cita.hora}.`
        });
        agregarNotificacion({
            clave: `cita:${cita.id}:participante2-notifica-especialista:${paciente.id}`,
            destinatarioCedula: psicologoCedula,
            tipo: "Participante añadido",
            titulo: "Participante confirmado en consulta",
            texto: `${paciente.nombre} fue añadido como segundo participante de la consulta del ${fecha} a las ${cita.hora}.`
        });
        return true;

    }

    function registrarSalidaConsulta(citaId, usuario, rol, finalizar = false) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        if (!cita || !participanteAutorizadoConsulta(cita, usuario, rol)) return false;
        if (finalizar && rol !== "Psicólogo") return false;

        const ahora = new Date();
        const asistencia = cita.consulta?.participantes?.find((registro) =>
            registro.cedula === usuario.cedula && registro.rol === rol
        );
        const entradaActiva = asistencia?.entradas?.findLast
            ? asistencia.entradas.findLast((registro) => !registro.salida)
            : asistencia?.entradas?.slice().reverse().find((registro) => !registro.salida);
        if (!entradaActiva) return false;

        entradaActiva.salida = ahora.toISOString();
        entradaActiva.duracionSegundos = Math.max(0, Math.floor((ahora - new Date(entradaActiva.entrada)) / 1000));
        asistencia.duracionSegundos = (asistencia.duracionSegundos || 0) + entradaActiva.duracionSegundos;

        if (finalizar) {
            cita.consulta.fin = ahora.toISOString();
            cita.consulta.duracionSegundos = Math.max(0, Math.floor((ahora - new Date(cita.consulta.inicio)) / 1000));
            cita.consulta.participantes.forEach((participante) => {
                const abierta = participante.entradas.find((registro) => !registro.salida);
                if (abierta) {
                    abierta.salida = ahora.toISOString();
                    abierta.duracionSegundos = Math.max(0, Math.floor((ahora - new Date(abierta.entrada)) / 1000));
                    participante.duracionSegundos = (participante.duracionSegundos || 0) + abierta.duracionSegundos;
                }
            });
            cita.estado = "Asistió";
        }

        return guardarCitas(citas);

    }

    function marcarNoAsistencia(citaId, psicologo) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        if (!cita || cita.psicologoCedula !== psicologo.cedula || !puedeMarcarNoAsistencia(cita)) return false;

        const fecha = new Date().toISOString();
        cita.estado = "No asistió";
        cita.actualizadaEn = fecha;
        cita.historialCambios = [...(cita.historialCambios || []), {
            accion: "No asistió",
            fecha,
            usuarioCedula: psicologo.cedula,
            usuarioNombre: psicologo.nombre,
            rol: "Psicólogo"
        }];
        return guardarCitas(citas);

    }

    function puedeMarcarNoAsistencia(cita, ahora = new Date()) {

        const ventana = obtenerVentanaConsulta(cita);
        if (!cita || !ventana || !["Programada", "Reprogramada", "En curso"].includes(cita.estado) ||
            ahora < new Date(ventana.inicio.getTime() + 15 * 60 * 1000)) return false;

        const participantes = cita.consulta?.participantes || [];
        const especialistaIngreso = participantes.some((participante) =>
            participante.rol === "Psicólogo" && participante.cedula === cita.psicologoCedula &&
            participante.entradas?.some((entrada) => Boolean(entrada.entrada))
        );
        const pacientesEsperados = [cita.pacienteCedula, ...(cita.pacientesAdicionales || []).map((p) => p.cedula)];
        const pacienteIngreso = participantes.some((participante) =>
            participante.rol === "Paciente" && pacientesEsperados.includes(participante.cedula) &&
            participante.entradas?.some((entrada) => Boolean(entrada.entrada))
        );

        return especialistaIngreso && !pacienteIngreso;

    }

    const CATEGORIA_PAREJA_FAMILIA = "Terapia de pareja y familia";

    function normalizarCategoriaAtencion(categoria) {
        return ["Terapia de pareja", "Terapia familiar"].includes(categoria)
            ? CATEGORIA_PAREJA_FAMILIA
            : categoria;
    }

    const ESPECIALIDADES_PREDETERMINADAS = [
        "Ansiedad y estrés", "Depresión", CATEGORIA_PAREJA_FAMILIA,
        "Terapia infantil", "Duelo y pérdida", "Adicciones"
    ];

    function obtenerCategoriasInactivas() {
        try {
            const inactivas = JSON.parse(localStorage.getItem(CLAVE_CATEGORIAS_ATENCION_INACTIVAS)) || [];
            return Array.isArray(inactivas) ? inactivas : [];
        } catch {
            return [];
        }
    }

    function guardarCategoriasInactivas(categorias) {
        try {
            localStorage.setItem(CLAVE_CATEGORIAS_ATENCION_INACTIVAS, JSON.stringify(categorias));
            return true;
        } catch (error) {
            console.error("No se pudo guardar el estado de categorías:", error);
            return false;
        }
    }

    function obtenerCategoriasAtencion() {

        try {
            const guardadas = JSON.parse(localStorage.getItem(CLAVE_CATEGORIAS_ATENCION));
            if (!Array.isArray(guardadas) || guardadas.length === 0) return [...ESPECIALIDADES_PREDETERMINADAS];

            const normalizadas = [...new Set(guardadas.map(normalizarCategoriaAtencion))];
            if (JSON.stringify(normalizadas) !== JSON.stringify(guardadas)) {
                localStorage.setItem(CLAVE_CATEGORIAS_ATENCION, JSON.stringify(normalizadas));
            }
            const activas = normalizadas.filter((categoria) => !obtenerCategoriasInactivas().includes(categoria));
            return activas.length ? activas : normalizadas;
        } catch {
            return [...ESPECIALIDADES_PREDETERMINADAS];
        }

    }

    function guardarCategoriasAtencion(categorias) {

        if (!Array.isArray(categorias) || categorias.length === 0 || categorias.length > 30) return false;

        const normalizadas = [...new Set(categorias.map((categoria) =>
            normalizarCategoriaAtencion(String(categoria).trim())
        ))];
        if (normalizadas.length === 0) return false;
        if (normalizadas.some((categoria) => obtenerCategoriasInactivas().includes(categoria))) return false;
        const sinDuplicados = new Set(normalizadas.map((categoria) => categoria.toLocaleLowerCase("es-CO")));
        if (normalizadas.some((categoria) => !/^[\p{L}\p{M}0-9&() -]{3,50}$/u.test(categoria)) ||
            sinDuplicados.size !== normalizadas.length) return false;

        try {
            localStorage.setItem(CLAVE_CATEGORIAS_ATENCION, JSON.stringify(normalizadas));
            return true;
        } catch (error) {
            console.error("No se pudo guardar el catálogo de atención:", error);
            return false;
        }

    }

    function editarCategoriaAtencion(categoriaAnterior, categoriaNueva) {

        const categorias = obtenerCategoriasAtencion();
        const nueva = normalizarCategoriaAtencion(String(categoriaNueva).trim());
        const usada = obtenerPsicologos().some((psicologo) =>
            (psicologo.categorias || [psicologo.especialidad].filter(Boolean)).includes(categoriaAnterior)
        ) || obtenerCitas().some((cita) => cita.especialidad === categoriaAnterior);

        if (!categorias.includes(categoriaAnterior) || usada) return false;
        return guardarCategoriasAtencion(categorias.map((categoria) =>
            categoria === categoriaAnterior ? nueva : categoria
        ));

    }

    function desactivarCategoriaAtencion(categoria) {

        const categorias = obtenerCategoriasAtencion();
        if (!categorias.includes(categoria) || categorias.length <= 1) return false;

        const nuevasInactivas = [...new Set([...obtenerCategoriasInactivas(), categoria])];
        if (!guardarCategoriasInactivas(nuevasInactivas)) return false;
        if (guardarCategoriasAtencion(categorias.filter((actual) => actual !== categoria))) return true;

        guardarCategoriasInactivas(nuevasInactivas.filter((actual) => actual !== categoria));
        return false;

    }

    function reactivarCategoriaAtencion(categoria) {

        const inactivas = obtenerCategoriasInactivas();
        if (!inactivas.includes(categoria)) return false;

        if (!guardarCategoriasInactivas(inactivas.filter((actual) => actual !== categoria))) return false;
        if (guardarCategoriasAtencion([...obtenerCategoriasAtencion(), categoria])) return true;

        guardarCategoriasInactivas(inactivas);
        return false;

    }

    const PREGUNTAS_BIENESTAR = [
        { id: "p1", texto: "¿Con qué frecuencia te has sentido con poca energía en las últimas dos semanas?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p2", texto: "¿Qué tan seguido sientes dificultad para dormir o descansar bien?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p3", texto: "¿Con qué frecuencia te sientes preocupado/a sin poder controlarlo?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p4", texto: "¿Qué tanto disfrutas actividades que antes te gustaban?", opciones: ["Igual que siempre", "Un poco menos", "Bastante menos", "Casi nada"] },
        { id: "p5", texto: "¿Con qué frecuencia te sientes irritable o de mal humor?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p6", texto: "¿Qué tan seguido te cuesta concentrarte en tareas cotidianas?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p7", texto: "¿Cómo describirías tu apetito últimamente?", opciones: ["Normal", "Un poco alterado", "Bastante alterado", "Muy alterado"] },
        { id: "p8", texto: "¿Qué tan conectado/a te sientes con las personas cercanas a ti?", opciones: ["Muy conectado/a", "Algo conectado/a", "Poco conectado/a", "Nada conectado/a"] },
        { id: "p9", texto: "¿Con qué frecuencia sientes que todo te cuesta más esfuerzo de lo normal?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p10", texto: "¿Qué tan seguido sientes ansiedad física (corazón acelerado, tensión, etc.)?", opciones: ["Nunca", "A veces", "Frecuentemente", "Casi siempre"] },
        { id: "p11", texto: "¿Cómo calificarías tu estado de ánimo general esta semana?", opciones: ["Muy bueno", "Bueno", "Regular", "Bajo"] },
        { id: "p12", texto: "¿Sientes que tienes a alguien con quien hablar cuando lo necesitas?", opciones: ["Siempre", "Casi siempre", "Pocas veces", "Casi nunca"] },
        { id: "p13", texto: "En las últimas dos semanas, ¿has tenido pensamientos de que no vale la pena seguir viviendo?", opciones: ["Nunca", "Rara vez", "A veces", "Frecuentemente"], esPreguntaSeguridad: true }
    ];

    function psicologosSemilla() {

        return [
            { id: "p-carlos", nombre: "Carlos Peña", cedula: "20304050", passwordHash: "2917efde09452f272f813a88d83eae4dbe833734cbbcd454f5613f94d21a47a3", titulo: "Psicólogo, Universidad Nacional de Colombia", registroProfesional: "RP-20304050", estadoVerificacion: "Aprobado", especialidad: "Ansiedad y estrés", experiencia: 8, tarifa: 80000, calificacion: 4.8, bio: "Enfoque cognitivo-conductual para manejo de ansiedad, estrés laboral y ataques de pánico." },
            { id: "p-marta", nombre: "Marta Ruiz", cedula: "30405060", passwordHash: "7ee8b08aaac1d8fb514e61f7d1f1111eb227202f33df6a9a1db654c40bbb50eb", titulo: "Psicóloga, Universidad de los Andes", registroProfesional: "RP-30405060", estadoVerificacion: "Aprobado", especialidad: CATEGORIA_PAREJA_FAMILIA, experiencia: 11, tarifa: 95000, calificacion: 4.9, bio: "Terapia sistémica para parejas y familias en crisis o buscando fortalecer su comunicación." },
            { id: "p-daniela", nombre: "Daniela Cortés", cedula: "40112233", passwordHash: "fce2d620055be582929005187725c9af7783301a9bc2effa0ae462aa4b8ef191", titulo: "Psicóloga, Universidad Javeriana", registroProfesional: "RP-40112233", estadoVerificacion: "Aprobado", especialidad: "Depresión", experiencia: 6, tarifa: 75000, calificacion: 4.7, bio: "Acompañamiento en procesos depresivos, baja autoestima y pérdida de motivación." },
            { id: "p-esteban", nombre: "Esteban Rojas", cedula: "50223344", passwordHash: "85e62e1098afbc28c2c65e66e779d255d23b48842a4c524f6178422166e7b7e5", titulo: "Psicólogo, Universidad del Rosario", registroProfesional: "RP-50223344", estadoVerificacion: "Aprobado", especialidad: "Terapia infantil", experiencia: 9, tarifa: 85000, calificacion: 4.6, bio: "Psicología infantil y adolescente, manejo de conducta y dificultades escolares." },
            { id: "p-vale", nombre: "Valentina Ospina", cedula: "60334455", passwordHash: "85aecdd5777667991425e5bfd84e34809b9bd7421438ef7bbf65ac5b3ce10225", titulo: "Psicóloga, Universidad de Antioquia", registroProfesional: "RP-60334455", estadoVerificacion: "Aprobado", especialidad: "Duelo y pérdida", experiencia: 5, tarifa: 70000, calificacion: 4.9, bio: "Acompañamiento en procesos de duelo, pérdidas significativas y transiciones de vida." },
            { id: "p-andres", nombre: "Andrés Beltrán", cedula: "70445566", passwordHash: "afc9f164491b1f395ee95bf196b140519787029ebc0bc8b965aec62a028144af", titulo: "Psicólogo, Pontificia Universidad Javeriana", registroProfesional: "RP-70445566", estadoVerificacion: "Aprobado", especialidad: "Adicciones", experiencia: 12, tarifa: 90000, calificacion: 4.5, bio: "Tratamiento de adicciones y prevención de recaídas, con enfoque en redes de apoyo." }
        ];

    }

    /* ------------------------------------------------------
       Hash simple y determinista (mismo filtro = mismo dato)
    ------------------------------------------------------ */
    function hash(texto) {
        let h = 0;
        for (let i = 0; i < texto.length; i++) {
            h = (h * 31 + texto.charCodeAt(i)) >>> 0;
        }
        return h;
    }

    function numeroPseudo(semilla, min, max) {
        const h = hash(semilla);
        return min + (h % (max - min + 1));
    }

    /* ------------------------------------------------------
       Indicadores: valores por categoría, según indicador/año/mes
    ------------------------------------------------------ */
    function obtenerValoresIndicador(indicador, anio, mes) {

        return CATEGORIAS_INDICADOR.map((categoria) => {

            const semilla = `${indicador}-${anio}-${mes}-${categoria}`;
            const base = numeroPseudo(semilla, 120, 820);

            return { categoria, valor: base };

        });

    }

    function obtenerTablaIndicador(indicador, anio, mes) {

        const eess = [
            "Los Robles La Paz, Dara...", "Los Robes La San Mich...", "Los Robes La Paz",
            "Los Rohes La San Echi...", "Los Rones La San Infan...", "Los Robes La San Miah...",
            "Los Rones EESS", "Los Rones La Paciinta", "Los Rones La San Mian...",
            "Los Rones Barina"
        ];

        return eess.map((nombre, indice) => {

            const semilla = `${indicador}-${anio}-${mes}-tabla-${indice}`;
            const den = numeroPseudo(semilla + "den", 100, 800);
            const num = numeroPseudo(semilla + "num", 10, den);
            const porcentaje = ((num / den) * 100).toFixed(1);

            return {
                diris: "Lima Centro",
                red: "Red Integrada S.M.",
                categoria: "Puesto de Salud",
                nombreEess: nombre,
                codigo: `2023${String(numeroPseudo(semilla + "cod", 1000, 9999))}`,
                mes,
                anio,
                den,
                num,
                porcentaje: `${porcentaje}%`
            };

        });

    }

    /* ------------------------------------------------------
       Pacientes (módulo de seguimiento)
    ------------------------------------------------------ */
    function generarPacientes() {

        return NOMBRES_DEMO.map((nombre, indice) => {

            const semilla = `paciente-${indice}`;
            const sesiones = numeroPseudo(semilla + "s", 2, 14);
            const seguimiento = numeroPseudo(semilla + "seg", 15, 100);
            const estados = seguimiento >= 95
                ? "Completado"
                : seguimiento >= 40
                    ? "En progreso"
                    : "Reciente";

            const tratamientos = [
                "Tratamiento emocional", "Tratamiento de ansiedad",
                "Tratamiento en pareja", "Tratamiento familiar"
            ];

            return {
                id: 20 + indice,
                nombre,
                cedula: `1234${String(56670 + indice * 3)}`,
                ips: IPS_DEMO[indice % IPS_DEMO.length],
                sesiones,
                fechaMedica: `202${3 + (indice % 2)}-0${1 + (indice % 9)}-${10 + (indice % 18)}`,
                tratamiento: tratamientos[indice % tratamientos.length],
                seguimiento,
                especialista: ESPECIALISTAS_DEMO[indice % ESPECIALISTAS_DEMO.length],
                estado: estados
            };

        });

    }

    /* ------------------------------------------------------
       Usuarios del sistema (localStorage, con semilla inicial)
    ------------------------------------------------------ */
    function usuariosSemilla() {

        const consentimientoSemilla = (cedulaUsuario) => ({
            aceptado: true, version: VERSION_CONSENTIMIENTO, fecha: "2026-09-01T08:00:00.000Z", cedulaUsuario
        });

        return [
            { id: "u1", nombre: "Laura Gómez", cedula: "10203040", passwordHash: "5e65256a15648af6b0eb486c37aab3de7492f14a83403b7a9208cd6a2419cdd2", email: "laura.gomez@helpsy.co", correoVerificado: true, rol: "Administrador", estado: "Activo", consentimiento: consentimientoSemilla("10203040") },
            { id: "u4", nombre: "Julián Torres", cedula: "40506070", passwordHash: "4f083a47c3ce50387375e1103d0b0cb3e07c737fb5ba6d6571d146dea61ffa1d", email: "julian.torres@correo.com", correoVerificado: true, rol: "Paciente", estado: "Activo", consentimiento: consentimientoSemilla("40506070") },
            { id: "u5", nombre: "Sofía Ramírez", cedula: "50607080", passwordHash: "318860f7d0650e512a684abae88da44eda757f95bdbd5fa5a191ee1f59562fb3", email: "sofia.ramirez@correo.com", correoVerificado: true, rol: "Paciente", estado: "Inactivo", consentimiento: consentimientoSemilla("50607080") }
        ];

    }

    function obtenerUsuarios() {

        try {

            const guardado = localStorage.getItem(CLAVE_USUARIOS);
            if (guardado) {
                const usuarios = JSON.parse(guardado);
                const migrados = usuarios.map((usuario) => ({
                    ...usuario,
                    correoVerificado: usuario.correoVerificado !== false
                }));
                if (migrados.some((usuario, indice) => usuario.correoVerificado !== usuarios[indice].correoVerificado)) {
                    guardarUsuarios(migrados);
                }
                return migrados;
            }

            const inicial = usuariosSemilla();
            localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(inicial));
            return inicial;

        } catch (error) {

            console.error("No se pudo leer usuarios:", error);
            return usuariosSemilla();

        }

    }

    function guardarUsuarios(lista) {

        try {
            localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error("No se pudo guardar usuarios:", error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Sesión activa (simulada, sin backend real)

       RF-03/RF-04/RNF-04: la sesión guarda cuándo se creó, cuándo
       "expira" su token y cuándo fue la última actividad. obtenerSesion
       es quien hace cumplir ambos límites — si cualquiera se superó,
       cierra la sesión sola y devuelve null, como si el token ya no
       fuera válido.
    ------------------------------------------------------ */
    function obtenerSesion() {

        try {

            const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
            if (!sesion) return null;

            const ahora = Date.now();

            if (!sesion.token || !sesion.expiraEn || ahora > sesion.expiraEn) {
                cerrarSesion();
                return null;
            }

            if (sesion.ultimaActividad && (ahora - sesion.ultimaActividad) > TIEMPO_INACTIVIDAD_MS) {
                cerrarSesion();
                return null;
            }

            const cuentas = sesion.rol === "Psicólogo" ? obtenerPsicologos() : obtenerUsuarios();
            const cuenta = cuentas.find((registro) => registro.cedula === sesion.cedula);
            if (!cuenta || (Number(cuenta.versionCredenciales) || 0) !== (Number(sesion.versionCredenciales) || 0)) {
                cerrarSesion();
                return null;
            }

            return sesion;

        } catch {
            return null;
        }

    }

    function guardarSesion(usuario) {

        try {

            const ahora = Date.now();

            const sesion = {
                ...usuario,
                token: Array.from(crypto.getRandomValues(new Uint8Array(32)))
                    .map((byte) => byte.toString(16).padStart(2, "0"))
                    .join(""),
                creadaEn: ahora,
                expiraEn: ahora + DURACION_SESION_MS,
                ultimaActividad: ahora
            };

            sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
            return true;

        } catch {
            return false;
        }

    }

    function actualizarSesion(cambios) {

        try {
            const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
            if (!sesion) return false;
            sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ ...sesion, ...cambios }));
            return true;
        } catch (error) {
            console.error("No se pudo actualizar la sesión:", error);
            return false;
        }

    }

    // Se llama en cada clic/tecla dentro de la aplicación para que la
    // sesión no se cierre por inactividad mientras la persona sigue
    // usando Helpsy activamente. No reinicia el límite de la hora
    // (RF-03), solo el de los 30 minutos de inactividad (RF-04).
    function renovarActividadSesion() {

        try {

            const crudo = sessionStorage.getItem(CLAVE_SESION);
            if (!crudo) return;

            const sesion = JSON.parse(crudo);
            sesion.ultimaActividad = Date.now();

            sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));

        } catch (error) {
            console.error(error);
        }

    }

    function cerrarSesion() {

        try {
            sessionStorage.removeItem(CLAVE_SESION);
        } catch (error) {
            console.error(error);
        }

    }

    /* ------------------------------------------------------
       Intentos de inicio de sesión (RNF-06)
       Se guarda en localStorage (no en sessionStorage) porque debe
       sobrevivir aunque la pestaña se cierre: si no, bastaría cerrar
       y volver a abrir para esquivar el bloqueo.
    ------------------------------------------------------ */
    function obtenerIntentosLogin() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_INTENTOS_LOGIN)) || {};
        } catch {
            return {};
        }

    }

    function claveIntento(cedula, rol) {
        return `${rol}:${cedula}`;
    }

    function registrarIntentoFallido(cedula, rol) {

        const todos = obtenerIntentosLogin();
        const clave = claveIntento(cedula, rol);
        const actual = todos[clave] || { intentos: 0, bloqueadoHasta: 0 };

        actual.intentos += 1;

        let quedoBloqueada = false;

        if (actual.intentos >= MAX_INTENTOS_LOGIN) {
            actual.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
            actual.intentos = 0;
            quedoBloqueada = true;
        }

        todos[clave] = actual;

        try {
            localStorage.setItem(CLAVE_INTENTOS_LOGIN, JSON.stringify(todos));
        } catch (error) {
            console.error(error);
        }

        return { quedoBloqueada, minutosBloqueo: TIEMPO_BLOQUEO_MS / 60000 };

    }

    function limpiarIntentosLogin(cedula, rol) {

        const todos = obtenerIntentosLogin();
        delete todos[claveIntento(cedula, rol)];

        try {
            localStorage.setItem(CLAVE_INTENTOS_LOGIN, JSON.stringify(todos));
        } catch (error) {
            console.error(error);
        }

    }

    function estaBloqueado(cedula, rol) {

        const todos = obtenerIntentosLogin();
        const actual = todos[claveIntento(cedula, rol)];

        if (!actual || !actual.bloqueadoHasta) {
            return { bloqueado: false };
        }

        if (Date.now() < actual.bloqueadoHasta) {
            return {
                bloqueado: true,
                minutosRestantes: Math.ceil((actual.bloqueadoHasta - Date.now()) / 60000)
            };
        }

        // El bloqueo ya pasó: se limpia para no dejar la cuenta marcada
        // para siempre con un bloqueo que ya no aplica.
        limpiarIntentosLogin(cedula, rol);
        return { bloqueado: false };

    }

    /* ------------------------------------------------------
       Historial de cargas de datos
    ------------------------------------------------------ */
    function obtenerCargas() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_CARGAS)) || [];
        } catch {
            return [];
        }

    }

    function agregarCarga(carga) {

        const cargas = obtenerCargas();
        cargas.unshift(carga);

        try {
            localStorage.setItem(CLAVE_CARGAS, JSON.stringify(cargas.slice(0, 20)));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Historial de reportes generados
    ------------------------------------------------------ */
    function obtenerReportesGenerados() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_REPORTES)) || [];
        } catch {
            return [];
        }

    }

    function agregarReporteGenerado(reporte) {

        const reportes = obtenerReportesGenerados();
        reportes.unshift(reporte);

        try {
            localStorage.setItem(CLAVE_REPORTES, JSON.stringify(reportes.slice(0, 20)));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Psicólogos (catálogo + inicio de sesión propio)
    ------------------------------------------------------ */
    function obtenerPsicologos() {

        try {

            const guardado = localStorage.getItem(CLAVE_PSICOLOGOS);
            if (guardado) {

                const emailsDemo = {
                    "20304050": "carlos.pena@helpsy.co",
                    "30405060": "marta.ruiz@helpsy.co",
                    "40112233": "daniela.cortes@helpsy.co",
                    "50223344": "esteban.rojas@helpsy.co",
                    "60334455": "valentina.ospina@helpsy.co",
                    "70445566": "andres.beltran@helpsy.co"
                };

                const psicologos = JSON.parse(guardado);
                const migrados = psicologos.map((psicologo) => ({
                    ...psicologo,
                    email: psicologo.email || emailsDemo[psicologo.cedula] || "",
                    correoVerificado: psicologo.correoVerificado !== false,
                    especialidad: normalizarCategoriaAtencion(psicologo.especialidad),
                    categorias: [...new Set((psicologo.categorias || [psicologo.especialidad].filter(Boolean))
                        .map(normalizarCategoriaAtencion))]
                }));

                if (migrados.some((psicologo, indice) =>
                    psicologo.email !== psicologos[indice].email ||
                    psicologo.correoVerificado !== psicologos[indice].correoVerificado ||
                    psicologo.especialidad !== psicologos[indice].especialidad ||
                    JSON.stringify(psicologo.categorias) !== JSON.stringify(psicologos[indice].categorias || [psicologos[indice].especialidad].filter(Boolean))
                )) {
                    guardarPsicologos(migrados);
                }

                return migrados;

            }

            const inicial = psicologosSemilla().map((psicologo) => ({
                ...psicologo,
                email: {
                    "20304050": "carlos.pena@helpsy.co",
                    "30405060": "marta.ruiz@helpsy.co",
                    "40112233": "daniela.cortes@helpsy.co",
                    "50223344": "esteban.rojas@helpsy.co",
                    "60334455": "valentina.ospina@helpsy.co",
                    "70445566": "andres.beltran@helpsy.co"
                }[psicologo.cedula],
                correoVerificado: true,
                categorias: [psicologo.especialidad]
            }));
            localStorage.setItem(CLAVE_PSICOLOGOS, JSON.stringify(inicial));
            return inicial;

        } catch (error) {
            console.error("No se pudo leer psicólogos:", error);
            return psicologosSemilla();
        }

    }

    function guardarPsicologos(lista) {

        try {
            localStorage.setItem(CLAVE_PSICOLOGOS, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Citas (agendamiento, reprogramación, cancelación)
    ------------------------------------------------------ */
    function obtenerCitas() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_CITAS)) || [];
        } catch {
            return [];
        }

    }

    function validarDisponibilidadCita(psicologoId, fecha, hora, excluirCitaId = null) {

        const psicologo = obtenerPsicologos().find((registro) => registro.id === psicologoId);
        if (!psicologo) return { valida: false, motivo: "No se encontró el especialista." };
        if (psicologo.estado === "Inactivo") {
            return { valida: false, motivo: "Este especialista no está activo." };
        }
        if (psicologo.estadoVerificacion !== "Aprobado") {
            return { valida: false, motivo: "El especialista no está verificado para recibir citas." };
        }
        if (horasHastaCita({ fecha, hora }) <= 0) {
            return { valida: false, motivo: "La fecha y hora deben estar en el futuro." };
        }

        const disponibilidad = psicologo.disponibilidad || disponibilidadPorDefecto();
        const dias = Array.isArray(disponibilidad.dias) ? disponibilidad.dias : [];
        const horas = Array.isArray(disponibilidad.horas) ? disponibilidad.horas : [];
        const diaElegido = diaDeLaSemana(fecha);
        if (!diaElegido || !dias.includes(diaElegido) || !horas.includes(hora)) {
            return { valida: false, motivo: "El especialista no ofrece esa franja semanal." };
        }

        const bloqueos = Array.isArray(disponibilidad.bloqueos) ? disponibilidad.bloqueos : [];
        const bloqueado = bloqueos.some((bloqueo) => {
            const fechaBloqueo = typeof bloqueo === "string" ? bloqueo : bloqueo.fecha;
            const horasBloqueadas = typeof bloqueo === "object" && Array.isArray(bloqueo.horas)
                ? bloqueo.horas
                : [];
            return fechaBloqueo === fecha && (horasBloqueadas.length === 0 || horasBloqueadas.includes(hora));
        });
        if (bloqueado) {
            return { valida: false, motivo: "El especialista bloqueó esa fecha o franja." };
        }

        const conflicto = obtenerCitas().some((cita) =>
            cita.id !== excluirCitaId &&
            cita.psicologoId === psicologoId &&
            cita.fecha === fecha &&
            cita.hora === hora &&
            !["Cancelada", "Completada", "Asistió", "No asistió"].includes(cita.estado)
        );
        if (conflicto) {
            return { valida: false, motivo: "Ese horario ya está reservado." };
        }

        return { valida: true, motivo: "" };

    }

    function guardarCitas(lista) {

        try {
            localStorage.setItem(CLAVE_CITAS, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    async function agregarCita(cita) {

        const reservar = () => {
            const menor = obtenerMenorPorDocumento(cita.pacienteCedula);
            if (menor && (!cita.agendadaPorTutor ||
                menor.tutorCedula !== cita.agendadaPorTutor.cedula ||
                !menorTieneConsentimiento(cita.pacienteCedula))) return null;
            if (cita.agendadaPorTutor && !menor) return null;

            const disponibilidad = validarDisponibilidadCita(
                cita.psicologoId,
                cita.fecha,
                cita.hora
            );
            if (!disponibilidad.valida) return null;

            const citas = obtenerCitas();
            citas.push(cita);
            return guardarCitas(citas) ? cita : null;
        };

        if (typeof navigator !== "undefined" && navigator.locks?.request) {
            const claveBloqueo = `helpsy-cita:${cita.psicologoId}:${cita.fecha}:${cita.hora}`;
            return navigator.locks.request(claveBloqueo, reservar);
        }

        return reservar();

    }

    /* ------------------------------------------------------
       Diario emocional
    ------------------------------------------------------ */
    function obtenerDiario(pacienteCedula) {

        try {
            const todo = JSON.parse(localStorage.getItem(CLAVE_DIARIO)) || [];
            return todo.filter((entrada) => entrada.pacienteCedula === pacienteCedula);
        } catch {
            return [];
        }

    }

    function contarRegistrosDiario() {

        try {
            return (JSON.parse(localStorage.getItem(CLAVE_DIARIO)) || []).length;
        } catch {
            return 0;
        }

    }

    function agregarEntradaDiario(entrada) {

        try {

            const todo = JSON.parse(localStorage.getItem(CLAVE_DIARIO)) || [];
            const indiceExistente = todo.findIndex((registro) =>
                registro.pacienteCedula === entrada.pacienteCedula && registro.fechaISO === entrada.fechaISO
            );
            if (indiceExistente >= 0) {
                todo[indiceExistente] = entrada;
            } else {
                todo.push(entrada);
            }
            localStorage.setItem(CLAVE_DIARIO, JSON.stringify(todo));
            return true;

        } catch (error) {
            console.error(error);
            return false;
        }

    }

    function obtenerSeguimientos(pacienteCedula) {

        try {
            const todos = JSON.parse(localStorage.getItem(CLAVE_SEGUIMIENTOS)) || [];
            return pacienteCedula
                ? todos.filter((registro) => registro.pacienteCedula === pacienteCedula)
                : todos;
        } catch {
            return [];
        }

    }

    function agregarSeguimiento(registro) {

        try {
            const todos = obtenerSeguimientos();
            todos.push(registro);
            localStorage.setItem(CLAVE_SEGUIMIENTOS, JSON.stringify(todos));
            return registro;
        } catch (error) {
            console.error(error);
            return null;
        }

    }

    /* ------------------------------------------------------
       Tareas asignadas por el psicólogo
    ------------------------------------------------------ */
    function obtenerTareas(pacienteCedula) {

        try {

            const todas = JSON.parse(localStorage.getItem(CLAVE_TAREAS)) || [];
            return pacienteCedula ? todas.filter((t) => t.pacienteCedula === pacienteCedula) : todas;

        } catch {
            return [];
        }

    }

    function guardarTareas(lista) {

        try {
            localStorage.setItem(CLAVE_TAREAS, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    function agregarTarea(tarea) {

        const tareas = obtenerTareas();
        tareas.push(tarea);
        return guardarTareas(tareas) ? tarea : null;

    }

    /* ------------------------------------------------------
       Cuestionario de bienestar inicial
    ------------------------------------------------------ */
    function obtenerCuestionario(pacienteCedula) {

        try {
            const todo = JSON.parse(localStorage.getItem(CLAVE_CUESTIONARIO)) || {};
            return todo[pacienteCedula] || null;
        } catch {
            return null;
        }

    }

    function guardarCuestionario(pacienteCedula, resultado) {

        try {
            const todo = JSON.parse(localStorage.getItem(CLAVE_CUESTIONARIO)) || {};
            todo[pacienteCedula] = resultado;
            localStorage.setItem(CLAVE_CUESTIONARIO, JSON.stringify(todo));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Pagos (simulados — nunca se guarda un número de tarjeta)
    ------------------------------------------------------ */
    function obtenerPagos(cedula) {

        try {

            const todos = JSON.parse(localStorage.getItem(CLAVE_PAGOS)) || [];

            // "cedula" puede ser la del paciente que pagó por sí mismo, o
            // la del tutor que pagó por un menor a su cargo.
            return cedula
                ? todos.filter((p) => p.pacienteCedula === cedula || p.tutorCedula === cedula)
                : todos;

        } catch {
            return [];
        }

    }

    function agregarPago(pago) {

        try {
            const pagos = JSON.parse(localStorage.getItem(CLAVE_PAGOS)) || [];
            pagos.unshift(pago);
            localStorage.setItem(CLAVE_PAGOS, JSON.stringify(pagos));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    /* ------------------------------------------------------
       Talleres grupales virtuales
    ------------------------------------------------------ */
    function obtenerTalleres() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_TALLERES)) || [];
        } catch {
            return [];
        }

    }

    function guardarTalleres(lista) {

        try {
            localStorage.setItem(CLAVE_TALLERES, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    function agregarTaller(taller) {

        const talleres = obtenerTalleres();
        talleres.push({ ...taller, inscritos: [] });
        return guardarTalleres(talleres) ? taller : null;

    }

    function inscribirseATaller(tallerId, pacienteCedula, pacienteNombre) {

        const talleres = obtenerTalleres();
        const taller = talleres.find((t) => t.id === tallerId);

        if (!taller) return { ok: false, motivo: "El taller no existe." };

        if (taller.inscritos.some((i) => i.cedula === pacienteCedula)) {
            return { ok: false, motivo: "Ya estás inscrito en este taller." };
        }

        if (taller.inscritos.length >= taller.cupoMaximo) {
            return { ok: false, motivo: "Este taller ya no tiene cupo." };
        }

        taller.inscritos.push({ cedula: pacienteCedula, nombre: pacienteNombre });
        guardarTalleres(talleres);

        return { ok: true };

    }

    function cancelarInscripcionTaller(tallerId, pacienteCedula) {

        const talleres = obtenerTalleres();
        const taller = talleres.find((t) => t.id === tallerId);

        if (!taller) return false;

        taller.inscritos = taller.inscritos.filter((i) => i.cedula !== pacienteCedula);
        return guardarTalleres(talleres);

    }

    /* ------------------------------------------------------
       Consentimiento versionado (RF-10)
       En vez de solo un booleano "aceptó o no", se guarda qué
       versión del texto aceptó, cuándo y bajo qué cédula — lo
       mismo que pide la Ley 1581 de 2012 para poder demostrar el
       consentimiento informado, no solo asumirlo.
    ------------------------------------------------------ */
    function registrarConsentimiento(cedulaUsuario, titularCedula = cedulaUsuario, nombreUsuario = null) {

        const fecha = new Date().toISOString();
        const actor = {
            cedula: cedulaUsuario,
            nombre: nombreUsuario || obtenerUsuarios().concat(obtenerPsicologos())
                .find((cuenta) => cuenta.cedula === cedulaUsuario)?.nombre || "Usuario"
        };

        return {
            aceptado: true,
            version: VERSION_CONSENTIMIENTO,
            fecha,
            cedulaUsuario,
            titularCedula,
            autorizacionDatos: {
                aceptado: true,
                version: VERSION_CONSENTIMIENTO,
                fecha,
                usuario: actor
            },
            consentimientoInformado: {
                aceptado: true,
                version: VERSION_CONSENTIMIENTO,
                fecha,
                usuario: actor
            }
        };

    }

    function consentimientoVigente(consentimiento) {

        return Boolean(
            consentimiento &&
            consentimiento.aceptado &&
            consentimiento.autorizacionDatos &&
            consentimiento.autorizacionDatos.aceptado &&
            consentimiento.autorizacionDatos.version === VERSION_CONSENTIMIENTO &&
            consentimiento.consentimientoInformado &&
            consentimiento.consentimientoInformado.aceptado &&
            consentimiento.consentimientoInformado.version === VERSION_CONSENTIMIENTO
        );

    }

    function obtenerSolicitudesPrivacidad(cedulaActor) {

        try {
            const solicitudes = JSON.parse(localStorage.getItem("helpsySolicitudesPrivacidad")) || [];
            return cedulaActor
                ? solicitudes.filter((solicitud) =>
                    solicitud.solicitadoPor.cedula === cedulaActor ||
                    (solicitud.tipoTitular === "menor" && solicitud.tutorCedula === cedulaActor)
                )
                : solicitudes;
        } catch (error) {
            console.error("No se pudieron leer las solicitudes de privacidad:", error);
            return [];
        }

    }

    function solicitarSupresionDatos(cedulaActor, tipoTitular, idTitular, motivo) {

        const usuario = obtenerUsuarios().concat(obtenerPsicologos())
            .find((cuenta) => cuenta.cedula === cedulaActor);
        if (!["cuenta", "menor"].includes(tipoTitular)) return null;

        const menor = tipoTitular === "menor"
            ? obtenerMenores(cedulaActor).find((registro) => registro.documento === idTitular)
            : null;

        if (!usuario || (tipoTitular === "menor" && !menor) ||
            (tipoTitular === "menor" && usuario.rol !== "Tutor") ||
            (tipoTitular === "cuenta" && idTitular !== cedulaActor)) {
            return null;
        }

        try {

            const solicitudes = JSON.parse(localStorage.getItem("helpsySolicitudesPrivacidad")) || [];
            const solicitud = {
                id: `priv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                tipoTitular,
                titularCedula: idTitular,
                titularNombre: menor ? menor.nombre : usuario.nombre,
                tutorCedula: menor ? cedulaActor : null,
                solicitadoPor: { cedula: usuario.cedula, nombre: usuario.nombre, rol: usuario.rol },
                motivo: motivo.trim(),
                fecha: new Date().toISOString(),
                estado: "Pendiente de revisión"
            };

            solicitudes.unshift(solicitud);
            localStorage.setItem("helpsySolicitudesPrivacidad", JSON.stringify(solicitudes));
            registrarActividad("Privacidad", `${usuario.nombre} solicitó la supresión de datos de ${solicitud.titularNombre}.`);
            return solicitud;

        } catch (error) {
            console.error("No se pudo registrar la solicitud de supresión:", error);
            return null;
        }

    }

    function registrarAceptacionConfidencialidad(citaId, usuario, rol) {

        const citas = obtenerCitas();
        const cita = citas.find((registro) => registro.id === citaId);
        if (!cita) return false;
        const esPacienteInvitado = Array.isArray(cita.pacientesAdicionales) &&
            cita.pacientesAdicionales.some((paciente) => paciente.cedula === usuario.cedula);
        const participanteAutorizado = (
            (rol === "Paciente" && (cita.pacienteCedula === usuario.cedula || esPacienteInvitado)) ||
            (rol === "Psicólogo" && cita.psicologoCedula === usuario.cedula) ||
            (rol === "Tutor" &&
                cita.agendadaPorTutor &&
                cita.agendadaPorTutor.cedula === usuario.cedula &&
                menorTieneConsentimiento(cita.pacienteCedula))
        );
        if (!participanteAutorizado) return false;

        if (!Array.isArray(cita.aceptacionesConfidencialidad)) {
            cita.aceptacionesConfidencialidad = [];
        }

        cita.aceptacionesConfidencialidad.push({
            version: VERSION_AVISO_CONFIDENCIALIDAD,
            fecha: new Date().toISOString(),
            usuarioCedula: usuario.cedula,
            usuarioNombre: usuario.nombre,
            rol
        });

        return guardarCitas(citas);

    }

    /* ------------------------------------------------------
       Menores de edad registrados por un tutor (RF-02, RF-11)
       Un menor no inicia sesión por su cuenta: su tutor gestiona su
       perfil, agenda sus citas y registra su estado emocional "en su
       nombre". Por eso el menor no tiene passwordHash ni rol propio,
       solo un documento (que funciona como su "cédula" dentro de citas
       y diario) y el consentimiento que dio su tutor para tratarlo.
    ------------------------------------------------------ */
    function obtenerMenores(tutorCedula) {

        try {

            const todos = JSON.parse(localStorage.getItem(CLAVE_MENORES)) || [];
            return tutorCedula ? todos.filter((m) => m.tutorCedula === tutorCedula) : todos;

        } catch {
            return [];
        }

    }

    function obtenerMenorPorDocumento(documento) {
        return obtenerMenores().find((m) => m.documento === documento) || null;
    }

    function guardarMenores(lista) {

        try {
            localStorage.setItem(CLAVE_MENORES, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }

    function agregarMenor(menor) {

        const menores = obtenerMenores();
        menores.push(menor);
        return guardarMenores(menores) ? menor : null;

    }

    // RF-11: no se puede agendar una cita (ni, en general, atender) a
    // un menor cuyo tutor no dio el consentimiento registrado.
    function menorTieneConsentimiento(documento) {

        const menor = obtenerMenorPorDocumento(documento);
        return Boolean(
            menor &&
            consentimientoVigente(menor.consentimiento) &&
            menor.consentimiento.titularCedula === menor.documento &&
            menor.consentimiento.cedulaUsuario === menor.tutorCedula
        );

    }

    /* ------------------------------------------------------
       Auditoría de accesos a datos sensibles (RF-43 / RNF-10)
       Distinta del log de "Actividad" general: esta es específica
       para accesos a datos clínicos (diario emocional, consultas) y,
       a diferencia de la actividad, no se trunca ni se borra desde la
       aplicación — solo el administrador puede consultarla.
    ------------------------------------------------------ */
    function registrarAccesoSensible(usuarioQueAcceda, rolQueAcceda, recurso, titularCedula) {

        try {

            const registros = JSON.parse(localStorage.getItem(CLAVE_AUDITORIA)) || [];

            registros.unshift({
                id: `aud${Date.now()}${Math.floor(Math.random() * 1000)}`,
                fecha: new Date().toISOString(),
                usuario: usuarioQueAcceda,
                rol: rolQueAcceda,
                recurso,
                titularCedula
            });

            localStorage.setItem(CLAVE_AUDITORIA, JSON.stringify(registros));

        } catch (error) {
            console.error("No se pudo registrar el acceso en la auditoría:", error);
        }

    }

    function obtenerAuditoria() {

        try {
            return JSON.parse(localStorage.getItem(CLAVE_AUDITORIA)) || [];
        } catch {
            return [];
        }

    }

    return {
        CATEGORIAS_INDICADOR,
        INDICADORES_DISPONIBLES,
        fechaBogotaISO,
        sumarDiasFechaISO,
        formatearFechaBogota,
        get ESPECIALIDADES() { return obtenerCategoriasAtencion(); },
        obtenerCategoriasAtencion,
        guardarCategoriasAtencion,
        obtenerCategoriasInactivas,
        editarCategoriaAtencion,
        desactivarCategoriaAtencion,
        reactivarCategoriaAtencion,
        PREGUNTAS_BIENESTAR,
        obtenerValoresIndicador,
        obtenerTablaIndicador,
        generarPacientes,
        obtenerUsuarios,
        guardarUsuarios,
        buscarCuentaPorEmail,
        actualizarCuenta,
        crearTokenCuenta,
        obtenerTokenCuenta,
        consumirTokenCuenta,
        obtenerPsicologos,
        guardarPsicologos,
        obtenerSesion,
        guardarSesion,
        actualizarSesion,
        renovarActividadSesion,
        cerrarSesion,
        registrarIntentoFallido,
        limpiarIntentosLogin,
        estaBloqueado,
        obtenerCargas,
        agregarCarga,
        obtenerReportesGenerados,
        agregarReporteGenerado,
        obtenerCitas,
        guardarCitas,
        agregarCita,
        obtenerDiario,
        contarRegistrosDiario,
        agregarEntradaDiario,
        obtenerSeguimientos,
        agregarSeguimiento,
        obtenerTareas,
        guardarTareas,
        agregarTarea,
        obtenerCuestionario,
        guardarCuestionario,
        obtenerPagos,
        agregarPago,
        obtenerMensajeDelDia,
        obtenerPreferencias,
        guardarPreferencias,
        obtenerNotificaciones,
        agregarNotificacion,
        marcarNotificacionLeida,
        obtenerAlertasRiesgo,
        agregarAlertaRiesgo,
        registrarActividad,
        obtenerActividad,
        generarCopiaSeguridad,
        restaurarCopiaSeguridad,
        obtenerTalleres,
        agregarTaller,
        inscribirseATaller,
        cancelarInscripcionTaller,
        registrarConsentimiento,
        consentimientoVigente,
        obtenerSolicitudesPrivacidad,
        solicitarSupresionDatos,
        registrarAceptacionConfidencialidad,
        obtenerMenores,
        obtenerMenorPorDocumento,
        guardarMenores,
        agregarMenor,
        menorTieneConsentimiento,
        registrarAccesoSensible,
        obtenerAuditoria,
        HORAS_CATALOGO,
        DIAS_SEMANA,
        disponibilidadPorDefecto,
        diaDeLaSemana,
        obtenerPoliticaCitas,
        guardarPoliticaCitas,
        horasHastaCita,
        cumpleAnticipacionCita,
        validarDisponibilidadCita,
        obtenerVentanaConsulta,
        registrarEntradaConsulta,
        registrarSalidaConsulta,
        puedeMarcarNoAsistencia,
        marcarNoAsistencia,
        configurarTutorConsulta,
        agregarPacienteConsulta
    };

})();
