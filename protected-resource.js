const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const jwt = require("jsonwebtoken");

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/user-info', (req, res) => {
	const authorizationBearer = req.headers.authorization;
	if(!authorizationBearer) return res.status(401).send();

	const token = authorizationBearer.slice(7);

	try {
		const decodedToken = jwt.verify(token, config.publicKey, {
			algorithm:  "RS256"
		});

		const { userName, scope } = decodedToken;
		const scopePermissions = scope.split(' ');
		const user = users[userName];

		const permissions = scopePermissions.map(scopePermissions => scopePermissions.slice(11));
		res.json({name: user.name, date_of_birth: user.date_of_birth});
	} catch(e) {
		return res.status(401).send();
	}
});

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
