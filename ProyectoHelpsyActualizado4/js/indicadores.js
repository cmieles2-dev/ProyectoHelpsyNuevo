document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("indicadores", "Indicadores de analítica médica");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const selectIndicador = document.getElementById("filtro-indicador");
    const selectAnio = document.getElementById("filtro-anio");
    const mesesGrid = document.getElementById("meses-grid");
    const tituloGrafico = document.getElementById("titulo-grafico");
    const subtituloGrafico = document.getElementById("subtitulo-grafico");

    let mesActivo = new Date().getMonth() + 1 > 12 ? 12 : (new Date().getMonth() + 1);
    let grafico = null;

    /* -------------------- Poblar filtros -------------------- */

    selectIndicador.innerHTML = HelpsyData.INDICADORES_DISPONIBLES
        .map((ind) => `<option>${ind}</option>`).join("");

    mesesGrid.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
        .map((mes) => `<button type="button" class="mes-btn ${mes === mesActivo ? "activo" : ""}" data-mes="${mes}">${mes}</button>`)
        .join("");

    mesesGrid.addEventListener("click", (evento) => {

        const boton = evento.target.closest(".mes-btn");
        if (!boton) return;

        mesesGrid.querySelectorAll(".mes-btn").forEach((b) => b.classList.remove("activo"));
        boton.classList.add("activo");
        mesActivo = Number(boton.dataset.mes);

    });

    /* -------------------- Tabs -------------------- */

    document.querySelectorAll(".tab-btn").forEach((tab) => {

        tab.addEventListener("click", () => {

            document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("activo"));
            tab.classList.add("activo");

            const esGrafico = tab.dataset.tab === "grafico";
            document.getElementById("panel-grafico").style.display = esGrafico ? "" : "none";
            document.getElementById("panel-detalle").style.display = esGrafico ? "none" : "";

        });

    });

    /* -------------------- Consultar (dibuja gráfico + tabla) -------------------- */

    function consultar() {

        const indicador = selectIndicador.value;
        const anio = selectAnio.value;

        const valores = HelpsyData.obtenerValoresIndicador(indicador, anio, mesActivo);
        const filasTabla = HelpsyData.obtenerTablaIndicador(indicador, anio, mesActivo);

        tituloGrafico.textContent = `Casos de ${indicador.toLowerCase()} por categoría`;
        subtituloGrafico.textContent = `Mes ${mesActivo} de ${anio} · ${valores.reduce((s, v) => s + v.valor, 0)} casos en total`;

        dibujarGrafico(valores);
        dibujarTabla(filasTabla);

        HelpsyUI.toast(`Datos actualizados para ${indicador}, mes ${mesActivo}/${anio}.`, "info");

    }

    function dibujarGrafico(valores) {

        const colores = ["#4f9eff", "#7ee2a8", "#c99bf0", "#ffb45c", "#4f9eff", "#7ee2a8", "#c99bf0", "#ffb45c"];

        if (grafico) grafico.destroy();

        const contexto = document.getElementById("grafico-indicadores").getContext("2d");

        grafico = new Chart(contexto, {
            data: {
                labels: valores.map((v) => v.categoria),
                datasets: [
                    {
                        type: "bar",
                        label: "Cantidad de casos",
                        data: valores.map((v) => v.valor),
                        backgroundColor: colores,
                        borderRadius: 6,
                        maxBarThickness: 46
                    },
                    {
                        type: "line",
                        label: "Tendencia",
                        data: valores.map((v) => v.valor),
                        borderColor: "#2f6fed",
                        backgroundColor: "#2f6fed",
                        tension: 0.4,
                        pointRadius: 4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#eef1f5" } },
                    x: { grid: { display: false } }
                }
            }
        });

    }

    function dibujarTabla(filas) {

        document.querySelector("#tabla-detalle tbody").innerHTML = filas.map((fila) => `
            <tr>
                <td>${fila.diris}</td>
                <td>${fila.red}</td>
                <td>${fila.categoria}</td>
                <td>${fila.nombreEess}</td>
                <td>${fila.codigo}</td>
                <td>${fila.mes}</td>
                <td>${fila.anio}</td>
                <td>${fila.den}</td>
                <td>${fila.num}</td>
                <td>${fila.porcentaje}</td>
            </tr>
        `).join("");

    }

    document.getElementById("btn-consultar").addEventListener("click", consultar);

    document.getElementById("btn-exportar").addEventListener("click", () => {

        const indicador = selectIndicador.value;
        const anio = selectAnio.value;
        const filas = HelpsyData.obtenerTablaIndicador(indicador, anio, mesActivo);

        HelpsyUI.exportarExcel(
            `indicadores_${indicador.toLowerCase()}_${anio}_${mesActivo}.xlsx`,
            "Indicadores",
            filas.map((f) => ({
                DIRIS: f.diris, Red: f.red, Categoria: f.categoria, "Nombre EESS": f.nombreEess,
                Codigo: f.codigo, Mes: f.mes, Anio: f.anio, Den: f.den, Num: f.num, Porcentaje: f.porcentaje
            }))
        );

    });

    consultar();

});
