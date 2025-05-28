import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { routerUser } from "./Routes/userRouter.ts";
import { bulkUploadRouter } from "./Routes/bulkUploadRouter.ts";
const app = new Application();

app.use(oakCors());

app.use(bulkUploadRouter.routes());
app.use(bulkUploadRouter.allowedMethods());

const routers = [routerUser];

routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());    
});

console.log("Servidor corriendo por el puerto 8000");
app.listen({port:8000});       