document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("tareas", "Tareas");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor", "Psicólogo")) return;

    const esPsicologo = sesion.rol === "Psicólogo";
    const esTutor = sesion.rol === "Tutor";

    function fechaLocalISO(fecha = new Date()) {
        return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"), String(fecha.getDate()).padStart(2, "0")].join("-");
    }

    function escaparHTML(texto) {
        return String(texto || "").replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    // RF-33 (Tutor "por el menor"): un tutor ve las tareas de todos sus
    // menores con consentimiento vigente, no solo de uno.
    function documentosDeMisMenores() {
        return HelpsyData.obtenerMenores(sesion.cedula)
            .filter((m) => HelpsyData.menorTieneConsentimiento(m.documento))
            .map((m) => m.documento);
    }

    document.getElementById("titulo-tareas").textContent = esPsicologo ? "Tareas que has asignado" : "Tus tareas";

    document.getElementById("info-tareas").innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        ${esPsicologo
            ? "Asigna actividades entre sesiones a tus pacientes y revisa cuáles ya completaron."
            : "Actividades que tu psicólogo te dejó para practicar entre sesiones."}
    `;

    function pacientesDelPsicologo() {

        const citas = HelpsyData.obtenerCitas().filter((c) => c.psicologoCedula === sesion.cedula);
        const mapa = new Map();

        citas.forEach((c) => mapa.set(c.pacienteCedula, c.pacienteNombre));

        return Array.from(mapa, ([cedula, nombre]) => ({ cedula, nombre }));

    }

    function notificarCambioTarea(tarea, accion, titulo, texto) {
        const menor = HelpsyData.obtenerMenorPorDocumento(tarea.pacienteCedula);
        const destinatarios = [tarea.pacienteCedula];
        if (menor && HelpsyData.menorTieneConsentimiento(tarea.pacienteCedula)) {
            destinatarios.push(menor.tutorCedula);
        }
        [...new Set(destinatarios)].forEach((destinatarioCedula) => {
            HelpsyData.agregarNotificacion({
                clave: `tarea:${tarea.id}:${accion}:${tarea.actualizadaEn}:${destinatarioCedula}`,
                destinatarioCedula,
                tipo: titulo,
                titulo,
                texto
            });
        });
    }

    if (esPsicologo) {

        const botonNueva = document.getElementById("btn-nueva-tarea");
        botonNueva.classList.remove("oculto");

        botonNueva.addEventListener("click", () => {

            const pacientes = pacientesDelPsicologo();

            if (pacientes.length === 0) {
                HelpsyUI.toast("Todavía no tienes pacientes con citas agendadas.", "error");
                return;
            }

            document.getElementById("tarea-paciente").innerHTML =
                pacientes.map((p) => `<option value="${p.cedula}">${p.nombre}</option>`).join("");

            document.getElementById("form-tarea").reset();
            document.getElementById("tarea-id").value = "";
            document.getElementById("tarea-paciente").disabled = false;
            document.getElementById("titulo-modal-tarea").textContent = "Asignar tarea";
            document.querySelector('#form-tarea [type="submit"]').textContent = "Asignar";
            document.getElementById("tarea-fecha").min = fechaLocalISO();
            HelpsyUI.abrirModal("modal-tarea");

        });

        function cerrarModalTarea() {
            document.getElementById("tarea-paciente").disabled = false;
            HelpsyUI.cerrarModal("modal-tarea");
        }

        document.getElementById("cerrar-modal-tarea").addEventListener("click", cerrarModalTarea);
        document.getElementById("cancelar-modal-tarea").addEventListener("click", cerrarModalTarea);

        document.getElementById("form-tarea").addEventListener("submit", (evento) => {

            evento.preventDefault();

            const pacienteCedula = document.getElementById("tarea-paciente").value;
            const pacientes = pacientesDelPsicologo();
            const paciente = pacientes.find((p) => p.cedula === pacienteCedula);
            const tareaId = document.getElementById("tarea-id").value;
            const titulo = document.getElementById("tarea-titulo").value.trim();
            const descripcion = document.getElementById("tarea-descripcion").value.trim();
            const fechaLimiteISO = document.getElementById("tarea-fecha").value;

            if (titulo.length < 3) {
                HelpsyUI.toast("Escribe un título para la tarea.", "error");
                return;
            }

            if (descripcion.length < 3) {
                HelpsyUI.toast("Añade instrucciones para la actividad.", "error");
                return;
            }

            if (!paciente || !fechaLimiteISO || fechaLimiteISO < fechaLocalISO()) {
                HelpsyUI.toast("Elige un paciente válido y una fecha límite vigente.", "error");
                return;
            }

            if (tareaId) {
                const tareas = HelpsyData.obtenerTareas();
                const indice = tareas.findIndex((tarea) =>
                    tarea.id === tareaId && tarea.psicologoCedula === sesion.cedula
                );
                if (indice === -1 || tareas[indice].estado !== "Pendiente") {
                    HelpsyUI.toast("Solo puedes editar actividades pendientes asignadas por ti.", "error");
                    return;
                }

                tareas[indice] = {
                    ...tareas[indice],
                    titulo,
                    descripcion,
                    fechaLimiteISO,
                    actualizadaEn: new Date().toISOString()
                };
                if (!HelpsyData.guardarTareas(tareas)) {
                    HelpsyUI.toast("No se pudieron guardar los cambios.", "error");
                    return;
                }

                notificarCambioTarea(
                    tareas[indice],
                    "actualizada",
                    "Actividad actualizada",
                    `${sesion.nombre} actualizó “${titulo}”. Nueva fecha límite: ${HelpsyData.formatearFechaBogota(fechaLimiteISO)}.`
                );
                cerrarModalTarea();
                HelpsyUI.toast("Actividad actualizada.", "exito");
                pintar();
                return;
            }

            const tarea = HelpsyData.agregarTarea({
                id: `t${Date.now()}`,
                pacienteCedula,
                pacienteNombre: paciente.nombre,
                psicologoNombre: sesion.nombre,
                psicologoCedula: sesion.cedula,
                titulo,
                descripcion,
                fechaAsignada: HelpsyData.formatearFechaBogota(HelpsyData.fechaBogotaISO()),
                fechaAsignadaISO: new Date().toISOString(),
                fechaLimiteISO,
                estado: "Pendiente"
            });

            if (!tarea) {
                HelpsyUI.toast("No se pudo asignar la actividad.", "error");
                return;
            }

            HelpsyData.agregarNotificacion({
                clave: `tarea:${tarea.id}:${pacienteCedula}`,
                destinatarioCedula: pacienteCedula,
                tipo: "Actividad asignada",
                titulo: "Nueva actividad asignada",
                texto: `${sesion.nombre} te asignó “${titulo}” con fecha límite ${HelpsyData.formatearFechaBogota(fechaLimiteISO)}.`
            });
            const menor = HelpsyData.obtenerMenorPorDocumento(pacienteCedula);
            if (menor && HelpsyData.menorTieneConsentimiento(pacienteCedula)) {
                HelpsyData.agregarNotificacion({
                    clave: `tarea:${tarea.id}:${menor.tutorCedula}`,
                    destinatarioCedula: menor.tutorCedula,
                    tipo: "Actividad asignada",
                    titulo: "Actividad asignada a tu menor",
                    texto: `${sesion.nombre} asignó “${titulo}” a ${paciente.nombre}.`
                });
            }

            cerrarModalTarea();
            HelpsyUI.toast("Tarea asignada.", "exito");
            pintar();

        });

    }

    function pintar() {

        const tareas = esPsicologo
            ? HelpsyData.obtenerTareas().filter((t) => {
                const pacientes = pacientesDelPsicologo().map((p) => p.cedula);
                return pacientes.includes(t.pacienteCedula) && t.psicologoNombre === sesion.nombre;
            })
            : esTutor
                ? HelpsyData.obtenerTareas().filter((t) => documentosDeMisMenores().includes(t.pacienteCedula))
                : HelpsyData.obtenerTareas(sesion.cedula);

        document.getElementById("contador-tareas").textContent = `${tareas.length} tareas`;

        const progreso = document.getElementById("progreso-semanal-tareas-modulo");
        if (!esPsicologo) {
            const limiteSemana = new Date();
            limiteSemana.setDate(limiteSemana.getDate() - 7);
            const tareasSemana = tareas.filter((tarea) =>
                tarea.fechaAsignadaISO && new Date(tarea.fechaAsignadaISO) >= limiteSemana
            );
            const completadas = tareasSemana.filter((tarea) => tarea.estado === "Completada").length;
            const porcentaje = tareasSemana.length ? Math.round(completadas / tareasSemana.length * 100) : 0;
            progreso.innerHTML = tareasSemana.length
                ? `<div class="progreso-etiqueta"><span>Progreso de esta semana</span><strong>${completadas}/${tareasSemana.length} completadas</strong></div><div class="progreso-pista"><div class="progreso-relleno" style="width:${porcentaje}%;"></div></div>`
                : `<p class="campo-nota">Sin actividades asignadas en los últimos 7 días.</p>`;
        } else {
            progreso.replaceChildren();
        }

        const contenedor = document.getElementById("lista-tareas");

        if (tareas.length === 0) {

            contenedor.innerHTML = `
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>No hay tareas todavía</strong>
                    <span>${esPsicologo ? "Asigna la primera actividad a uno de tus pacientes." : "Tu psicólogo aún no te ha asignado actividades."}</span>
                </div>
            `;

            return;

        }

        contenedor.innerHTML = `<div class="lista-simple">${tareas.map((t) => `
            <div class="lista-item" style="align-items:flex-start;">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.tareas}</div>
                <div class="lista-item-texto">
                    <strong>${escaparHTML(t.titulo)}</strong>
                    <span>${esPsicologo ? `Para ${escaparHTML(t.pacienteNombre)}` : `${esTutor ? `Para ${escaparHTML(t.pacienteNombre)} · ` : ""}Asignada por ${escaparHTML(t.psicologoNombre)}`} · ${escaparHTML(t.fechaAsignada)}</span>
                    ${t.descripcion ? `<p style="margin-top:4px; font-size:11.5px; color:var(--gris-500);">${escaparHTML(t.descripcion)}</p>` : ""}
                    ${t.fechaLimiteISO ? `<p class="campo-nota" style="margin-top:4px;">Fecha límite: ${escaparHTML(HelpsyData.formatearFechaBogota(t.fechaLimiteISO))}</p>` : ""}
                </div>
                ${!esPsicologo && t.estado === "Pendiente"
                    ? `<button class="btn btn-exito btn-sm" data-completar-tarea="${escaparHTML(t.id)}">Marcar hecha</button>`
                    : esPsicologo && t.estado === "Pendiente"
                        ? `<div style="display:flex; gap:6px; flex-wrap:wrap;"><button class="btn btn-fantasma btn-sm" data-editar-tarea="${escaparHTML(t.id)}">Editar</button><button class="btn btn-peligro btn-sm" data-cancelar-tarea="${escaparHTML(t.id)}">Cancelar</button></div>`
                        : `<span class="badge ${t.estado === "Completada" ? "badge-verde" : t.estado === "Cancelada" ? "badge-rojo" : "badge-naranja"}">${escaparHTML(t.estado)}</span>`
                }
            </div>
        `).join("")}</div>`;

    }

    document.getElementById("lista-tareas").addEventListener("click", (evento) => {

        const botonEditar = evento.target.closest("[data-editar-tarea]");
        const botonCancelar = evento.target.closest("[data-cancelar-tarea]");

        if (botonEditar) {
            const tarea = HelpsyData.obtenerTareas().find((registro) =>
                registro.id === botonEditar.dataset.editarTarea &&
                registro.psicologoCedula === sesion.cedula &&
                registro.estado === "Pendiente"
            );
            if (!tarea) return;

            const pacientes = pacientesDelPsicologo();
            if (!pacientes.some((paciente) => paciente.cedula === tarea.pacienteCedula)) {
                HelpsyUI.toast("La relación con este paciente ya no está activa.", "error");
                return;
            }

            const selectorPaciente = document.getElementById("tarea-paciente");
            selectorPaciente.innerHTML = pacientes.map((paciente) =>
                `<option value="${escaparHTML(paciente.cedula)}">${escaparHTML(paciente.nombre)}</option>`
            ).join("");
            selectorPaciente.value = tarea.pacienteCedula;
            selectorPaciente.disabled = true;
            document.getElementById("tarea-id").value = tarea.id;
            document.getElementById("tarea-titulo").value = tarea.titulo;
            document.getElementById("tarea-descripcion").value = tarea.descripcion;
            document.getElementById("tarea-fecha").min = fechaLocalISO();
            document.getElementById("tarea-fecha").value = tarea.fechaLimiteISO;
            document.getElementById("titulo-modal-tarea").textContent = "Editar actividad";
            document.querySelector('#form-tarea [type="submit"]').textContent = "Guardar cambios";
            HelpsyUI.abrirModal("modal-tarea");
            return;
        }

        if (botonCancelar) {
            const tareas = HelpsyData.obtenerTareas();
            const indice = tareas.findIndex((tarea) =>
                tarea.id === botonCancelar.dataset.cancelarTarea &&
                tarea.psicologoCedula === sesion.cedula &&
                tarea.estado === "Pendiente"
            );
            if (indice === -1 || !confirm(`¿Cancelar la actividad “${tareas[indice]?.titulo || ""}”?`)) return;

            tareas[indice].estado = "Cancelada";
            tareas[indice].actualizadaEn = new Date().toISOString();
            if (!HelpsyData.guardarTareas(tareas)) {
                HelpsyUI.toast("No se pudo cancelar la actividad.", "error");
                return;
            }
            notificarCambioTarea(
                tareas[indice],
                "cancelada",
                "Actividad cancelada",
                `${sesion.nombre} canceló “${tareas[indice].titulo}”.`
            );
            HelpsyData.registrarActividad("Tareas", `${sesion.nombre} canceló la actividad ${tareas[indice].id}.`);
            HelpsyUI.toast("Actividad cancelada.", "info");
            pintar();
            return;
        }

        const boton = evento.target.closest("[data-completar-tarea]");
        if (!boton) return;

        const tareas = HelpsyData.obtenerTareas();
        const indice = tareas.findIndex((t) => t.id === boton.dataset.completarTarea);

        if (indice !== -1) {
            const puedeCompletar = esTutor
                ? documentosDeMisMenores().includes(tareas[indice].pacienteCedula)
                : !esPsicologo && tareas[indice].pacienteCedula === sesion.cedula;
            if (!puedeCompletar || tareas[indice].estado !== "Pendiente") return;
            tareas[indice].estado = "Completada";
            tareas[indice].fechaCompletadaISO = new Date().toISOString();
            if (!HelpsyData.guardarTareas(tareas)) {
                HelpsyUI.toast("No se pudo actualizar la actividad.", "error");
                return;
            }
            const psicologo = tareas[indice].psicologoCedula ||
                HelpsyData.obtenerPsicologos().find((registro) => registro.nombre === tareas[indice].psicologoNombre)?.cedula;
            if (psicologo) {
                HelpsyData.agregarNotificacion({
                    clave: `tarea:${tareas[indice].id}:completada:${Date.now()}`,
                    destinatarioCedula: psicologo,
                    tipo: "Actividad completada",
                    titulo: "Actividad completada",
                    texto: `${tareas[indice].pacienteNombre} completó “${tareas[indice].titulo}”.`
                });
            }
            HelpsyUI.toast("Tarea marcada como completada.", "exito");
            pintar();
        }

    });

    pintar();

});
