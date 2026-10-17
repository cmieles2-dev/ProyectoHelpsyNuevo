document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("mis-pacientes", "Mis pacientes");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Psicólogo")) return;

    const citas = HelpsyData.obtenerCitas().filter((c) =>
        c.psicologoCedula === sesion.cedula &&
        c.pagado &&
        ["Programada", "Reprogramada", "En curso"].includes(c.estado)
    );

    const mapaPacientes = new Map();

    citas.forEach((c) => {

        const participantes = [
            { cedula: c.pacienteCedula, nombre: c.pacienteNombre },
            ...(c.pacientesAdicionales || [])
        ];

        participantes.forEach((participante) => {
            if (!mapaPacientes.has(participante.cedula)) {
                mapaPacientes.set(participante.cedula, {
                    cedula: participante.cedula,
                    nombre: participante.nombre,
                    sesiones: 0,
                    ultimaCita: c.fecha
                });
            }

            const paciente = mapaPacientes.get(participante.cedula);
            paciente.sesiones++;
            if (c.fecha > paciente.ultimaCita) paciente.ultimaCita = c.fecha;
        });

    });

    const pacientes = Array.from(mapaPacientes.values());
    const INSTRUMENTOS = {
        bienestar: { nombre: "WHO-5", maximo: 25 },
        ansiedad: { nombre: "GAD-7", maximo: 21 },
        depresion: { nombre: "PHQ-9", maximo: 27 },
        estres: { nombre: "PSS-10", maximo: 40 }
    };
    let pacienteActivo = null;
    let graficoPaciente = null;

    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    document.getElementById("contador-pacientes").textContent = `${pacientes.length} pacientes`;

    const contenedor = document.getElementById("lista-pacientes");

    if (pacientes.length === 0) {

        contenedor.innerHTML = `
            <div class="estado-vacio">
                ${HelpsyUI.ICONOS.vacio}
                <strong>Todavía no tienes pacientes</strong>
                <span>Cuando alguien agende y pague una cita contigo, aparecerá aquí.</span>
            </div>
        `;

        return;

    }

    contenedor.innerHTML = `
        <div class="tabla-envoltura">
            <table class="tabla-datos">
                <thead><tr><th>Paciente</th><th>Sesiones</th><th>Última cita</th><th></th></tr></thead>
                <tbody>
                    ${pacientes.map((p) => `
                        <tr>
                            <td>
                                <div class="fila-persona">
                                    <span class="avatar-mini">${escaparHTML(HelpsyUI.iniciales(p.nombre))}</span>
                                    ${escaparHTML(p.nombre)}
                                </div>
                            </td>
                            <td>${p.sesiones}</td>
                            <td>${p.ultimaCita}</td>
                            <td><button class="btn btn-fantasma btn-sm" data-ver-diario="${escaparHTML(p.cedula)}" data-nombre="${escaparHTML(p.nombre)}">Ver diario</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    function pintarGraficoPaciente(entradas) {

        if (graficoPaciente) graficoPaciente.destroy();

        const fechaFinalISO = HelpsyData.fechaBogotaISO();
        const mapa = new Map(entradas.map((entrada) => [entrada.fechaISO, entrada.animo]));
        const dias = Array.from({ length: 30 }, (_, indice) => {
            const iso = HelpsyData.sumarDiasFechaISO(fechaFinalISO, indice - 29);
            return { iso, etiqueta: HelpsyData.formatearFechaBogota(iso) };
        });

        const lienzo = document.getElementById("grafico-paciente");
        const etiquetas = dias.map((dia) => dia.etiqueta);
        const valores = dias.map((dia) => mapa.get(dia.iso) ?? null);

        if (typeof Chart === "undefined") {
            HelpsyUI.dibujarGraficaEmocional(lienzo, etiquetas, valores, "#16a34a");
            return;
        }

        graficoPaciente = new Chart(lienzo, {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [{
                    label: "Estado de ánimo",
                    data: valores,
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22,163,74,0.12)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } },
                spanGaps: false
            }
        });

    }

    function pintarResultadosInstrumentos(cedula) {

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Resultados de instrumentos", cedula);
        const registros = HelpsyData.obtenerSeguimientos(cedula).slice().reverse();
        document.getElementById("lista-instrumentos-paciente").innerHTML = registros.length
            ? registros.map((registro) => `
                <div class="diario-entrada">
                    <div class="diario-entrada-texto">
                        <strong>${registro.instrumento} · ${registro.categoria}</strong>
                        <p>Puntaje: ${registro.puntaje} de ${registro.maximo}</p>
                    </div>
                    <span class="diario-entrada-fecha">${HelpsyData.formatearFechaBogota(registro.fecha)}</span>
                </div>
            `).join("")
            : `<p class="campo-nota">Sin resultados registrados.</p>`;

    }

    function actualizarInstrumentoSeleccionado() {

        const categoria = document.getElementById("instrumento-categoria-paciente").value;
        const instrumento = INSTRUMENTOS[categoria];
        document.getElementById("instrumento-nombre-paciente").innerHTML =
            `<option value="${instrumento.nombre}">${instrumento.nombre}</option>`;
        document.getElementById("instrumento-maximo-paciente").value = instrumento.maximo;
        document.getElementById("instrumento-puntaje-paciente").max = instrumento.maximo;

    }

    async function pintarAlertasRiesgo(cedula) {

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Alertas de riesgo", cedula);
        const alertas = HelpsyData.obtenerAlertasRiesgo(cedula, sesion.cedula);
        const alertasConDetalle = await Promise.all(alertas.map(async (alerta) => ({
            ...alerta,
            detalle: alerta.detalleCifrado
                ? await HelpsyUI.descifrarTexto(alerta.detalleCifrado, cedula)
                : "Sin detalle adicional."
        })));

        document.getElementById("lista-alertas-riesgo").innerHTML = alertasConDetalle.length
            ? alertasConDetalle.map((alerta) => `
                <div class="diario-entrada">
                    <div class="diario-entrada-texto">
                        <strong>${escaparHTML(alerta.nivel)} · ${escaparHTML(alerta.estado)}</strong>
                        <p>${escaparHTML(alerta.detalle)}</p>
                    </div>
                    <span class="diario-entrada-fecha">${escaparHTML(HelpsyData.formatearFechaBogota(alerta.creadaEn, true))}</span>
                </div>
            `).join("")
            : `<p class="campo-nota">No hay alertas abiertas para este paciente.</p>`;

    }

    actualizarInstrumentoSeleccionado();
    document.getElementById("instrumento-categoria-paciente").addEventListener("change", actualizarInstrumentoSeleccionado);

    document.getElementById("btn-guardar-instrumento-paciente").addEventListener("click", () => {

        if (!pacienteActivo || !pacientes.some((paciente) => paciente.cedula === pacienteActivo.cedula)) return;

        const categoria = document.getElementById("instrumento-categoria-paciente").value;
        const puntajeTexto = document.getElementById("instrumento-puntaje-paciente").value;
        const puntaje = Number(puntajeTexto);
        const maximo = INSTRUMENTOS[categoria].maximo;

        if (puntajeTexto === "" || !Number.isInteger(puntaje) || puntaje < 0 || puntaje > maximo) {
            HelpsyUI.toast("Ingresa un puntaje entero dentro del rango indicado.", "error");
            return;
        }

        const guardado = HelpsyData.agregarSeguimiento({
            id: `seg${Date.now()}`,
            pacienteCedula: pacienteActivo.cedula,
            categoria,
            instrumento: INSTRUMENTOS[categoria].nombre,
            puntaje,
            maximo,
            fechaISO: HelpsyData.fechaBogotaISO(),
            fecha: HelpsyData.formatearFechaBogota(HelpsyData.fechaBogotaISO()),
            registradoPor: { cedula: sesion.cedula, nombre: sesion.nombre, rol: sesion.rol }
        });

        if (!guardado) {
            HelpsyUI.toast("No se pudo guardar el resultado.", "error");
            return;
        }

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Registro de instrumento", pacienteActivo.cedula);
        document.getElementById("instrumento-puntaje-paciente").value = "";
        pintarResultadosInstrumentos(pacienteActivo.cedula);
        HelpsyUI.toast("Resultado guardado.", "exito");

    });

    contenedor.addEventListener("click", async (evento) => {

        const boton = evento.target.closest("[data-ver-diario]");
        if (!boton) return;

        const cedula = boton.dataset.verDiario;
        const nombre = boton.dataset.nombre;
        pacienteActivo = pacientes.find((paciente) => paciente.cedula === cedula);
        if (!pacienteActivo) return;

        // RF-43 / RNF-05: un especialista accediendo al diario de un
        // paciente es exactamente el tipo de acceso que debe quedar en
        // la auditoría, sea o no uno de sus pacientes vinculados.
        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Diario emocional de paciente", cedula);

        const entradas = HelpsyData.obtenerDiario(cedula);

        document.getElementById("titulo-diario-paciente").textContent = `Diario de ${nombre}`;

        const panel = document.getElementById("panel-diario-paciente");
        panel.classList.remove("oculto");
        panel.scrollIntoView({ behavior: "smooth", block: "start" });

        const contenedorNotas = document.getElementById("contenido-diario-paciente");

        if (entradas.length === 0) {

            contenedorNotas.innerHTML = `
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>Este paciente aún no ha registrado su ánimo</strong>
                    <span>Cuando lo haga, sus entradas aparecerán aquí.</span>
                </div>
            `;

        } else {

            contenedorNotas.innerHTML = `<p style="font-size:11px; color:var(--gris-500);">Cargando registros...</p>`;

            const entradasConNotas = await Promise.all(
                [...entradas].reverse().map(async (e) => ({
                    ...e,
                    notasTexto: e.notaPrivada
                        ? null
                        : e.notasCifradas
                            ? await HelpsyUI.descifrarTexto(e.notasCifradas, cedula)
                            : (e.notas || "")
                }))
            );

            contenedorNotas.innerHTML = entradasConNotas.map((e) => `
                <div class="diario-entrada">
                    <span class="diario-entrada-emoji">${e.emoji}</span>
                    <div class="diario-entrada-texto">
                        <strong>${escaparHTML(e.animoTexto)}</strong>
                        <p>${escaparHTML(e.notaPrivada ? "Nota privada." : e.notasTexto || "Sin notas.")}</p>
                    </div>
                    <span class="diario-entrada-fecha">${HelpsyData.formatearFechaBogota(e.fecha)}</span>
                </div>
            `).join("");

        }

        pintarGraficoPaciente(entradas);
        pintarResultadosInstrumentos(cedula);
        await pintarAlertasRiesgo(cedula);

    });

    const formularioAlerta = document.getElementById("form-alerta-riesgo");
    document.getElementById("btn-nueva-alerta").addEventListener("click", () => {
        if (!pacienteActivo) {
            HelpsyUI.toast("Selecciona primero un paciente vinculado.", "error");
            return;
        }
        formularioAlerta.classList.toggle("oculto");
    });

    document.getElementById("btn-cancelar-alerta").addEventListener("click", () => {
        formularioAlerta.reset();
        formularioAlerta.classList.add("oculto");
    });

    formularioAlerta.addEventListener("submit", async (evento) => {

        evento.preventDefault();
        if (!pacienteActivo || !pacientes.some((paciente) => paciente.cedula === pacienteActivo.cedula)) {
            HelpsyUI.toast("La alerta solo puede registrarse sobre un paciente vinculado.", "error");
            return;
        }

        const detalle = document.getElementById("alerta-descripcion").value.trim();
        if (detalle.length < 3) {
            HelpsyUI.toast("Describe brevemente la observación clínica.", "error");
            return;
        }

        const alerta = {
            id: `ar${Date.now()}`,
            pacienteCedula: pacienteActivo.cedula,
            pacienteNombre: pacienteActivo.nombre,
            especialistaCedula: sesion.cedula,
            especialistaNombre: sesion.nombre,
            nivel: document.getElementById("alerta-nivel").value,
            detalleCifrado: await HelpsyUI.cifrarTexto(detalle, pacienteActivo.cedula)
        };

        if (!HelpsyData.agregarAlertaRiesgo(alerta)) {
            HelpsyUI.toast("No se pudo guardar la alerta.", "error");
            return;
        }

        HelpsyData.registrarAccesoSensible(sesion.nombre, sesion.rol, "Registro de alerta de riesgo", pacienteActivo.cedula);
        formularioAlerta.reset();
        formularioAlerta.classList.add("oculto");
        await pintarAlertasRiesgo(pacienteActivo.cedula);
        HelpsyUI.toast("Alerta de riesgo guardada.", "exito");

    });

    document.getElementById("btn-cerrar-diario").addEventListener("click", () => {
        document.getElementById("panel-diario-paciente").classList.add("oculto");
        pacienteActivo = null;
    });

});
