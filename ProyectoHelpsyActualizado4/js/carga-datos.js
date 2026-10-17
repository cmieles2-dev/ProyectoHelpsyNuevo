document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("carga", "Carga de datos");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    const zona = document.getElementById("zona-carga");
    const input = document.getElementById("input-archivo");
    const resultado = document.getElementById("resultado-carga");
    const panelPreview = document.getElementById("panel-vista-previa");
    const subtituloPreview = document.getElementById("vista-previa-subtitulo");
    const tablaPreview = document.getElementById("tabla-vista-previa");

    ["dragenter", "dragover"].forEach((evt) => {
        zona.addEventListener(evt, (e) => {
            e.preventDefault();
            zona.classList.add("arrastrando");
        });
    });

    ["dragleave", "drop"].forEach((evt) => {
        zona.addEventListener(evt, (e) => {
            e.preventDefault();
            zona.classList.remove("arrastrando");
        });
    });

    zona.addEventListener("drop", (evento) => {

        const archivo = evento.dataTransfer.files[0];
        if (archivo) procesarArchivo(archivo);

    });

    input.addEventListener("change", () => {

        const archivo = input.files[0];
        if (archivo) procesarArchivo(archivo);

    });

    function procesarArchivo(archivo) {

        const extensionesValidas = [".csv", ".xlsx", ".xls"];
        const nombreLower = archivo.name.toLowerCase();

        if (!extensionesValidas.some((ext) => nombreLower.endsWith(ext))) {

            resultado.innerHTML = `
                <div class="estado-vacio" style="padding: 14px 0;">
                    ${HelpsyUI.ICONOS.error}
                    <strong>Formato no soportado</strong>
                    <span>Solo se aceptan archivos .csv, .xlsx o .xls.</span>
                </div>
            `;

            HelpsyUI.toast("Ese tipo de archivo no está soportado.", "error");
            return;

        }

        resultado.innerHTML = `<p style="font-size:12.5px; color:var(--gris-500);">Leyendo ${archivo.name}...</p>`;

        const lector = new FileReader();

        lector.onload = (evento) => {

            try {

                const datos = new Uint8Array(evento.target.result);
                const libro = XLSX.read(datos, { type: "array" });
                const primeraHoja = libro.SheetNames[0];
                const filas = XLSX.utils.sheet_to_json(libro.Sheets[primeraHoja], { defval: "" });

                if (filas.length === 0) {
                    throw new Error("El archivo no tiene filas de datos.");
                }

                mostrarExito(archivo, filas);
                mostrarVistaPrevia(archivo, filas);
                guardarEnHistorial(archivo, filas);
                pintarHistorial();

            } catch (error) {

                console.error(error);

                resultado.innerHTML = `
                    <div class="estado-vacio" style="padding: 14px 0;">
                        ${HelpsyUI.ICONOS.error}
                        <strong>No se pudo leer el archivo</strong>
                        <span>Revisa que tenga encabezados y al menos una fila de datos.</span>
                    </div>
                `;

                HelpsyUI.toast("Hubo un problema leyendo el archivo.", "error");

            }

        };

        lector.readAsArrayBuffer(archivo);

    }

    function mostrarExito(archivo, filas) {

        resultado.innerHTML = `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.exito}</div>
                <div class="lista-item-texto">
                    <strong>${archivo.name}</strong>
                    <span>${filas.length} registros leídos correctamente</span>
                </div>
                <span class="badge badge-verde">Listo</span>
            </div>
        `;

        HelpsyUI.toast(`${archivo.name} se leyó correctamente (${filas.length} filas).`, "exito");

    }

    function mostrarVistaPrevia(archivo, filas) {

        const columnas = Object.keys(filas[0]);
        const filasVisibles = filas.slice(0, 15);

        subtituloPreview.textContent =
            `${archivo.name} · mostrando ${filasVisibles.length} de ${filas.length} filas`;

        tablaPreview.innerHTML = `
            <thead>
                <tr>${columnas.map((c) => `<th>${c}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${filasVisibles.map((fila) => `
                    <tr>${columnas.map((c) => `<td>${fila[c]}</td>`).join("")}</tr>
                `).join("")}
            </tbody>
        `;

        panelPreview.style.display = "";

    }

    function guardarEnHistorial(archivo, filas) {

        HelpsyData.agregarCarga({
            nombreArchivo: archivo.name,
            registros: filas.length,
            fecha: new Date().toISOString()
        });

    }

    function pintarHistorial() {

        const cargas = HelpsyData.obtenerCargas();
        const contenedor = document.getElementById("historial-cargas");

        if (cargas.length === 0) {

            contenedor.innerHTML = `
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>Todavía no hay archivos cargados</strong>
                    <span>Sube tu primer archivo desde el panel de la izquierda.</span>
                </div>
            `;

            return;

        }

        contenedor.innerHTML = `<div class="lista-simple">${cargas.map((c) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.carga}</div>
                <div class="lista-item-texto">
                    <strong>${c.nombreArchivo}</strong>
                    <span>${c.registros} registros · ${HelpsyData.formatearFechaBogota(c.fecha, true)}</span>
                </div>
                <span class="badge badge-verde">Cargado</span>
            </div>
        `).join("")}</div>`;

    }

    pintarHistorial();

});
