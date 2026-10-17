document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("seguimiento", "Seguimiento de pacientes avanzado");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const pacientes = HelpsyData.generarPacientes();

    const cuerpoTabla = document.getElementById("tabla-pacientes");
    const contador = document.getElementById("contador-resultados");

    function badgeEstado(estado) {

        const mapa = {
            "Completado": "badge-verde",
            "En progreso": "badge-azul",
            "Reciente": "badge-naranja"
        };

        return `<span class="badge ${mapa[estado] || "badge-gris"}">${estado}</span>`;

    }

    function filtrar() {

        const ips = document.getElementById("f-ips").value;
        const tipo = document.getElementById("f-tipo").value;
        const estado = document.getElementById("f-estado")?.value || "Todos";

        const buscarNombre = document.getElementById("b-nombre").value.trim().toLowerCase();
        const buscarCedula = document.getElementById("b-cedula").value.trim();
        const buscarEspecialista = document.getElementById("b-especialista").value.trim().toLowerCase();

        return pacientes.filter((paciente) => {

            if (ips !== "Todos" && paciente.ips !== ips) return false;
            if (tipo !== "Todos" && paciente.tratamiento !== tipo) return false;
            if (estado !== "Todos" && paciente.estado !== estado) return false;

            if (buscarNombre && !paciente.nombre.toLowerCase().includes(buscarNombre)) return false;
            if (buscarCedula && !paciente.cedula.includes(buscarCedula)) return false;
            if (buscarEspecialista && !paciente.especialista.toLowerCase().includes(buscarEspecialista)) return false;

            return true;

        });

    }

    function pintar() {

        const resultado = filtrar();

        contador.textContent = `${resultado.length} de ${pacientes.length} pacientes`;

        if (resultado.length === 0) {

            cuerpoTabla.innerHTML = `
                <tr><td colspan="9">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>No hay pacientes con estos filtros</strong>
                        <span>Prueba quitando algún filtro o cambiando el término de búsqueda.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        cuerpoTabla.innerHTML = resultado.map((p) => `
            <tr>
                <td>${p.id}</td>
                <td>
                    <div class="fila-persona">
                        <span class="avatar-mini">${HelpsyUI.iniciales(p.nombre)}</span>
                        ${p.nombre}
                    </div>
                </td>
                <td>${p.cedula}</td>
                <td>${p.ips}</td>
                <td>${p.sesiones}</td>
                <td>${p.tratamiento}</td>
                <td>
                    <div class="mini-progreso">
                        <div class="progreso-pista"><div class="progreso-relleno" style="width:${p.seguimiento}%;"></div></div>
                        <span>${p.seguimiento}%</span>
                    </div>
                </td>
                <td>${p.especialista}</td>
                <td>${badgeEstado(p.estado)}</td>
            </tr>
        `).join("");

    }

    // Consultar: vuelve a aplicar filtros (útil tras cambiar selects)
    document.getElementById("btn-consultar").addEventListener("click", () => {
        pintar();
        HelpsyUI.toast("Resultados actualizados con los filtros seleccionados.", "info");
    });

    // Búsqueda en vivo mientras el usuario escribe
    ["b-nombre", "b-cedula", "b-especialista"].forEach((id) => {
        document.getElementById(id).addEventListener("input", pintar);
    });

    // Filtros: muestra/oculta filtros avanzados (estado y rango de fechas)
    document.getElementById("btn-filtros").addEventListener("click", () => {

        const panel = document.getElementById("filtros-avanzados");
        const visible = panel.style.display !== "none";
        panel.style.display = visible ? "none" : "";

    });

    document.getElementById("f-estado")?.addEventListener("change", pintar);

    // Exportar a Excel real con los resultados actualmente filtrados
    document.getElementById("btn-exportar").addEventListener("click", () => {

        const resultado = filtrar();

        HelpsyUI.exportarExcel(
            "seguimiento_pacientes.xlsx",
            "Pacientes",
            resultado.map((p) => ({
                ID: p.id, Nombre: p.nombre, Cedula: p.cedula, "IPS/Hospital": p.ips,
                Sesiones: p.sesiones, Tratamiento: p.tratamiento,
                "Seguimiento (%)": p.seguimiento, Especialista: p.especialista, Estado: p.estado
            }))
        );

    });

    // Salir: cierra sesión con confirmación (mismo botón que "Cerrar sesión")
    document.getElementById("btn-salir").addEventListener("click", () => {

        if (confirm("¿Salir del módulo de seguimiento y cerrar tu sesión?")) {
            HelpsyData.cerrarSesion();
            window.location.href = "login.html";
        }

    });

    pintar();

});
