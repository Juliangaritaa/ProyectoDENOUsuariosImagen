import { conexion } from "./conexion.ts";
import { ensureDir, z } from "../Dependencies/dependencias.ts";

interface UsuarioData{
    idUsuario: number | null;
    nombre: string;
    apellido: string;
    email: string;
    foto: string;
}

export class Usuario{
    public _objUsuario: UsuarioData | null;
    public _idUsuario: number | null;

    constructor(objUser: UsuarioData | null = null, idUsusario: number | null = null){
        this._objUsuario = objUser;
        this._idUsuario = idUsusario;
    }

    public async SeleccionarUsuarios(): Promise<UsuarioData[]> {
        try {
            const { rows: users } = await conexion.execute('SELECT * FROM usuario');
            return users as UsuarioData[];
        } catch (error) {
            console.error("Error al obtener los usuarios:", error);
            return [];
        }
    }

    public async InsertarUsuario(formData: FormData):Promise<{ success:boolean;message:string; usuario?: Record<string, unknown> }>{

        try {

            const nombre = formData.get("nombre")?.toString();
            const apellido = formData.get("apellido")?.toString();
            const email = formData.get("email")?.toString();
            const foto = formData.get("foto");            
            
            if (!nombre || !apellido || !email || !(foto instanceof File)) {
                throw new Error("Faltan campos requeridos para insertar la información");
            }

            const uploadDir = "./uploads";
            await ensureDir(uploadDir);

            const fileName = `${Date.now()}_${foto.name}`;
            const filePath = `${uploadDir}/${fileName}`;

            const content = new Uint8Array(await foto.arrayBuffer());
            await Deno.writeFile(filePath, content);


            await conexion.execute("START TRANSACTION");
            const result = await conexion.execute('insert into usuario (nombre, apellido, email, foto) values (?, ?, ?, ?)', [
                nombre, 
                apellido, 
                email,
                fileName,
            ]);
    
            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [usuario] = await conexion.query('select * from usuario WHERE idUsuario = LAST_INSERT_ID()',);
                await conexion.execute("COMMIT");
                
                return { success:true, message:"Usuario registrado correctamente.", usuario:usuario };
            } else {
                throw new Error("No fué posible registrar el usuario.");
            }            
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {success:false, message: error.message};
            } else {
                return {success:false, message:"Erro interno del servidor"};
            }
        }
    }

    public async ActualizarUsuario(formData: FormData): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
        try {
            const idUsuario = formData.get("idUsuario")?.toString();
            const nombre = formData.get("nombre")?.toString();
            const apellido = formData.get("apellido")?.toString();
            const email = formData.get("email")?.toString();
            const foto = formData.get("foto");

            if (!idUsuario || !nombre || !apellido || !email) {
                throw new Error("Faltan campos requeridos para actualizar la información");
            }

            await conexion.execute("START TRANSACTION");

            let updateQuery = 'UPDATE usuario SET nombre = ?, apellido = ?, email = ?';
            const params = [nombre, apellido, email];

            if (foto instanceof File) {
                const uploadDir = "./uploads";
                await ensureDir(uploadDir);

                const fileName = `${Date.now()}_${foto.name}`;
                const filePath = `${uploadDir}/${fileName}`;

                const content = new Uint8Array(await foto.arrayBuffer());
                await Deno.writeFile(filePath, content);

                updateQuery += ', foto = ?';
                params.push(fileName);
            }

            updateQuery += ' WHERE idUsuario = ?';
            params.push(idUsuario);

            const result = await conexion.execute(updateQuery, params);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [usuario] = await conexion.query('SELECT * FROM usuario WHERE idUsuario = ?', [idUsuario]);
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Usuario actualizado correctamente",
                    usuario: usuario
                };
            } else {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se encontró el usuario o no se realizaron cambios."
                };
            }

        } catch (error) {
            await conexion.execute("ROLLBACK");

            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }

    public async EliminarUsuario(formData: FormData): Promise<{ success: boolean; message: string }> {
        try {
            const idUsuario = formData.get("idUsuario")?.toString();

            if (!idUsuario) {
                throw new Error("Se requiere el id del usuario para eliminar");
            }

            await conexion.execute("START TRANSACTION");

            const [existingUser] = await conexion.query('SELECT * FROM usuario WHERE idUsuario = ?', [idUsuario]);

            if (!existingUser || existingUser.length === 0) {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se encontró el usuario especificado"
                };
            }

            const foto = existingUser[0].foto;

            const result = await conexion.execute('DELETE FROM usuario WHERE idUsuario = ?', [idUsuario]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                if (foto) {
                    try {
                        await Deno.remove(`./uploads/${foto}`);
                    } catch (_) {
                        // Imagen no encontrada o ya eliminada; continuar
                    }
                }

                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Usuario eliminado correctamente"
                };
            } else {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se encontró el usuario o no se realizaron los cambios."
                };
            }

        } catch (error) {
            await conexion.execute("ROLLBACK");

            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }
}