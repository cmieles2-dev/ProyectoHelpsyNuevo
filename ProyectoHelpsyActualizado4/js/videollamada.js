document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("citas", "Sala de videollamada");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor", "Psicólogo")) return;

    const parametros = new URLSearchParams(window.location.search);
    const citaId = parametros.get("cita");
    const cita = HelpsyData.obtenerCitas().find((c) => c.id === citaId);
    const ventana = HelpsyData.obtenerVentanaConsulta(cita);
    const menor = cita && HelpsyData.obtenerMenorPorDocumento(cita.pacienteCedula);
    const esParticipanteAutorizado = cita && (
        (sesion.rol === "Paciente" && cita.pacienteCedula === sesion.cedula) ||
        (sesion.rol === "Psicólogo" && cita.psicologoCedula === sesion.cedula) ||
        (sesion.rol === "Tutor" && cita.incluirTutorConsulta === true && menor &&
            menor.tutorCedula === sesion.cedula &&
            HelpsyData.menorTieneConsentimiento(cita.pacienteCedula))
    );

    if (!esParticipanteAutorizado || !ventana || !ventana.puedeIngresar ||
        !["Programada", "Reprogramada", "En curso"].includes(cita.estado) ||
        (menor && !HelpsyData.menorTieneConsentimiento(cita.pacienteCedula))) {
        const mensaje = !cita
            ? "No se encontró la cita."
            : !ventana?.puedeIngresar
                ? "La sala abre 10 minutos antes de la cita y cierra 15 minutos después de la hora programada."
                : "No tienes autorización para ingresar a esta consulta.";
        HelpsyUI.toast(mensaje, "error");
        document.getElementById("modal-confidencialidad").classList.remove("visible");
        setTimeout(() => { window.location.href = "citas.html"; }, 1200);
        return;
    }

    const otraPersona = sesion.rol === "Psicólogo" ? cita.pacienteNombre : cita.psicologoNombre;
    const escapar = (texto) => String(texto || "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[caracter]);
    const lienzo = document.getElementById("video-lienzo");
    lienzo.innerHTML = `
        <div class="video-avatar-grande">${escapar(HelpsyUI.iniciales(otraPersona))}</div>
        <div class="video-mini">${escapar(sesion.nombre)}</div>
    `;

    const detalle = document.getElementById("detalle-cita-video");
    detalle.innerHTML = `
        <div class="tarjeta">
            <div class="tarjeta-encabezado">
                <div>
                    <h2>Sesión con ${escapar(otraPersona)}</h2>
                    <p>${escapar(cita.especialidad)} · ${escapar(HelpsyData.formatearFechaBogota(cita.fecha))} a las ${escapar(cita.hora)}</p>
                </div>
                <span class="badge badge-azul" id="cronometro">00:00</span>
            </div>
            <p class="campo-nota" id="lista-asistencia">Aún no hay ingresos registrados.</p>
        </div>
    `;

    const controlTutor = sesion.rol === "Psicólogo" && cita.agendadaPorTutor && menor &&
        HelpsyData.menorTieneConsentimiento(cita.pacienteCedula)
        ? document.createElement("label")
        : null;
    if (controlTutor) {
        controlTutor.className = "consentimiento";
        controlTutor.innerHTML = `
            <input type="checkbox" id="permitir-tutor-consulta" ${cita.incluirTutorConsulta ? "checked" : ""}>
            <span class="consentimiento-check"></span>
            <span class="consentimiento-texto">Autorizar la participación del tutor en esta consulta</span>
        `;
        detalle.appendChild(controlTutor);
        controlTutor.querySelector("input").addEventListener("change", (evento) => {
            const habilitado = evento.currentTarget.checked;
            if (!HelpsyData.configurarTutorConsulta(cita.id, sesion.cedula, habilitado)) {
                evento.currentTarget.checked = !habilitado;
                HelpsyUI.toast("No se pudo actualizar la autorización del tutor.", "error");
                return;
            }
            cita.incluirTutorConsulta = habilitado;
            HelpsyUI.toast(habilitado ? "Tutor autorizado para esta consulta." : "Participación del tutor desactivada.", "info");
        });
    }

    if (sesion.rol === "Psicólogo" && ["Terapia de pareja", "Terapia de pareja y familia"].includes(cita.especialidad)) {
        const formularioPareja = document.createElement("form");
        formularioPareja.className = "tarjeta";
        formularioPareja.innerHTML = `
            <div class="campo">
                <label for="cedula-pareja">Invitar segunda persona</label>
                <input class="input-simple" id="cedula-pareja" inputmode="numeric" autocomplete="off" required>
            </div>
            <button class="btn btn-fantasma btn-sm" type="submit">Agregar participante</button>
        `;
        detalle.appendChild(formularioPareja);
        formularioPareja.addEventListener("submit", (evento) => {
            evento.preventDefault();
            const cedula = formularioPareja.querySelector("#cedula-pareja").value.trim();
            if (!HelpsyData.agregarPacienteConsulta(cita.id, sesion.cedula, cedula)) {
                HelpsyUI.toast("No se agregó. Verifica que sea una cuenta paciente activa, con consentimiento vigente y distinta a la primera persona.", "error");
                return;
            }
            formularioPareja.reset();
            pintarAsistencia();
            HelpsyUI.toast("Segunda persona invitada. La cita aparecerá en su agenda.", "exito");
        });
    }

    const pintarAsistencia = () => {
        const citaActualizada = HelpsyData.obtenerCitas().find((registro) => registro.id === cita.id);
        const citados = [citaActualizada.pacienteNombre, ...(citaActualizada.pacientesAdicionales || []).map((p) => p.nombre)];
        const asistentes = (citaActualizada.consulta?.participantes || []).map((participante) => participante.nombre);
        const textoCitados = citados.map(escapar).join(", ");
        const textoAsistentes = asistentes.map(escapar).join(", ") || "ninguno todavía";
        document.getElementById("lista-asistencia").textContent = `Personas citadas: ${textoCitados}. Ingresaron: ${textoAsistentes}.`;
    };

    /* -------------------------------------------------------------
       Aviso de confidencialidad: obligatorio, no se puede saltar.
       El botón de entrar sigue deshabilitado hasta marcar el check.
    ------------------------------------------------------------- */

    const checkConfidencialidad = document.getElementById("check-confidencialidad");
    checkConfidencialidad.focus();
    const botonAceptar = document.getElementById("btn-aceptar-confidencialidad");

    checkConfidencialidad.addEventListener("change", () => {
        botonAceptar.disabled = !checkConfidencialidad.checked;
    });

    let intervalo = null;
    let segundosEnSala = 0;

    botonAceptar.addEventListener("click", () => {

        if (!checkConfidencialidad.checked) return;

        if (!HelpsyData.registrarAceptacionConfidencialidad(
            cita.id,
            { cedula: sesion.cedula, nombre: sesion.nombre },
            sesion.rol
        )) {
            HelpsyUI.toast("No se pudo registrar tu aceptación de confidencialidad. No puedes entrar todavía.", "error");
            return;
        }

        if (!HelpsyData.registrarEntradaConsulta(
            cita.id,
            { cedula: sesion.cedula, nombre: sesion.nombre },
            sesion.rol
        )) {
            HelpsyUI.toast("No se pudo registrar tu asistencia. Verifica que la ventana de ingreso siga abierta.", "error");
            return;
        }

        HelpsyUI.cerrarModal("modal-confidencialidad");
        document.getElementById("video-shell").classList.remove("oculto");
        pintarAsistencia();
        intervalo = setInterval(actualizarCronometro, 1000);

    });

    function actualizarCronometro() {

        segundosEnSala++;
        const mm = String(Math.floor(segundosEnSala / 60)).padStart(2, "0");
        const ss = String(segundosEnSala % 60).padStart(2, "0");
        document.getElementById("cronometro").textContent = `${mm}:${ss}`;

    }

    let micActivo = true;
    let camaraActiva = true;

    document.getElementById("btn-mic").addEventListener("click", (evento) => {
        micActivo = !micActivo;
        evento.currentTarget.style.background = micActivo ? "" : "var(--rojo-600)";
        HelpsyUI.toast(micActivo ? "Micrófono activado (simulado)." : "Micrófono silenciado (simulado).", "info");
    });

    document.getElementById("btn-camara").addEventListener("click", (evento) => {
        camaraActiva = !camaraActiva;
        evento.currentTarget.style.background = camaraActiva ? "" : "var(--rojo-600)";
        HelpsyUI.toast(camaraActiva ? "Cámara encendida (simulada)." : "Cámara apagada (simulada).", "info");
    });

    document.getElementById("btn-colgar").addEventListener("click", () => {

        if (intervalo) clearInterval(intervalo);
        const finalizar = sesion.rol === "Psicólogo" && confirm(
            "¿Finalizar la consulta para todos y registrar su duración? Si eliges Cancelar, solo saldrás de la sala."
        );
        if (!HelpsyData.registrarSalidaConsulta(
            cita.id,
            { cedula: sesion.cedula, nombre: sesion.nombre },
            sesion.rol,
            finalizar
        )) {
            HelpsyUI.toast("No se pudo guardar tu salida de la consulta.", "error");
            return;
        }

        window.location.href = "citas.html";

    });

});
