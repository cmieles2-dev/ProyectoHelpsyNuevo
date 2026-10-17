document.addEventListener("DOMContentLoaded", () => {

    const sesion = HelpsyUI.montarShell("reportes", "Reportes");
    if (!sesion) return;
    if (!HelpsyUI.exigirRol("Administrador")) return;

    function imprimirTabla(titulo, columnas, filas) {

        const ventana = window.open("", "_blank");

        if (!ventana) {
            HelpsyUI.toast("El navegador bloqueó la ventana de impresión.", "error");
            return false;
        }

        const filasHtml = filas.map((fila) =>
            `<tr>${columnas.map((c) => `<td>${fila[c.clave] ?? ""}</td>`).join("")}</tr>`
        ).join("");

        const encabezadosHtml = columnas.map((c) => `<th>${c.titulo}</th>`).join("");

        ventana.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>${titulo} — Helpsy</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #101828; }
                    h1 { margin-bottom: 4px; font-size: 20px; }
                    p { color: #667085; margin-top: 0; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #d0d5dd; padding: 7px 9px; text-align: left; font-size: 11.5px; }
                    th { background: #f2f4f7; }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <p>Helpsy — generado el ${HelpsyData.formatearFechaBogota(new Date().toISOString(), true)}</p>
                <table>
                    <thead><tr>${encabezadosHtml}</tr></thead>
                    <tbody>${filasHtml}</tbody>
                </table>
                <script>window.onload = () => window.print();<\/script>
            </body>
            </html>
        `);

        ventana.document.close();
        return true;

    }

    function registrarReporte(nombre, formato, filas) {

        HelpsyData.agregarReporteGenerado({
            nombre,
            formato,
            filas: filas.length,
            fecha: new Date().toISOString()
        });

        pintarHistorial();

    }

    function generarIndicadores() {

        const hoy = new Date();
        const filas = HelpsyData.obtenerTablaIndicador("Depresión", hoy.getFullYear(), hoy.getMonth() + 1)
            .map((f) => ({
                DIRIS: f.diris, Red: f.red, "Nombre EESS": f.nombreEess,
                Mes: f.mes, Anio: f.anio, Den: f.den, Num: f.num, Porcentaje: f.porcentaje
            }));

        HelpsyUI.exportarExcel("reporte_indicadores.xlsx", "Indicadores", filas);
        registrarReporte("Indicadores mensuales", "Excel", filas);

    }

    function generarUsuarios() {

        const filas = HelpsyData.obtenerUsuarios().map((u) => ({
            Nombre: u.nombre, Cedula: u.cedula, Correo: u.email, Rol: u.rol, Estado: u.estado
        }));

        HelpsyUI.exportarExcel("reporte_usuarios.xlsx", "Usuarios", filas);
        registrarReporte("Usuarios del sistema", "Excel", filas);

    }

    function generarPacientes() {

        const pacientes = HelpsyData.generarPacientes();

        const generado = imprimirTabla(
            "Reporte de pacientes activos",
            [
                { clave: "nombre", titulo: "Nombre" },
                { clave: "cedula", titulo: "Cédula" },
                { clave: "ips", titulo: "IPS" },
                { clave: "especialista", titulo: "Especialista" },
                { clave: "estado", titulo: "Estado" }
            ],
            pacientes
        );

        if (generado) {
            registrarReporte("Pacientes activos", "PDF", pacientes);
            HelpsyUI.toast("Se abrió la vista de impresión en una nueva pestaña.", "exito");
        }

    }

    function generarSeguimiento() {

        const pacientes = HelpsyData.generarPacientes();

        const generado = imprimirTabla(
            "Reporte de seguimiento general",
            [
                { clave: "nombre", titulo: "Nombre" },
                { clave: "sesiones", titulo: "Sesiones" },
                { clave: "tratamiento", titulo: "Tratamiento" },
                { clave: "seguimiento", titulo: "Seguimiento (%)" },
                { clave: "especialista", titulo: "Especialista" }
            ],
            pacientes
        );

        if (generado) {
            registrarReporte("Seguimiento general", "PDF", pacientes);
            HelpsyUI.toast("Se abrió la vista de impresión en una nueva pestaña.", "exito");
        }

    }

    const generadores = {
        indicadores: generarIndicadores,
        usuarios: generarUsuarios,
        pacientes: generarPacientes,
        seguimiento: generarSeguimiento
    };

    document.querySelectorAll("[data-reporte]").forEach((boton) => {

        boton.addEventListener("click", () => {

            const generador = generadores[boton.dataset.reporte];
            if (generador) generador();

        });

    });

    function pintarHistorial() {

        const reportes = HelpsyData.obtenerReportesGenerados();
        const contenedor = document.getElementById("historial-reportes");

        if (reportes.length === 0) {

            contenedor.innerHTML = `
                <div class="estado-vacio">
                    ${HelpsyUI.ICONOS.vacio}
                    <strong>Todavía no has generado reportes</strong>
                    <span>Elige una de las tarjetas de arriba para generar el primero.</span>
                </div>
            `;

            return;

        }

        contenedor.innerHTML = `<div class="lista-simple">${reportes.map((r) => `
            <div class="lista-item">
                <div class="lista-item-icono">${HelpsyUI.ICONOS.reportes}</div>
                <div class="lista-item-texto">
                    <strong>${r.nombre}</strong>
                    <span>${r.filas} filas · ${HelpsyData.formatearFechaBogota(r.fecha, true)}</span>
                </div>
                <span class="badge ${r.formato === "Excel" ? "badge-verde" : "badge-azul"}">${r.formato}</span>
            </div>
        `).join("")}</div>`;

    }

    pintarHistorial();

});
