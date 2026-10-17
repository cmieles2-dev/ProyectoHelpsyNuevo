document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("talleres", "Talleres grupales");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Psicólogo")) return;

    const esPsicologo = sesion.rol === "Psicólogo";

    document.getElementById("titulo-talleres").textContent = esPsicologo
        ? "Talleres que has creado"
        : "Talleres disponibles";

    document.getElementById("info-talleres").innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        ${esPsicologo
            ? "Crea sesiones grupales virtuales abiertas a cualquier paciente de Helpsy."
            : "Sesiones grupales virtuales con cupo limitado. Inscríbete antes de que se llenen."}
    `;

    if (esPsicologo) {

        document.getElementById("btn-nuevo-taller").classList.remove("oculto");

        document.getElementById("btn-nuevo-taller").addEventListener("click", () => {

            document.getElementById("form-taller").reset();
            document.getElementById("taller-fecha").min = HelpsyData.fechaBogotaISO();
            HelpsyUI.abrirModal("modal-taller");

        });

        document.getElementById("cerrar-modal-taller").addEventListener("click", () => HelpsyUI.cerrarModal("modal-taller"));
        document.getElementById("cancelar-modal-taller").addEventListener("click", () => HelpsyUI.cerrarModal("modal-taller"));

        document.getElementById("form-taller").addEventListener("submit", (evento) => {

            evento.preventDefault();

            const titulo = document.getElementById("taller-titulo").value.trim();
            const descripcion = document.getElementById("taller-descripcion").value.trim();
            const fecha = document.getElementById("taller-fecha").value;
            const hora = document.getElementById("taller-hora").value;
            const cupoMaximo = Number(document.getElementById("taller-cupo").value);

            if (titulo.length < 3 || !fecha) {
                HelpsyUI.toast("Completa el título y la fecha del taller.", "error");
                return;
            }

            HelpsyData.agregarTaller({
                id: `tll${Date.now()}`,
                titulo,
                descripcion,
                fecha,
                hora,
                cupoMaximo,
                psicologoNombre: sesion.nombre,
                psicologoCedula: sesion.cedula
            });

            HelpsyData.registrarActividad("Talleres", `${sesion.nombre} creó el taller "${titulo}".`);
            HelpsyUI.cerrarModal("modal-taller");
            HelpsyUI.toast("Taller creado.", "exito");
            pintar();

        });

    }

    function pintar() {

        const todos = HelpsyData.obtenerTalleres()
            .filter((t) => !esPsicologo || t.psicologoCedula === sesion.cedula)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        document.getElementById("contador-talleres").textContent = `${todos.length} talleres`;

        const grid = document.getElementById("grid-talleres");

        if (todos.length === 0) {

            grid.innerHTML = `
                <div class="estado-vacio" style="grid-column: 1/-1;">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>No hay talleres todavía</strong>
                    <span>${esPsicologo ? "Crea el primero con el botón de arriba." : "Vuelve pronto, los psicólogos publican talleres nuevos regularmente."}</span>
                </div>
            `;

            return;

        }

        grid.innerHTML = todos.map((t) => {

            const cuposLibres = t.cupoMaximo - t.inscritos.length;
            const yaInscrito = !esPsicologo && t.inscritos.some((i) => i.cedula === sesion.cedula);
            const lleno = cuposLibres <= 0;

            return `
                <div class="psicologo-card">
                    <div class="psicologo-card-encabezado">
                        <div class="psicologo-avatar">${HelpsyUI.iniciales(t.psicologoNombre)}</div>
                        <div>
                            <h3>${t.titulo}</h3>
                            <span class="psicologo-especialidad">${t.psicologoNombre}</span>
                        </div>
                    </div>
                    <p class="bio">${t.descripcion || "Sin descripción."}</p>
                    <div class="psicologo-calificacion">
                        📅 ${HelpsyData.formatearFechaBogota(t.fecha)} · ${t.hora}
                    </div>
                    <div class="psicologo-card-pie">
                        <div class="psicologo-tarifa">
                            <strong>${t.inscritos.length}/${t.cupoMaximo}</strong>
                            <span>inscritos</span>
                        </div>
                        ${botonAccionTaller(t, yaInscrito, lleno)}
                    </div>
                </div>
            `;

        }).join("");

    }

    function botonAccionTaller(taller, yaInscrito, lleno) {

        if (esPsicologo) {

            const nombres = taller.inscritos.map((i) => i.nombre).join(", ") || "Nadie inscrito todavía";
            return `<button class="btn btn-fantasma btn-sm" title="${nombres}" data-ver-inscritos="${taller.id}">Ver inscritos</button>`;

        }

        if (yaInscrito) {
            return `<button class="btn btn-peligro btn-sm" data-cancelar-taller="${taller.id}">Cancelar cupo</button>`;
        }

        if (lleno) {
            return `<button class="btn btn-fantasma btn-sm" disabled>Sin cupo</button>`;
        }

        return `<button class="btn btn-primario btn-sm" data-inscribir-taller="${taller.id}">Inscribirme</button>`;

    }

    document.getElementById("grid-talleres").addEventListener("click", (evento) => {

        const botonInscribir = evento.target.closest("[data-inscribir-taller]");
        const botonCancelar = evento.target.closest("[data-cancelar-taller]");
        const botonVerInscritos = evento.target.closest("[data-ver-inscritos]");

        if (botonInscribir) {

            const resultado = HelpsyData.inscribirseATaller(botonInscribir.dataset.inscribirTaller, sesion.cedula, sesion.nombre);

            if (resultado.ok) {
                HelpsyUI.toast("Te inscribiste al taller.", "exito");
                pintar();
            } else {
                HelpsyUI.toast(resultado.motivo, "error");
            }

        }

        if (botonCancelar) {

            if (confirm("¿Cancelar tu cupo en este taller?")) {
                HelpsyData.cancelarInscripcionTaller(botonCancelar.dataset.cancelarTaller, sesion.cedula);
                HelpsyUI.toast("Cupo cancelado.", "info");
                pintar();
            }

        }

        if (botonVerInscritos) {

            const taller = HelpsyData.obtenerTalleres().find((t) => t.id === botonVerInscritos.dataset.verInscritos);
            const nombres = taller?.inscritos.map((i) => i.nombre).join("\n") || "Nadie inscrito todavía.";
            alert(`Inscritos en "${taller?.titulo}":\n\n${nombres}`);

        }

    });

    pintar();

});
