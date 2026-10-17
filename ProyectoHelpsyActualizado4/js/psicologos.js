document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("psicologos", "Buscar psicólogos");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor")) return;

    const esTutor = sesion.rol === "Tutor";
    const campoAgendarMenor = document.getElementById("campo-agendar-menor");
    const selectAgendarMenor = document.getElementById("agendar-menor");
    let citaPendienteConsentimiento = null;

    const selectEspecialidad = document.getElementById("filtro-especialidad");
    const buscador = document.getElementById("buscar-psicologo");
    const grid = document.getElementById("grid-psicologos");

    function escaparHTML(texto) {
        return String(texto || "").replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    selectEspecialidad.innerHTML = `<option>Todas</option>` +
        HelpsyData.ESPECIALIDADES.map((e) => `<option>${e}</option>`).join("");

    const categoriaSugerida = new URLSearchParams(window.location.search).get("categoria");
    if (categoriaSugerida && HelpsyData.ESPECIALIDADES.includes(categoriaSugerida)) {
        selectEspecialidad.value = categoriaSugerida;
    }

    function pintar() {

        const especialidad = selectEspecialidad.value;
        const texto = buscador.value.trim().toLowerCase();
        const categoriasActivas = HelpsyData.ESPECIALIDADES;

        const psicologos = HelpsyData.obtenerPsicologos().filter((p) => {

            if (p.estadoVerificacion !== "Aprobado") return false;
            if (p.estado === "Inactivo") return false;
            if (p.correoVerificado === false) return false;
            const categoriasProfesional = (p.categorias || [p.especialidad]).filter((categoria) =>
                categoriasActivas.includes(categoria)
            );
            if (categoriasProfesional.length === 0) return false;
            if (especialidad !== "Todas" && !categoriasProfesional.includes(especialidad)) return false;
            if (texto && !p.nombre.toLowerCase().includes(texto)) return false;

            return true;

        });

        if (psicologos.length === 0) {

            grid.innerHTML = `
                <div class="estado-vacio" style="grid-column: 1/-1;">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>No hay psicólogos con estos filtros</strong>
                    <span>Prueba con otra especialidad o borra la búsqueda.</span>
                </div>
            `;

            return;

        }

        grid.innerHTML = psicologos.map((p) => `
            <div class="psicologo-card">
                <div class="psicologo-card-encabezado">
                    <div class="psicologo-avatar">${HelpsyUI.iniciales(p.nombre)}</div>
                    <div>
                        <h3>${escaparHTML(p.nombre)}</h3>
                        <span class="psicologo-especialidad">${escaparHTML((p.categorias || [p.especialidad]).filter((categoria) => categoriasActivas.includes(categoria)).join(", "))}</span>
                    </div>
                </div>
                <div class="psicologo-calificacion">
                    ${HelpsyUI.ICONOS.estrella} ${p.calificacion.toFixed(1)} · ${p.experiencia} años de experiencia
                </div>
                <p class="campo-nota">${escaparHTML(p.titulo)} · Registro ${escaparHTML(p.registroProfesional)}</p>
                <p class="bio">${escaparHTML(p.bio)}</p>
                <div class="psicologo-card-pie">
                    <div class="psicologo-tarifa">
                        <strong>${HelpsyUI.formatoPesos(p.tarifa)}</strong>
                        <span>por sesión</span>
                    </div>
                    <button class="btn btn-primario btn-sm" data-agendar="${p.id}">Agendar</button>
                </div>
            </div>
        `).join("");

    }

    selectEspecialidad.addEventListener("change", pintar);
    buscador.addEventListener("input", pintar);

    grid.addEventListener("click", (evento) => {

        const boton = evento.target.closest("[data-agendar]");
        if (!boton) return;

        const psicologo = HelpsyData.obtenerPsicologos().find((p) => p.id === boton.dataset.agendar);
        if (!psicologo) return;

        document.getElementById("modal-agendar-titulo").textContent = `Agendar con ${psicologo.nombre}`;
        document.getElementById("agendar-psicologo-id").value = psicologo.id;
        document.getElementById("agendar-fecha").min = HelpsyData.fechaBogotaISO();
        document.getElementById("error-agendar-menor").textContent = "";
        actualizarHorasDisponibles(psicologo.id, document.getElementById("agendar-fecha").value);

        // RF-02/RF-11: un tutor debe elegir para cuál menor agenda, y
        // solo se le ofrecen los menores que ya tienen su consentimiento.
        campoAgendarMenor.classList.toggle("oculto", !esTutor);

        if (esTutor) {

            const menoresConConsentimiento = HelpsyData.obtenerMenores(sesion.cedula)
                .filter((m) => HelpsyData.menorTieneConsentimiento(m.documento));

            selectAgendarMenor.innerHTML = menoresConConsentimiento.length === 0
                ? `<option value="">No tienes menores con consentimiento registrado</option>`
                : menoresConConsentimiento.map((m) => `<option value="${m.documento}">${m.nombre}</option>`).join("");

        }

        HelpsyUI.abrirModal("modal-agendar");

    });

    /* -------------------------------------------------------------
       Disponibilidad en tiempo real: cada vez que se elige una fecha,
       se revisan las citas ya existentes de ESE psicólogo ese día y
       se deshabilitan las horas que ya están tomadas.
    ------------------------------------------------------------- */
    function actualizarHorasDisponibles(psicologoId, fechaISO) {

        const selectHora = document.getElementById("agendar-hora");
        const avisoDisponibilidad = document.getElementById("aviso-disponibilidad");

        const psicologo = HelpsyData.obtenerPsicologos().find((p) => p.id === psicologoId);
        const disponibilidad = psicologo?.disponibilidad || HelpsyData.disponibilidadPorDefecto();

        // RF-16: el día de la semana de la fecha elegida debe estar
        // entre los días que ese psicólogo atiende.
        const diaSemana = fechaISO ? HelpsyData.diaDeLaSemana(fechaISO) : null;
        const diaHabilitado = diaSemana && disponibilidad.dias.includes(diaSemana);

        Array.from(selectHora.options).forEach((opcion) => {

            const ofrecida = disponibilidad.horas.includes(opcion.value);
            const validacion = ofrecida
                ? HelpsyData.validarDisponibilidadCita(psicologoId, fechaISO, opcion.value)
                : { valida: false, motivo: "" };
            const ocupada = !validacion.valida && ofrecida;

            opcion.disabled = !diaHabilitado || !ofrecida || ocupada;

            opcion.textContent = !diaHabilitado
                ? `${opcion.value} (no atiende este día)`
                : !ofrecida
                    ? `${opcion.value} (no ofrecida)`
                    : ocupada
                        ? `${opcion.value} (${validacion.motivo.includes("bloqueó") ? "bloqueado" : validacion.motivo.includes("reservado") ? "ocupado" : "no disponible"})`
                        : opcion.value;

        });

        const todasOcupadas = Array.from(selectHora.options).every((o) => o.disabled);

        if (avisoDisponibilidad) {
            avisoDisponibilidad.textContent = todasOcupadas && fechaISO
                ? (diaHabilitado
                    ? "Este psicólogo no tiene horas libres ese día. Elige otra fecha."
                    : `Este psicólogo no atiende los ${diaSemana || "días que elegiste"}. Elige otra fecha.`)
                : "";
        }

        // Deja seleccionada la primera hora libre, para que el paciente
        // no confirme por accidente una hora que ya está ocupada.
        const primeraLibre = Array.from(selectHora.options).find((o) => !o.disabled);
        if (primeraLibre) selectHora.value = primeraLibre.value;

    }

    document.getElementById("agendar-fecha").addEventListener("change", (evento) => {

        const psicologoId = document.getElementById("agendar-psicologo-id").value;
        actualizarHorasDisponibles(psicologoId, evento.target.value);

    });

    document.getElementById("cerrar-modal-agendar").addEventListener("click", () => HelpsyUI.cerrarModal("modal-agendar"));
    document.getElementById("cancelar-modal-agendar").addEventListener("click", () => HelpsyUI.cerrarModal("modal-agendar"));

    document.getElementById("form-agendar").addEventListener("submit", (evento) => {

        evento.preventDefault();

        const psicologo = HelpsyData.obtenerPsicologos()
            .find((p) => p.id === document.getElementById("agendar-psicologo-id").value);

        if (!psicologo) {
            HelpsyUI.toast("No encontramos el especialista seleccionado.", "error");
            return;
        }

        const fecha = document.getElementById("agendar-fecha").value;
        const hora = document.getElementById("agendar-hora").value;

        if (!fecha) {
            HelpsyUI.toast("Elige una fecha para tu cita.", "error");
            return;
        }

        const disponibilidad = HelpsyData.validarDisponibilidadCita(psicologo.id, fecha, hora);
        if (!disponibilidad.valida) {
            HelpsyUI.toast(`${disponibilidad.motivo} Elige otra fecha u hora.`, "error");
            return;
        }

        let pacienteCedula = sesion.cedula;
        let pacienteNombre = sesion.nombre;
        let agendadaPorTutor = null;

        if (esTutor) {

            const documentoMenor = selectAgendarMenor.value;

            if (!documentoMenor) {
                document.getElementById("error-agendar-menor").textContent =
                    "Registra primero un menor con consentimiento, en \"Mis menores\".";
                return;
            }

            // RF-11: segunda comprobación, en el momento exacto de agendar
            // (y no solo al llenar el selector), por si el consentimiento
            // fue revocado entre que se abrió el modal y se envió el form.
            if (!HelpsyData.menorTieneConsentimiento(documentoMenor)) {
                document.getElementById("error-agendar-menor").textContent =
                    "Este menor no tiene consentimiento vigente: no se puede agendar.";
                return;
            }

            const menor = HelpsyData.obtenerMenorPorDocumento(documentoMenor);
            pacienteCedula = menor.documento;
            pacienteNombre = menor.nombre;
            agendadaPorTutor = { cedula: sesion.cedula, nombre: sesion.nombre };

        }

        const datosAgendamiento = {
            pacienteCedula,
            pacienteNombre,
            agendadaPorTutor,
            psicologoId: psicologo.id,
            psicologoNombre: psicologo.nombre,
            psicologoCedula: psicologo.cedula,
            especialidad: selectEspecialidad.value === "Todas"
                ? (psicologo.categorias || [psicologo.especialidad])[0]
                : selectEspecialidad.value,
            tarifa: psicologo.tarifa,
            fecha,
            hora
        };

        const cuentaActor = HelpsyData.obtenerUsuarios().find((usuario) => usuario.cedula === sesion.cedula);

        if (!cuentaActor || cuentaActor.estado === "Inactivo") {
            HelpsyUI.toast("La cuenta no está activa y no puede agendar consultas.", "error");
            return;
        }

        if (cuentaActor.correoVerificado === false) {
            HelpsyUI.toast("Verifica tu correo desde Mi perfil antes de agendar una cita.", "error");
            return;
        }

        if (!HelpsyData.consentimientoVigente(cuentaActor.consentimiento)) {
            citaPendienteConsentimiento = { datosAgendamiento, cuentaActor };
            document.getElementById("check-consentimiento-consulta").checked = false;
            document.getElementById("aceptar-consentimiento-consulta").disabled = true;
            document.getElementById("error-consentimiento-consulta").textContent = "";
            HelpsyUI.abrirModal("modal-consentimiento-consulta");
            return;
        }

        continuarAlPago(datosAgendamiento);

    });

    function continuarAlPago(datosAgendamiento) {

        // El pago (simulado) confirma la cita y la agrega a "Mis citas".
        sessionStorage.setItem("helpsyCitaPendiente", JSON.stringify(datosAgendamiento));
        window.location.href = "pagos.html?agendar=1";

    }

    const checkConsentimiento = document.getElementById("check-consentimiento-consulta");
    const botonAceptarConsentimiento = document.getElementById("aceptar-consentimiento-consulta");

    checkConsentimiento.addEventListener("change", () => {
        botonAceptarConsentimiento.disabled = !checkConsentimiento.checked;
    });

    ["cerrar-consentimiento-consulta", "cancelar-consentimiento-consulta"].forEach((id) => {
        document.getElementById(id).addEventListener("click", () => {
            citaPendienteConsentimiento = null;
            HelpsyUI.cerrarModal("modal-consentimiento-consulta");
        });
    });

    botonAceptarConsentimiento.addEventListener("click", () => {

        if (!checkConsentimiento.checked || !citaPendienteConsentimiento) {
            document.getElementById("error-consentimiento-consulta").textContent =
                "Debes aceptar ambos consentimientos antes de continuar.";
            return;
        }

        const consentimiento = HelpsyData.registrarConsentimiento(
            sesion.cedula,
            sesion.cedula,
            sesion.nombre
        );

        if (!HelpsyData.actualizarCuenta("usuario", sesion.cedula, { consentimiento })) {
            document.getElementById("error-consentimiento-consulta").textContent =
                "No se pudo registrar tu aceptación. Inténtalo de nuevo.";
            return;
        }

        const datosAgendamiento = citaPendienteConsentimiento.datosAgendamiento;
        citaPendienteConsentimiento = null;
        HelpsyUI.cerrarModal("modal-consentimiento-consulta");
        continuarAlPago(datosAgendamiento);

    });

    pintar();

});
