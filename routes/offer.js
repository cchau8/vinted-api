const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// import des middleswares
const isAuthenticated = require("../middlewares/isAuthenticated");
const checkOfferParams = require("../middlewares/checkOfferParams");
// ROUTES

// /offer/publish to create an offer (only authenticated user)
router.post("/offer/publish", isAuthenticated, checkOfferParams, async (req, res) => {
	// middleware isAuthenticated rajoute la clé user qui correspond au token correspondant si le client envoie le bon token
	try {
		const account = req.user.account;
		// console.log(account);
		const newOffer = new Offer({
			product_name: req.fields.title,
			product_description: req.fields.description,
			product_price: req.fields.price,
			product_details: [
				{
					brand: req.fields.brand,
				},
				{
					size: req.fields.size,
				},
				{
					condition: req.fields.condition,
				},
				{
					color: req.fields.color,
				},
				{
					location: req.fields.location,
				},
			],
			owner: req.user,
		});
		const pictureToUpload = await cloudinary.uploader.upload(req.files.picture.path, {
			folder: `vinted/offers/${newOffer.id}/`,
		});
		newOffer.product_image = pictureToUpload;
		await newOffer.save();
		// remove other info such as (hash, salt...) in the response
		newOffer.owner = req.user.account;
		res.json(newOffer);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// /offer/edit to edit the offer (need ID of the offer) + (only authenticated user)
router.put("/offer/edit", isAuthenticated, checkOfferParams, async (req, res) => {
	try {
		const updatedOffer = await Offer.findByIdAndUpdate(req.fields.id, {
			product_name: req.fields.title,
			product_description: req.fields.description,
			product_price: req.fields.price,
			product_details: [
				{
					brand: req.fields.brand,
				},
				{
					size: req.fields.size,
				},
				{
					condition: req.fields.condition,
				},
				{
					color: req.fields.color,
				},
				{
					location: req.fields.location,
				},
			],
		});
		if (req.files.picture) {
			await cloudinary.uploader.destroy(updatedOffer.product_image.public_id);
			const updatedPic = await cloudinary.uploader.upload(req.files.picture.path, {
				folder: `vinted/offers/${updatedOffer.id}`,
			});
			updatedOffer.product_image = updatedPic;
			await updatedOffer.save();
		}
		res.send("Offer successfully edited");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// /offer/delete to delete an offer (only authenticated user)
router.delete("/offer/delete", isAuthenticated, async (req, res) => {
	try {
		// On supprime ce qu'il y a dans le dossier
		await cloudinary.api.delete_resources_by_prefix(`vinted/offers/${req.fields.id}`);
		// Une fois le dossier vide, on peut le supprimer
		await cloudinary.api.delete_folder(`vinted/offers/${req.fields.id}`);
		await Offer.findByIdAndDelete(req.fields.id);
		res.json("Offer successfully deleted !");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// /offers to get offers filtered by title, price, sort them and add page logic (page, and limit)
router.get("/offers", async (req, res) => {
	try {
		let filters = {};
		let sortPrice;
		let pageNb;
		let limit;

		// Condition pour l'objet filters permettant de filtrer les résultats obtenus selon les paramètres query
		if (req.query.title) {
			filters.product_name = new RegExp(req.query.title, "i");
		}
		if (req.query.priceMin) {
			filters.product_price = { $gte: Number(req.query.priceMin) };
			if (req.query.priceMax) {
				filters.product_price.$lte = Number(req.query.priceMax);
			}
		} else if (req.query.priceMax) {
			filters.product_price = { $lte: Number(req.query.priceMax) };
		}

		if (req.query.sort) {
			sortPrice = { product_price: req.query.sort.replace("price-", "") };
		}
		if (req.query.page) {
			pageNb = Number(req.query.page);
		}
		if (req.query.limit) {
			limit = Number(req.query.limit);
		}
		const offers = await Offer.find(filters)
			.select()
			.sort(sortPrice)
			.limit(req.query.page ? limit : 0)
			.skip((pageNb - 1) * limit);
		const count = await Offer.countDocuments(offers);
		res.json({ count: count, offers: offers });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// /offer to get an offer by id
router.get("/offer/:id", async (req, res) => {
	try {
		const offer = await Offer.findById(req.params.id).populate({
			path: "owner",
			select: "account",
		});
		if (offer) {
			res.json(offer);
		} else {
			res.status(404).json({ message: "Offer not found." });
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
