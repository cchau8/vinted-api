// import des modules
require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

// création de l'app et utilisation des modules
const app = express();
app.use(formidable());
app.use(morgan("dev"));
app.use(cors());

// connexion à la DB
mongoose.connect(process.env.MONGO_DB_URI);
console.log(process.env.MONGO_DB_URI);
// connexion à cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test route /
app.get("/", (req, res) => {
	res.send("Welcome to my vinted API !");
});

// import et use des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

// Page not found route
app.all("*", (req, res) => {
	res.status(404).json({ message: "Page not found." });
});

// lancement du serveur sur le port 3000
app.listen(PORT, () => {
	console.log("Server has started.");
});
