const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/pay", isAuthenticated, async (req, res) => {
	try {
		const stripeToken = req.fields.stripeToken;
		const response = await stripe.charges.create({
			amount: req.fields.amount,
			currency: "eur",
			description: req.fields.title,
			source: stripeToken,
		});
		res.json(response);
	} catch (error) {
		console.log(error.message);
	}
});
module.exports = router;
