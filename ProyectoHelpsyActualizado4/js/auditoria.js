document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("auditoria", "Auditoría");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const tabla = document.getElementById("tabla-auditoria");
    const contador = document.getElementById("contador-auditoria");
    const filtroTitular = document.getElementById("filtro-titular-auditoria");
    const filtroUsuario = document.getElementById("filtro-usuario-auditoria");
    const fechaDesde = document.getElementById("fecha-desde-auditoria");
    const fechaHasta = document.getElementById("fecha-hasta-auditoria");
    const buscador = document.getElementById("buscar-auditoria");
    const botonMas = document.getElementById("btn-mas-auditoria");
    let limiteVisible = 100;

    function escaparHTML(texto) {
        return String(texto || "").replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    function obtenerFechaISO(fechaCruda) {
        const legado = String(fechaCruda || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (legado) {
            return `${legado[3]}-${String(legado[2]).padStart(2, "0")}-${String(legado[1]).padStart(2, "0")}`;
        }
        const fecha = new Date(fechaCruda);
        return Number.isNaN(fecha.getTime()) ? "" : HelpsyData.fechaBogotaISO(fecha);
    }

    function pintarEstadisticas() {

        const registros = HelpsyData.obtenerAuditoria();
        const titulares = new Set(registros.map((r) => r.titularCedula)).size;
        const usuarios = new Set(registros.map((r) => r.usuario)).size;

        document.getElementById("stat-grid-auditoria").innerHTML = `
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-azul-suave">${HelpsyUI.ICONOS.reportes}</span>Total de accesos</div>
                <strong>${registros.length}</strong><small>Registrados desde que existe este avance</small>
            </div>
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-morado-suave">${HelpsyUI.ICONOS.usuario}</span>Titulares distintos</div>
                <strong>${titulares}</strong><small>Personas cuyos datos fueron consultados</small>
            </div>
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-verde-suave">${HelpsyUI.ICONOS.usuarios}</span>Personas que accedieron</div>
                <strong>${usuarios}</strong><small>Entre especialistas, tutores y pacientes</small>
            </div>
        `;

    }

    function pintarTabla() {

        const titular = filtroTitular.value.trim().toLowerCase();
        const usuario = filtroUsuario.value.trim().toLowerCase();
        const desde = fechaDesde.value;
        const hasta = fechaHasta.value;
        const texto = buscador.value.trim().toLowerCase();

        const registros = HelpsyData.obtenerAuditoria().filter((r) => {

            if (titular && !String(r.titularCedula || "").toLowerCase().includes(titular)) return false;
            if (usuario && !String(r.usuario || "").toLowerCase().includes(usuario)) return false;
            const fechaISO = obtenerFechaISO(r.fecha);
            if (desde && (!fechaISO || fechaISO < desde)) return false;
            if (hasta && (!fechaISO || fechaISO > hasta)) return false;

            if (texto) {
                const enTexto = String(r.recurso || "").toLowerCase();
                if (!enTexto.includes(texto)) return false;
            }

            return true;

        });

        contador.textContent = `${registros.length} registros · mostrando ${Math.min(limiteVisible, registros.length)}`;

        if (registros.length === 0) {
            botonMas.classList.add("oculto");

            tabla.innerHTML = `
                <tr><td colspan="5">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>No hay accesos que coincidan</strong>
                        <span>Ajusta los filtros, o todavía no se ha accedido a datos sensibles.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        tabla.innerHTML = registros.slice(0, limiteVisible).map((r) => `
            <tr>
                <td>${escaparHTML(HelpsyData.formatearFechaBogota(r.fecha, true))}</td>
                <td>${escaparHTML(r.usuario)}</td>
                <td><span class="badge badge-gris">${escaparHTML(r.rol)}</span></td>
                <td>${escaparHTML(r.recurso)}</td>
                <td>${escaparHTML(r.titularCedula || "—")}</td>
            </tr>
        `).join("");
        botonMas.classList.toggle("oculto", registros.length <= limiteVisible);

    }

    [filtroTitular, filtroUsuario, fechaDesde, fechaHasta, buscador].forEach((campo) => campo.addEventListener("input", () => {
        limiteVisible = 100;
        pintarTabla();
    }));
    botonMas.addEventListener("click", () => {
        limiteVisible += 100;
        pintarTabla();
    });

    pintarEstadisticas();
    pintarTabla();

});
