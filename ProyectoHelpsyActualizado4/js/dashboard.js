document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("dashboard", "Panel de administración");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const usuarios = HelpsyData.obtenerUsuarios();
    const psicologos = HelpsyData.obtenerPsicologos();
    const cuentas = [
        ...usuarios.map((usuario) => ({ ...usuario, tipo: "usuario" })),
        ...psicologos.map((psicologo) => ({ ...psicologo, tipo: "psicologo" }))
    ];
    const cuentasActivas = cuentas.filter((cuenta) =>
        (cuenta.estado || "Activo") === "Activo" && (cuenta.tipo !== "psicologo" ||
            !["Pendiente", "Rechazado"].includes(cuenta.estadoVerificacion))
    ).length;
    const citas = HelpsyData.obtenerCitas();
    const registrosDiario = HelpsyData.contarRegistrosDiario();

    /* -------------------- Tarjetas de resumen -------------------- */

    document.getElementById("stat-grid").innerHTML = `
        <div class="stat-card">
            <div class="stat-card-encabezado">
                <span class="stat-card-icono icono-azul-suave">${HelpsyUI.ICONOS.usuarios}</span>
                Usuarios registrados
            </div>
            <strong>${cuentas.length}</strong>
            <small>Pacientes, especialistas y administradores</small>
        </div>

        <div class="stat-card">
            <div class="stat-card-encabezado">
                <span class="stat-card-icono icono-verde-suave">${HelpsyUI.ICONOS.seguimiento}</span>
                Cuentas activas
            </div>
            <strong>${cuentasActivas}</strong>
            <small>Habilitadas para usar el sistema</small>
        </div>

        <div class="stat-card">
            <div class="stat-card-encabezado">
                <span class="stat-card-icono icono-naranja-suave">${HelpsyUI.ICONOS.reportes}</span>
                Citas registradas
            </div>
            <strong>${citas.length}</strong>
            <small>${citas.filter((cita) => !["Cancelada", "Completada", "Asistió", "No asistió"].includes(cita.estado) && HelpsyData.horasHastaCita(cita) >= 0).length} activas o futuras</small>
        </div>

        <div class="stat-card">
            <div class="stat-card-encabezado">
                <span class="stat-card-icono icono-morado-suave">${HelpsyUI.ICONOS.indicadores}</span>
                Registros emocionales
            </div>
            <strong>${registrosDiario}</strong>
            <small>Entradas guardadas en el diario</small>
        </div>
    `;

    const estadosCita = ["Programada", "Reprogramada", "En curso", "Asistió", "No asistió", "Completada", "Cancelada"];
    document.getElementById("resumen-citas").innerHTML = estadosCita.map((estado) => {
        const cantidad = citas.filter((cita) => cita.estado === estado).length;
        return `<div class="progreso-fila"><div class="progreso-etiqueta"><span>${estado}</span><strong>${cantidad}</strong></div></div>`;
    }).join("");

    /* -------------------- Carga de datos reciente -------------------- */

    const cargas = HelpsyData.obtenerCargas();

    document.getElementById("cargas-recientes").innerHTML = cargas.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>Todavía no has cargado archivos</strong>
                <span>Cuando subas un archivo en "Carga de datos", aparecerá aquí.</span>
            </div>
        `
        : `<div class="lista-simple">${cargas.slice(0, 4).map((carga) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.carga}</div>
                <div class="lista-item-texto">
                    <strong>${carga.nombreArchivo}</strong>
                    <span>${carga.registros} registros · ${HelpsyData.formatearFechaBogota(carga.fecha, true)}</span>
                </div>
                <span class="badge badge-verde">Cargado</span>
            </div>
        `).join("")}</div>`;

});
