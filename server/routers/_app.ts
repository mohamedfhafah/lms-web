import { router } from "../trpc";
import { healthRouter } from "./health";
import { adherentRouter } from "./adherent";
import { catalogueRouter } from "./catalogue";
import { oeuvreRouter } from "./oeuvre";
import { loanRouter } from "./loan";
import { reservationRouter } from "./reservation";
import { adminRouter } from "./admin";

export const appRouter = router({
  health: healthRouter,
  adherent: adherentRouter,
   catalogue: catalogueRouter,
   oeuvre: oeuvreRouter,
   loan: loanRouter,
   reservation: reservationRouter,
   admin: adminRouter,
});

export type AppRouter = typeof appRouter;
