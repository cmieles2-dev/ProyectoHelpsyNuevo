document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("citas", sesionTitulo());
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor", "Psicólogo")) return;

    // Un Tutor ve y gestiona las citas de sus menores igual que un
    // Paciente las suyas; solo cambia cómo se filtran (ver abajo).
    const esPaciente = sesion.rol === "Paciente" || sesion.rol === "Tutor";
    const esTutor = sesion.rol === "Tutor";
    const ESTADOS_TERMINALES_CITA = ["Cancelada", "Completada", "Asistió", "No asistió"];
    const politicaCitas = HelpsyData.obtenerPoliticaCitas();
    const textoPolitica = politicaCitas.anticipacionHoras === 0
        ? "Puedes cancelar o reprogramar hasta la hora de la cita."
        : `Puedes cancelar o reprogramar con al menos ${politicaCitas.anticipacionHoras} horas de anticipación.`;

    function sesionTitulo() {
        const s = HelpsyData.obtenerSesion();
        return s && s.rol === "Psicólogo" ? "Agenda de citas" : "Mis citas";
    }

    document.getElementById("info-citas").innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        ${esPaciente
            ? `Aquí ves tus citas. ${textoPolitica}`
            : `Aquí ves las citas de tus pacientes. ${textoPolitica}`}
    `;

    document.getElementById("titulo-lista-citas").textContent = esPaciente ? "Tus citas" : "Citas de tus pacientes";

    const encabezado = document.querySelector("#tabla-citas-encabezado thead");

    encabezado.innerHTML = esPaciente
        ? `<tr><th>Psicólogo</th><th>Especialidad</th><th>Fecha</th><th>Hora</th><th>Estado</th><th></th></tr>`
        : `<tr><th>Paciente</th><th>Especialidad</th><th>Fecha</th><th>Hora</th><th>Estado</th><th></th></tr>`;

    function obtenerMisCitas() {

        const todas = HelpsyData.obtenerCitas();

        const propias = todas
            .filter((c) => {

                if (esTutor) return c.agendadaPorTutor && c.agendadaPorTutor.cedula === sesion.cedula;
                if (esPaciente) return c.pacienteCedula === sesion.cedula ||
                    (c.pacientesAdicionales || []).some((paciente) => paciente.cedula === sesion.cedula);
                return c.psicologoCedula === sesion.cedula;

            })
            .sort((a, b) => HelpsyData.horasHastaCita(a) - HelpsyData.horasHastaCita(b));

        if (vistaActual === "historial") {
            return propias
                .filter((c) => ESTADOS_TERMINALES_CITA.includes(c.estado) || HelpsyData.horasHastaCita(c) < 0)
                .sort((a, b) => HelpsyData.horasHastaCita(b) - HelpsyData.horasHastaCita(a));
        }

        return propias.filter((c) =>
            !ESTADOS_TERMINALES_CITA.includes(c.estado) && HelpsyData.horasHastaCita(c) >= 0
        );

    }

    let vistaActual = "proximas";

    document.getElementById("tabs-citas").addEventListener("click", (evento) => {

        const boton = evento.target.closest(".tab-btn");
        if (!boton) return;

        document.querySelectorAll("#tabs-citas .tab-btn").forEach((b) => b.classList.remove("activo"));
        boton.classList.add("activo");
        vistaActual = boton.dataset.vista;

        document.getElementById("titulo-lista-citas").textContent = vistaActual === "historial"
            ? (esPaciente ? "Historial de tus sesiones" : "Historial de sesiones realizadas")
            : (esPaciente ? "Tus citas" : "Citas de tus pacientes");

        pintar();

    });

    function badgeEstado(estado) {

        const mapa = { "Programada": "badge-azul", "Reprogramada": "badge-naranja", "Cancelada": "badge-rojo", "Completada": "badge-verde", "Asistió": "badge-verde", "No asistió": "badge-rojo", "En curso": "badge-morado" };
        const etiqueta = estado === "Completada" ? "Asistió" : estado;
        return `<span class="badge ${mapa[estado] || "badge-gris"}">${etiqueta}</span>`;

    }

    function duracionConsulta(segundos) {
        const total = Math.max(0, Math.floor(segundos));
        return `${Math.floor(total / 60)} min ${total % 60} s`;
    }

    function esHoraDeEntrar(cita) {

        const ventana = HelpsyData.obtenerVentanaConsulta(cita);
        return Boolean(ventana && ventana.puedeIngresar &&
            !ESTADOS_TERMINALES_CITA.includes(cita.estado));

    }

    function puedeGestionarCita(cita) {
        const propia = esTutor
            ? cita.agendadaPorTutor && cita.agendadaPorTutor.cedula === sesion.cedula
            : esPaciente
                ? cita.pacienteCedula === sesion.cedula
                : cita.psicologoCedula === sesion.cedula;
        return !ESTADOS_TERMINALES_CITA.includes(cita.estado) &&
            propia &&
            HelpsyData.cumpleAnticipacionCita(cita);
    }


    function puedeMarcarAusencia(cita) {
        return HelpsyData.puedeMarcarNoAsistencia(cita);
    }
    function pintar() {

        const citas = obtenerMisCitas();
        const cuerpo = document.getElementById("tabla-citas");

        document.getElementById("contador-citas").textContent = `${citas.length} en total`;

        if (citas.length === 0) {

            const mensajeVacio = vistaActual === "historial"
                ? "Aquí aparecerán tus sesiones una vez completadas o canceladas."
                : (esPaciente ? "Agenda tu primera sesión desde \"Buscar psicólogos\"." : "Aparecerán aquí cuando un paciente te agende.");

            cuerpo.innerHTML = `
                <tr><td colspan="6">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>${vistaActual === "historial" ? "Sin sesiones en el historial" : "No hay citas todavía"}</strong>
                        <span>${mensajeVacio}</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        cuerpo.innerHTML = citas.map((c) => `
            <tr>
                <td>${esPaciente ? c.psicologoNombre : c.pacienteNombre}</td>
                <td>${c.especialidad}</td>
                <td>${HelpsyData.formatearFechaBogota(c.fecha)}</td>
                <td>${c.hora}</td>
                <td>
                    ${badgeEstado(c.estado)}
                    ${Number.isFinite(c.consulta?.duracionSegundos) ? `<small class="campo-nota">Duración: ${duracionConsulta(c.consulta.duracionSegundos)}</small>` : ""}
                </td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap: wrap;">
                        ${esHoraDeEntrar(c) ? `<a class="btn btn-exito btn-sm" href="videollamada.html?cita=${c.id}">Entrar</a>` : ""}
                        ${!esHoraDeEntrar(c) && !ESTADOS_TERMINALES_CITA.includes(c.estado) ? `
                            <small class="campo-nota">${HelpsyData.obtenerVentanaConsulta(c)?.cierraEn < new Date() ? "La ventana de ingreso está cerrada." : `Disponible 10 minutos antes de las ${c.hora}.`}</small>
                        ` : ""}
                        ${puedeGestionarCita(c) ? `
                            <button class="btn btn-fantasma btn-sm" data-reprogramar="${c.id}">Reprogramar</button>
                            <button class="btn btn-peligro btn-sm" data-cancelar="${c.id}">Cancelar</button>
                        ` : ""}
                        ${sesion.rol === "Psicólogo" && ["Programada", "Reprogramada"].includes(c.estado) && puedeMarcarAusencia(c) ? `
                            <button class="btn btn-fantasma btn-sm" data-marcar-ausencia="${c.id}">Marcar no asistió</button>
                        ` : ""}
                        ${!puedeGestionarCita(c) && !ESTADOS_TERMINALES_CITA.includes(c.estado) &&
                            (!esPaciente || (esTutor
                                ? c.agendadaPorTutor && c.agendadaPorTutor.cedula === sesion.cedula
                                : c.pacienteCedula === sesion.cedula)) ? `
                            <small class="campo-nota">Fuera del plazo permitido para cambios.</small>
                        ` : ""}
                    </div>
                </td>
            </tr>
        `).join("");

    }

    function agregarRegistroCambio(cita, accion) {
        const cambios = cita.historialCambios || [];
        return [...cambios, {
            accion,
            fecha: new Date().toISOString(),
            usuarioCedula: sesion.cedula,
            usuarioNombre: sesion.nombre,
            rol: sesion.rol
        }];
    }

    function notificarCambioCita(cita, estado) {

        const destinatarios = sesion.rol === "Psicólogo"
            ? [cita.pacienteCedula, cita.agendadaPorTutor?.cedula,
                ...(cita.pacientesAdicionales || []).map((paciente) => paciente.cedula)].filter(Boolean)
            : [cita.psicologoCedula, ...(esTutor ? [cita.pacienteCedula] : [])];
        const titulo = estado === "Cancelada"
            ? "Cita cancelada"
            : estado === "No asistió" ? "Inasistencia registrada" : "Cita reprogramada";
        const texto = estado === "Cancelada"
            ? `La cita del ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora} fue cancelada por ${sesion.nombre}.`
            : estado === "No asistió"
                ? `El especialista registró que no hubo ingresos a la cita del ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}.`
                : `La cita fue reprogramada para el ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}.`;

        [...new Set(destinatarios)].forEach((destinatarioCedula) => {
            HelpsyData.agregarNotificacion({
                clave: `cita:${cita.id}:${estado}:${cita.actualizadaEn}:${destinatarioCedula}`,
                destinatarioCedula,
                tipo: titulo,
                titulo,
                texto
            });
        });

    }

    function actualizarHorasReprogramacion() {
        const citaId = document.getElementById("reprogramar-id").value;
        const cita = HelpsyData.obtenerCitas().find((registro) => registro.id === citaId);
        const fecha = document.getElementById("reprogramar-fecha").value;
        const selector = document.getElementById("reprogramar-hora");
        selector.replaceChildren();

        if (!cita || !fecha) return;

        HelpsyData.HORAS_CATALOGO.forEach((hora) => {
            const validacion = HelpsyData.validarDisponibilidadCita(
                cita.psicologoId,
                fecha,
                hora,
                cita.id
            );
            const futura = HelpsyData.horasHastaCita({ fecha, hora }) > 0;
            const opcion = document.createElement("option");
            opcion.value = hora;
            opcion.disabled = !validacion.valida || !futura;
            opcion.textContent = opcion.disabled
                ? `${hora} (${futura ? validacion.motivo.toLowerCase() : "hora pasada"})`
                : hora;
            selector.appendChild(opcion);
        });

        const primeraDisponible = Array.from(selector.options).find((opcion) => !opcion.disabled);
        if (primeraDisponible) selector.value = primeraDisponible.value;
    }

    document.getElementById("tabla-citas").addEventListener("click", (evento) => {

        const btnReprogramar = evento.target.closest("[data-reprogramar]");
        const btnCancelar = evento.target.closest("[data-cancelar]");
        const btnAusencia = evento.target.closest("[data-marcar-ausencia]");
        if (btnReprogramar) {

            const cita = HelpsyData.obtenerCitas().find((registro) => registro.id === btnReprogramar.dataset.reprogramar);
            if (!cita || !puedeGestionarCita(cita)) {
                HelpsyUI.toast(`La cita debe modificarse con ${politicaCitas.anticipacionHoras} horas de anticipación.`, "error");
                pintar();
                return;
            }
            document.getElementById("reprogramar-id").value = cita.id;
            document.getElementById("reprogramar-fecha").min = HelpsyData.fechaBogotaISO();
            document.getElementById("reprogramar-fecha").value = cita.fecha;
            document.getElementById("aviso-politica-reprogramacion").textContent = textoPolitica;
            actualizarHorasReprogramacion();
            HelpsyUI.abrirModal("modal-reprogramar");

        }

        if (btnAusencia) {

            if (!confirm("¿Registrar que no hubo ingresos a esta consulta?")) return;

            if (!HelpsyData.marcarNoAsistencia(btnAusencia.dataset.marcarAusencia, sesion)) {
                HelpsyUI.toast("No se pudo registrar la ausencia. Verifica el estado de la cita.", "error");
                pintar();
                return;
            }

            const cita = HelpsyData.obtenerCitas().find((registro) => registro.id === btnAusencia.dataset.marcarAusencia);
            notificarCambioCita(cita, "No asistió");
            HelpsyData.registrarActividad("Citas", `${sesion.nombre} registró la inasistencia de la cita ${cita.id}.`);
            HelpsyUI.toast("Inasistencia registrada y notificada.", "info");
            pintar();

        }

        if (btnCancelar) {

            if (!confirm(`¿Cancelar esta cita? ${textoPolitica}`)) return;

            const citas = HelpsyData.obtenerCitas();
            const indice = citas.findIndex((c) => c.id === btnCancelar.dataset.cancelar);
            if (indice === -1 || !puedeGestionarCita(citas[indice])) {
                HelpsyUI.toast(`La cita debe cancelarse con ${politicaCitas.anticipacionHoras} horas de anticipación.`, "error");
                pintar();
                return;
            }

            citas[indice].estado = "Cancelada";
            citas[indice].historialCambios = agregarRegistroCambio(citas[indice], "Cancelada");
            citas[indice].actualizadaEn = new Date().toISOString();
            if (!HelpsyData.guardarCitas(citas)) {
                HelpsyUI.toast("No se pudo cancelar la cita.", "error");
                return;
            }
            notificarCambioCita(citas[indice], "Cancelada");
            HelpsyData.registrarActividad("Citas", `${sesion.nombre} canceló la cita ${citas[indice].id}.`);
            HelpsyUI.toast("Cita cancelada. El paciente y el especialista verán el estado actualizado.", "info");
            pintar();

        }

    });

    document.getElementById("cerrar-modal-reprogramar").addEventListener("click", () => HelpsyUI.cerrarModal("modal-reprogramar"));
    document.getElementById("cancelar-modal-reprogramar").addEventListener("click", () => HelpsyUI.cerrarModal("modal-reprogramar"));
    document.getElementById("reprogramar-fecha").addEventListener("change", actualizarHorasReprogramacion);

    document.getElementById("form-reprogramar").addEventListener("submit", (evento) => {

        evento.preventDefault();

        const id = document.getElementById("reprogramar-id").value;
        const fecha = document.getElementById("reprogramar-fecha").value;
        const hora = document.getElementById("reprogramar-hora").value;

        if (!fecha) {
            HelpsyUI.toast("Elige una fecha.", "error");
            return;
        }

        const citas = HelpsyData.obtenerCitas();
        const indice = citas.findIndex((c) => c.id === id);

        if (indice === -1 || !puedeGestionarCita(citas[indice])) {
            HelpsyUI.toast(`La cita debe modificarse con ${politicaCitas.anticipacionHoras} horas de anticipación.`, "error");
            HelpsyUI.cerrarModal("modal-reprogramar");
            pintar();
            return;
        }

        const disponibilidad = HelpsyData.validarDisponibilidadCita(
            citas[indice].psicologoId,
            fecha,
            hora,
            id
        );
        if (!disponibilidad.valida || HelpsyData.horasHastaCita({ fecha, hora }) <= 0) {
            HelpsyUI.toast(disponibilidad.valida
                ? "La nueva fecha y hora deben estar en el futuro."
                : `${disponibilidad.motivo} Elige otra fecha u hora.`, "error");
            actualizarHorasReprogramacion();
            return;
        }

        const cita = citas[indice];
        cita.historialCambios = agregarRegistroCambio(cita, "Reprogramada");
        cita.fecha = fecha;
        cita.hora = hora;
        cita.estado = "Reprogramada";
        cita.actualizadaEn = new Date().toISOString();
        if (!HelpsyData.guardarCitas(citas)) {
            HelpsyUI.toast("No se pudo guardar la reprogramación.", "error");
            return;
        }

        notificarCambioCita(cita, "Reprogramada");
        HelpsyData.registrarActividad("Citas", `${sesion.nombre} reprogramó la cita ${cita.id} para ${HelpsyData.formatearFechaBogota(fecha)} a las ${hora}.`);
        HelpsyUI.cerrarModal("modal-reprogramar");
        HelpsyUI.toast("Cita reprogramada. El paciente y el especialista verán la nueva hora.", "exito");
        pintar();

    });

    pintar();

});
