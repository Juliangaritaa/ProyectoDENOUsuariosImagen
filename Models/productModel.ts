import { conexion } from './conexion.ts';

export async function agregarProducto(producto:any){
    try {
        await conexion.query(
      "INSERT INTO producto (nombre, cantidad, descripcion, precio, unidadMedida, idCategoria) VALUES (?, ?, ?, ?, ?, ?)",
      [
        producto.nombre,
        producto.cantidad,
        producto.descripcion,
        producto.precio,
        producto.unidadMedida,
        producto.idCategoria,
      ]
    );        
    } catch (error) {
    console.error("Error al insertar producto:", error);
    throw error;        
    }
}