import { readCSVObjects } from "https://deno.land/x/csv@v0.9.2/mod.ts";
import { agregarProducto } from "../Models/productModel.ts";
import { StringReader } from "https://deno.land/std@0.195.0/io/string_reader.ts";

export async function subirArchivoProductos(ctx: any) {
    const { response, request } = ctx;

    try {
        const formData = await request.body.formData();
        const file = formData.get("archivo");

        if (!(file instanceof File)) {
            response.status = 400;
            response.body = { mensaje: "Archivo no proporcionado o inválido." };
            return;
        }

        const csvContent = await file.text();
        const csvReader = new StringReader(csvContent);
        const productos: any[] = [];

        for await (const rawRow of readCSVObjects(csvReader)) {
            // Clean row keys
            const row = Object.fromEntries(
                Object.entries(rawRow).map(([key, value]) => [key.replace(/\r/g, '').trim(), value])
            );

            const producto = {
                nombre: row.nombre,
                cantidad: row.cantidad,
                descripcion: row.descripcion,
                precio: row.precio,
                unidadMedida: row.unidadMedida,
                idCategoria: parseInt(row.idCategoria),
            };

            if (producto.nombre && producto.precio && !isNaN(producto.idCategoria)) {
                await agregarProducto(producto);
                productos.push(producto);
            }
        }

        response.status = 200;
        response.body = {
            success: true,
            mensaje: "Carga masiva completada",
            totalInsertados: productos.length,
        };
    } catch (error) {
        console.error("Error al procesar archivo:", error);
        response.status = 400;
        response.body = {
            success: false,
            mensaje: "Error al procesar el archivo",
            errors: error instanceof Error ? error.message : String(error),
        };
    }
}