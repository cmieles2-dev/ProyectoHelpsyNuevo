document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("usuarios", "Usuarios");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const tabla = document.getElementById("tabla-usuarios");
    const contador = document.getElementById("contador-usuarios");
    const filtroRol = document.getElementById("filtro-rol");
    const buscador = document.getElementById("buscar-usuario");

    const formulario = document.getElementById("form-usuario");
    const modalTitulo = document.getElementById("modal-titulo");
    let soloRestablecerAcceso = false;

    function escaparHTML(texto) {
        return String(texto || "").replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[caracter]);
    }

    function pintarCategoriasAtencion() {

        const contenedor = document.getElementById("lista-categorias-atencion");
        contenedor.replaceChildren();

        HelpsyData.obtenerCategoriasAtencion().forEach((categoria) => {
            const fila = document.createElement("div");
            fila.className = "preferencia-fila";
            const nombre = document.createElement("strong");
            nombre.textContent = categoria;
            const acciones = document.createElement("div");
            acciones.style.display = "flex";
            acciones.style.gap = "6px";
            const editar = document.createElement("button");
            editar.type = "button";
            editar.className = "btn btn-fantasma btn-sm";
            editar.textContent = "Editar";
            editar.dataset.editarCategoria = categoria;
            const desactivar = document.createElement("button");
            desactivar.type = "button";
            desactivar.className = "btn btn-fantasma btn-sm";
            desactivar.textContent = "Desactivar";
            desactivar.dataset.desactivarCategoria = categoria;
            acciones.append(editar, desactivar);
            fila.append(nombre, acciones);
            contenedor.appendChild(fila);
        });

        const inactivas = HelpsyData.obtenerCategoriasInactivas();
        if (inactivas.length) {
            const tituloInactivas = document.createElement("h3");
            tituloInactivas.textContent = "Categorías desactivadas";
            contenedor.appendChild(tituloInactivas);
            inactivas.forEach((categoria) => {
                const fila = document.createElement("div");
                fila.className = "preferencia-fila";
                const nombre = document.createElement("strong");
                nombre.textContent = categoria;
                const reactivar = document.createElement("button");
                reactivar.type = "button";
                reactivar.className = "btn btn-fantasma btn-sm";
                reactivar.textContent = "Reactivar";
                reactivar.dataset.reactivarCategoria = categoria;
                fila.append(nombre, reactivar);
                contenedor.appendChild(fila);
            });
        }

    }

    function reiniciarFormularioCategoria() {
        document.getElementById("form-categoria-atencion").reset();
        document.getElementById("categoria-atencion-edicion").value = "";
        document.getElementById("nueva-categoria-atencion").placeholder = "Nueva categoría";
        document.querySelector('#form-categoria-atencion [type="submit"]').textContent = "Agregar categoría";
        document.getElementById("cancelar-edicion-categoria").classList.add("oculto");

    }

    document.getElementById("form-categoria-atencion").addEventListener("submit", (evento) => {

        evento.preventDefault();
        const entrada = document.getElementById("nueva-categoria-atencion");
        const categorias = HelpsyData.obtenerCategoriasAtencion();
        const nuevaCategoria = entrada.value.trim();
        const categoriaOriginal = document.getElementById("categoria-atencion-edicion").value;

        if (categoriaOriginal) {
            if (!HelpsyData.editarCategoriaAtencion(categoriaOriginal, nuevaCategoria)) {
                HelpsyUI.toast("No se puede editar: la categoría está en uso o el nombre no es válido.", "error");
                return;
            }
            HelpsyData.registrarActividad("Categorías de atención", `${sesion.nombre} editó ${categoriaOriginal} como ${nuevaCategoria}.`);
            reiniciarFormularioCategoria();
            pintarCategoriasAtencion();
            HelpsyUI.toast("Categoría actualizada.", "exito");
            return;
        }

        if (!HelpsyData.guardarCategoriasAtencion([...categorias, nuevaCategoria])) {
            HelpsyUI.toast("Categoría inválida, repetida o no se pudo guardar.", "error");
            return;
        }

        HelpsyData.registrarActividad("Categorías de atención", `${sesion.nombre} agregó la categoría ${nuevaCategoria}.`);
        reiniciarFormularioCategoria();
        pintarCategoriasAtencion();
        HelpsyUI.toast("Categoría agregada al catálogo.", "exito");

    });

    document.getElementById("cancelar-edicion-categoria").addEventListener("click", reiniciarFormularioCategoria);

    document.getElementById("lista-categorias-atencion").addEventListener("click", (evento) => {

        const botonEditar = evento.target.closest("[data-editar-categoria]");
        const botonDesactivar = evento.target.closest("[data-desactivar-categoria]");
        const botonReactivar = evento.target.closest("[data-reactivar-categoria]");

        if (botonEditar) {
            const categoria = botonEditar.dataset.editarCategoria;
            document.getElementById("categoria-atencion-edicion").value = categoria;
            document.getElementById("nueva-categoria-atencion").value = categoria;
            document.getElementById("nueva-categoria-atencion").placeholder = "Nombre actualizado";
            document.querySelector('#form-categoria-atencion [type="submit"]').textContent = "Guardar cambios";
            document.getElementById("cancelar-edicion-categoria").classList.remove("oculto");
            return;
        }

        if (botonDesactivar) {
            const categoria = botonDesactivar.dataset.desactivarCategoria;
            if (!confirm(`¿Desactivar “${categoria}”? Se conservará en registros existentes.`)) return;
            if (!HelpsyData.desactivarCategoriaAtencion(categoria)) {
                HelpsyUI.toast("No se pudo desactivar. Debe quedar al menos una categoría activa.", "error");
                return;
            }
            HelpsyData.registrarActividad("Categorías de atención", `${sesion.nombre} desactivó la categoría ${categoria}.`);
            pintarCategoriasAtencion();
            HelpsyUI.toast("Categoría desactivada.", "info");
            return;
        }

        if (botonReactivar) {
            const categoria = botonReactivar.dataset.reactivarCategoria;
            if (!HelpsyData.reactivarCategoriaAtencion(categoria)) {
                HelpsyUI.toast("No se pudo reactivar. Verifica que no exista otra categoría con ese nombre.", "error");
                return;
            }
            HelpsyData.registrarActividad("Categorías de atención", `${sesion.nombre} reactivó la categoría ${categoria}.`);
            pintarCategoriasAtencion();
            HelpsyUI.toast("Categoría reactivada.", "exito");
        }

    });

    function badgeRol(rol) {

        const mapa = { "Administrador": "badge-morado", "Psicólogo": "badge-azul", "Paciente": "badge-gris", "Tutor": "badge-naranja" };
        return `<span class="badge ${mapa[rol] || "badge-gris"}">${escaparHTML(rol)}</span>`;

    }

    /* ============================================================
       VERIFICACIÓN DE ESPECIALISTAS (RF-07 / HU-26)
       Los psicólogos se guardan en una colección aparte
       (HelpsyData.obtenerPsicologos), no en "usuarios".
    ============================================================ */

    const tablaPendientes = document.getElementById("tabla-pendientes");
    const contadorPendientes = document.getElementById("contador-pendientes");

    function badgeVerificacion(estado) {

        const mapa = {
            "Pendiente": "badge-naranja",
            "Aprobado": "badge-verde",
            "Rechazado": "badge-rojo",
            "Información solicitada": "badge-azul"
        };

        return `<span class="badge ${mapa[estado] || "badge-gris"}">${escaparHTML(estado || "Aprobado")}</span>`;

    }

    function pintarPendientes() {

        const psicologos = HelpsyData.obtenerPsicologos();
        const pendientes = psicologos.filter((p) =>
            ["Pendiente", "Información solicitada"].includes(p.estadoVerificacion)
        );

        contadorPendientes.textContent = pendientes.length === 0
            ? "No hay especialistas esperando revisión."
            : `${pendientes.length} especialista${pendientes.length === 1 ? "" : "s"} requiere${pendientes.length === 1 ? "" : "n"} revisión.`;

        if (pendientes.length === 0) {

            tablaPendientes.innerHTML = `
                <tr><td colspan="7">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>Todo al día</strong>
                        <span>No hay registros nuevos de psicólogos por verificar.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        tablaPendientes.innerHTML = pendientes.map((p) => `
            <tr>
                <td>
                    <div class="fila-persona">
                        <span class="avatar-mini">${HelpsyUI.iniciales(p.nombre)}</span>
                        ${escaparHTML(p.nombre)}
                    </div>
                </td>
                <td>${escaparHTML(p.cedula)}</td>
                <td>${escaparHTML(p.titulo || "—")}</td>
                <td>${escaparHTML(p.registroProfesional || "—")}</td>
                <td>${escaparHTML(p.especialidad)}</td>
                <td>${badgeVerificacion(p.estadoVerificacion)}${p.motivoSolicitudInformacion ? `<small class="campo-nota">${escaparHTML(p.motivoSolicitudInformacion)}</small>` : ""}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-primario btn-sm" data-aprobar="${p.id}">Aprobar</button>
                        <button class="btn btn-fantasma btn-sm" data-solicitar-informacion="${p.id}">Pedir información</button>
                        <button class="btn btn-fantasma btn-sm" data-rechazar="${p.id}">Rechazar</button>
                    </div>
                </td>
            </tr>
        `).join("");

    }

    tablaPendientes.addEventListener("click", (evento) => {

        const botonAprobar = evento.target.closest("[data-aprobar]");
        const botonRechazar = evento.target.closest("[data-rechazar]");
        const botonSolicitar = evento.target.closest("[data-solicitar-informacion]");

        if (botonAprobar) {

            const psicologos = HelpsyData.obtenerPsicologos();
            const indice = psicologos.findIndex((p) => p.id === botonAprobar.dataset.aprobar);
            if (indice === -1) return;

            psicologos[indice].estadoVerificacion = "Aprobado";
            delete psicologos[indice].motivoRechazo;
            delete psicologos[indice].motivoSolicitudInformacion;

            if (!HelpsyData.guardarPsicologos(psicologos)) {
                HelpsyUI.toast("No se pudo guardar la verificación.", "error");
                return;
            }
            HelpsyData.agregarNotificacion({
                clave: `verificacion:${psicologos[indice].id}:aprobada:${Date.now()}`,
                destinatarioCedula: psicologos[indice].cedula,
                tipo: "Verificación aprobada",
                titulo: "Verificación profesional aprobada",
                texto: "Tu perfil ya está habilitado para aparecer en las búsquedas de pacientes."
            });
            HelpsyData.registrarActividad("Verificación de especialistas", `${sesion.nombre} aprobó el registro profesional de ${psicologos[indice].nombre}.`);
            HelpsyUI.toast(`${psicologos[indice].nombre} fue verificado y ya aparece en las búsquedas de pacientes.`, "exito");

            pintarPendientes();

        }

        if (botonRechazar) {

            document.getElementById("rechazo-id").value = botonRechazar.dataset.rechazar;
            document.getElementById("rechazo-motivo").value = "";
            document.getElementById("error-rechazo-motivo").textContent = "";
            HelpsyUI.abrirModal("modal-rechazo");

        }

        if (botonSolicitar) {
            document.getElementById("solicitud-informacion-id").value = botonSolicitar.dataset.solicitarInformacion;
            document.getElementById("solicitud-informacion-motivo").value = "";
            document.getElementById("error-solicitud-informacion").textContent = "";
            HelpsyUI.abrirModal("modal-solicitud-informacion");
        }

    });

    const formularioRechazo = document.getElementById("form-rechazo");

    document.getElementById("cerrar-modal-rechazo").addEventListener("click", () => HelpsyUI.cerrarModal("modal-rechazo"));
    document.getElementById("cancelar-modal-rechazo").addEventListener("click", () => HelpsyUI.cerrarModal("modal-rechazo"));

    formularioRechazo.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const id = document.getElementById("rechazo-id").value;
        const motivo = document.getElementById("rechazo-motivo").value.trim();

        if (motivo.length < 10) {
            document.getElementById("error-rechazo-motivo").textContent = "Explica el motivo con al menos 10 caracteres: el especialista lo verá.";
            return;
        }

        const psicologos = HelpsyData.obtenerPsicologos();
        const indice = psicologos.findIndex((p) => p.id === id);
        if (indice === -1) return;

        psicologos[indice].estadoVerificacion = "Rechazado";
        psicologos[indice].motivoRechazo = motivo;
        delete psicologos[indice].motivoSolicitudInformacion;

        if (!HelpsyData.guardarPsicologos(psicologos)) {
            HelpsyUI.toast("No se pudo guardar el rechazo.", "error");
            return;
        }
        HelpsyData.agregarNotificacion({
            clave: `verificacion:${psicologos[indice].id}:rechazada:${Date.now()}`,
            destinatarioCedula: psicologos[indice].cedula,
            tipo: "Verificación rechazada",
            titulo: "Verificación profesional rechazada",
            texto: motivo
        });
        HelpsyData.registrarActividad("Verificación de especialistas", `${sesion.nombre} rechazó el registro profesional de ${psicologos[indice].nombre}.`);
        HelpsyUI.toast(`Rechazo guardado para ${psicologos[indice].nombre}; el motivo aparecerá al intentar iniciar sesión.`, "exito");

        HelpsyUI.cerrarModal("modal-rechazo");
        pintarPendientes();

    });

    ["cerrar-modal-solicitud", "cancelar-modal-solicitud"].forEach((id) => {
        document.getElementById(id).addEventListener("click", () => HelpsyUI.cerrarModal("modal-solicitud-informacion"));
    });

    document.getElementById("form-solicitud-informacion").addEventListener("submit", (evento) => {

        evento.preventDefault();
        const id = document.getElementById("solicitud-informacion-id").value;
        const motivo = document.getElementById("solicitud-informacion-motivo").value.trim();
        if (motivo.length < 10) {
            document.getElementById("error-solicitud-informacion").textContent = "Indica qué dato o documento debe completar (mínimo 10 caracteres).";
            return;
        }

        const psicologos = HelpsyData.obtenerPsicologos();
        const indice = psicologos.findIndex((psicologo) => psicologo.id === id);
        if (indice === -1) return;

        psicologos[indice].estadoVerificacion = "Información solicitada";
        psicologos[indice].motivoSolicitudInformacion = motivo;
        if (!HelpsyData.guardarPsicologos(psicologos)) {
            HelpsyUI.toast("No se pudo guardar la solicitud.", "error");
            return;
        }

        HelpsyData.agregarNotificacion({
            clave: `verificacion:${psicologos[indice].id}:informacion:${Date.now()}`,
            destinatarioCedula: psicologos[indice].cedula,
            tipo: "Información solicitada",
            titulo: "Información profesional requerida",
            texto: motivo
        });
        HelpsyData.registrarActividad("Verificación de especialistas", `${sesion.nombre} solicitó información a ${psicologos[indice].nombre}.`);
        HelpsyUI.cerrarModal("modal-solicitud-informacion");
        HelpsyUI.toast("Se envió la solicitud al especialista.", "exito");
        pintarPendientes();

    });

    function pintarEstadisticas() {

        const usuarios = HelpsyData.obtenerUsuarios();
        const psicologos = HelpsyData.obtenerPsicologos();

        const admins = usuarios.filter((u) => u.rol === "Administrador").length;
        const pacientes = usuarios.filter((u) => ["Paciente", "Tutor"].includes(u.rol)).length;

        document.getElementById("stat-grid-usuarios").innerHTML = `
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-azul-suave">${HelpsyUI.ICONOS.usuarios}</span>Total</div>
                <strong>${usuarios.length + psicologos.length}</strong><small>Cuentas de ambas colecciones</small>
            </div>
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-morado-suave">${HelpsyUI.ICONOS.usuario}</span>Administradores</div>
                <strong>${admins}</strong><small>Con acceso total al sistema</small>
            </div>
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-verde-suave">${HelpsyUI.ICONOS.seguimiento}</span>Psicólogos</div>
                <strong>${psicologos.length}</strong><small>En el catálogo profesional</small>
            </div>
            <div class="stat-card">
                <div class="stat-card-encabezado"><span class="stat-card-icono icono-naranja-suave">${HelpsyUI.ICONOS.reportes}</span>Pacientes</div>
                <strong>${pacientes}</strong><small>Pacientes y tutores con cuenta</small>
            </div>
        `;

    }

    function pintarTabla() {

        const cuentas = [
            ...HelpsyData.obtenerUsuarios().map((cuenta) => ({ ...cuenta, tipoCuenta: "usuario" })),
            ...HelpsyData.obtenerPsicologos().map((cuenta) => ({ ...cuenta, rol: "Psicólogo", tipoCuenta: "psicologo" }))
        ];
        const rol = filtroRol.value;
        const texto = buscador.value.trim().toLowerCase();

        const filtrados = cuentas.filter((cuenta) => {

            if (rol !== "Todos" && cuenta.rol !== rol) return false;

            if (texto) {
                const enTexto = `${cuenta.nombre} ${cuenta.cedula} ${cuenta.email}`.toLowerCase();
                if (!enTexto.includes(texto)) return false;
            }

            return true;

        });

        contador.textContent = `${filtrados.length} de ${cuentas.length} cuentas`;

        if (filtrados.length === 0) {

            tabla.innerHTML = `
                <tr><td colspan="6">
                    <div class="estado-vacio">
                        ${HelpsyUI.ICONOS.vacio}
                        <strong>No hay usuarios que coincidan</strong>
                        <span>Ajusta el filtro de rol o el término de búsqueda.</span>
                    </div>
                </td></tr>
            `;

            return;

        }

        tabla.innerHTML = filtrados.map((cuenta) => {
            const propia = cuenta.cedula === sesion.cedula;
            const estado = cuenta.estado || "Activo";
            const estadoVerificacion = cuenta.tipoCuenta === "psicologo"
                ? `<small class="campo-nota">${badgeVerificacion(cuenta.estadoVerificacion)}</small>`
                : "";
            const tipoId = `${cuenta.tipoCuenta}:${cuenta.id}`;
            const tipoCedula = `${cuenta.tipoCuenta}:${cuenta.cedula}`;
            return `
            <tr>
                <td>
                    <div class="fila-persona">
                        <span class="avatar-mini">${HelpsyUI.iniciales(cuenta.nombre)}</span>
                        ${escaparHTML(cuenta.nombre)}
                    </div>
                </td>
                <td>${escaparHTML(cuenta.cedula)}</td>
                <td>${escaparHTML(cuenta.email || "—")}</td>
                <td>${badgeRol(cuenta.rol)}</td>
                <td><span class="badge ${estado === "Activo" ? "badge-verde" : "badge-gris"}">${estado}</span>${estadoVerificacion}</td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${cuenta.tipoCuenta === "usuario" ? `<button class="btn-icono" data-editar="${escaparHTML(cuenta.id)}" aria-label="Editar ${escaparHTML(cuenta.nombre)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>` : ""}
                        <button class="btn btn-fantasma btn-sm" data-restablecer="${tipoId}">Restablecer acceso</button>
                        <button class="btn btn-fantasma btn-sm" data-cambiar-estado="${tipoCedula}" ${propia ? "disabled title=\"No puedes suspender tu propia cuenta\"" : ""}>${estado === "Activo" ? "Suspender" : "Activar"}</button>
                        ${cuenta.tipoCuenta === "usuario" && !propia ? `<button class="btn-icono" data-borrar="${escaparHTML(cuenta.id)}" aria-label="Eliminar ${escaparHTML(cuenta.nombre)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>` : ""}
                    </div>
                </td>
            </tr>
        `;
        }).join("");

    }

    function refrescarTodo() {
        pintarEstadisticas();
        pintarTabla();
        pintarPendientes();
        pintarCategoriasAtencion();
    }

    filtroRol.addEventListener("change", pintarTabla);
    buscador.addEventListener("input", pintarTabla);

    /* -------------------- Modal: nuevo / editar -------------------- */

    function abrirModalNuevo() {

        formulario.reset();
        document.getElementById("usuario-id").value = "";
        document.getElementById("usuario-tipo").value = "usuario";
        document.getElementById("usuario-solo-restablecer").value = "false";
        soloRestablecerAcceso = false;
        modalTitulo.textContent = "Nuevo usuario";
        document.getElementById("usuario-password").required = true;
        document.getElementById("nota-usuario-password").textContent = "";
        document.getElementById("usuario-rol").disabled = false;
        document.getElementById("usuario-rol").querySelector('option[value="Psicólogo"]').disabled = true;
        document.getElementById("usuario-rol").value = "Paciente";
        document.getElementById("usuario-estado").disabled = false;
        document.getElementById("usuario-nombre").readOnly = false;
        document.getElementById("usuario-cedula").readOnly = false;
        document.getElementById("usuario-email").readOnly = false;
        document.querySelectorAll("#form-usuario .campo-error").forEach((e) => e.textContent = "");
        HelpsyUI.abrirModal("modal-usuario");

    }

    function abrirModalEditar(id, tipo = "usuario", restablecer = false) {

        const cuentas = tipo === "psicologo" ? HelpsyData.obtenerPsicologos() : HelpsyData.obtenerUsuarios();
        const usuario = cuentas.find((cuenta) => cuenta.id === id);
        if (!usuario) return;

        soloRestablecerAcceso = restablecer;
        document.getElementById("usuario-tipo").value = tipo;
        document.getElementById("usuario-solo-restablecer").value = String(restablecer);
        modalTitulo.textContent = restablecer ? `Restablecer acceso de ${usuario.nombre}` : "Editar usuario";
        document.getElementById("usuario-id").value = usuario.id;
        document.getElementById("usuario-nombre").value = usuario.nombre;
        document.getElementById("usuario-cedula").value = usuario.cedula;
        document.getElementById("usuario-email").value = usuario.email;
        document.getElementById("usuario-rol").value = tipo === "psicologo" ? "Psicólogo" : usuario.rol;
        document.getElementById("usuario-estado").value = usuario.estado;
        document.getElementById("usuario-password").value = "";
        document.getElementById("usuario-password").required = restablecer;
        document.getElementById("nota-usuario-password").textContent = restablecer
            ? "Define una contraseña de al menos 12 caracteres, con letras y números."
            : "Déjalo en blanco para no cambiar la contraseña actual.";
        document.getElementById("usuario-rol").querySelector('option[value="Psicólogo"]').disabled = true;
        document.getElementById("usuario-rol").disabled = tipo === "psicologo" || restablecer || usuario.cedula === sesion.cedula;
        document.getElementById("usuario-estado").disabled = restablecer || usuario.cedula === sesion.cedula;
        document.getElementById("usuario-nombre").readOnly = restablecer;
        document.getElementById("usuario-cedula").readOnly = restablecer || tipo === "psicologo";
        document.getElementById("usuario-email").readOnly = restablecer;

        document.querySelectorAll("#form-usuario .campo-error").forEach((e) => e.textContent = "");
        HelpsyUI.abrirModal("modal-usuario");

    }

    document.getElementById("btn-nuevo-usuario").addEventListener("click", abrirModalNuevo);
    document.getElementById("cerrar-modal-usuario").addEventListener("click", () => HelpsyUI.cerrarModal("modal-usuario"));
    document.getElementById("cancelar-modal-usuario").addEventListener("click", () => HelpsyUI.cerrarModal("modal-usuario"));

    tabla.addEventListener("click", (evento) => {

        const botonEditar = evento.target.closest("[data-editar]");
        const botonBorrar = evento.target.closest("[data-borrar]");
        const botonRestablecer = evento.target.closest("[data-restablecer]");
        const botonCambiarEstado = evento.target.closest("[data-cambiar-estado]");

        if (botonEditar) {
            abrirModalEditar(botonEditar.dataset.editar, "usuario", false);
        }

        if (botonRestablecer) {
            const [tipo, id] = botonRestablecer.dataset.restablecer.split(":");
            abrirModalEditar(id, tipo, true);
        }

        if (botonCambiarEstado) {
            const [tipo, cedula] = botonCambiarEstado.dataset.cambiarEstado.split(":");
            if (cedula === sesion.cedula) return;

            const coleccion = tipo === "psicologo"
                ? HelpsyData.obtenerPsicologos()
                : HelpsyData.obtenerUsuarios();
            const indice = coleccion.findIndex((cuenta) => cuenta.cedula === cedula);
            if (indice === -1) return;
            coleccion[indice].estado = (coleccion[indice].estado || "Activo") === "Activo" ? "Inactivo" : "Activo";
            const guardado = tipo === "psicologo"
                ? HelpsyData.guardarPsicologos(coleccion)
                : HelpsyData.guardarUsuarios(coleccion);
            if (!guardado) {
                HelpsyUI.toast("No se pudo actualizar el estado de la cuenta.", "error");
                return;
            }
            HelpsyData.registrarActividad("Usuarios", `${sesion.nombre} ${coleccion[indice].estado === "Activo" ? "activó" : "suspendió"} la cuenta ${coleccion[indice].nombre}.`);
            HelpsyUI.toast(`Cuenta ${coleccion[indice].estado === "Activo" ? "activada" : "suspendida"}.`, "exito");
            refrescarTodo();
        }

        if (botonBorrar) {

            const usuarios = HelpsyData.obtenerUsuarios();
            const usuario = usuarios.find((u) => u.id === botonBorrar.dataset.borrar);

            if (usuario && confirm(`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) {

                HelpsyData.guardarUsuarios(usuarios.filter((u) => u.id !== usuario.id));
                HelpsyData.registrarActividad("Usuarios", `${sesion.nombre} eliminó al usuario ${usuario.nombre}.`);
                HelpsyUI.toast(`${usuario.nombre} fue eliminado.`, "exito");
                refrescarTodo();

            }

        }

    });

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        document.querySelectorAll("#form-usuario .campo-error").forEach((e) => e.textContent = "");

        const id = document.getElementById("usuario-id").value;
        const nombre = document.getElementById("usuario-nombre").value.trim();
        const cedula = document.getElementById("usuario-cedula").value.trim();
        const email = document.getElementById("usuario-email").value.trim();
        const password = document.getElementById("usuario-password").value;
        const rol = document.getElementById("usuario-rol").value;
        const estado = document.getElementById("usuario-estado").value;
        const tipo = document.getElementById("usuario-tipo").value;

        if (soloRestablecerAcceso) {
            const errorPassword = HelpsyUI.validarPasswordFuerte(password);
            if (errorPassword) {
                document.getElementById("error-usuario-password").textContent = errorPassword;
                return;
            }

            const coleccion = tipo === "psicologo"
                ? HelpsyData.obtenerPsicologos()
                : HelpsyData.obtenerUsuarios();
            const indice = coleccion.findIndex((cuenta) => cuenta.id === id);
            if (indice === -1) return;
            const guardado = HelpsyData.actualizarCuenta(tipo, coleccion[indice].cedula, {
                passwordHash: await HelpsyUI.hashPassword(password)
            });
            if (!guardado) {
                HelpsyUI.toast("No se pudo restablecer el acceso.", "error");
                return;
            }
            HelpsyData.registrarActividad("Usuarios", `${sesion.nombre} restableció el acceso de ${coleccion[indice].nombre}.`);
            HelpsyUI.cerrarModal("modal-usuario");
            HelpsyUI.toast("Contraseña restablecida.", "exito");
            refrescarTodo();
            return;
        }

        let valido = true;

        if (nombre.length < 3) {
            document.getElementById("error-usuario-nombre").textContent = "Escribe el nombre completo.";
            valido = false;
        }

        if (!/^\d{6,10}$/.test(cedula)) {
            document.getElementById("error-usuario-cedula").textContent = "Cédula inválida.";
            valido = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById("error-usuario-email").textContent = "Correo inválido.";
            valido = false;
        }

        // Contraseña: obligatoria al crear, opcional al editar
        // (en blanco = no se toca la que ya tenía).
        const esNuevo = !id;

        if ((esNuevo || password) && password.length > 0) {
            const errorPassword = HelpsyUI.validarPasswordFuerte(password);
            if (errorPassword) {
                document.getElementById("error-usuario-password").textContent = errorPassword;
                valido = false;
            }
        }

        if (esNuevo && password.length === 0) {
            document.getElementById("error-usuario-password").textContent = "La contraseña es obligatoria para una cuenta nueva.";
            valido = false;
        }

        const usuarios = HelpsyData.obtenerUsuarios();
        const psicologos = HelpsyData.obtenerPsicologos();

        const cedulaDuplicada = [...usuarios, ...psicologos].some((u) =>
            u.cedula === cedula && !(u.id === id && tipo === "usuario")
        );
        const correoDuplicado = [...usuarios, ...psicologos].some((cuenta) =>
            cuenta.email && cuenta.email.toLowerCase() === email.toLowerCase() &&
            !(cuenta.id === id && tipo === "usuario")
        );

        if (valido && cedulaDuplicada) {
            document.getElementById("error-usuario-cedula").textContent = "Ya existe otro usuario con esta cédula.";
            valido = false;
        }

        if (valido && correoDuplicado) {
            document.getElementById("error-usuario-email").textContent = "Ya existe otra cuenta con este correo.";
            valido = false;
        }

        if (!id && rol === "Psicólogo") {
            document.getElementById("error-usuario-email").textContent = "Los especialistas deben registrarse y verificar sus credenciales profesionales.";
            valido = false;
        }

        if (!valido) return;

        if (id) {

            const indice = usuarios.findIndex((u) => u.id === id);
            const cambios = { nombre, cedula, email, rol, estado };
            if (password) cambios.passwordHash = await HelpsyUI.hashPassword(password);

            if (!HelpsyData.actualizarCuenta("usuario", usuarios[indice].cedula, cambios)) {
                HelpsyUI.toast("No se pudo actualizar el usuario.", "error");
                return;
            }
            HelpsyData.registrarActividad("Usuarios", `${sesion.nombre} editó al usuario ${nombre}.`);
            HelpsyUI.toast("Usuario actualizado.", "exito");

        } else {

            const passwordHash = await HelpsyUI.hashPassword(password);
            usuarios.push({ id: `u${Date.now()}`, nombre, cedula, email, passwordHash, rol, estado });
            if (!HelpsyData.guardarUsuarios(usuarios)) {
                HelpsyUI.toast("No se pudo crear el usuario.", "error");
                return;
            }
            HelpsyData.registrarActividad("Usuarios", `${sesion.nombre} creó al usuario ${nombre} (${rol}).`);
            HelpsyUI.toast("Usuario creado.", "exito");

        }

        HelpsyUI.cerrarModal("modal-usuario");
        refrescarTodo();

    });

    refrescarTodo();

});
