const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")

const config = {
	port: 9000,

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
	tokenEndpoint: "http://localhost:9001/token",
	userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/authorize', (req, res) => {
	state = randomString().replace('+', 't');
	res.redirect(`${config.authorizationEndpoint}?response_type=code&client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=permission:name permission:date_of_birth&state=${state}`);
});

app.get('/callback', async (req, res) => {
	const receivedState = req.query.state;
	if(receivedState !== state) return res.status(403).send();

	try {
		const response = await axios.post(config.tokenEndpoint, {
			code: req.query.code,
		}, {
			auth: {
				//Authorization: `Basic ${Buffer.from(config.clientId + ':' + config.clientSecret).toString('base64')}`/*).toString('base64')*/,
				username: config.clientId,
				password: config.clientSecret,
			},
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		})
		const access_token = response.data.access_token;
		const responseUserData = await axios.get(config.userInfoEndpoint, {
			headers: {
				Authorization: `bearer ${access_token}`,
				'Access-Control-Allow-Origin': '*'
			},
		});

		res.render('welcome', {
			user: responseUserData.data
		});
	} catch(err) {
		res.status(err.status).send();
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
	getState() {
		return state
	},
	setState(s) {
		state = s
	},
}
