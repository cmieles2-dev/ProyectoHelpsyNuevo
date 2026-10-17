document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("psicologo", "Bienvenido a Helpsy");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Psicólogo")) return;

    const citas = HelpsyData.obtenerCitas().filter((c) => c.psicologoCedula === sesion.cedula);

    const citasFuturas = citas
        .filter((c) => !["Cancelada", "Completada", "Asistió", "No asistió"].includes(c.estado))
        .sort((a, b) => HelpsyData.horasHastaCita(a) - HelpsyData.horasHastaCita(b));

    const pacientesUnicos = new Map();
    citas.forEach((c) => pacientesUnicos.set(c.pacienteCedula, c.pacienteNombre));

    const tareasAsignadas = HelpsyData.obtenerTareas().filter((t) => t.psicologoNombre === sesion.nombre);
    const tareasPendientesRevision = tareasAsignadas.filter((t) => t.estado === "Pendiente");

    document.getElementById("stat-grid-psicologo").innerHTML = `
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-azul-suave">${HelpsyUI.ICONOS.usuarios}</span>Pacientes</div>
            <strong>${pacientesUnicos.size}</strong><small>Con al menos una cita contigo</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-verde-suave">${HelpsyUI.ICONOS.citas}</span>Próximas sesiones</div>
            <strong>${citasFuturas.length}</strong><small>Confirmadas y pagadas</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-naranja-suave">${HelpsyUI.ICONOS.tareas}</span>Tareas asignadas</div>
            <strong>${tareasAsignadas.length}</strong><small>${tareasPendientesRevision.length} aún pendientes</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-morado-suave">${HelpsyUI.ICONOS.estrella}</span>Calificación</div>
            <strong>${(HelpsyData.obtenerPsicologos().find((p) => p.cedula === sesion.cedula)?.calificacion || 5).toFixed(1)}</strong>
            <small>Promedio de tus pacientes</small>
        </div>
    `;

    const contenedorCitas = document.getElementById("proximas-citas");

    contenedorCitas.innerHTML = citasFuturas.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>No tienes sesiones agendadas</strong>
                <span>Aparecerán aquí cuando un paciente te agende y pague.</span>
            </div>
        `
        : `<div class="lista-simple">${citasFuturas.slice(0, 4).map((c) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.citas}</div>
                <div class="lista-item-texto">
                    <strong>${c.pacienteNombre}</strong>
                    <span>${HelpsyData.formatearFechaBogota(c.fecha)} a las ${c.hora}</span>
                </div>
                <span class="badge badge-azul">${c.estado}</span>
            </div>
        `).join("")}</div>`;

    const contenedorPacientes = document.getElementById("lista-pacientes-resumen");
    const pacientesArray = Array.from(pacientesUnicos, ([cedula, nombre]) => ({ cedula, nombre }));

    contenedorPacientes.innerHTML = pacientesArray.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>Aún no tienes pacientes</strong>
                <span>Tu perfil ya es visible en "Buscar psicólogos" para nuevos pacientes.</span>
            </div>
        `
        : `<div class="lista-simple">${pacientesArray.slice(0, 4).map((p) => `
            <div class="lista-item">
                <span class="avatar-mini">${HelpsyUI.iniciales(p.nombre)}</span>
                <div class="lista-item-texto"><strong>${p.nombre}</strong></div>
            </div>
        `).join("")}</div>`;

    /* ================================================================
       RF-16: disponibilidad propia (días + horas que ofrece)
    ================================================================ */

    const psicologoActual = HelpsyData.obtenerPsicologos().find((p) => p.cedula === sesion.cedula);
    const disponibilidad = psicologoActual?.disponibilidad || HelpsyData.disponibilidadPorDefecto();

    const contenedorDias = document.getElementById("disponibilidad-dias");
    const contenedorHoras = document.getElementById("disponibilidad-horas");

    contenedorDias.innerHTML = HelpsyData.DIAS_SEMANA.map((dia) => `
        <button type="button" class="chip-opcion ${disponibilidad.dias.includes(dia) ? "activo" : ""}" data-dia="${dia}">${dia}</button>
    `).join("");

    contenedorHoras.innerHTML = HelpsyData.HORAS_CATALOGO.map((hora) => `
        <button type="button" class="chip-opcion ${disponibilidad.horas.includes(hora) ? "activo" : ""}" data-hora="${hora}">${hora}</button>
    `).join("");

    contenedorDias.addEventListener("click", (evento) => {
        const chip = evento.target.closest("[data-dia]");
        if (chip) chip.classList.toggle("activo");
    });

    contenedorHoras.addEventListener("click", (evento) => {
        const chip = evento.target.closest("[data-hora]");
        if (chip) chip.classList.toggle("activo");
    });

    document.getElementById("btn-guardar-disponibilidad").addEventListener("click", () => {

        const diasActivos = Array.from(contenedorDias.querySelectorAll(".chip-opcion.activo")).map((c) => c.dataset.dia);
        const horasActivas = Array.from(contenedorHoras.querySelectorAll(".chip-opcion.activo")).map((c) => c.dataset.hora);

        if (diasActivos.length === 0 || horasActivas.length === 0) {
            HelpsyUI.toast("Elige al menos un día y una hora, o nadie podrá agendar contigo.", "error");
            return;
        }

        const psicologos = HelpsyData.obtenerPsicologos();
        const indice = psicologos.findIndex((p) => p.cedula === sesion.cedula);

        if (indice !== -1) {

            psicologos[indice].disponibilidad = { dias: diasActivos, horas: horasActivas };
            HelpsyData.guardarPsicologos(psicologos);
            HelpsyData.registrarActividad("Disponibilidad", `${sesion.nombre} actualizó su disponibilidad (${diasActivos.length} días, ${horasActivas.length} horas).`);
            HelpsyUI.toast("Disponibilidad guardada.", "exito");

        }

    });

});
