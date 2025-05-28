import { Router } from "../Dependencies/dependencias.ts";
import { subirArchivoProductos } from "../Controllers/ProductController.ts";

const bulkUploadRouter = new Router();

bulkUploadRouter.post("/productos", subirArchivoProductos);

export { bulkUploadRouter };
