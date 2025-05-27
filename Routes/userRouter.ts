import { Router } from "../Dependencies/dependencias.ts";
import { getUsers, postUser, putUser, deleteUser } from "../Controllers/userController.ts";


const routerUser = new Router();

routerUser.get("/usuarios", getUsers);
routerUser.post("/usuarios", postUser);
routerUser.put("/usuarios/:id", putUser);
routerUser.delete("/usuarios", deleteUser);

export { routerUser };