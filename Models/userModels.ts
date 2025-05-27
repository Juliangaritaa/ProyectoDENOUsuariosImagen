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

    public async SeleccionarUsuarios(): Promise<UsuarioData[]>{
        const {rows: users} = await conexion.execute('select * from usuario');
        return users as UsuarioData[];
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
                foto,
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

    public async ActualizarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown>}>{
        try {
            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario valido");
            }

            const {idUsuario, nombre, apellido, email} = this._objUsuario;

            if (!idUsuario) {
                throw new Error("Se requiere el id del usuario para actualizar");
            }

            if (!nombre || !apellido || !email) {
                throw new Error("Faltan campos requeridos para actualizar la informacion");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                'UPDATE usuario SET nombre = ?, apellido = ?, email = ? WHERE idUsuario = ?', [nombre, apellido, email, idUsuario]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [usuario] = await conexion.query(
                    'SELECT * FROM usuario WHERE idUsuario = ?',
                    [idUsuario]
                );

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
                    message: "No se encontró el usuario o no se realizaron los cambios."
                };
            }

        } catch (error) {
            await conexion.execute("ROLLBACK");

            if (error instanceof z.ZodError) {
                return { success:false, message: error.message };
            } else {
                return { success:false, message: "Error interno del servidor" };
            }
        }
    }

    public async EliminarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown>}>{
        try {
            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario valido");
            }

            const {idUsuario} = this._objUsuario;

            if (!idUsuario) {
                throw new Error("Se requiere el id del usuario para eliminar");
            }

            await conexion.execute("START TRANSACTION");

            const [existingUser] = await conexion.query(
                'SELECT * FROM usuario WHERE idUsuario = ?',
                [idUsuario]
            );

            if (!existingUser || existingUser.length === 0) {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se encontró el usuario especificado"
                };
            }

            const result = await conexion.execute(
                'DELETE FROM usuario WHERE idUsuario = ?', 
                [idUsuario]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message:"Usuario eliminado correctamente"
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
                return { success:false, message: error.message };
            } else {
                return { success:false, message: "Error interno del servidor" };
            }
        }
    }

}