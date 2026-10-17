document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("form-registro");
    const selectTipo = document.getElementById("tipoUsuario");
    const camposPsicologo = document.getElementById("campos-psicologo");
    const notaTutor = document.getElementById("nota-tutor");
    const selectEspecialidad = document.getElementById("especialidad");

    selectEspecialidad.innerHTML = HelpsyData.ESPECIALIDADES.map((especialidad) =>
        `<option value="${especialidad}">${especialidad}</option>`
    ).join("");

    function actualizarCamposSegunTipo() {
        camposPsicologo.classList.toggle("oculto", selectTipo.value !== "Psicólogo");
        notaTutor.classList.toggle("oculto", selectTipo.value !== "Tutor");
    }

    function edadEnAnios(fechaISO) {
        const [anioNacimiento, mesNacimiento, diaNacimiento] = fechaISO.split("-").map(Number);
        const [anioHoy, mesHoy, diaHoy] = HelpsyData.fechaBogotaISO().split("-").map(Number);
        let edad = anioHoy - anioNacimiento;

        if (mesHoy < mesNacimiento ||
            (mesHoy === mesNacimiento && diaHoy < diaNacimiento)) {
            edad -= 1;
        }

        return edad;
    }

    selectTipo.addEventListener("change", actualizarCamposSegunTipo);
    actualizarCamposSegunTipo();

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();
        document.querySelectorAll(".campo-error").forEach((elemento) => elemento.textContent = "");

        const nombre = document.getElementById("nombre").value.trim();
        const cedula = document.getElementById("cedula").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const fechaNacimiento = document.getElementById("fecha-nacimiento").value;
        const password = document.getElementById("password").value;
        const tipoUsuario = selectTipo.value;
        const autorizacion = document.getElementById("autorizacion-datos").checked;
        const tituloProfesional = document.getElementById("titulo-profesional").value.trim();
        const registroProfesional = document.getElementById("registro-profesional").value.trim();
        const categorias = Array.from(selectEspecialidad.selectedOptions, (opcion) => opcion.value);
        const errores = {
            nombre: document.getElementById("error-nombre"),
            cedula: document.getElementById("error-cedula"),
            email: document.getElementById("error-email"),
            fecha: document.getElementById("error-fecha-nacimiento"),
            password: document.getElementById("error-password"),
            titulo: document.getElementById("error-titulo-profesional"),
            registro: document.getElementById("error-registro-profesional"),
            autorizacion: document.getElementById("error-autorizacion")
        };
        let valido = true;

        if (!["Paciente", "Tutor", "Psicólogo"].includes(tipoUsuario)) {
            HelpsyUI.toast("Ese tipo de cuenta no se puede registrar desde este formulario.", "error");
            return;
        }

        if (nombre.length < 3) {
            errores.nombre.textContent = "Escribe tu nombre completo.";
            valido = false;
        }

        if (!/^\d{6,10}$/.test(cedula)) {
            errores.cedula.textContent = "Cédula inválida (6 a 10 dígitos).";
            valido = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errores.email.textContent = "Correo inválido.";
            valido = false;
        }

        if (!fechaNacimiento || Number.isNaN(new Date(`${fechaNacimiento}T12:00:00.000Z`).getTime())) {
            errores.fecha.textContent = "Selecciona una fecha de nacimiento válida.";
            valido = false;
        } else if (fechaNacimiento > HelpsyData.fechaBogotaISO()) {
            errores.fecha.textContent = "La fecha de nacimiento no puede estar en el futuro.";
            valido = false;
        } else if (edadEnAnios(fechaNacimiento) < 18) {
            errores.fecha.textContent = "El registro es para personas adultas (18 años o más). Para un menor, debe registrarlo un tutor.";
            valido = false;
        }

        const errorPassword = HelpsyUI.validarPasswordFuerte(password);
        if (errorPassword) {
            errores.password.textContent = errorPassword;
            valido = false;
        }

        if (!autorizacion) {
            errores.autorizacion.textContent = "Debes autorizar el tratamiento de tus datos para continuar.";
            valido = false;
        }

        if (tipoUsuario === "Psicólogo") {
            if (tituloProfesional.length < 5) {
                errores.titulo.textContent = "Escribe tu título profesional completo.";
                valido = false;
            }
            if (registroProfesional.length < 4) {
                errores.registro.textContent = "Escribe tu número de registro/tarjeta profesional.";
                valido = false;
            }
            if (categorias.length === 0) {
                HelpsyUI.toast("Selecciona al menos una categoría profesional.", "error");
                valido = false;
            }
        }

        const usuarios = HelpsyData.obtenerUsuarios();
        const psicologos = HelpsyData.obtenerPsicologos();
        const cedulaDuplicada = [...usuarios, ...psicologos].some((cuenta) => cuenta.cedula === cedula);
        const correoDuplicado = [...usuarios, ...psicologos].some((cuenta) =>
            cuenta.email && cuenta.email.toLowerCase() === email
        );

        if (valido && correoDuplicado) {
            errores.email.innerHTML = 'Este correo ya tiene una cuenta. <a href="login.html">Iniciar sesión</a>.';
            return;
        }
        if (valido && cedulaDuplicada) {
            errores.cedula.textContent = "Ya existe una cuenta con esta cédula.";
            return;
        }
        if (!valido) return;

        const passwordHash = await HelpsyUI.hashPassword(password);
        const consentimiento = HelpsyData.registrarConsentimiento(cedula, cedula, nombre);

        if (tipoUsuario === "Psicólogo") {

            psicologos.push({
                id: `p-${Date.now()}`,
                nombre,
                cedula,
                email,
                correoVerificado: false,
                fechaNacimiento,
                passwordHash,
                titulo: tituloProfesional,
                registroProfesional,
                estadoVerificacion: "Pendiente",
                especialidad: categorias[0],
                categorias,
                experiencia: 1,
                tarifa: 70000,
                calificacion: 5.0,
                bio: "",
                estado: "Activo",
                consentimiento,
                historialConsentimientos: [consentimiento]
            });

            if (!HelpsyData.guardarPsicologos(psicologos)) {
                HelpsyUI.toast("No se pudo guardar el registro profesional.", "error");
                return;
            }

            HelpsyData.registrarActividad("Registro", `Nuevo especialista registrado: ${nombre}, pendiente de verificación.`);

        } else {

            usuarios.push({
                id: `u${Date.now()}`,
                nombre,
                cedula,
                email,
                correoVerificado: false,
                fechaNacimiento,
                passwordHash,
                rol: tipoUsuario,
                estado: "Activo",
                consentimiento,
                historialConsentimientos: [consentimiento]
            });

            if (!HelpsyData.guardarUsuarios(usuarios)) {
                HelpsyUI.toast("No se pudo guardar el registro.", "error");
                return;
            }

            HelpsyData.registrarActividad("Registro", `Nueva cuenta creada: ${nombre} (${tipoUsuario}).`);

        }

        const tipoCuenta = tipoUsuario === "Psicólogo" ? "psicologo" : "usuario";
        const token = HelpsyData.crearTokenCuenta("verificar-correo", tipoCuenta, cedula);

        if (!token) {
            HelpsyUI.toast("La cuenta quedó creada, pero no se pudo generar el enlace. Contacta al administrador de la demo.", "error");
            return;
        }

        const enlace = new URL("login.html", window.location.href);
        enlace.searchParams.set("verificar", token);
        document.getElementById("link-verificacion").href = enlace.href;
        document.getElementById("registro-verificacion").classList.remove("oculto");
        formulario.classList.add("oculto");
        document.getElementById("registro-verificacion").scrollIntoView({ behavior: "smooth", block: "center" });

    });

});
