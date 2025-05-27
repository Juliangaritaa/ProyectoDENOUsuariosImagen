// deno-lint-ignore-file
import { Usuario } from "../Models/userModels.ts";

export const getUsers = async(ctx:any)=>{
    const {response} = ctx;

    try{
        const objUsuario = new Usuario();
        const listaUsuarios = await objUsuario.SeleccionarUsuarios();
        response.status = 200;
        response.body = {
            success:true,
            data:listaUsuarios,
        }
    } catch (error) {
        response.status = 400;
        response.body = {
            success:false,
            msg: "Error al procesar la solicitud",
            errors: error
        }
    }
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

        const body = await request.body({ type: "form-data" }).value;
        const formData = new FormData();

        for (const[key, value] of Object.entries(body.fields)){
            formData.append(key, String(value));
        }

        if (body.files && body.files.length > 0) {
                for (const file of body.files) {
                    if (file.name === "foto" && file.content) {
                    const blob = new Blob([file.content], { type: file.contentType });
                    const fileObj = new File([blob], file.originalName!, { type: file.contentType });
                    formData.append("foto", fileObj);
                }
            }
        }

        const usuario = new Usuario();
        const result = await usuario.InsertarUsuario(formData);

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

export const putUser = async(ctx:any)=>{
    const {response, request} = ctx;
    try {
        const contentLength = request.headers.get("Content-Length");
        if (contentLength === 0) {
            response.status = 400;
            response.body = { success:false, msg:"El cuerpo pde la solicitud esta vacio"};
            return;
        }

        const idUsuario = ctx.params.id;
        if (!idUsuario) {
            response.status = 400;
            response.body = {success:false, msg:"Id no proporcionado"};
            return;
        }

        const body = await request.body.json();
        const UserData = {
            idUsuario:idUsuario,
            nombre:body.nombres,
            apellido:body.apellidos,
            email:body.email,
            foto:body.foto
        }

        const objUser = new Usuario(UserData)
        const result = await objUser.ActualizarUsuario();
        response.status = 200;
        response.body = {
            success:true,
            body:result,
            msg:"Usuario actualizado correctamente",
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success:false,
            msg:"Error al actualizar el usuario",
            errors:error
        }
    }
};

export const deleteUser = async(ctx:any)=>{
    const {response, request} = ctx;
    try {
        const contentLength = request.headers.get("Content-Length");
        if (!contentLength || Number(contentLength) === 0) {
            response.status = 400;
            response.body = { success:false, msg:"El cuerpo de la solicitud esta vacio"};
            return;
        }

        const body = await request.body.json();
        
        if (!body.idUsuario) {
            response.status = 400;
            response.body = {success:false, msg:"id del usuario no proporcionado"};
            return;
        }

        const UserData = {
            idUsuario: body.idUsuario,
            nombre: "",    
            apellido: "", 
            email: ""
        }

        const objUser = new Usuario(UserData);
        const result = await objUser.EliminarUsuario();

        if (!result.success) {
            response.status = 404;
            response.body = {success:false, msg:result.message};
            return;
        }

        response.status = 200;
        response.body = {
            success:true,
            msg: result.message
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success:false,
            msg:"Error al borrar el usuario",
            errors:error
        }
    }
};
