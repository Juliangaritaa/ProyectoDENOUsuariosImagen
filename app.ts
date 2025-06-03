import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { routerUser } from "./Routes/userRouter.ts";
import { bulkUploadRouter } from "./Routes/bulkUploadRouter.ts";
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

const app = new Application();

app.use(oakCors());

app.use(async (ctx, next) => {
    const { request, response } = ctx;
    
    if (request.url.pathname.startsWith("/uploads/")) {
        try {
            const encodedFilePath = request.url.pathname.replace("/uploads/", "");
            const filePath = decodeURIComponent(encodedFilePath); 
            
            console.log("Archivo solicitado:", filePath); 
            
            const file = await Deno.readFile(`./uploads/${filePath}`);
            
            const ext = filePath.split('.').pop()?.toLowerCase();
            let contentType = "application/octet-stream";
            
            switch (ext) {
                case 'jpg':
                case 'jpeg':
                    contentType = "image/jpeg";
                    break;
                case 'png':
                    contentType = "image/png";
                    break;
                case 'gif':
                    contentType = "image/gif";
                    break;
                case 'webp':
                    contentType = "image/webp";
                    break;
            }
            
            response.headers.set("Content-Type", contentType);
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.body = file;
            return;
        } catch (error) {
            console.log("Error al cargar archivo:", error);
            console.log("Ruta solicitada:", request.url.pathname);
            
            try {
                const files = [];
                for await (const dirEntry of Deno.readDir("./uploads")) {
                    if (dirEntry.isFile) {
                        files.push(dirEntry.name);
                    }
                }
                console.log("Archivos disponibles en uploads:", files);
            } catch (dirError) {
                console.log("Error al leer directorio uploads:", dirError);
            }
            
            response.status = 404;
            response.body = "Archivo no encontrado";
            return;
        }
    }
    
    await next();
});

app.use(bulkUploadRouter.routes());
app.use(bulkUploadRouter.allowedMethods());

const routers = [routerUser];

routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());    
});

console.log("Servidor corriendo por el puerto 8000");
app.listen({port:8000});       