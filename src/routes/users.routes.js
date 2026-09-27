import { Router } from "express";

import { getUserById } from "../controllers/users.controller.js";


const router = Router();


// GET localhost:3000/users/:id
router.get("/users/:id", getUserById);


export default router;