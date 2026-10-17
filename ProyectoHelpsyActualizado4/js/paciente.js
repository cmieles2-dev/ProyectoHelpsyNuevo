document.addEventListener("DOMContentLoaded", async () => {

    const sesion = HelpsyUI.montarShell("paciente", "Bienvenido a Helpsy");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente")) return;

    const preferencias = HelpsyData.obtenerPreferencias(sesion.cedula);

    if (preferencias.mensajesMotivacionales) {

        document.getElementById("mensaje-motivacional").innerHTML = `
            <div class="mensaje-dia">
                <span class="mensaje-dia-icono">✨</span>
                <p>${HelpsyData.obtenerMensajeDelDia()}</p>
                <a href="perfil.html" class="mensaje-dia-config" title="Configurar">Configurar</a>
            </div>
        `;

    }

    const citas = HelpsyData.obtenerCitas().filter((c) =>
        c.pacienteCedula === sesion.cedula ||
        (c.pacientesAdicionales || []).some((paciente) => paciente.cedula === sesion.cedula)
    );
    const diario = HelpsyData.obtenerDiario(sesion.cedula);
    const tareas = HelpsyData.obtenerTareas(sesion.cedula);
    const cuestionario = HelpsyData.obtenerCuestionario(sesion.cedula);

    const citasFuturas = citas
        .filter((c) => !["Cancelada", "Completada", "Asistió", "No asistió"].includes(c.estado))
        .sort((a, b) => HelpsyData.horasHastaCita(a) - HelpsyData.horasHastaCita(b));

    const tareasPendientes = tareas.filter((t) => t.estado === "Pendiente");
    const racha = diario.length;

    /* -------------------- Tarjetas de resumen -------------------- */

    document.getElementById("stat-grid-paciente").innerHTML = `
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-azul-suave">${HelpsyUI.ICONOS.citas}</span>Próximas citas</div>
            <strong>${citasFuturas.length}</strong><small>Agendadas y confirmadas</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-verde-suave">${HelpsyUI.ICONOS.diario}</span>Registros del diario</div>
            <strong>${racha}</strong><small>Entradas escritas en total</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-naranja-suave">${HelpsyUI.ICONOS.tareas}</span>Tareas pendientes</div>
            <strong>${tareasPendientes.length}</strong><small>De ${tareas.length} asignadas</small>
        </div>
        <div class="stat-card">
            <div class="stat-card-encabezado"><span class="stat-card-icono icono-morado-suave">${HelpsyUI.ICONOS.info}</span>Bienestar inicial</div>
            <strong>${cuestionario ? cuestionario.banda : "Sin responder"}</strong>
            <small>${cuestionario ? `Cuestionario del ${HelpsyData.formatearFechaBogota(cuestionario.fecha, true)}` : "Aún no completas el cuestionario"}</small>
        </div>
    `;

    /* -------------------- Próxima cita -------------------- */

    const contenedorCita = document.getElementById("proxima-cita");

    if (citasFuturas.length === 0) {

        contenedorCita.innerHTML = `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>No tienes citas agendadas</strong>
                <span>Busca un psicólogo y agenda tu primera sesión.</span>
            </div>
            <a href="psicologos.html" class="btn btn-primario btn-ancho" style="margin-top:12px;">Buscar psicólogos</a>
        `;

    } else {

        const cita = citasFuturas[0];

        contenedorCita.innerHTML = `
            <div class="lista-item" style="align-items:center;">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.citas}</div>
                <div class="lista-item-texto">
                    <strong>${cita.psicologoNombre}</strong>
                    <span>${cita.especialidad} · ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}</span>
                </div>
                <span class="badge badge-azul">${cita.estado}</span>
            </div>
        `;

    }

    /* -------------------- Resumen del diario -------------------- */

    const contenedorDiario = document.getElementById("diario-resumen");
    const ultimasEntradas = await Promise.all(
        [...diario].reverse().slice(0, 3).map(async (entrada) => ({
            ...entrada,
            notasTexto: entrada.notasCifradas
                ? await HelpsyUI.descifrarTexto(entrada.notasCifradas, sesion.cedula)
                : (entrada.notas || "")
        }))
    );

    contenedorDiario.innerHTML = ultimasEntradas.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>Todavía no has escrito en tu diario</strong>
                <span>Registrar cómo te sientes ayuda a ver tu progreso con el tiempo.</span>
            </div>
        `
        : ultimasEntradas.map((entrada) => `
            <div class="diario-entrada">
                <span class="diario-entrada-emoji">${entrada.emoji}</span>
                <div class="diario-entrada-texto">
                    <strong>${entrada.animoTexto}</strong>
                    <p>${entrada.notasTexto || "Sin notas adicionales."}</p>
                </div>
                <span class="diario-entrada-fecha">${HelpsyData.formatearFechaBogota(entrada.fecha)}</span>
            </div>
        `).join("");

    /* -------------------- Resumen de tareas -------------------- */

    const contenedorTareas = document.getElementById("tareas-resumen");

    /* -------------------- Progreso semanal (M5) -------------------- */
    // Semana = últimos 7 días corridos. El % es real: tareas asignadas
    // en esa ventana vs. cuántas de esas ya se completaron.

    const haceSieteDias = new Date();
    haceSieteDias.setDate(haceSieteDias.getDate() - 7);

    const tareasDeLaSemana = tareas.filter((t) =>
        t.fechaAsignadaISO && new Date(t.fechaAsignadaISO) >= haceSieteDias
    );

    const completadasDeLaSemana = tareasDeLaSemana.filter((t) => t.estado === "Completada");

    const porcentajeSemanal = tareasDeLaSemana.length === 0
        ? 0
        : Math.round((completadasDeLaSemana.length / tareasDeLaSemana.length) * 100);

    document.getElementById("progreso-semanal-tareas").innerHTML = tareasDeLaSemana.length === 0
        ? `<p style="font-size:11.5px; color:var(--gris-500);">Sin tareas nuevas en los últimos 7 días.</p>`
        : `
            <div class="progreso-etiqueta">
                <span>Progreso de esta semana</span>
                <strong>${completadasDeLaSemana.length}/${tareasDeLaSemana.length} completadas</strong>
            </div>
            <div class="progreso-pista">
                <div class="progreso-relleno" style="width:${porcentajeSemanal}%;"></div>
            </div>
        `;

    contenedorTareas.innerHTML = tareasPendientes.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.exito}
                <strong>Estás al día con tus tareas</strong>
                <span>No tienes actividades pendientes por ahora.</span>
            </div>
        `
        : `<div class="lista-simple">${tareasPendientes.slice(0, 4).map((t) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.tareas}</div>
                <div class="lista-item-texto">
                    <strong>${t.titulo}</strong>
                    <span>Asignada por ${t.psicologoNombre} · ${HelpsyData.formatearFechaBogota(t.fechaAsignada)}</span>
                </div>
                <span class="badge badge-naranja">Pendiente</span>
            </div>
        `).join("")}</div>`;

});
