document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("diario", "Diario emocional");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor")) return;

    const esTutor = sesion.rol === "Tutor";
    const REGLA_ALERTA_RIESGO_VALIDADA = false;
    const campoMenor = document.getElementById("campo-diario-menor");
    const selectMenor = document.getElementById("diario-menor");

    // RF-27 (Tutor "por el menor"): todo lo que antes usaba la cédula de
    // la sesión ahora usa el documento del menor seleccionado, cuando
    // quien está en sesión es un Tutor.
    let identificadorActivo = sesion.cedula;
    let nombreActivo = sesion.nombre;

    if (esTutor) {

        const menoresConConsentimiento = HelpsyData.obtenerMenores(sesion.cedula)
            .filter((m) => HelpsyData.menorTieneConsentimiento(m.documento));

        if (menoresConConsentimiento.length === 0) {

            document.querySelector("main.contenido").innerHTML = `
                <div class="topbar" id="helpsy-topbar"></div>
                <div class="estado-vacio" style="margin-top: 20px;">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>No tienes menores con consentimiento registrado</strong>
                    <span>Ve a "Mis menores" para registrar uno antes de usar el diario emocional.</span>
                </div>
            `;
            HelpsyUI.montarShell("menores", "Diario emocional");
            return;

        }

        campoMenor.classList.remove("oculto");
        selectMenor.innerHTML = menoresConConsentimiento
            .map((m) => `<option value="${m.documento}">${m.nombre}</option>`)
            .join("");

        identificadorActivo = selectMenor.value;
        nombreActivo = menoresConConsentimiento.find((m) => m.documento === identificadorActivo)?.nombre;

        selectMenor.addEventListener("change", async () => {
            identificadorActivo = selectMenor.value;
            actualizarAvisoHoy();
            await pintarHistorialYGrafico();
            pintarInstrumentos();
        });

    }

    const OPCIONES_ANIMO = [
        { valor: 1, emoji: "😞", texto: "Mal" },
        { valor: 2, emoji: "😕", texto: "Bajo" },
        { valor: 3, emoji: "😐", texto: "Regular" },
        { valor: 4, emoji: "🙂", texto: "Bien" },
        { valor: 5, emoji: "😄", texto: "Muy bien" }
    ];

    const INSTRUMENTOS = {
        bienestar: [{ id: "WHO-5", nombre: "WHO-5", maximo: 25 }],
        ansiedad: [{ id: "GAD-7", nombre: "GAD-7", maximo: 21 }],
        depresion: [{ id: "PHQ-9", nombre: "PHQ-9", maximo: 27 }],
        estres: [{ id: "PSS-10", nombre: "PSS-10", maximo: 40 }]
    };

    let seleccion = null;
    let grafico = null;
    let diasGrafica = 7;

    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    const grid = document.getElementById("animo-grid");

    grid.innerHTML = OPCIONES_ANIMO.map((o) => `
        <button type="button" class="animo-opcion" data-valor="${o.valor}">
            <span class="emoji">${o.emoji}</span>
            ${o.texto}
        </button>
    `).join("");

    grid.addEventListener("click", (evento) => {

        const boton = evento.target.closest(".animo-opcion");
        if (!boton) return;

        grid.querySelectorAll(".animo-opcion").forEach((b) => b.classList.remove("seleccionado"));
        boton.classList.add("seleccionado");
        seleccion = OPCIONES_ANIMO.find((o) => o.valor === Number(boton.dataset.valor));

    });

    let hoy = HelpsyData.fechaBogotaISO();

    function yaRegistroHoy() {
        return HelpsyData.obtenerDiario(identificadorActivo).some((e) => e.fechaISO === hoy);
    }

    async function generarAlertaPorTendencia() {

        if (!REGLA_ALERTA_RIESGO_VALIDADA || esTutor) return false;

        const entradas = HelpsyData.obtenerDiario(identificadorActivo)
            .slice()
            .sort((a, b) => b.fechaISO.localeCompare(a.fechaISO))
            .slice(0, 3);
        if (entradas.length < 3 || entradas.some((entrada) => entrada.animo > 2)) return false;

        const fechasConsecutivas = entradas.every((entrada, indice) => {
            if (indice === 0) return true;
            const fechaActual = new Date(`${entradas[indice - 1].fechaISO}T12:00:00Z`);
            const fechaAnterior = new Date(`${entrada.fechaISO}T12:00:00Z`);
            return Math.round((fechaActual - fechaAnterior) / 86400000) === 1;
        });
        if (!fechasConsecutivas) return false;

        const claveOrigen = `diario-${identificadorActivo}-${entradas[0].fechaISO}`;
        const citasVinculadas = HelpsyData.obtenerCitas()
            .filter((cita) => cita.pacienteCedula === identificadorActivo && cita.psicologoCedula);
        const profesionales = [...new Map(citasVinculadas.map((cita) => [
            cita.psicologoCedula,
            { cedula: cita.psicologoCedula, nombre: cita.psicologoNombre }
        ])).values()];

        if (profesionales.length === 0) return false;

        const alertasPrevias = HelpsyData.obtenerAlertasRiesgo(identificadorActivo);
        const detalleCifrado = await HelpsyUI.cifrarTexto(
            "Señal automática de seguimiento: se registró ánimo bajo en tres días consecutivos. Es una regla demostrativa pendiente de validación clínica; revisar con criterio profesional.",
            identificadorActivo
        );

        profesionales.forEach((profesional) => {
            const duplicada = alertasPrevias.some((alerta) =>
                alerta.claveOrigen === claveOrigen && alerta.especialistaCedula === profesional.cedula
            );
            if (duplicada) return;

            HelpsyData.agregarAlertaRiesgo({
                id: `auto-${Date.now()}-${profesional.cedula}`,
                pacienteCedula: identificadorActivo,
                pacienteNombre: nombreActivo,
                especialistaCedula: profesional.cedula,
                especialistaNombre: profesional.nombre,
                nivel: "Señal automática para revisar",
                origen: "diario-emocional-prototipo",
                claveOrigen,
                detalleCifrado
            });
        });

        return true;

    }

    function actualizarAvisoHoy() {

        const aviso = document.getElementById("aviso-ya-registrado");
        const boton = document.getElementById("btn-guardar-diario");

        if (yaRegistroHoy()) {
            aviso.textContent = "Ya registraste tu ánimo hoy. Puedes guardar de nuevo para reemplazarlo.";
            aviso.classList.remove("oculto");
        } else {
            aviso.classList.add("oculto");
        }

    }

    function actualizarInstrumentosDisponibles() {

        const categoria = document.getElementById("instrumento-categoria").value;
        const instrumentosCategoria = INSTRUMENTOS[categoria];
        const select = document.getElementById("instrumento-nombre");
        select.innerHTML = instrumentosCategoria.map((instrumento) =>
            `<option value="${instrumento.id}" data-maximo="${instrumento.maximo}">${instrumento.nombre}</option>`
        ).join("");
        document.getElementById("instrumento-maximo").value = instrumentosCategoria[0].maximo;
        document.getElementById("instrumento-puntaje").max = instrumentosCategoria[0].maximo;

    }

    function obtenerOrientacionInstrumento(instrumento, puntaje) {

        if (instrumento === "GAD-7") {
            const banda = puntaje <= 4 ? "mínimo" : puntaje <= 9 ? "leve" : puntaje <= 14 ? "moderado" : "alto";
            return {
                texto: `El puntaje cae en el rango de tamizaje ${banda} usual para GAD-7. Si te preocupa cómo te sientes, conversa con un profesional.`,
                categoria: "Ansiedad y estrés"
            };
        }

        if (instrumento === "PHQ-9") {
            const banda = puntaje <= 4 ? "mínimo" : puntaje <= 9 ? "leve" : puntaje <= 14 ? "moderado" : puntaje <= 19 ? "moderadamente alto" : "alto";
            return {
                texto: `El puntaje cae en el rango de tamizaje ${banda} usual para PHQ-9. Este resultado por sí solo no establece un diagnóstico; busca interpretación profesional.`,
                categoria: "Depresión"
            };
        }

        if (instrumento === "WHO-5") {
            return {
                texto: puntaje <= 13
                    ? "El puntaje está en el rango que suele sugerir revisar el bienestar con un profesional. No constituye un diagnóstico."
                    : "El puntaje no alcanza el punto de corte de tamizaje usual para bienestar disminuido. Si algo te preocupa, conversa con un profesional.",
                categoria: ""
            };
        }

        return {
            texto: "PSS-10 no tiene un punto de corte clínico universal. Revisa el resultado con un profesional y observa cambios a lo largo del tiempo.",
            categoria: "Ansiedad y estrés"
        };

    }

    function pintarInstrumentos() {

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Resultados de instrumentos", identificadorActivo);
        const registros = HelpsyData.obtenerSeguimientos(identificadorActivo).slice().reverse();
        const lista = document.getElementById("lista-instrumentos");

        lista.innerHTML = registros.length
            ? registros.map((registro) => `
                <div class="diario-entrada">
                    <div class="diario-entrada-texto">
                        <strong>${registro.instrumento} · ${registro.categoria}</strong>
                        <p>Puntaje: ${registro.puntaje} de ${registro.maximo}</p>
                        ${registro.orientacion ? `<p>${escaparHTML(registro.orientacion)}</p>` : ""}
                    </div>
                    <span class="diario-entrada-fecha">${HelpsyData.formatearFechaBogota(registro.fecha)}</span>
                </div>
            `).join("")
            : `<p class="campo-nota">Todavía no hay resultados registrados.</p>`;

    }

    document.getElementById("btn-guardar-diario").addEventListener("click", async () => {

        hoy = HelpsyData.fechaBogotaISO();

        if (!seleccion) {
            HelpsyUI.toast("Elige primero cómo te sientes hoy.", "error");
            return;
        }

        const notas = document.getElementById("diario-notas").value.trim();

        // Las notas son el dato más sensible del diario (reflexiones
        // personales), así que se cifran antes de tocar localStorage.
        // Se cifran con el documento del TITULAR (paciente o menor), no
        // con la cédula de quien hace clic, para que la llave de
        // descifrado no dependa de quién esté de tutor en ese momento.
        const notasCifradas = await HelpsyUI.cifrarTexto(notas, identificadorActivo);

        HelpsyData.agregarEntradaDiario({
            id: `d${Date.now()}`,
            pacienteCedula: identificadorActivo,
            registradoPorTutor: esTutor ? { cedula: sesion.cedula, nombre: sesion.nombre } : null,
            fechaISO: hoy,
            fecha: HelpsyData.formatearFechaBogota(hoy),
            animo: seleccion.valor,
            animoTexto: seleccion.texto,
            emoji: seleccion.emoji,
            notaPrivada: document.getElementById("diario-nota-privada").checked,
            notasCifradas
        });

        const alertaGenerada = await generarAlertaPorTendencia();

        HelpsyUI.toast("Registro de hoy guardado (notas cifradas).", "exito");
        if (alertaGenerada) {
            HelpsyUI.toast("Se generó una señal de seguimiento para el equipo tratante. No es una valoración clínica.", "exito");
        }

        document.getElementById("diario-notas").value = "";
        document.getElementById("diario-nota-privada").checked = false;
        grid.querySelectorAll(".animo-opcion").forEach((b) => b.classList.remove("seleccionado"));
        seleccion = null;

        actualizarAvisoHoy();
        await pintarHistorialYGrafico();

    });

    async function pintarHistorialYGrafico() {

        // RF-43: leer el diario emocional de alguien es acceder a un
        // dato clínico sensible; queda en la auditoría aunque sea el
        // propio titular (o su tutor) quien lo esté viendo.
        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Diario emocional", identificadorActivo);

        const entradas = HelpsyData.obtenerDiario(identificadorActivo);
        const lista = document.getElementById("lista-diario");

        document.getElementById("contador-diario").textContent = `${entradas.length} registros`;

        if (entradas.length === 0) {

            lista.innerHTML = `
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>Aún no hay registros para este periodo</strong>
                    <span>Cuando te venga bien, puedes registrar cómo te sientes.</span>
                </div>
            `;

        } else {

            // Se descifran las notas de cada entrada antes de pintarlas.
            const entradasConNotas = await Promise.all(
                [...entradas].reverse().map(async (e) => ({
                    ...e,
                    notasTexto: e.notasCifradas
                        ? await HelpsyUI.descifrarTexto(e.notasCifradas, identificadorActivo)
                        : (e.notas || "") // compatibilidad con registros viejos sin cifrar
                }))
            );

            lista.innerHTML = entradasConNotas.map((e) => `
                <div class="diario-entrada">
                    <span class="diario-entrada-emoji">${e.emoji}</span>
                    <div class="diario-entrada-texto">
                        <strong>${escaparHTML(e.animoTexto)}</strong>
                        <p>${escaparHTML(e.notasTexto || "Sin notas.")}</p>
                    </div>
                    <span class="diario-entrada-fecha">${HelpsyData.formatearFechaBogota(e.fecha)}</span>
                </div>
            `).join("");

        }

        if (grafico) grafico.destroy();

        const lienzo = document.getElementById("grafico-diario");
        const fechaFinalISO = HelpsyData.fechaBogotaISO();
        const entradasPorFecha = new Map(entradas.map((entrada) => [entrada.fechaISO, entrada]));
        const fechas = Array.from({ length: diasGrafica }, (_, indice) => {
            const fechaISO = HelpsyData.sumarDiasFechaISO(fechaFinalISO, indice - diasGrafica + 1);
            return {
                fechaISO,
                etiqueta: HelpsyData.formatearFechaBogota(fechaISO),
                entrada: entradasPorFecha.get(fechaISO)
            };
        });

        const etiquetas = fechas.map((dia) => dia.etiqueta);
        const valores = fechas.map((dia) => dia.entrada?.animo ?? null);

        if (typeof Chart === "undefined") {
            HelpsyUI.dibujarGraficaEmocional(lienzo, etiquetas, valores, "#3b6df0");
            return;
        }

        grafico = new Chart(lienzo.getContext("2d"), {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [{
                    label: "Estado de ánimo",
                    data: valores,
                    borderColor: "#3b6df0",
                    backgroundColor: "rgba(59,109,240,0.12)",
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 1, max: 5, ticks: { stepSize: 1 } }
                },
                spanGaps: false
            }
        });

    }

    document.querySelectorAll("[data-periodo]").forEach((boton) => {
        boton.addEventListener("click", async () => {
            diasGrafica = Number(boton.dataset.periodo);
            document.querySelectorAll("[data-periodo]").forEach((opcion) => {
                opcion.setAttribute("aria-pressed", String(opcion === boton));
                opcion.classList.toggle("btn-primario", opcion === boton);
                opcion.classList.toggle("btn-fantasma", opcion !== boton);
            });
            await pintarHistorialYGrafico();
        });
    });

    document.getElementById("instrumento-categoria").addEventListener("change", actualizarInstrumentosDisponibles);

    document.getElementById("instrumento-nombre").addEventListener("change", (evento) => {
        const maximo = Number(evento.target.selectedOptions[0].dataset.maximo);
        document.getElementById("instrumento-maximo").value = maximo;
        document.getElementById("instrumento-puntaje").max = maximo;
    });

    document.getElementById("btn-guardar-instrumento").addEventListener("click", () => {

        const instrumento = document.getElementById("instrumento-nombre").value;
        const categoria = document.getElementById("instrumento-categoria").value;
        const puntajeTexto = document.getElementById("instrumento-puntaje").value;
        const puntaje = Number(puntajeTexto);
        const maximo = Number(document.getElementById("instrumento-maximo").value);

        if (puntajeTexto === "" || !Number.isInteger(puntaje) || !Number.isInteger(maximo) || puntaje < 0 || maximo < 1 || puntaje > maximo) {
            HelpsyUI.toast("Ingresa un puntaje entero dentro del rango indicado.", "error");
            return;
        }

        const orientacion = obtenerOrientacionInstrumento(instrumento, puntaje);

        const guardado = HelpsyData.agregarSeguimiento({
            id: `seg${Date.now()}`,
            pacienteCedula: identificadorActivo,
            categoria,
            instrumento,
            puntaje,
            maximo,
            orientacion: orientacion.texto,
            fechaISO: HelpsyData.fechaBogotaISO(),
            fecha: HelpsyData.formatearFechaBogota(HelpsyData.fechaBogotaISO()),
            registradoPor: { cedula: sesion.cedula, nombre: sesion.nombre, rol: sesion.rol }
        });

        if (!guardado) {
            HelpsyUI.toast("No se pudo guardar el resultado.", "error");
            return;
        }

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Registro de instrumento", identificadorActivo);
        document.getElementById("instrumento-puntaje").value = "";
        const destino = orientacion.categoria
            ? `<a class="btn btn-fantasma btn-sm" href="psicologos.html?categoria=${encodeURIComponent(orientacion.categoria)}">Ver especialistas: ${orientacion.categoria}</a>`
            : "";
        const panelOrientacion = document.getElementById("orientacion-instrumento");
        panelOrientacion.classList.remove("oculto");
        panelOrientacion.innerHTML = `<p><strong>Orientación no diagnóstica:</strong> ${escaparHTML(orientacion.texto)}</p>${destino}`;
        HelpsyUI.toast("Resultado guardado.", "exito");
        pintarInstrumentos();

    });

    actualizarAvisoHoy();
    actualizarInstrumentosDisponibles();
    pintarInstrumentos();
    pintarHistorialYGrafico();

});
