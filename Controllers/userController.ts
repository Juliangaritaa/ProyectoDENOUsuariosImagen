// deno-lint-ignore-file
import { Usuario } from "../Models/userModels.ts";
import { ensureDir } from "../Dependencies/dependencias.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export const getUsers = async(ctx: any) => {
    const { response } = ctx;

    try {
        const objUsuario = new Usuario();
        const listaUsuarios = await objUsuario.SeleccionarUsuarios();
        
        // Construir URLs completas para las fotos
        const usuariosConFotos = listaUsuarios.map(usuario => ({
            ...usuario,
            foto: usuario.foto 
                ? `http://localhost:8000/uploads/${usuario.foto}` 
                : null
        }));
        
        response.status = 200;
        response.body = {
            success: true,
            data: usuariosConFotos,
        }
    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            msg: "Error al procesar la solicitud",
            errors: error
        }
    }
};

export const staticFiles = async (ctx: any, next: any) => {
    const { request, response } = ctx;
    
    if (request.url.pathname.startsWith("/uploads/")) {
        try {
            await send(ctx, request.url.pathname, {
                root: "./",
                index: "index.html",
            });
            return;
        } catch {

        }
    }
    
    await next();
};

export const postUser = async(ctx:any)=>{
    const {response, request} = ctx;
    try{
        const contentLength = request.headers.get("Content-Length");
        if (contentLength === 0) {
            response.status = 400;
            response.body = {success:false, msg:"Cuerpo de la solicitud está vacío"};
            return;
        }

        const body = await request.body.formData();

        const usuario = new Usuario();
        const result = await usuario.InsertarUsuario(body);

        response.status = 200;
        response.body = {
            success:true, 
            msg:"Usuario creado exitosamente",
            body: result
        };

    } catch (error) {
        console.error("Error", error);
        response.status = 400;
        response.body = 
        {
            success:false, 
            msg:"Error al procesar la solicitud", 
            errors:error
        }
    }
};

export const putUser = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");
        if (!contentLength || Number(contentLength) === 0) {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud está vacío" };
            return;
        }

        const idUsuario = ctx.params.id;
        if (!idUsuario) {
            response.status = 400;
            response.body = { success: false, msg: "Id no proporcionado" };
            return;
        }

        const formData = await request.body.formData();
        formData.set("idUsuario", idUsuario); 
        
        const objUser = new Usuario();
        const result = await objUser.ActualizarUsuario(formData);

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            msg: result.message,
            body: result.success ? result : undefined,
        };

    } catch (error) {
        console.error(error);
        response.status = 400;
        response.body = {
            success: false,
            msg: "Error al actualizar el usuario",
            errors: error,
        };
    }
};

export const deleteUser = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");
        if (!contentLength || Number(contentLength) === 0) {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud está vacío" };
            return;
        }

        const body = await request.body.formData();
        const idUsuario = body.get("idUsuario")?.toString();

        if (!idUsuario) {
            response.status = 400;
            response.body = { success: false, msg: "ID del usuario no proporcionado" };
            return;
        }

        const UserData = {
            idUsuario: Number(idUsuario),
            nombre: body.nombre,
            apellido: body.apellido,
            email: body.email,
            foto: body.foto,
        }

        const objUser = new Usuario(UserData);
        const result = await objUser.EliminarUsuario(body);

        if (!result.success) {
            response.status = 404;
            response.body = { success: false, msg: result.message };
            return;
        }

        response.status = 200;
        response.body = {
            success: true,
            msg: result.message,
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            msg: "Error al borrar el usuario",
            errors: error,
        };
    }
};
