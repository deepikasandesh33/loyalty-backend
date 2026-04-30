import express from "express";
import path from "path";
import authRoutes from "./routes/auth";
import storeRoutes from "./routes/stores";
import restaurantRoutes from "./routes/restaurants";
import offerRoutes from "./routes/offers";
import adminRoutes from "./routes/admin";
import managerRoutes from "./routes/manager";
import redeemRoutes from "./routes/redeem";
import registerRoutes from "./routes/register";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(authRoutes);
app.use(storeRoutes);
app.use(restaurantRoutes);
app.use(offerRoutes);
app.use(adminRoutes);
app.use(managerRoutes);
app.use(redeemRoutes);
app.use("/register", registerRoutes);

app.listen(PORT, () => {
  console.log(`Loyalty backend running on http://localhost:${PORT}`);
});
