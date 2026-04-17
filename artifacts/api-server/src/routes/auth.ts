import { Router } from "express";
import { login, logout, verify } from "../lib/authStore.js";

const router = Router();

router.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const token = login(password);
  if (!token) {
    res.status(401).json({ error: "Senha incorreta" });
    return;
  }
  res.json({ token });
});

router.post("/admin/logout", (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (token) logout(token);
  res.json({ success: true });
});

router.get("/admin/verify", (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  res.json({ valid: verify(token) });
});

export default router;
