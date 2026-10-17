document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("recursos", "Recursos");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Paciente")) return;

    /* -------------------- Tabs -------------------- */

    document.getElementById("tabs-recursos").addEventListener("click", (evento) => {

        const boton = evento.target.closest(".tab-btn");
        if (!boton) return;

        document.querySelectorAll("#tabs-recursos .tab-btn").forEach((b) => b.classList.remove("activo"));
        boton.classList.add("activo");

        ["respiracion", "meditacion", "guias"].forEach((panel) => {
            document.getElementById(`panel-${panel}`).classList.toggle("oculto", panel !== boton.dataset.tab);
        });

    });

    /* -------------------- Respiración en caja -------------------- */

    const circulo = document.getElementById("circulo-respiracion");
    const textoRespiracion = document.getElementById("texto-respiracion");
    const botonIniciar = document.getElementById("btn-iniciar-respiracion");
    const botonDetener = document.getElementById("btn-detener-respiracion");
    const contadorCiclos = document.getElementById("ciclos-respiracion");

    const PASOS = [
        { texto: "Inhala...", clase: "expandir" },
        { texto: "Sostén", clase: "expandir" },
        { texto: "Exhala...", clase: "contraer" },
        { texto: "Sostén", clase: "contraer" }
    ];

    let temporizadorRespiracion = null;
    let pasoActual = 0;
    let ciclos = 0;

    function pasoDeRespiracion() {

        const paso = PASOS[pasoActual % PASOS.length];

        textoRespiracion.textContent = paso.texto;
        circulo.classList.remove("expandir", "contraer");
        circulo.classList.add(paso.clase);

        if (pasoActual > 0 && pasoActual % PASOS.length === 0) {
            ciclos++;
            contadorCiclos.textContent = `${ciclos} ciclo${ciclos === 1 ? "" : "s"} completado${ciclos === 1 ? "" : "s"}`;
        }

        pasoActual++;

    }

    botonIniciar.addEventListener("click", () => {

        pasoActual = 0;
        ciclos = 0;
        contadorCiclos.textContent = "";

        pasoDeRespiracion();
        temporizadorRespiracion = setInterval(pasoDeRespiracion, 4000);

        botonIniciar.classList.add("oculto");
        botonDetener.classList.remove("oculto");

    });

    botonDetener.addEventListener("click", detenerRespiracion);

    function detenerRespiracion() {

        clearInterval(temporizadorRespiracion);
        circulo.classList.remove("expandir", "contraer");
        textoRespiracion.textContent = "Listo";

        botonIniciar.classList.remove("oculto");
        botonDetener.classList.add("oculto");

    }

    /* -------------------- Meditación guiada (temporizador) -------------------- */

    const DURACION_MEDITACION = 5 * 60; // 5 minutos, en segundos
    let segundosRestantes = DURACION_MEDITACION;
    let temporizadorMeditacion = null;

    function pintarTiempo() {

        const mm = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
        const ss = String(segundosRestantes % 60).padStart(2, "0");
        document.getElementById("temporizador-meditacion").textContent = `${mm}:${ss}`;

    }

    document.getElementById("btn-iniciar-meditacion").addEventListener("click", (evento) => {

        segundosRestantes = DURACION_MEDITACION;
        pintarTiempo();

        temporizadorMeditacion = setInterval(() => {

            segundosRestantes--;
            pintarTiempo();

            if (segundosRestantes <= 0) {

                clearInterval(temporizadorMeditacion);
                HelpsyUI.toast("Meditación terminada. ¿Cómo te sientes? Puedes registrarlo en tu diario.", "exito");
                detenerMeditacion();

            }

        }, 1000);

        evento.target.classList.add("oculto");
        document.getElementById("btn-detener-meditacion").classList.remove("oculto");

    });

    document.getElementById("btn-detener-meditacion").addEventListener("click", detenerMeditacion);

    function detenerMeditacion() {

        clearInterval(temporizadorMeditacion);
        segundosRestantes = DURACION_MEDITACION;
        pintarTiempo();

        document.getElementById("btn-iniciar-meditacion").classList.remove("oculto");
        document.getElementById("btn-detener-meditacion").classList.add("oculto");

    }

    pintarTiempo();

    /* -------------------- Guías -------------------- */

    const CONTENIDO_CATEGORIAS = {
        ansiedad: [
            { titulo: "Cuando notes preocupación", puntos: [
                "Identifica qué está pasando ahora, sin exigirte resolver todo de una vez.",
                "Prueba el ejercicio de respiración de esta página si te resulta cómodo.",
                "Anota qué te preocupa y qué apoyo concreto podrías pedir."
            ] },
            { titulo: "Apoyo profesional", puntos: [
                "Si la preocupación interfiere con tu vida diaria, puedes hablar con un profesional.",
                "La información de esta guía no permite identificar ni tratar un trastorno."
            ] }
        ],
        depresion: [
            { titulo: "Pasos pequeños", puntos: [
                "Elige una actividad cotidiana pequeña y posible para hoy.",
                "Si puedes, cuéntale a alguien de confianza cómo te has sentido.",
                "Registrar tu ánimo puede ayudarte a describir cambios en una consulta."
            ] },
            { titulo: "Busca acompañamiento", puntos: [
                "Si el desánimo persiste o afecta tu rutina, considera conversar con un profesional.",
                "Esta información no reemplaza una valoración ni es un diagnóstico."
            ] }
        ],
        duelo: [
            { titulo: "A tu propio ritmo", puntos: [
                "Las experiencias de pérdida son distintas; no hay un calendario único para vivirlas.",
                "Puedes apoyarte en una persona de confianza y expresar lo que necesitas.",
                "Si te sirve, escribe recuerdos o pensamientos sin obligación de compartirlos."
            ] },
            { titulo: "Acompañamiento", puntos: [
                "Un profesional puede ofrecer un espacio para hablar de la pérdida y sus efectos.",
                "Pide ayuda urgente si no te sientes a salvo."
            ] }
        ],
        bienestar: [
            { titulo: "Cuidado cotidiano", puntos: [
                "Busca una rutina realista de descanso, alimentación y movimiento que se adapte a ti.",
                "Mantén contacto con personas con quienes te sientas en confianza.",
                "Reconoce qué actividades te ayudan y cuáles te gustaría ajustar."
            ] },
            { titulo: "Seguimiento", puntos: [
                "Puedes usar el diario para registrar cómo te sientes y comentarlo en consulta.",
                "El autocuidado complementa, pero no sustituye, el acompañamiento profesional."
            ] }
        ]
    };

    function pintarGuias(categoria) {
        document.getElementById("lista-guias").innerHTML = CONTENIDO_CATEGORIAS[categoria].map((guia) => `
            <div class="guia-item">
                <h3>${guia.titulo}</h3>
                <ul>${guia.puntos.map((punto) => `<li>${punto}</li>`).join("")}</ul>
            </div>
        `).join("");
    }

    const selectorCategoria = document.getElementById("categoria-recurso");
    selectorCategoria.addEventListener("change", () => pintarGuias(selectorCategoria.value));
    pintarGuias(selectorCategoria.value);

});
