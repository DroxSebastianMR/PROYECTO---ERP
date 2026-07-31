import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { notificationsService } from "./notifications.service.js";

export const notificationsRouter = Router();
notificationsRouter.get("/", async (request, response, next) => {
  try {
    response.json(await notificationsService.list((request as AuthenticatedRequest).auth!.id));
  } catch (error) {
    next(error);
  }
});
notificationsRouter.patch("/read-all", async (request, response, next) => {
  try {
    await notificationsService.markAllRead((request as AuthenticatedRequest).auth!.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
notificationsRouter.patch("/:id/read", async (request, response, next) => {
  try {
    await notificationsService.markRead(
      (request as AuthenticatedRequest).auth!.id,
      z.string().uuid().parse(request.params.id),
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
