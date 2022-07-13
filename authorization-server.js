const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/authorize', (req, res) => {
	const client = clients[req.query.client_id];

	if(!client) return res.status(401).send();

	const scope = req.query.scope;
	if(scope && !containsAll(client.scopes, scope.split(' '))) return res.status(401).send();

	const requestId = randomString();
	requests[requestId] = req.query;
	res.render('login', {
		client,
		scope,
		requestId
	});
});

app.post('/approve', (req, res) => {
	const { userName, password, requestId } = req.body;

	if(users[userName] !== password) return res.status(401).send();
	if(!requests[requestId]) return res.status(401).send();

	const clientReq = requests[requestId];
	delete requests[requestId];

	const code = randomString();
	authorizationCodes[code] = { clientReq, userName };

	res.redirect(`${clientReq.redirect_uri}?code=${encodeURIComponent(code)}&state=${clientReq.state}`);
});

app.post('/token',(req, res) => {
	const authorizationHeader = req.headers.authorization;

	if(!authorizationHeader) return res.status(401).send();

	const { clientId, clientSecret } = decodeAuthCredentials(authorizationHeader);
	if(clients[clientId].clientSecret !== clientSecret) return res.status(401).send();

	const code = req.body.code;
	if(!authorizationCodes[code]) return res.status(401).send();
	const authorizationCodeObj = authorizationCodes[code];
	delete authorizationCodes[code];

	const access_token = jwt.sign({
		userName: authorizationCodeObj.userName,
		scope: authorizationCodeObj.clientReq.scope,
	}, fs.readFileSync('./assets/private_key.pem', 'utf8'), {
		issuer:  'test',
		subject:  'test',
		expiresIn:  "17280h",
		algorithm:  "RS256"
	});

	res.json({ access_token, token_type: 'Bearer' }).status(200);
});

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
