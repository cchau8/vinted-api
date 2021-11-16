const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
	"sk_test_51JwPeWH1S9Sx4yii02ufZVv7FVAzR8Fd8PivwnHSdxioBvXzWg8UNxQtanVblZeE7R99kSOa3dEnKOFRrprNJWvQ00vmtiLw0m"
);

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
