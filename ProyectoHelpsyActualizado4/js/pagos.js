document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("pagos", "Pagos");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente", "Tutor")) return;

    const zonaCheckout = document.getElementById("zona-checkout");
    const citaPendienteCruda = sessionStorage.getItem("helpsyCitaPendiente");
    const citaPendiente = citaPendienteCruda ? JSON.parse(citaPendienteCruda) : null;

    // Para un Paciente, la cita pendiente es suya. Para un Tutor, es de
    // un menor a su cargo: lo que se compara es quién la agendó, no la
    // cédula del titular (que es la del menor, no la del tutor).
    const citaPerteneceASesion = citaPendiente && (
        citaPendiente.pacienteCedula === sesion.cedula ||
        (citaPendiente.agendadaPorTutor && citaPendiente.agendadaPorTutor.cedula === sesion.cedula)
    );

    if (citaPerteneceASesion) {

        mostrarCheckout(citaPendiente);

    } else {

        zonaCheckout.innerHTML = `
            <div class="tarjeta">
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.pagos}
                    <strong>No tienes ningún pago pendiente</strong>
                    <span>Agenda una cita desde "Buscar psicólogos" para pagarla aquí.</span>
                </div>
                <a href="psicologos.html" class="btn btn-primario btn-ancho" style="margin-top:12px;">Buscar psicólogos</a>
            </div>
        `;

    }

    function mostrarCheckout(cita) {

        zonaCheckout.innerHTML = `
            <div class="grid-dos">

                <div class="tarjeta">
                    <div class="tarjeta-encabezado">
                        <div>
                            <h2>Resumen de tu cita</h2>
                            <p>Confirma los datos antes de pagar.</p>
                        </div>
                    </div>
                    <div class="lista-simple">
                        <div class="lista-item">
                            <div class="lista-item-icono">${HelpsyUI.ICONOS.usuarios}</div>
                            <div class="lista-item-texto"><strong>${cita.psicologoNombre}</strong><span>${cita.especialidad}</span></div>
                        </div>
                        <div class="lista-item">
                            <div class="lista-item-icono">${HelpsyUI.ICONOS.citas}</div>
                            <div class="lista-item-texto"><strong>${HelpsyData.formatearFechaBogota(cita.fecha)}</strong><span>${cita.hora} · Videollamada en Helpsy</span></div>
                        </div>
                        <div class="lista-item">
                            <div class="lista-item-icono">${HelpsyUI.ICONOS.pagos}</div>
                            <div class="lista-item-texto"><strong>${HelpsyUI.formatoPesos(cita.tarifa)}</strong><span>Valor de la sesión</span></div>
                        </div>
                    </div>
                </div>

                <div class="tarjeta">
                    <div class="tarjeta-encabezado">
                        <div>
                            <h2>Pago simulado</h2>
                            <p>Ningún dato de tarjeta se guarda ni se envía a un servidor.</p>
                        </div>
                    </div>

                    <div class="metodo-pago-grid" id="metodo-pago-grid">
                        <button type="button" class="metodo-pago-opcion activo" data-metodo="tarjeta">
                            💳 <span>Tarjeta</span>
                        </button>
                        <button type="button" class="metodo-pago-opcion" data-metodo="pse">
                            🏦 <span>PSE</span>
                        </button>
                        <button type="button" class="metodo-pago-opcion" data-metodo="nequi">
                            📱 <span>Nequi</span>
                        </button>
                    </div>

                    <div id="zona-formulario-pago"></div>

                </div>

            </div>
        `;

        pintarFormularioSegunMetodo("tarjeta");

        document.getElementById("metodo-pago-grid").addEventListener("click", (evento) => {

            const boton = evento.target.closest(".metodo-pago-opcion");
            if (!boton) return;

            document.querySelectorAll(".metodo-pago-opcion").forEach((b) => b.classList.remove("activo"));
            boton.classList.add("activo");
            pintarFormularioSegunMetodo(boton.dataset.metodo);

        });

        function pintarFormularioSegunMetodo(metodo) {

            const zona = document.getElementById("zona-formulario-pago");

            if (metodo !== "tarjeta") {

                zona.innerHTML = `
                    <div class="estado-vacio" style="padding-top: 20px;">
                        ${HelpsyUI.ICONOS.info}
                        <strong>${metodo === "pse" ? "PSE" : "Nequi"} próximamente</strong>
                        <span>La integración con esta pasarela todavía no está conectada en este avance. Usa "Tarjeta" para completar el pago de prueba.</span>
                    </div>
                `;

                return;

            }

            montarFormularioTarjeta(cita);

        }

    }

    function montarFormularioTarjeta(cita) {

        document.getElementById("zona-formulario-pago").innerHTML = `
            <div class="tarjeta-pago-visual">
                <span>💳 Helpsy Pay</span>
                <div class="tarjeta-pago-numero" id="preview-numero">•••• •••• •••• ••••</div>
                <div class="tarjeta-pago-pie">
                    <span id="preview-nombre">NOMBRE APELLIDO</span>
                    <span id="preview-vencimiento">MM/AA</span>
                </div>
            </div>

            <form id="form-pago" style="margin-top:18px;">

                <div class="campo" style="margin-bottom:14px;">
                    <label for="pago-nombre">Nombre en la tarjeta</label>
                    <input type="text" class="input-simple" id="pago-nombre" placeholder="Como aparece en la tarjeta" required>
                </div>

                <div class="campo" style="margin-bottom:14px;">
                    <label for="pago-numero">Número de tarjeta (de prueba)</label>
                    <input type="text" class="input-simple" id="pago-numero" placeholder="4111 1111 1111 1111" maxlength="19" required>
                </div>

                <div class="campo-grupo dos-columnas">
                    <div class="campo">
                        <label for="pago-vencimiento">Vencimiento</label>
                        <input type="text" class="input-simple" id="pago-vencimiento" placeholder="MM/AA" maxlength="5" required>
                    </div>
                    <div class="campo">
                        <label for="pago-cvv">CVV</label>
                        <input type="text" class="input-simple" id="pago-cvv" placeholder="123" maxlength="3" required>
                    </div>
                </div>

                <button type="submit" class="btn btn-exito btn-ancho" style="margin-top:16px;" id="btn-pagar">
                    Pagar ${HelpsyUI.formatoPesos(cita.tarifa)}
                </button>

            </form>
        `;

        const inputNumero = document.getElementById("pago-numero");
        const inputNombre = document.getElementById("pago-nombre");
        const inputVencimiento = document.getElementById("pago-vencimiento");

        inputNumero.addEventListener("input", () => {

            const limpio = inputNumero.value.replace(/\D/g, "").slice(0, 16);
            inputNumero.value = limpio.replace(/(.{4})/g, "$1 ").trim();

            const grupos = limpio.padEnd(16, "•").match(/.{1,4}/g);
            document.getElementById("preview-numero").textContent = grupos.join(" ");

        });

        inputNombre.addEventListener("input", () => {
            document.getElementById("preview-nombre").textContent = inputNombre.value.toUpperCase() || "NOMBRE APELLIDO";
        });

        inputVencimiento.addEventListener("input", () => {

            let valor = inputVencimiento.value.replace(/\D/g, "").slice(0, 4);
            if (valor.length > 2) valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
            inputVencimiento.value = valor;
            document.getElementById("preview-vencimiento").textContent = valor || "MM/AA";

        });

        document.getElementById("form-pago").addEventListener("submit", (evento) => {

            evento.preventDefault();

            const numeroLimpio = inputNumero.value.replace(/\D/g, "");

            if (numeroLimpio.length !== 16) {
                HelpsyUI.toast("El número de tarjeta de prueba debe tener 16 dígitos.", "error");
                return;
            }

            const boton = document.getElementById("btn-pagar");
            boton.disabled = true;
            boton.textContent = "Procesando pago simulado...";

            // Simulación de latencia de pasarela de pago.
            setTimeout(() => confirmarPago(cita), 1100);

        });

    }

    async function confirmarPago(cita) {

        if (cita.agendadaPorTutor && !HelpsyData.menorTieneConsentimiento(cita.pacienteCedula)) {
            sessionStorage.removeItem("helpsyCitaPendiente");
            zonaCheckout.innerHTML = `
                <div class="tarjeta">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>No se pudo confirmar la consulta</strong>
                        <span>El menor ya no tiene consentimiento vigente. No se registró ningún pago.</span>
                    </div>
                    <a href="menores.html" class="btn btn-primario btn-ancho" style="margin-top:12px;">Revisar consentimiento del menor</a>
                </div>
            `;
            HelpsyUI.toast("El consentimiento del menor debe estar vigente para confirmar la cita.", "error");
            return;
        }

        const codigoConfirmacion = `HP-${Date.now().toString().slice(-8)}`;
        let nuevaCita = null;
        try {
            nuevaCita = await HelpsyData.agregarCita({
                id: `c${Date.now()}`,
                pacienteCedula: cita.pacienteCedula,
                pacienteNombre: cita.pacienteNombre,
                agendadaPorTutor: cita.agendadaPorTutor || null,
                psicologoId: cita.psicologoId,
                psicologoNombre: cita.psicologoNombre,
                psicologoCedula: cita.psicologoCedula,
                especialidad: cita.especialidad,
                fecha: cita.fecha,
                hora: cita.hora,
                estado: "Programada",
                pagado: true,
                codigoConfirmacion,
                confirmadaEn: new Date().toISOString()
            });
        } catch (error) {
            console.error("No se pudo reservar la franja:", error);
        }

        if (!nuevaCita) {
            sessionStorage.removeItem("helpsyCitaPendiente");
            zonaCheckout.innerHTML = `
                <div class="tarjeta">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>El horario ya no está disponible</strong>
                        <span>No se registró ningún pago. Elige otra fecha u hora para continuar.</span>
                    </div>
                    <a href="psicologos.html" class="btn btn-primario btn-ancho" style="margin-top:12px;">Volver al catálogo</a>
                </div>
            `;
            HelpsyUI.toast("La agenda cambió mientras confirmabas. No se registró el pago.", "error");
            return;
        }

        const claveCita = `cita:${nuevaCita.id}:confirmada`;
        const fechaCita = HelpsyData.formatearFechaBogota(cita.fecha);
        const mensajeConfirmacion = `Cita con ${cita.psicologoNombre} confirmada para el ${fechaCita} a las ${cita.hora}.`;
        HelpsyData.agregarNotificacion({
            clave: `${claveCita}:${cita.pacienteCedula}`,
            destinatarioCedula: cita.pacienteCedula,
            tipo: "Cita confirmada",
            titulo: "Cita confirmada",
            texto: mensajeConfirmacion
        });
        HelpsyData.agregarNotificacion({
            clave: `${claveCita}:${cita.psicologoCedula}`,
            destinatarioCedula: cita.psicologoCedula,
            tipo: "Cita confirmada",
            titulo: "Nueva cita confirmada",
            texto: `Cita con ${cita.pacienteNombre} confirmada para el ${fechaCita} a las ${cita.hora}.`
        });
        if (cita.agendadaPorTutor) {
            HelpsyData.agregarNotificacion({
                clave: `${claveCita}:${cita.agendadaPorTutor.cedula}`,
                destinatarioCedula: cita.agendadaPorTutor.cedula,
                tipo: "Cita confirmada",
                titulo: "Cita confirmada",
                texto: `Cita de ${cita.pacienteNombre} confirmada para el ${fechaCita} a las ${cita.hora}.`
            });
        }

        HelpsyData.agregarPago({
            id: `pg${Date.now()}`,
            pacienteCedula: cita.pacienteCedula,
            tutorCedula: cita.agendadaPorTutor ? cita.agendadaPorTutor.cedula : null,
            fecha: HelpsyData.formatearFechaBogota(HelpsyData.fechaBogotaISO()),
            psicologoNombre: cita.psicologoNombre,
            concepto: `Sesión de ${cita.especialidad}`,
            valor: cita.tarifa,
            estado: "Aprobado"
        });

        HelpsyData.registrarActividad(
            "Pago",
            cita.agendadaPorTutor
                ? `${cita.agendadaPorTutor.nombre} (tutor) pagó ${HelpsyUI.formatoPesos(cita.tarifa)} y confirmó la cita de ${cita.pacienteNombre} con ${cita.psicologoNombre}.`
                : `${cita.pacienteNombre} pagó ${HelpsyUI.formatoPesos(cita.tarifa)} y confirmó cita con ${cita.psicologoNombre}.`
        );
        HelpsyData.registrarActividad(
            "Citas",
            `Cita ${codigoConfirmacion} confirmada para ${cita.pacienteNombre} con ${cita.psicologoNombre}, el ${fechaCita} a las ${cita.hora}.`
        );

        sessionStorage.removeItem("helpsyCitaPendiente");

        const codigoComprobante = codigoConfirmacion;

        zonaCheckout.innerHTML = `
            <div class="tarjeta">
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.exito}
                    <strong>Pago aprobado y cita confirmada</strong>
                    <span>${cita.pacienteNombre}: cita con ${cita.psicologoNombre} (${cita.especialidad}) el ${fechaCita} a las ${cita.hora}. Código de confirmación: ${codigoConfirmacion}.</span>
                </div>
                <div style="display:flex; gap:10px; margin-top:12px;">
                    <button class="btn btn-fantasma btn-ancho" id="btn-ver-comprobante">Ver comprobante</button>
                    <a href="citas.html" class="btn btn-primario btn-ancho">Ver mis citas</a>
                </div>
            </div>
        `;

        document.getElementById("btn-ver-comprobante").addEventListener("click", () => {
            HelpsyUI.imprimirComprobante("Comprobante de pago", codigoComprobante, [
                ["Paciente", cita.pacienteNombre],
                ["Psicólogo", cita.psicologoNombre],
                ["Especialidad", cita.especialidad],
                ["Fecha de la cita", `${fechaCita} · ${cita.hora}`],
                ["Valor pagado", HelpsyUI.formatoPesos(cita.tarifa)],
                ["Estado", "Aprobado"]
            ]);
        });

        HelpsyUI.toast("Pago aprobado y cita confirmada.", "exito");
        pintarHistorial();

    }

    function pintarHistorial() {

        const pagos = HelpsyData.obtenerPagos(sesion.cedula);
        const tabla = document.getElementById("tabla-pagos");

        if (pagos.length === 0) {

            tabla.innerHTML = `
                <tr><td colspan="6">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>Todavía no tienes pagos registrados</strong>
                        <span>Aparecerán aquí cuando pagues tu primera sesión.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        tabla.innerHTML = pagos.map((p) => `
            <tr>
                <td>${HelpsyData.formatearFechaBogota(p.fecha)}</td>
                <td>${p.psicologoNombre}</td>
                <td>${p.concepto}</td>
                <td>${HelpsyUI.formatoPesos(p.valor)}</td>
                <td><span class="badge badge-verde">${p.estado}</span></td>
                <td><button class="btn btn-fantasma btn-sm" data-comprobante="${p.id}">Ver comprobante</button></td>
            </tr>
        `).join("");

    }

    document.getElementById("tabla-pagos").addEventListener("click", (evento) => {

        const boton = evento.target.closest("[data-comprobante]");
        if (!boton) return;

        const pago = HelpsyData.obtenerPagos(sesion.cedula).find((p) => p.id === boton.dataset.comprobante);
        if (!pago) return;

        HelpsyUI.imprimirComprobante("Comprobante de pago", `HP-${pago.id.slice(-8)}`, [
            ["Psicólogo", pago.psicologoNombre],
            ["Concepto", pago.concepto],
            ["Fecha de pago", pago.fecha],
            ["Valor", HelpsyUI.formatoPesos(pago.valor)],
            ["Estado", pago.estado]
        ]);

    });

    pintarHistorial();

});
