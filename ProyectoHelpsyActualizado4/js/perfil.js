document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("perfil", "Mi perfil");
    if (!sesion) return;

    const tipoCuenta = sesion.rol === "Psicólogo" ? "psicologo" : "usuario";
    const listaCuenta = tipoCuenta === "psicologo"
        ? HelpsyData.obtenerPsicologos()
        : HelpsyData.obtenerUsuarios();
    const cuentaActual = listaCuenta.find((cuenta) => cuenta.cedula === sesion.cedula);
    const formularioPerfil = document.getElementById("form-perfil");

    if (!cuentaActual) {
        HelpsyUI.toast("No se encontró tu cuenta para cargar el perfil.", "error");
        return;
    }

    function pintarDatosPrivacidad() {

        const resumen = document.getElementById("resumen-datos-privacidad");
        const consentimiento = cuentaActual.consentimiento;
        const diario = HelpsyData.obtenerDiario(sesion.cedula);
        const citas = HelpsyData.obtenerCitas().filter((cita) =>
            cita.pacienteCedula === sesion.cedula ||
            (cita.agendadaPorTutor && cita.agendadaPorTutor.cedula === sesion.cedula)
        );
        const tareas = HelpsyData.obtenerTareas(sesion.cedula);
        const pagos = HelpsyData.obtenerPagos(sesion.cedula);

        resumen.replaceChildren();
        [
            `Nombre: ${cuentaActual.nombre}`,
            `Correo: ${cuentaActual.email || "No registrado"}`,
            `Fecha de nacimiento: ${cuentaActual.fechaNacimiento ? HelpsyData.formatearFechaBogota(cuentaActual.fechaNacimiento) : "No registrada"}`,
            `Rol de la cuenta: ${cuentaActual.rol || "Psicólogo"}`,
            `Registros de diario asociados a tu cuenta: ${diario.length}`,
            `Citas asociadas a tu cuenta: ${citas.length}`,
            `Tareas asociadas a tu cuenta: ${tareas.length}`,
            `Pagos asociados a tu cuenta: ${pagos.length}`
        ].forEach((texto) => {
            const elemento = document.createElement("p");
            elemento.className = "lista-item-texto";
            elemento.textContent = texto;
            resumen.appendChild(elemento);
        });

        const consentimientos = document.getElementById("consentimientos-privacidad");
        consentimientos.replaceChildren();
        const tituloConsentimientos = document.createElement("strong");
        tituloConsentimientos.textContent = "Consentimiento de la cuenta: ";
        consentimientos.appendChild(tituloConsentimientos);
        const historialConsentimientos = cuentaActual.historialConsentimientos ||
            (consentimiento ? [consentimiento] : []);
        if (historialConsentimientos.length === 0) {
            const detalleConsentimiento = document.createElement("span");
            detalleConsentimiento.textContent = "No hay consentimientos registrados.";
            consentimientos.appendChild(detalleConsentimiento);
        } else {
            const listaConsentimientos = document.createElement("ul");
            historialConsentimientos.forEach((registro) => {
                const elemento = document.createElement("li");
                const usuarioRegistro = registro.autorizacionDatos &&
                    registro.autorizacionDatos.usuario;
                elemento.textContent = `Autorización de datos y consentimiento informado v${registro.version}; fecha ${HelpsyData.formatearFechaBogota(registro.fecha, true)}; registrado por ${usuarioRegistro ? `${usuarioRegistro.nombre} (${usuarioRegistro.cedula})` : registro.cedulaUsuario || "Usuario"}.${HelpsyData.consentimientoVigente(registro) ? " Vigente." : " Versión anterior; requiere actualización."}`;
                listaConsentimientos.appendChild(elemento);
            });
            consentimientos.appendChild(listaConsentimientos);
        }

        const selectTitular = document.getElementById("titular-supresion");
        selectTitular.replaceChildren();
        const opcionCuenta = document.createElement("option");
        opcionCuenta.value = `cuenta:${sesion.cedula}`;
        opcionCuenta.textContent = `Mi cuenta — ${sesion.nombre}`;
        selectTitular.appendChild(opcionCuenta);

        const tablaMenores = document.getElementById("menores-privacidad");
        const cuerpoMenores = document.getElementById("tabla-menores-privacidad");
        cuerpoMenores.replaceChildren();

        if (sesion.rol === "Tutor") {
            const menores = HelpsyData.obtenerMenores(sesion.cedula);
            tablaMenores.classList.toggle("oculto", menores.length === 0);

            menores.forEach((menor) => {
                const opcion = document.createElement("option");
                opcion.value = `menor:${menor.documento}`;
                opcion.textContent = `Menor — ${menor.nombre} (${menor.documento})`;
                selectTitular.appendChild(opcion);

                const fila = document.createElement("tr");
                const valores = [
                    menor.nombre,
                    menor.documento,
                    HelpsyData.formatearFechaBogota(menor.fechaNacimiento),
                    HelpsyData.consentimientoVigente(menor.consentimiento)
                        ? `Vigente v${menor.consentimiento.version}, ${HelpsyData.formatearFechaBogota(menor.consentimiento.fecha, true)} — tutor ${menor.consentimiento.autorizacionDatos.usuario.nombre} (${menor.consentimiento.cedulaUsuario})`
                        : menor.consentimiento
                            ? `Anterior/no vigente, v${menor.consentimiento.version} — requiere actualización por el tutor`
                            : "Sin registro vigente"
                ];
                valores.forEach((valor) => {
                    const celda = document.createElement("td");
                    celda.textContent = valor || "—";
                    fila.appendChild(celda);
                });
                const celdaAcciones = document.createElement("td");
                const enlaceCorreccion = document.createElement("a");
                enlaceCorreccion.href = "menores.html";
                enlaceCorreccion.textContent = "Corregir perfil";
                celdaAcciones.appendChild(enlaceCorreccion);
                fila.appendChild(celdaAcciones);
                cuerpoMenores.appendChild(fila);
            });
        } else {
            tablaMenores.classList.add("oculto");
        }

        pintarSolicitudesPrivacidad();

    }

    function pintarSolicitudesPrivacidad() {

        const contenedor = document.getElementById("solicitudes-supresion");
        const solicitudes = HelpsyData.obtenerSolicitudesPrivacidad(sesion.cedula);
        contenedor.replaceChildren();

        const titulo = document.createElement("h3");
        titulo.textContent = "Solicitudes de supresión";
        contenedor.appendChild(titulo);

        if (solicitudes.length === 0) {
            const vacio = document.createElement("p");
            vacio.className = "campo-nota";
            vacio.textContent = "No tienes solicitudes registradas.";
            contenedor.appendChild(vacio);
            return;
        }

        solicitudes.forEach((solicitud) => {
            const fila = document.createElement("p");
            fila.className = "campo-nota";
            fila.textContent = `${solicitud.titularNombre} · ${HelpsyData.formatearFechaBogota(solicitud.fecha, true)} · ${solicitud.estado}${solicitud.motivo ? ` · Motivo: ${solicitud.motivo}` : ""}`;
            contenedor.appendChild(fila);
        });

    }

    document.getElementById("form-solicitud-supresion").addEventListener("submit", (evento) => {

        evento.preventDefault();

        const [tipoTitular, idTitular] = document.getElementById("titular-supresion").value.split(":");
        const solicitud = HelpsyData.solicitarSupresionDatos(
            sesion.cedula,
            tipoTitular,
            idTitular,
            document.getElementById("motivo-supresion").value
        );

        if (!solicitud) {
            HelpsyUI.toast("No se pudo registrar la solicitud. Confirma que el titular esté vinculado a tu cuenta.", "error");
            return;
        }

        document.getElementById("form-solicitud-supresion").reset();
        pintarDatosPrivacidad();
        HelpsyUI.toast("Solicitud registrada como pendiente de revisión. No se borraron datos.", "exito");

    });

    pintarDatosPrivacidad();

    document.getElementById("perfil-nombre").value = cuentaActual.nombre;
    document.getElementById("perfil-fecha-nacimiento").value = cuentaActual.fechaNacimiento || "";
    document.getElementById("perfil-email").value = cuentaActual.email || "";

    formularioPerfil.addEventListener("submit", (evento) => {

        evento.preventDefault();
        document.getElementById("error-perfil-nombre").textContent = "";
        document.getElementById("error-perfil-email").textContent = "";

        const nombre = document.getElementById("perfil-nombre").value.trim();
        const fechaNacimiento = document.getElementById("perfil-fecha-nacimiento").value;
        const email = document.getElementById("perfil-email").value.trim().toLowerCase();
        const emailCambio = email !== (cuentaActual.email || "").toLowerCase();

        if (nombre.length < 3) {
            document.getElementById("error-perfil-nombre").textContent = "Escribe tu nombre completo.";
            return;
        }

        const fechaError = document.getElementById("error-perfil-fecha");
        fechaError.textContent = "";
        if (!fechaNacimiento && cuentaActual.fechaNacimiento) {
            fechaError.textContent = "Selecciona una fecha de nacimiento.";
            return;
        }
        if (fechaNacimiento) {
            const [anio, mes, dia] = fechaNacimiento.split("-").map(Number);
            const nacimiento = new Date(`${fechaNacimiento}T12:00:00.000Z`);
            const [anioHoy, mesHoy, diaHoy] = HelpsyData.fechaBogotaISO().split("-").map(Number);
            let edad = anioHoy - anio;
            if (mesHoy < mes || (mesHoy === mes && diaHoy < dia)) {
                edad -= 1;
            }
            if (Number.isNaN(nacimiento.getTime()) || fechaNacimiento > HelpsyData.fechaBogotaISO() || edad < 18) {
                fechaError.textContent = "La fecha debe corresponder a una persona adulta y no puede estar en el futuro.";
                return;
            }
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById("error-perfil-email").textContent = "Ingresa un correo válido.";
            return;
        }

        const otrasCuentas = [
            ...HelpsyData.obtenerUsuarios(),
            ...HelpsyData.obtenerPsicologos()
        ].filter((cuenta) => cuenta.cedula !== sesion.cedula);

        if (otrasCuentas.some((cuenta) => cuenta.email && cuenta.email.toLowerCase() === email)) {
            document.getElementById("error-perfil-email").textContent = "Ese correo ya está asociado a otra cuenta.";
            return;
        }

        const cambiosPerfil = {
            nombre,
            email,
            ...(fechaNacimiento ? { fechaNacimiento } : {}),
            ...(emailCambio ? { correoVerificado: false } : {})
        };

        if (!HelpsyData.actualizarCuenta(tipoCuenta, sesion.cedula, cambiosPerfil)) {
            HelpsyUI.toast("No se pudieron guardar los datos del perfil.", "error");
            return;
        }

        HelpsyData.actualizarSesion({ nombre });

        if (emailCambio) {
            const token = HelpsyData.crearTokenCuenta("verificar-correo", tipoCuenta, sesion.cedula);
            if (!token) {
                HelpsyUI.toast("El perfil se guardó, pero no se pudo generar el enlace de verificación.", "error");
                return;
            }

            const enlace = new URL("login.html", window.location.href);
            enlace.searchParams.set("verificar", token);
            const link = document.getElementById("link-verificacion-perfil");
            link.href = enlace.href;
            document.getElementById("aviso-verificacion-perfil").classList.remove("oculto");
        }

        cuentaActual.nombre = nombre;
        cuentaActual.email = email;
        if (fechaNacimiento) cuentaActual.fechaNacimiento = fechaNacimiento;
        const nombreEnTopbar = document.querySelector("#helpsy-topbar .topbar-nombre strong");
        if (nombreEnTopbar) nombreEnTopbar.textContent = nombre;

        HelpsyUI.toast("Perfil actualizado.", "exito");

    });

    const tarjetaEspecialista = document.getElementById("tarjeta-perfil-especialista");

    if (sesion.rol === "Psicólogo") {
        tarjetaEspecialista.classList.remove("oculto");

        const selectorCategorias = document.getElementById("perfil-categorias");
        selectorCategorias.innerHTML = HelpsyData.ESPECIALIDADES.map((especialidad) =>
            `<option value="${especialidad}">${especialidad}</option>`
        ).join("");

        const categoriasActuales = cuentaActual.categorias || [cuentaActual.especialidad].filter(Boolean);
        Array.from(selectorCategorias.options).forEach((opcion) => {
            opcion.selected = categoriasActuales.includes(opcion.value);
        });
        document.getElementById("perfil-titulo-profesional").value = cuentaActual.titulo || "";
        document.getElementById("perfil-registro-profesional").value = cuentaActual.registroProfesional || "";
        document.getElementById("perfil-bio").value = cuentaActual.bio || "";

        const diasDisponibilidad = document.getElementById("dias-disponibilidad");
        const horasDisponibilidad = document.getElementById("horas-disponibilidad");
        let disponibilidadActual = cuentaActual.disponibilidad || HelpsyData.disponibilidadPorDefecto();
        disponibilidadActual = {
            dias: disponibilidadActual.dias || [],
            horas: disponibilidadActual.horas || [],
            bloqueos: disponibilidadActual.bloqueos || []
        };

        function pintarOpcionesDisponibilidad(contenedor, opciones, seleccionadas, prefijo) {
            contenedor.replaceChildren();
            opciones.forEach((opcion, indice) => {
                const etiqueta = document.createElement("label");
                etiqueta.style.display = "inline-flex";
                etiqueta.style.alignItems = "center";
                etiqueta.style.gap = "8px";
                etiqueta.style.margin = "4px 12px 4px 0";
                const check = document.createElement("input");
                check.type = "checkbox";
                check.id = `${prefijo}-${indice}`;
                check.value = opcion;
                check.checked = seleccionadas.includes(opcion);
                etiqueta.append(check, document.createTextNode(opcion));
                contenedor.appendChild(etiqueta);
            });
        }

        function pintarBloqueos() {
            const contenedor = document.getElementById("lista-bloqueos-disponibilidad");
            contenedor.replaceChildren();
            const bloqueos = disponibilidadActual.bloqueos || [];
            if (bloqueos.length === 0) {
                const mensaje = document.createElement("p");
                mensaje.className = "campo-nota";
                mensaje.textContent = "No tienes fechas bloqueadas.";
                contenedor.appendChild(mensaje);
                return;
            }
            bloqueos.forEach((bloqueo) => {
                const fecha = typeof bloqueo === "string" ? bloqueo : bloqueo.fecha;
                const fila = document.createElement("div");
                fila.className = "preferencia-fila";
                const texto = document.createElement("span");
                texto.textContent = `${HelpsyData.formatearFechaBogota(fecha)} — día completo`;
                const quitar = document.createElement("button");
                quitar.type = "button";
                quitar.className = "btn btn-fantasma btn-sm";
                quitar.textContent = "Quitar";
                quitar.dataset.quitarBloqueo = fecha;
                fila.append(texto, quitar);
                contenedor.appendChild(fila);
            });
        }

        pintarOpcionesDisponibilidad(diasDisponibilidad, HelpsyData.DIAS_SEMANA, disponibilidadActual.dias, "dia-disponible");
        pintarOpcionesDisponibilidad(horasDisponibilidad, HelpsyData.HORAS_CATALOGO, disponibilidadActual.horas, "hora-disponible");
        pintarBloqueos();
        document.getElementById("fecha-bloqueo").min = HelpsyData.fechaBogotaISO();

        function obtenerCitasConfirmadasFuturas() {
            return HelpsyData.obtenerCitas().filter((cita) =>
                cita.psicologoCedula === sesion.cedula &&
                cita.pagado &&
                ["Programada", "Reprogramada"].includes(cita.estado) &&
                HelpsyData.horasHastaCita(cita) > 0
            );
        }

        function confirmarCitasAfectadas(citas) {
            if (citas.length === 0) return true;
            return confirm(
                `Hay ${citas.length} cita(s) confirmada(s) en conflicto. Se conservarán sin cambios y se notificará a las personas vinculadas. ¿Guardar de todos modos?`
            );
        }

        function notificarCitasAfectadas(citas) {
            citas.forEach((cita) => {
                const destinatarios = [
                    { cedula: cita.pacienteCedula, nombre: cita.pacienteNombre },
                    ...(cita.agendadaPorTutor ? [cita.agendadaPorTutor] : []),
                    ...(cita.pacientesAdicionales || [])
                ];
                destinatarios.forEach((destinatario) => {
                    HelpsyData.agregarNotificacion({
                        clave: `disponibilidad:${cita.id}:${sesion.cedula}:${destinatario.cedula}:${Date.now()}`,
                        destinatarioCedula: destinatario.cedula,
                        tipo: "Cambio de disponibilidad",
                        titulo: "Tu cita se mantiene confirmada",
                        texto: `El especialista actualizó su disponibilidad, lo que coincide con tu cita del ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}. La cita sigue vigente; confirma cualquier ajuste directamente con el especialista.`
                    });
                });
            });
        }

        document.getElementById("form-disponibilidad-especialista").addEventListener("submit", (evento) => {
            evento.preventDefault();
            const nuevaDisponibilidad = {
                ...disponibilidadActual,
                dias: Array.from(diasDisponibilidad.querySelectorAll("input:checked"), (check) => check.value),
                horas: Array.from(horasDisponibilidad.querySelectorAll("input:checked"), (check) => check.value)
            };
            const citasAfectadas = obtenerCitasConfirmadasFuturas().filter((cita) =>
                !nuevaDisponibilidad.dias.includes(HelpsyData.diaDeLaSemana(cita.fecha)) ||
                !nuevaDisponibilidad.horas.includes(cita.hora)
            );
            if (!confirmarCitasAfectadas(citasAfectadas)) return;
            if (!HelpsyData.actualizarCuenta("psicologo", sesion.cedula, { disponibilidad: nuevaDisponibilidad })) {
                HelpsyUI.toast("No se pudo guardar la disponibilidad.", "error");
                return;
            }
            disponibilidadActual = nuevaDisponibilidad;
            cuentaActual.disponibilidad = nuevaDisponibilidad;
            notificarCitasAfectadas(citasAfectadas);
            HelpsyUI.toast("Disponibilidad semanal actualizada.", "exito");
        });

        document.getElementById("form-bloqueo-disponibilidad").addEventListener("submit", (evento) => {
            evento.preventDefault();
            const fecha = document.getElementById("fecha-bloqueo").value;
            if (!fecha) return;
            if ((disponibilidadActual.bloqueos || []).some((bloqueo) =>
                (typeof bloqueo === "string" ? bloqueo : bloqueo.fecha) === fecha
            )) {
                HelpsyUI.toast("Esa fecha ya está bloqueada.", "info");
                return;
            }
            const nuevaDisponibilidad = {
                ...disponibilidadActual,
                bloqueos: [...disponibilidadActual.bloqueos, { fecha }]
            };
            const citasAfectadas = obtenerCitasConfirmadasFuturas().filter((cita) => cita.fecha === fecha);
            if (!confirmarCitasAfectadas(citasAfectadas)) return;
            if (!HelpsyData.actualizarCuenta("psicologo", sesion.cedula, { disponibilidad: nuevaDisponibilidad })) {
                HelpsyUI.toast("No se pudo guardar el bloqueo.", "error");
                return;
            }
            disponibilidadActual = nuevaDisponibilidad;
            cuentaActual.disponibilidad = nuevaDisponibilidad;
            document.getElementById("form-bloqueo-disponibilidad").reset();
            pintarBloqueos();
            notificarCitasAfectadas(citasAfectadas);
            HelpsyUI.toast("Fecha bloqueada en tu agenda.", "exito");
        });

        document.getElementById("lista-bloqueos-disponibilidad").addEventListener("click", (evento) => {
            const boton = evento.target.closest("[data-quitar-bloqueo]");
            if (!boton) return;
            const nuevaDisponibilidad = {
                ...disponibilidadActual,
                bloqueos: disponibilidadActual.bloqueos.filter((bloqueo) =>
                    (typeof bloqueo === "string" ? bloqueo : bloqueo.fecha) !== boton.dataset.quitarBloqueo
                )
            };
            if (!HelpsyData.actualizarCuenta("psicologo", sesion.cedula, { disponibilidad: nuevaDisponibilidad })) {
                HelpsyUI.toast("No se pudo quitar el bloqueo.", "error");
                return;
            }
            disponibilidadActual = nuevaDisponibilidad;
            cuentaActual.disponibilidad = nuevaDisponibilidad;
            pintarBloqueos();
            HelpsyUI.toast("Bloqueo eliminado.", "exito");
        });

        document.getElementById("form-perfil-especialista").addEventListener("submit", (evento) => {

            evento.preventDefault();

            const bio = document.getElementById("perfil-bio").value.trim();
            const categorias = Array.from(selectorCategorias.selectedOptions, (opcion) => opcion.value);
            const titulo = document.getElementById("perfil-titulo-profesional").value.trim();
            const registroProfesional = document.getElementById("perfil-registro-profesional").value.trim();

            if (!bio) {
                HelpsyUI.toast("Escribe una presentación profesional.", "error");
                return;
            }

            if (categorias.length === 0) {
                HelpsyUI.toast("Selecciona al menos una categoría profesional.", "error");
                return;
            }

            const cambios = {
                titulo,
                registroProfesional,
                bio,
                categorias,
                especialidad: categorias[0]
            };
            const debeReenviar = cuentaActual.estadoVerificacion === "Información solicitada";
            if (debeReenviar) {
                cambios.estadoVerificacion = "Pendiente";
                cambios.motivoSolicitudInformacion = "";
            }

            if (!HelpsyData.actualizarCuenta("psicologo", sesion.cedula, cambios)) {
                HelpsyUI.toast("No se pudo guardar el perfil profesional.", "error");
                return;
            }

            HelpsyUI.toast(debeReenviar
                ? "Información actualizada y enviada a revisión del administrador."
                : "Perfil profesional actualizado.", "exito");

        });
    }

    if (sesion.rol === "Administrador") {
        const tarjetaPolitica = document.getElementById("tarjeta-politica-citas");
        tarjetaPolitica.classList.remove("oculto");
        document.getElementById("anticipacion-citas").value =
            HelpsyData.obtenerPoliticaCitas().anticipacionHoras;
        document.getElementById("form-politica-citas").addEventListener("submit", (evento) => {
            evento.preventDefault();
            const anticipacionHoras = Number(document.getElementById("anticipacion-citas").value);
            if (!HelpsyData.guardarPoliticaCitas({ anticipacionHoras })) {
                HelpsyUI.toast("Indica un plazo entero entre 0 y 720 horas.", "error");
                return;
            }
            HelpsyUI.toast("Política de agenda actualizada.", "exito");
        });
    }

    // El mensaje motivacional diario es un concepto de paciente; a un
    // administrador o psicólogo no le aplica, así que se oculta esa fila.
    if (sesion.rol !== "Paciente") {
        document.getElementById("fila-mensajes-motivacionales").classList.add("oculto");
    }

    const preferencias = HelpsyData.obtenerPreferencias(sesion.cedula);

    document.getElementById("check-mensajes-motivacionales").checked = preferencias.mensajesMotivacionales;
    document.getElementById("check-notificaciones-correo").checked = preferencias.notificacionesCorreo;

    function guardarCambioPreferencia() {

        const nuevas = {
            mensajesMotivacionales: document.getElementById("check-mensajes-motivacionales").checked,
            notificacionesCorreo: document.getElementById("check-notificaciones-correo").checked
        };

        HelpsyData.guardarPreferencias(sesion.cedula, nuevas);
        HelpsyUI.toast("Preferencia guardada.", "exito");

    }

    document.getElementById("check-mensajes-motivacionales").addEventListener("change", guardarCambioPreferencia);
    document.getElementById("check-notificaciones-correo").addEventListener("change", guardarCambioPreferencia);

    /* -------------------- Cambiar contraseña -------------------- */

    function obtenerCuentaYColeccion() {

        if (sesion.rol === "Psicólogo") {

            const psicologos = HelpsyData.obtenerPsicologos();
            const indice = psicologos.findIndex((p) => p.cedula === sesion.cedula);
            return { coleccion: psicologos, indice, guardar: HelpsyData.guardarPsicologos };

        }

        const usuarios = HelpsyData.obtenerUsuarios();
        const indice = usuarios.findIndex((u) => u.cedula === sesion.cedula);
        return { coleccion: usuarios, indice, guardar: HelpsyData.guardarUsuarios };

    }

    document.getElementById("form-cambiar-password").addEventListener("submit", async (evento) => {

        evento.preventDefault();

        document.getElementById("error-password-actual").textContent = "";
        document.getElementById("error-password-nueva").textContent = "";

        const actual = document.getElementById("password-actual").value;
        const nueva = document.getElementById("password-nueva").value;
        const confirmar = document.getElementById("password-nueva-confirmar").value;

        const { coleccion, indice, guardar } = obtenerCuentaYColeccion();

        if (indice === -1) {
            HelpsyUI.toast("No se encontró tu cuenta.", "error");
            return;
        }

        const hashActualIngresado = await HelpsyUI.hashPassword(actual);

        if (coleccion[indice].passwordHash !== hashActualIngresado) {
            document.getElementById("error-password-actual").textContent = "La contraseña actual no coincide.";
            return;
        }

        const errorPassword = HelpsyUI.validarPasswordFuerte(nueva);
        if (errorPassword) {
            document.getElementById("error-password-nueva").textContent = errorPassword;
            return;
        }

        if (nueva !== confirmar) {
            document.getElementById("error-password-nueva").textContent = "Las contraseñas no coinciden.";
            return;
        }

        const actualizado = HelpsyData.actualizarCuenta(tipoCuenta, sesion.cedula, {
            passwordHash: await HelpsyUI.hashPassword(nueva)
        });
        if (!actualizado) {
            HelpsyUI.toast("No se pudo actualizar la contraseña.", "error");
            return;
        }

        document.getElementById("form-cambiar-password").reset();
        HelpsyData.cerrarSesion();
        window.location.href = "login.html";

    });

});
