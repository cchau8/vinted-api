const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const { findById } = require("../models/User");

// functions
const generateHash = (password, salt) => {
	return SHA256(password + salt).toString(encBase64);
};

// ROUTES

// /user/signup to sign up
router.post("/user/signup", async (req, res) => {
	// check if username is not null
	if (!req.fields.username) {
		res.json({ message: "Please enter a valid username" });
	}

	try {
		// check if email already used
		const duplicate = await User.findOne({ email: req.fields.email });
		if (duplicate !== null) {
			res.json({ message: "E-mail already linked to another account" });
		} else {
			// create new user and save info + salt + hash + token
			const salt = uid2(64);
			const hash = generateHash(req.fields.password, salt);
			const token = uid2(64);
			const newUser = new User({
				email: req.fields.email,
				account: {
					username: req.fields.username,
					phone: req.fields.phone,
				},
				token: token,
				hash: hash,
				salt: salt,
			});
			// upload avatar to cloudinary
			if (req.fields.avatar.path) {
				const avatarToUpload = await cloudinary.uploader.upload(req.files.avatar.path, {
					folder: `/vinted/users/${newUser.id}/`,
				});
				newUser.account.avatar = avatarToUpload;
				await newUser.save();
			}

			// send response
			res.json({
				id: newUser.id,
				token: newUser.token,
				account: newUser.account,
			});
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// /user/login to sign in the app
router.post("/user/login", async (req, res) => {
	// check if password is null
	if (!req.fields.password) {
		return res.status(400).json({ message: "Please enter password." });
	}
	try {
		// check if user exists
		const user = await User.findOne({ email: req.fields.email });
		if (!user) {
			res.status(400).json({
				message: "E-mail/password combination is not valid",
			});
		} else {
			// check if crypted (password + salt) === hash
			if (generateHash(req.fields.password, user.salt) === user.hash) {
				const loginRes = {
					id: user.id,
					token: user.token,
					account: user.account,
				};
				res.json(loginRes);
			} else {
				// password is incorrect
				res.status(400).json({
					message: "E-mail/password combination is not valid",
				});
			}
		}
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

module.exports = router;
