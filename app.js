// WDD MyTime - nodejs server module
// Ron Patterson, BPWC
// 7/28/2020

'use strict';

// load required modules
const express = require('express'),
	app = express(),
	session = require('express-session'),
	MongoClient = require('mongodb').MongoClient,
	engines = require('consolidate'),
	bodyParser = require('body-parser'),
	path = require("path"),
	assert = require('assert'),
	mytime = require('./mytime'),
	wdb = new mytime();
const MongoDBStore = require('connect-mongo')(session);

// globals
const mongo_host =
//		'localhost',
		'192.168.0.25',
		mongo_port = '27017',
		mongo_db = 'mytime',
		dbLink = 'mongodb://'+mongo_host+':'+mongo_port+'/'+mongo_db;

// setup express.js
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
console.log('Current directory: ',process.cwd());

function app_lu_init (db) {
	// load lookups with the bt_lookups and bt_users collections
	var cursor = db.collection('lookups').find( { } );
	var results = {};
	cursor.forEach((doc) => {
		//assert.equal(null, doc);
		var arr = [];
		var id = doc._id;
		doc.items.forEach((element, index, array) => {
			if (element.active == "y")
				arr.push({"cd":element.cd,"descr":element.descr});
		});
		results[id] = arr;
	}, (err) => {
		assert.equal(null, err);
		results.roles = "admin";
		results.users = {};
		// get users for lookups
		var cursor = db.collection('users').find( { } );
		cursor.forEach((doc) => {
			//console.log(doc);
			doc.name = doc.lname + ', ' + doc.fname;
			results.users[doc.uid] = doc;
		}, (err) => {
			assert.equal(null, err);
			//console.log('lookups:'); console.log(results);
			wdb.put_lookups(results);
		});
	});
}

function app_init (db) {
	// init the session
	app.use(session({
		//secret: process.env.SESSION_SECRET,
		secret: 'wd_mytime_sess_cd',
		store: new MongoDBStore(
		{
			db: db,
			url: dbLink,
			collection: 'mySessions'
		}),
		cookie: { },
		maxAge: 2 * 24 * 60 * 60 * 1000,
		saveUninitialized: true,
		resave: false
	}));
	app_lu_init(db);
}

MongoClient.connect(dbLink, { useUnifiedTopology: true }, (err, client) => {
	assert.equal(null, err);
	console.log("Successfully connected to MongoDB.");
	var db = client.db(mongo_db);
	app_init(db);
	//debugger;
	setInterval(function() {app_init(db)},60000); // refresh lookups

	app.get('/', function(req, res, next) {
		res.render('mytime');
	});

	app.get('/mt_init', function(req, res) {
		app_init(db, req, res);
		res.json(wdb.get_lookups());
		res.end();
		//console.log('Lookups loaded');
	});

	app.get('/mt_client_list', function(req, res) {
		wdb.client_list(db, req, res);
	});

	app.get('/mt_get_client', function(req, res) {
		wdb.get_client(db, req, res);
	});

	app.post('/mt_add_update_client', function(req, res, next) {
		wdb.add_update_client(db, req, res, next);
	});

	app.post('/mt_delete_client', function(req, res) {
		wdb.delete_client(db, req, res);
	});

	app.get('/mt_proj_list', function(req, res) {
		wdb.proj_list(db, req, res);
	});

	app.get('/mt_get_proj', function(req, res) {
		wdb.get_proj(db, req, res);
	});

	app.post('/mt_add_update_proj', function(req, res, next) {
		wdb.add_update_proj(db, req, res, next);
	});

	app.post('/mt_delete_proj', function(req, res) {
		wdb.delete_proj(db, req, res);
	});

	app.get('/mt_contacts_list', function(req, res) {
		wdb.contacts_list(db, req, res);
	});

	app.get('/mt_get_contact', function(req, res) {
		wdb.get_contact(db, req, res);
	});

	app.post('/mt_add_update_contact', function(req, res, next) {
		wdb.contact_add_update(db, req, res, next);
	});

	app.post('/worklog_add', function(req, res, next) {
		wdb.worklog_add(db, req, res, next);
	});

	app.post('/worklog_updateX', function(req, res, next) {
		wdb.worklog_updateX(db, req, res, next);
	});

	app.post('/assign_user', function(req, res, next) {
		wdb.assign_user(db, req, res, next);
	});

	app.post('/mt_email', function(req, res, next) {
		wdb.mt_email(db, req, res, next);
	});

	//app.post('/attachment_add', upload.single('upfile'), function(req, res, next) {
	app.post('/attachment_add', (req, res, next) => {
		wdb.attachment_add(db, req, res, next);
	});

	app.post('/attachment_delete', function(req, res) {
		wdb.attachment_delete(db, req, res);
	});

	app.get('/admin_lu_list', function(req, res) {
		wdb.admin_lu_list(db, req, res);
	});

	app.get('/admin_lu_get', function(req, res) {
		wdb.admin_lu_get(db, req, res);
	});

	app.post('/lu_add_update', function(req, res, next) {
		wdb.lu_add_update(db, req, res, next);
	});

	app.get('/admin_users', function(req, res) {
		wdb.admin_users(db, req, res);
	});

	app.get('/user_get', function(req, res) {
		wdb.user_get(db, req, res);
	});

	app.post('/user_add_update', function(req, res, next) {
		wdb.user_add_update(db, req, res, next);
	});

	app.use(wdb.errorHandler);

	var server = app.listen(3000, function() {
		var port = server.address().port;
		console.log('Express server listening on port %s.', port);
	});

}); // MongoClient.connect
