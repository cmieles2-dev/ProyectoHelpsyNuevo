/**
 * Piezas compartidas entre todas las páginas internas de Helpsy
 * (todo lo que no sea login/registro).
 */

const HelpsyUI = (() => {

    const ICONOS = {

        logo: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 3c-2 3-6 5-10 5v8c0 8 5.5 12.5 10 13.5C20.5 28.5 26 24 26 16V8c-4 0-8-2-10-5Z" fill="url(#g1)"/><path d="M13 16h2.5v-2.5a.5.5 0 0 1 1 0V16H19a.5.5 0 0 1 0 1h-2.5v2.5a.5.5 0 0 1-1 0V17H13a.5.5 0 0 1 0-1Z" fill="white"/><defs><linearGradient id="g1" x1="6" y1="3" x2="26" y2="28"><stop stop-color="#4f9eff"/><stop offset="1" stop-color="#2f6fed"/></linearGradient></defs></svg>`,

        usuarios: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,

        carga: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,

        indicadores: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,

        reportes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,

        seguimiento: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,

        dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,

        usuario: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,

        menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,

        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,

        exito: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,

        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,

        vacio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,

        citas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,

        diario: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>`,

        tareas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,

        pagos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,

        campana: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,

        video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,

        estrella: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,

        salir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,

        recursos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,

        supervision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>`,

        talleres: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`

    };

    const ITEMS_NAV_ADMIN = [
        { clave: "usuarios", href: "usuarios.html", icono: "usuarios", texto: "Usuarios" },
        { clave: "carga", href: "carga-datos.html", icono: "carga", texto: "Carga de datos" },
        { clave: "indicadores", href: "indicadores.html", icono: "indicadores", texto: "Indicadores" },
        { clave: "reportes", href: "reportes.html", icono: "reportes", texto: "Reportes" },
        { clave: "seguimiento", href: "seguimiento.html", icono: "seguimiento", texto: "Seguimiento" },
        { clave: "dashboard", href: "dashboard.html", icono: "dashboard", texto: "Dashboard" },
        { clave: "supervision", href: "supervision.html", icono: "supervision", texto: "Supervisión" },
        { clave: "auditoria", href: "auditoria.html", icono: "reportes", texto: "Auditoría" },
        { clave: "perfil", href: "perfil.html", icono: "usuario", texto: "Mi perfil" }
    ];

    const ITEMS_NAV_PACIENTE = [
        { clave: "paciente", href: "paciente.html", icono: "dashboard", texto: "Mi panel" },
        { clave: "psicologos", href: "psicologos.html", icono: "usuarios", texto: "Buscar psicólogos" },
        { clave: "citas", href: "citas.html", icono: "citas", texto: "Mis citas" },
        { clave: "diario", href: "diario.html", icono: "diario", texto: "Diario emocional" },
        { clave: "tareas", href: "tareas.html", icono: "tareas", texto: "Tareas" },
        { clave: "recursos", href: "recursos.html", icono: "recursos", texto: "Recursos" },
        { clave: "talleres", href: "talleres.html", icono: "talleres", texto: "Talleres grupales" },
        { clave: "pagos", href: "pagos.html", icono: "pagos", texto: "Pagos" },
        { clave: "perfil", href: "perfil.html", icono: "usuario", texto: "Mi perfil" }
    ];

    const ITEMS_NAV_TUTOR = [
        { clave: "menores", href: "menores.html", icono: "usuarios", texto: "Mis menores" },
        { clave: "psicologos", href: "psicologos.html", icono: "usuarios", texto: "Buscar psicólogos" },
        { clave: "citas", href: "citas.html", icono: "citas", texto: "Citas" },
        { clave: "diario", href: "diario.html", icono: "diario", texto: "Registro emocional" },
        { clave: "tareas", href: "tareas.html", icono: "tareas", texto: "Tareas" },
        { clave: "recursos", href: "recursos.html", icono: "recursos", texto: "Recursos" },
        { clave: "perfil", href: "perfil.html", icono: "usuario", texto: "Mi perfil" }
    ];

    const ITEMS_NAV_PSICOLOGO = [
        { clave: "psicologo", href: "psicologo.html", icono: "dashboard", texto: "Mi panel" },
        { clave: "mis-pacientes", href: "mis-pacientes.html", icono: "usuarios", texto: "Mis pacientes" },
        { clave: "citas", href: "citas.html", icono: "citas", texto: "Agenda de citas" },
        { clave: "tareas", href: "tareas.html", icono: "tareas", texto: "Tareas asignadas" },
        { clave: "talleres", href: "talleres.html", icono: "talleres", texto: "Talleres grupales" },
        { clave: "perfil", href: "perfil.html", icono: "usuario", texto: "Mi perfil" }
    ];

    function navPorRol(rol) {

        if (rol === "Administrador") return ITEMS_NAV_ADMIN;
        if (rol === "Psicólogo") return ITEMS_NAV_PSICOLOGO;
        if (rol === "Tutor") return ITEMS_NAV_TUTOR;
        return ITEMS_NAV_PACIENTE;

    }

    /* ------------------------------------------------------
       Guardia de sesión: si no hay usuario "logueado", se
       manda de vuelta al login. Es una simulación de
       autenticación en el navegador, no seguridad real.
    ------------------------------------------------------ */
    function exigirSesion() {

        const sesion = HelpsyData.obtenerSesion();

        if (!sesion) {
            window.location.href = "login.html";
            return null;
        }

        return sesion;

    }

    /* ------------------------------------------------------
       RF-04 / RNF-04: mantiene viva la sesión mientras la persona
       interactúa, y revisa cada minuto si el token ya expiró (1 h)
       o si pasaron 30 min sin actividad — en ambos casos
       HelpsyData.obtenerSesion() ya la cierra sola; aquí solo hace
       falta notar que quedó cerrada y sacar a la persona del panel.
    ------------------------------------------------------ */
    let vigilanciaSesionActiva = false;

    function vigilarSesion() {

        if (vigilanciaSesionActiva) return;
        vigilanciaSesionActiva = true;

        ["click", "keydown", "scroll", "mousemove"].forEach((evento) => {
            document.addEventListener(evento, () => HelpsyData.renovarActividadSesion(), { passive: true });
        });

        setInterval(() => {

            if (!HelpsyData.obtenerSesion()) {

                alert("Tu sesión se cerró por seguridad (expiró o estuvo inactiva por más de 30 minutos). Inicia sesión de nuevo.");
                window.location.href = "login.html";

            }

        }, 60 * 1000);

    }

    /* ------------------------------------------------------
       Construye el sidebar + topbar dentro de los
       contenedores #helpsy-sidebar y #helpsy-topbar
    ------------------------------------------------------ */
    function montarShell(paginaActiva, tituloPagina) {

        const sesion = exigirSesion();
        if (!sesion) return null;

        vigilarSesion();

        // Enlace "saltar al contenido": invisible hasta que alguien lo
        // enfoca con Tab, útil para no obligar a pasar por los 6-8
        // enlaces del sidebar en cada página con solo el teclado.
        const contenidoPrincipal = document.querySelector("main.contenido");

        if (contenidoPrincipal && !document.getElementById("enlace-saltar-contenido")) {

            contenidoPrincipal.id = contenidoPrincipal.id || "contenido-principal";

            document.body.insertAdjacentHTML("afterbegin", `
                <a href="#${contenidoPrincipal.id}" class="skip-link" id="enlace-saltar-contenido">
                    Saltar al contenido
                </a>
            `);

        }

        const contenedorSidebar = document.getElementById("helpsy-sidebar");
        const contenedorTopbar = document.getElementById("helpsy-topbar");

        if (contenedorSidebar) {

            const items = navPorRol(sesion.rol);

            const enlaces = items.map((item) => `
                <a class="sidebar-link ${item.clave === paginaActiva ? "activo" : ""}" href="${item.href}" ${item.clave === paginaActiva ? 'aria-current="page"' : ""}>
                    ${ICONOS[item.icono]}
                    <span>${item.texto}</span>
                </a>
            `).join("");

            contenedorSidebar.innerHTML = `
                <button class="sidebar-toggle" id="helpsy-toggle-sidebar" aria-label="Abrir menú">
                    ${ICONOS.menu}
                </button>
                <div class="overlay-sidebar" id="helpsy-overlay-sidebar"></div>
                <aside class="sidebar" id="helpsy-sidebar-panel">
                    <div class="sidebar-logo">
                        ${ICONOS.logo}
                        <span>Helpsy</span>
                    </div>
                    <nav class="sidebar-nav" aria-label="Menú principal">${enlaces}</nav>
                    <p class="sidebar-pie">
                        Avance de proyecto — datos de demostración,
                        sin conexión a un servidor real.
                    </p>
                </aside>
            `;

            const boton = document.getElementById("helpsy-toggle-sidebar");
            const panel = document.getElementById("helpsy-sidebar-panel");
            const overlay = document.getElementById("helpsy-overlay-sidebar");

            boton?.addEventListener("click", () => {
                panel.classList.toggle("abierto");
                overlay.classList.toggle("visible");
            });

            overlay?.addEventListener("click", () => {
                panel.classList.remove("abierto");
                overlay.classList.remove("visible");
            });

        }

        if (contenedorTopbar) {

            contenedorTopbar.innerHTML = `
                <h1>${tituloPagina}</h1>
                <div class="topbar-usuario">
                    <div class="notif-envoltura">
                        <button class="btn-icono" id="helpsy-campana" aria-label="Notificaciones">
                            ${ICONOS.campana}
                        </button>
                        <span class="notif-punto oculto" id="helpsy-notif-punto"></span>
                        <div class="notif-panel oculto" id="helpsy-notif-panel"></div>
                    </div>
                    <div class="topbar-nombre">
                        <strong>${sesion.nombre || "Usuario"}</strong>
                        <span>C.C. ${sesion.cedula || "—"} · ${sesion.rol || "Usuario"}</span>
                    </div>
                    <div class="topbar-avatar">${ICONOS.usuario}</div>
                    <button class="btn btn-fantasma btn-sm" id="helpsy-cerrar-sesion">
                        Cerrar sesión
                    </button>
                </div>
            `;

            document.getElementById("helpsy-cerrar-sesion")
                ?.addEventListener("click", () => confirmarCerrarSesion());

            montarNotificaciones(sesion);

        }

        return sesion;

    }

    /* ------------------------------------------------------
       Notificaciones: recordatorios generados a partir de
       las citas reales guardadas (no hay push real todavía)
    ------------------------------------------------------ */
    function montarNotificaciones(sesion) {

        const boton = document.getElementById("helpsy-campana");
        const panel = document.getElementById("helpsy-notif-panel");
        const punto = document.getElementById("helpsy-notif-punto");

        if (!boton || typeof HelpsyData.obtenerCitas !== "function") return;

        const citas = HelpsyData.obtenerCitas().filter((cita) => {
            if (sesion.rol === "Paciente") return cita.pacienteCedula === sesion.cedula ||
                (cita.pacientesAdicionales || []).some((paciente) => paciente.cedula === sesion.cedula);
            if (sesion.rol === "Psicólogo") return cita.psicologoCedula === sesion.cedula;
            if (sesion.rol === "Tutor") return cita.agendadaPorTutor?.cedula === sesion.cedula;
            return false;
        });

        citas.forEach((cita) => {
            if (!cita.pagado || !["Programada", "Reprogramada"].includes(cita.estado)) return;
            const horasRestantes = HelpsyData.horasHastaCita(cita);
            if (horasRestantes <= 0 || horasRestantes > 24) return;
            const ventana = horasRestantes <= 1 ? "1h" : "24h";
            const texto = sesion.rol === "Psicólogo"
                ? `Tienes una cita con ${cita.pacienteNombre} el ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}.`
                : `Tienes una cita con ${cita.psicologoNombre} el ${HelpsyData.formatearFechaBogota(cita.fecha)} a las ${cita.hora}.`;
            HelpsyData.agregarNotificacion({
                clave: `cita:${cita.id}:recordatorio:${ventana}`,
                destinatarioCedula: sesion.cedula,
                tipo: "Recordatorio de cita",
                titulo: `Recordatorio ${ventana === "1h" ? "de 1 hora" : "de 24 horas"}`,
                texto
            });
        });

        function escaparHTML(texto) {
            return String(texto || "").replace(/[&<>"']/g, (caracter) => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
            })[caracter]);
        }

        function pintarPanel() {

            const notificaciones = HelpsyData.obtenerNotificaciones(sesion.cedula).slice(0, 8);
            punto.classList.toggle("oculto", !notificaciones.some((notificacion) => !notificacion.leida));
            panel.innerHTML = notificaciones.length === 0
                ? `<div class="notif-vacio">Sin notificaciones por ahora.</div>`
                : notificaciones.map((notificacion) => `
                    <div class="notif-item ${notificacion.leida ? "" : "no-leida"}">
                        ${notificacion.tipo.includes("cita") || notificacion.tipo.includes("Cita") ? ICONOS.citas : ICONOS.tareas}
                        <div>
                            <p><strong>${escaparHTML(notificacion.titulo)}</strong></p>
                            <p>${escaparHTML(notificacion.texto)}</p>
                            <span class="badge ${notificacion.leida ? "badge-gris" : "badge-azul"}">${notificacion.leida ? "Leída" : "Nueva"}</span>
                            ${notificacion.leida ? "" : `<button class="btn btn-fantasma btn-sm" data-leer-notificacion="${escaparHTML(notificacion.id)}">Marcar leída</button>`}
                        </div>
                    </div>
                `).join("");

        }

        pintarPanel();

        boton.addEventListener("click", (evento) => {
            evento.stopPropagation();
            panel.classList.toggle("oculto");
        });

        panel.addEventListener("click", (evento) => {
            const botonLeer = evento.target.closest("[data-leer-notificacion]");
            if (!botonLeer) return;
            HelpsyData.marcarNotificacionLeida(botonLeer.dataset.leerNotificacion, sesion.cedula);
            pintarPanel();
        });

        document.addEventListener("click", () => panel.classList.add("oculto"));
        panel.addEventListener("click", (evento) => evento.stopPropagation());

    }

    function confirmarCerrarSesion() {

        const confirmado = confirm("¿Cerrar tu sesión en Helpsy?");

        if (confirmado) {
            HelpsyData.cerrarSesion();
            window.location.href = "login.html";
        }

    }

    /* ------------------------------------------------------
       Restringe una página a ciertos roles. Si el rol de la
       sesión no está permitido, redirige a su panel correcto
       en vez de dejarlo ver una pantalla que no le corresponde.
    ------------------------------------------------------ */
    function exigirRol(...rolesPermitidos) {

        const sesion = HelpsyData.obtenerSesion();

        if (!sesion) {
            window.location.href = "login.html";
            return false;
        }

        if (!rolesPermitidos.includes(sesion.rol)) {
            toast("No tienes acceso a esa sección con tu rol actual.", "error");
            window.location.href = "post-login.html";
            return false;
        }

        return true;

    }

    /* ------------------------------------------------------
       Toasts (feedback visual de acciones)
    ------------------------------------------------------ */
    function toast(mensaje, tipo = "info") {

        let contenedor = document.querySelector(".toast-contenedor");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.className = "toast-contenedor";
            document.body.appendChild(contenedor);
        }

        const icono = tipo === "exito" ? ICONOS.exito : tipo === "error" ? ICONOS.error : ICONOS.info;

        const elemento = document.createElement("div");
        elemento.className = `toast ${tipo}`;
        elemento.setAttribute("role", "status");
        elemento.innerHTML = `${icono}<span>${mensaje}</span>`;

        contenedor.appendChild(elemento);

        setTimeout(() => {
            elemento.style.opacity = "0";
            elemento.style.transition = "opacity 0.25s ease";
            setTimeout(() => elemento.remove(), 260);
        }, 3200);

    }

    /* ------------------------------------------------------
       Modal genérico
    ------------------------------------------------------ */
    let elementoConFocoPrevio = null;

    function abrirModal(idOverlay) {

        const overlay = document.getElementById(idOverlay);
        if (!overlay) return;

        elementoConFocoPrevio = document.activeElement;

        overlay.classList.add("visible");

        // Mueve el foco al primer campo o botón dentro del modal, para
        // que alguien navegando con teclado no se quede "perdido" en
        // el fondo de la página mientras el modal está abierto.
        const primerFocable = overlay.querySelector(
            "input:not([type=hidden]):not([disabled]), select, textarea, button:not([disabled])"
        );
        primerFocable?.focus();

    }

    function cerrarModal(idOverlay) {

        document.getElementById(idOverlay)?.classList.remove("visible");

        // Devuelve el foco a donde estaba antes de abrir el modal
        // (por ejemplo, el botón "Agendar" que lo abrió).
        elementoConFocoPrevio?.focus();
        elementoConFocoPrevio = null;

    }

    // Escape cierra cualquier modal visible, en cualquier página.
    document.addEventListener("keydown", (evento) => {

        if (evento.key !== "Escape") return;

        const modalAbierto = document.querySelector(".modal-overlay.visible");
        if (modalAbierto) cerrarModal(modalAbierto.id);

    });

    /* ------------------------------------------------------
       Exportar a Excel real (.xlsx) usando SheetJS
    ------------------------------------------------------ */
    function exportarExcel(nombreArchivo, hojaNombre, filas) {

        if (typeof XLSX === "undefined") {
            toast("No se pudo cargar la librería de Excel.", "error");
            return;
        }

        if (!filas || filas.length === 0) {
            toast("No hay datos para exportar con los filtros actuales.", "error");
            return;
        }

        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, hojaNombre);
        XLSX.writeFile(libro, nombreArchivo);

        toast(`${nombreArchivo} descargado (${filas.length} filas).`, "exito");

    }

    /* ------------------------------------------------------
       Comprobante / ticket imprimible (pagos y citas)
    ------------------------------------------------------ */
    function imprimirComprobante(titulo, codigo, filas) {

        const ventana = window.open("", "_blank");

        if (!ventana) {
            toast("El navegador bloqueó la ventana de impresión.", "error");
            return;
        }

        const filasHtml = filas.map(([etiqueta, valor]) => `
            <div class="fila"><span>${etiqueta}</span><strong>${valor}</strong></div>
        `).join("");

        ventana.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>${titulo} — Helpsy</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #101828; display:flex; justify-content:center; }
                    .ticket { width: 360px; border: 2px dashed #94a3b8; border-radius: 14px; padding: 24px; }
                    h1 { font-size: 18px; margin-bottom: 2px; }
                    .codigo { color: #3b6df0; font-size: 12px; font-weight: 700; margin-bottom: 18px; }
                    .fila { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px; }
                    .fila span { color: #667085; }
                    .pie { margin-top: 18px; text-align: center; font-size: 10.5px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <h1>🍃 Helpsy</h1>
                    <div class="codigo">Comprobante ${codigo}</div>
                    ${filasHtml}
                    <p class="pie">Generado el ${HelpsyData.formatearFechaBogota(new Date().toISOString(), true)} · Documento de demostración</p>
                </div>
                <script>window.onload = () => window.print();<\/script>
            </body>
            </html>
        `);

        ventana.document.close();

    }

    function formatoPesos(valor) {

        return new Intl.NumberFormat("es-CO", {
            style: "currency", currency: "COP", maximumFractionDigits: 0
        }).format(valor);

    }

    function iniciales(nombreCompleto) {

        return nombreCompleto
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0].toUpperCase())
            .join("");

    }

    /* ------------------------------------------------------
       Hash de contraseñas (SHA-256, Web Crypto API nativa).
       Esto reemplaza guardar la contraseña en texto plano.
       Aviso honesto: sin backend, cualquiera que abra la consola
       del navegador puede ver este mismo código y recalcular el
       hash — no es seguridad de nivel producción, pero ya no deja
       la contraseña legible directamente en localStorage, que es
       el problema concreto que había antes.
    ------------------------------------------------------ */
    async function hashPassword(textoPlano) {

        const datos = new TextEncoder().encode(textoPlano);
        const buffer = await crypto.subtle.digest("SHA-256", datos);

        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

    }

    function validarPasswordFuerte(password) {

        if (password.length < 12) return "Usa al menos 12 caracteres.";
        if (password.length > 128) return "Usa como máximo 128 caracteres.";
        if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
            return "Incluye al menos una letra y un número.";
        }

        const contrasenasComunes = ["123456789012", "password1234", "qwerty123456", "abcdefgh1234"];
        if (contrasenasComunes.includes(password.toLowerCase()) || new Set(password).size < 5) {
            return "Evita contraseñas comunes o repetir el mismo carácter.";
        }

        return "";

    }

    /* ------------------------------------------------------
       Cifrado AES-256-GCM para datos clínicos sensibles
       (notas del diario emocional).

       Límite honesto: sin backend, la llave se deriva en el mismo
       navegador que cifra y descifra, así que esto NO protege el
       dato de alguien con acceso al código o a la máquina del
       usuario. Lo que sí logra: si alguien copia el localStorage
       en crudo (por ejemplo, un archivo de respaldo mal compartido),
       no puede leer las notas sin pasar por esta misma función.
       Cifrado "real" de custodia de llaves requiere que la llave
       viva del lado del servidor, nunca en el navegador.
    ------------------------------------------------------ */
    async function derivarClave(cedula) {

        const material = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(cedula),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("helpsy-datos-clinicos"),
                iterations: 100000,
                hash: "SHA-256"
            },
            material,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );

    }

    function aBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    function deBase64(base64) {
        return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    }

    async function cifrarTexto(textoPlano, cedula) {

        if (!textoPlano) return { iv: "", datos: "" };

        const clave = await derivarClave(cedula);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const cifrado = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            clave,
            new TextEncoder().encode(textoPlano)
        );

        return { iv: aBase64(iv), datos: aBase64(cifrado) };

    }

    async function descifrarTexto(paquete, cedula) {

        if (!paquete || !paquete.datos) return "";

        try {

            const clave = await derivarClave(cedula);

            const descifrado = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: deBase64(paquete.iv) },
                clave,
                deBase64(paquete.datos)
            );

            return new TextDecoder().decode(descifrado);

        } catch (error) {

            console.error("No se pudo descifrar (¿cédula distinta a la que cifró?):", error);
            return "⚠️ No se pudo descifrar esta nota.";

        }

    }

    function dibujarGraficaEmocional(canvas, etiquetas, valores, color) {

        const alto = 180;
        const ancho = Math.max(canvas.clientWidth, 300);
        const escala = window.devicePixelRatio || 1;
        canvas.width = ancho * escala;
        canvas.height = alto * escala;
        canvas.style.height = `${alto}px`;
        const contexto = canvas.getContext("2d");
        contexto.scale(escala, escala);
        contexto.clearRect(0, 0, ancho, alto);

        const margen = { arriba: 12, derecha: 8, abajo: 28, izquierda: 30 };
        const anchoGrafica = ancho - margen.izquierda - margen.derecha;
        const altoGrafica = alto - margen.arriba - margen.abajo;
        contexto.font = "10px sans-serif";
        contexto.textAlign = "right";

        for (let valor = 1; valor <= 5; valor++) {
            const y = margen.arriba + altoGrafica * (5 - valor) / 4;
            contexto.strokeStyle = "#e4e7ec";
            contexto.beginPath();
            contexto.moveTo(margen.izquierda, y);
            contexto.lineTo(ancho - margen.derecha, y);
            contexto.stroke();
            contexto.fillStyle = "#667085";
            contexto.fillText(String(valor), margen.izquierda - 8, y + 3);
        }

        contexto.strokeStyle = color;
        contexto.fillStyle = color;
        contexto.lineWidth = 2;
        let segmentoAbierto = false;
        valores.forEach((valor, indice) => {
            if (valor == null) {
                segmentoAbierto = false;
                return;
            }
            const x = margen.izquierda + (valores.length < 2 ? 0 : anchoGrafica * indice / (valores.length - 1));
            const y = margen.arriba + altoGrafica * (5 - valor) / 4;
            if (segmentoAbierto) contexto.lineTo(x, y);
            else contexto.moveTo(x, y);
            contexto.stroke();
            contexto.beginPath();
            contexto.arc(x, y, 3, 0, Math.PI * 2);
            contexto.fill();
            contexto.beginPath();
            contexto.moveTo(x, y);
            segmentoAbierto = true;
        });

        const paso = Math.max(1, Math.ceil(etiquetas.length / 7));
        contexto.fillStyle = "#667085";
        contexto.textAlign = "center";
        etiquetas.forEach((etiqueta, indice) => {
            if (indice % paso === 0 || indice === etiquetas.length - 1) {
                const x = margen.izquierda + (etiquetas.length < 2 ? 0 : anchoGrafica * indice / (etiquetas.length - 1));
                contexto.fillText(etiqueta, x, alto - 8);
            }
        });

    }

    return {
        ICONOS,
        exigirSesion,
        exigirRol,
        montarShell,
        toast,
        abrirModal,
        cerrarModal,
        exportarExcel,
        imprimirComprobante,
        formatoPesos,
        iniciales,
        hashPassword,
        validarPasswordFuerte,
        cifrarTexto,
        descifrarTexto,
        dibujarGraficaEmocional
    };

})();
