document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("menores", "Mis menores");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Tutor")) return;

    const tabla = document.getElementById("tabla-menores");
    const contador = document.getElementById("contador-menores");
    const formulario = document.getElementById("form-menor");
    const modalTitulo = document.getElementById("modal-menor-titulo");

    function edadEnAnios(fechaNacimientoISO) {

        const [anio, mes, dia] = fechaNacimientoISO.split("-").map(Number);
        const [anioHoy, mesHoy, diaHoy] = HelpsyData.fechaBogotaISO().split("-").map(Number);

        let edad = anioHoy - anio;
        const aunNoCumple = (mesHoy < mes) ||
            (mesHoy === mes && diaHoy < dia);

        if (aunNoCumple) edad -= 1;

        return edad;

    }

    function pintarTabla() {

        const menores = HelpsyData.obtenerMenores(sesion.cedula);

        contador.textContent = menores.length === 0
            ? "Todavía no has registrado ningún menor."
            : `${menores.length} menor${menores.length === 1 ? "" : "es"} a tu cargo.`;

        if (menores.length === 0) {

            tabla.innerHTML = `
                <tr><td colspan="6">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>No tienes menores registrados</strong>
                        <span>Usa "Registrar menor" para crear su perfil y dar tu consentimiento.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        tabla.innerHTML = menores.map((m) => `
            <tr>
                <td>
                    <div class="fila-persona">
                        <span class="avatar-mini">${HelpsyUI.iniciales(m.nombre)}</span>
                        ${m.nombre}
                    </div>
                </td>
                <td>${m.documento}</td>
                <td>${HelpsyData.formatearFechaBogota(m.fechaNacimiento)} (${edadEnAnios(m.fechaNacimiento)} años)</td>
                <td>${m.relacion}</td>
                <td>
                    ${HelpsyData.consentimientoVigente(m.consentimiento)
                        ? `<span class="badge badge-verde">Vigente (v${m.consentimiento.version})</span>`
                        : `<span class="badge badge-rojo">Falta</span>`}
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-icono" data-editar="${m.id}" aria-label="Editar ${m.nombre}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");

    }

    function abrirModalNuevo() {

        formulario.reset();
        document.getElementById("menor-id").value = "";
        modalTitulo.textContent = "Registrar menor";
        document.querySelectorAll("#form-menor .campo-error").forEach((e) => e.textContent = "");
        HelpsyUI.abrirModal("modal-menor");

    }

    function abrirModalEditar(id) {

        const menor = HelpsyData.obtenerMenores(sesion.cedula).find((m) => m.id === id);
        if (!menor) return;

        modalTitulo.textContent = "Editar menor";
        document.getElementById("menor-id").value = menor.id;
        document.getElementById("menor-nombre").value = menor.nombre;
        document.getElementById("menor-documento").value = menor.documento;
        document.getElementById("menor-nacimiento").value = menor.fechaNacimiento;
        document.getElementById("menor-relacion").value = menor.relacion;
        document.getElementById("menor-consentimiento").checked =
            HelpsyData.consentimientoVigente(menor.consentimiento);

        document.querySelectorAll("#form-menor .campo-error").forEach((e) => e.textContent = "");
        HelpsyUI.abrirModal("modal-menor");

    }

    document.getElementById("btn-nuevo-menor").addEventListener("click", abrirModalNuevo);
    document.getElementById("cerrar-modal-menor").addEventListener("click", () => HelpsyUI.cerrarModal("modal-menor"));
    document.getElementById("cancelar-modal-menor").addEventListener("click", () => HelpsyUI.cerrarModal("modal-menor"));

    tabla.addEventListener("click", (evento) => {

        const boton = evento.target.closest("[data-editar]");
        if (boton) abrirModalEditar(boton.dataset.editar);

    });

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        document.querySelectorAll("#form-menor .campo-error").forEach((e) => e.textContent = "");

        const id = document.getElementById("menor-id").value;
        const nombre = document.getElementById("menor-nombre").value.trim();
        const documento = document.getElementById("menor-documento").value.trim();
        const fechaNacimiento = document.getElementById("menor-nacimiento").value;
        const relacion = document.getElementById("menor-relacion").value;
        const consentimientoMarcado = document.getElementById("menor-consentimiento").checked;

        let valido = true;

        if (nombre.length < 3) {
            document.getElementById("error-menor-nombre").textContent = "Escribe el nombre completo del menor.";
            valido = false;
        }

        if (!/^\d{6,15}$/.test(documento)) {
            document.getElementById("error-menor-documento").textContent = "Documento inválido.";
            valido = false;
        }

        if (!fechaNacimiento) {
            document.getElementById("error-menor-nacimiento").textContent = "Selecciona la fecha de nacimiento.";
            valido = false;
        } else if (fechaNacimiento > HelpsyData.fechaBogotaISO()) {
            document.getElementById("error-menor-nacimiento").textContent = "La fecha de nacimiento no puede estar en el futuro.";
            valido = false;
        } else if (edadEnAnios(fechaNacimiento) >= 18) {
            window.location.assign("registro.html");
            return;
        }

        // RF-11: sin consentimiento marcado, no se guarda el perfil como
        // habilitado para agendar — se exige aquí en vez de dejarlo para
        // "después", que es justo el hueco que la norma busca cerrar.
        if (!consentimientoMarcado) {
            document.getElementById("error-menor-consentimiento").textContent =
                "Debes marcar el consentimiento informado para registrar al menor.";
            valido = false;
        }

        const menores = HelpsyData.obtenerMenores();
        const documentoDuplicado = menores.some((m) => m.documento === documento && m.id !== id);

        if (valido && documentoDuplicado) {
            document.getElementById("error-menor-documento").textContent = "Ya existe un menor registrado con ese documento.";
            valido = false;
        }

        if (!valido) return;

        const consentimiento = HelpsyData.registrarConsentimiento(sesion.cedula, documento, sesion.nombre);

        if (id) {

            const indice = menores.findIndex((m) => m.id === id);
            if (indice === -1) {
                HelpsyUI.toast("No se encontró el perfil del menor para actualizar.", "error");
                return;
            }
            const historialConsentimientos = menores[indice].historialConsentimientos ||
                (menores[indice].consentimiento ? [menores[indice].consentimiento] : []);
            menores[indice] = {
                ...menores[indice],
                nombre,
                documento,
                fechaNacimiento,
                relacion,
                consentimiento,
                historialConsentimientos: [...historialConsentimientos, consentimiento]
            };
            HelpsyData.guardarMenores(menores);
            HelpsyData.registrarActividad("Menores", `${sesion.nombre} actualizó el perfil del menor ${nombre}.`);
            HelpsyUI.toast("Perfil del menor actualizado.", "exito");

        } else {

            HelpsyData.agregarMenor({
                id: `m${Date.now()}`,
                tutorCedula: sesion.cedula,
                tutorNombre: sesion.nombre,
                nombre,
                documento,
                fechaNacimiento,
                relacion,
                consentimiento,
                historialConsentimientos: [consentimiento]
            });

            HelpsyData.registrarActividad("Menores", `${sesion.nombre} registró al menor ${nombre} (consentimiento v${consentimiento.version}).`);
            HelpsyUI.toast("Menor registrado con el consentimiento dado.", "exito");

        }

        HelpsyUI.cerrarModal("modal-menor");
        pintarTabla();

    });

    pintarTabla();

});
