import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { routerUser } from "./Routes/userRouter.ts";
import { send } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/uploads")) {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}`,
    });
  } else {
    await next();
  }
});

app.use(oakCors());

const routers = [routerUser];

routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());    
});

console.log("Servidor corriendo por el puerto 8000");
app.listen({port:8000});       