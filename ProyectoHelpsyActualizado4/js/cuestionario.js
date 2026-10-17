document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyData.obtenerSesion();

    if (sesion && sesion.rol !== "Paciente") {
        window.location.href = "post-login.html";
        return;
    }

    const esAnonimo = !sesion;

    const preguntas = HelpsyData.PREGUNTAS_BIENESTAR;
    let indiceActual = -1; // -1 = pantalla de intro
    const respuestas = [];

    const progresoRelleno = document.getElementById("progreso-relleno");
    const pantallaIntro = document.getElementById("pantalla-intro");
    const pantallaPregunta = document.getElementById("pantalla-pregunta");
    const pantallaResultado = document.getElementById("pantalla-resultado");

    document.getElementById("total-preguntas").textContent = preguntas.length;
    document.getElementById("descripcion-cuestionario").innerHTML = esAnonimo
        ? `Son <span id="total-preguntas-anonimo">${preguntas.length}</span> preguntas orientativas. No es un diagnóstico ni una escala clínica validada.`
        : `Son <span>${preguntas.length}</span> preguntas orientativas. No es un diagnóstico ni una escala clínica validada.`;
    document.getElementById("nota-privacidad-cuestionario").textContent = esAnonimo
        ? "Sin cuenta, tus respuestas solo permanecen en esta página y no se guardan. Al salir o cerrar la pestaña se pierden."
        : "Tus respuestas se guardan asociadas a tu cuenta para que puedas revisarlas con tu especialista.";
    if (esAnonimo) document.getElementById("btn-omitir").textContent = "Salir";

    document.getElementById("btn-omitir").addEventListener("click", () => {

        const confirmado = confirm(esAnonimo
            ? "Al salir, tus respuestas se perderán. ¿Volver al inicio de sesión?"
            : "Puedes responderlo más tarde desde tu perfil. ¿Ir directo a tu panel?");

        if (confirmado) window.location.href = esAnonimo ? "login.html" : "paciente.html";

    });

    document.getElementById("btn-empezar").addEventListener("click", () => {
        indiceActual = 0;
        mostrarPregunta();
    });

    function actualizarProgreso() {

        const porcentaje = indiceActual < 0
            ? 0
            : Math.round((indiceActual / preguntas.length) * 100);

        progresoRelleno.style.width = `${porcentaje}%`;

    }

    function mostrarPregunta() {

        actualizarProgreso();

        pantallaIntro.classList.add("oculto");
        pantallaResultado.classList.add("oculto");
        pantallaPregunta.classList.remove("oculto");

        const pregunta = preguntas[indiceActual];

        document.getElementById("contador-pregunta").textContent =
            `Pregunta ${indiceActual + 1} de ${preguntas.length}`;

        document.getElementById("texto-pregunta").textContent = pregunta.texto;

        document.getElementById("opciones-pregunta").innerHTML = pregunta.opciones.map((opcion, indice) => `
            <button type="button" class="cuestionario-opcion" data-indice="${indice}">
                ${opcion}
            </button>
        `).join("");

        document.querySelectorAll(".cuestionario-opcion").forEach((boton) => {

            boton.addEventListener("click", () => {

                respuestas[indiceActual] = {
                    preguntaId: pregunta.id,
                    esPreguntaSeguridad: !!pregunta.esPreguntaSeguridad,
                    valor: Number(boton.dataset.indice),
                    texto: pregunta.opciones[Number(boton.dataset.indice)]
                };

                setTimeout(siguientePregunta, 150);

            });

        });

    }

    function siguientePregunta() {

        indiceActual++;

        if (indiceActual < preguntas.length) {
            mostrarPregunta();
        } else {
            mostrarResultado();
        }

    }

    function mostrarResultado() {

        actualizarProgreso();
        progresoRelleno.style.width = "100%";

        pantallaPregunta.classList.add("oculto");
        pantallaResultado.classList.remove("oculto");

        const respuestaSeguridad = respuestas.find((r) => r.esPreguntaSeguridad);
        const enRiesgo = respuestaSeguridad && respuestaSeguridad.valor >= 2; // "A veces" o "Frecuentemente"

        const puntajeGeneral = respuestas
            .filter((r) => !r.esPreguntaSeguridad)
            .reduce((suma, r) => suma + r.valor, 0);

        const puntajesPorTema = {
            ansiedad: respuestas.filter((respuesta) => ["p3", "p10"].includes(respuesta.preguntaId))
                .reduce((suma, respuesta) => suma + respuesta.valor, 0),
            depresion: respuestas.filter((respuesta) => ["p1", "p4", "p11"].includes(respuesta.preguntaId))
                .reduce((suma, respuesta) => suma + respuesta.valor, 0)
        };
        const temaOrientativo = puntajesPorTema.ansiedad === puntajesPorTema.depresion
            ? "bienestar"
            : puntajesPorTema.ansiedad > puntajesPorTema.depresion ? "ansiedad" : "depresion";
        const categoriaOrientativa = {
            ansiedad: "Ansiedad y estrés",
            depresion: "Depresión",
            bienestar: "Bienestar emocional"
        }[temaOrientativo];

        const maximoPosible = (preguntas.length - 1) * 3;
        const porcentaje = Math.round((puntajeGeneral / maximoPosible) * 100);

        let banda, colorBanda, mensaje;

        if (porcentaje < 30) {
            banda = "Bienestar estable";
            colorBanda = "badge-verde";
            mensaje = "Tus respuestas muestran un momento relativamente estable. De todas formas, mantener seguimiento con un psicólogo ayuda a sostenerlo.";
        } else if (porcentaje < 60) {
            banda = "Algunas señales para atender";
            colorBanda = "badge-naranja";
            mensaje = "Se notan algunas señales de cansancio emocional o estrés. Hablar con un psicólogo certificado puede ayudarte a manejarlas antes de que crezcan.";
        } else {
            banda = "Momento para buscar apoyo";
            colorBanda = "badge-rojo";
            mensaje = "Tus respuestas sugieren que estás pasando por un momento difícil. Te recomendamos agendar una cita con un psicólogo lo antes posible.";
        }

        if (sesion) {
            HelpsyData.guardarCuestionario(sesion.cedula, {
                fecha: new Date().toISOString(),
                puntajePorcentaje: porcentaje,
                banda,
                enRiesgo,
                respuestas
            });
        }

        const enlaceOrientacion = esAnonimo
            ? `<a class="btn btn-primario" href="registro.html" style="margin-top:10px;">Crear cuenta para buscar especialista</a>`
            : `<a class="btn btn-primario" href="psicologos.html?categoria=${encodeURIComponent(categoriaOrientativa)}" style="margin-top:10px;">Buscar especialista en ${categoriaOrientativa}</a>`;
        const enlacePanel = sesion
            ? `<a class="btn btn-fantasma" href="paciente.html" style="margin-top:10px;">Ir a mi panel</a>`
            : "";

        pantallaResultado.innerHTML = `
            <div class="cuestionario-resultado-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
            </div>
            <span class="badge ${colorBanda} cuestionario-resultado-banda">${banda}</span>
            <h1>Gracias por responder</h1>
            <p>${mensaje}</p>
            <p>Como tema para conversar, tus respuestas apuntan a: <strong>${categoriaOrientativa}</strong>. Esta orientación se basa en un cuestionario propio, no en un instrumento clínico validado.</p>

            ${enRiesgo ? `
                <div class="cuestionario-aviso">
                    <strong>Si sientes que necesitas hablar con alguien ahora mismo:</strong>
                    En Colombia puedes llamar a la <a href="tel:106"><strong>Línea 106</strong></a>
                    (salud mental) o al <a href="tel:123"><strong>123</strong></a> ante
                    una emergencia inmediata. No esperes una respuesta de Helpsy.
                </div>
            ` : ""}

            <p style="font-size: 11px; margin-top: 18px;">
                Este resultado es orientativo y no es un diagnóstico ni una escala validada. No sustituye una valoración profesional.
            </p>

            ${enlaceOrientacion}
            ${enlacePanel}
        `;

    }

});
