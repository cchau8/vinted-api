const checkOfferParams = (req, res, next) => {
	if (req.fields.title.length > 50) {
		return res.status(400).json({ message: "Please keep title under 50 characters." });
	} else if (req.fields.description.length > 500) {
		return res.status(400).json({ message: "Please keep description under 500 characters" });
	} else if (req.fields.price > 100000) {
		return res.status(400).json({ message: "Prices over 100 000$ are not allowed" });
	} else {
		return next();
	}
};

module.exports = checkOfferParams;
