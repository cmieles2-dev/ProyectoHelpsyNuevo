document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("supervision", "Supervisión del sistema");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    /* -------------------- Resumen del sistema -------------------- */

    document.getElementById("resumen-sistema").innerHTML = `
        <div class="lista-simple">
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.usuarios}</div>
                <div class="lista-item-texto"><strong>${HelpsyData.obtenerUsuarios().length} usuarios</strong><span>Administradores y pacientes</span></div>
            </div>
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.usuario}</div>
                <div class="lista-item-texto"><strong>${HelpsyData.obtenerPsicologos().length} psicólogos</strong><span>Perfiles activos</span></div>
            </div>
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.citas}</div>
                <div class="lista-item-texto"><strong>${HelpsyData.obtenerCitas().length} citas</strong><span>Programadas, asistidas, no asistidas o canceladas</span></div>
            </div>
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.pagos}</div>
                <div class="lista-item-texto"><strong>${HelpsyData.obtenerPagos().length} pagos</strong><span>Procesados (simulados) en este navegador</span></div>
            </div>
        </div>
    `;

    /* -------------------- Copia de seguridad -------------------- */

    document.getElementById("btn-exportar-copia").addEventListener("click", () => {

        const copia = HelpsyData.generarCopiaSeguridad();
        const blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `helpsy-backup-${HelpsyData.fechaBogotaISO()}.json`;
        enlace.click();

        URL.revokeObjectURL(url);

        HelpsyData.registrarActividad("Sistema", `${sesion.nombre} descargó una copia de seguridad.`);
        HelpsyUI.toast("Copia de seguridad descargada.", "exito");

    });

    document.getElementById("input-restaurar").addEventListener("change", (evento) => {

        const archivo = evento.target.files[0];
        if (!archivo) return;

        if (!confirm("Esto sobrescribirá los datos actuales de este navegador con los del archivo. ¿Continuar?")) {
            evento.target.value = "";
            return;
        }

        const lector = new FileReader();

        lector.onload = (e) => {

            try {

                const copia = JSON.parse(e.target.result);
                HelpsyData.restaurarCopiaSeguridad(copia);

                HelpsyData.registrarActividad("Sistema", `${sesion.nombre} restauró una copia de seguridad.`);
                HelpsyUI.toast("Copia restaurada. Recargando...", "exito");

                setTimeout(() => window.location.reload(), 1200);

            } catch (error) {

                console.error(error);
                HelpsyUI.toast("El archivo no es una copia de seguridad válida de Helpsy.", "error");

            }

        };

        lector.readAsText(archivo);

    });

    /* -------------------- Registro de actividad -------------------- */

    const registros = HelpsyData.obtenerActividad();

    document.getElementById("contador-actividad").textContent = `${registros.length} eventos registrados`;

    const contenedorActividad = document.getElementById("lista-actividad");

    contenedorActividad.innerHTML = registros.length === 0
        ? `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>Sin actividad registrada todavía</strong>
                <span>Los inicios de sesión, registros, citas y pagos aparecerán aquí.</span>
            </div>
        `
        : `<div class="lista-simple">${registros.map((r) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.info}</div>
                <div class="lista-item-texto">
                    <strong>${r.descripcion}</strong>
                    <span>${HelpsyData.formatearFechaBogota(r.fecha, true)}</span>
                </div>
                <span class="badge badge-gris">${r.tipo}</span>
            </div>
        `).join("")}</div>`;

});
