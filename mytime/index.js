// WD Billing - wd_billing index module
// Ron Patterson, BPWC
// 10/4/2016

'use strict';

// load required modules
const ObjectId = require('mongodb').ObjectID,
    fs = require('fs'),
    dateFormat = require('dateformat'),
    crypto = require('crypto'),
    mailer = require("nodemailer"),
    assert = require('assert');

const adir = '/usr/local/data/',
    smtp_host = 'smtp.postoffice.net',
    smtp_user = 'ron.patterson%40usa.net',
    smtp_pw = 'xxxx',
    dateFmt1 = 'mm/dd/yyyy h:MM tt',
    dateFmt2 = 'mm/dd/yyyy';

var lookups = [];

function getWDDlookup ( type, cd ) {
    var arr = lookups[type];
    for (var x=0; x<arr.length; ++x) {
        if (arr[x]['cd'] === cd) return arr[x]['descr'];
    }
}

module.exports = function() {

    return {

        // Handler for internal server errors
        errorHandler: (err, req, res, next) => {
            console.error(err.message);
            console.error(err.stack);
            res.status(500).render('error_template', { error: err });
        },

        put_lookups: (lu) => {
            //console.log(lu);
            lookups = lu;
        },

        get_lookups: () => {
            return lookups;
        },

        projList: (db, req, res) => {
            db.collection('getWDDlookupprojects')
            .find({})
            .sort({'proj_cd':1})
            .toArray((err, projs) => {
                res.render('projList', { 'projs': projs });
            });
        },

        proj_list: (db, req, res) => {
            var results = [];
            var crit = {};
            // var crit0 = req.query.crit;
            // if (crit0 && crit0.length > 1)
            //   crit = {'$and':crit0};
            // join to get client name
            var cursor = db.collection('projects')
            .aggregate([
                { '$match': crit },
                { '$sort': {'proj_cd':1} },
                // join to clients
                { '$lookup':
                    {
                        from: 'clients',
                        localField: 'client_id',
                        foreignField: '_id',
                        as: 'client_info'
                    }
                }
            ]);
            //console.log(cursor);
            cursor.forEach((doc) => {
                //doc.entry_dtm = date("m/d/Y g:i a",doc.entry_dtm.sec);
                //console.log(doc);
                doc.entry_dtm = dateFormat(doc.entry_dtm,dateFmt2);
                doc.status = getWDDlookup("mt_status",doc.status);
                doc.client = doc.client_info[0].client_name;
                results.push(doc);
            }, (err) => {
                assert.equal(null, err);
                results = {'data':results};
                //console.log(results.data);
                res.json(results);
                res.end();
            });
        },

        get_proj: (db, req, res) => {
            var id = req.query.id;
            db.collection('projects')
            .aggregate([
                { '$match': { '_id': new ObjectId(id) } },
                // join to clients
                { '$lookup':
                    {
                        from: 'clients',
                        localField: 'client_id',
                        foreignField: '_id',
                        as: 'client_info'
                    }
                },
                { '$addFields': { client_name: '$client_info.client_name' } }
            ]).toArray( (err, results) => {
                var proj = results[0];
                assert.equal(null, err);
                proj.status_descr = getWDDlookup("mt_status",proj.status);
                proj.priority_descr = getWDDlookup("mt_priority",proj.priority);
                //var bt = getWDDlookup("type",bug.bug_type);
                proj.edtm = dateFormat(proj.entry_dtm,dateFmt1);
                proj.ddt = typeof(proj.dates.due) == 'undefined' || !proj.dates.due ? '' : dateFormat(proj.dates.due,dateFmt2);
                proj.sdt = typeof(proj.dates.started) == 'undefined' || !proj.dates.started ? '' : dateFormat(proj.dates.started,dateFmt2);
                proj.cdtm = typeof(proj.dates.completed) == 'undefined' || !proj.dates.completed ? '' : dateFormat(proj.dates.completed,dateFmt2);
                if (typeof(proj.attachments) != 'undefined') {
                    for (var i=0; i<proj.attachments.length; ++i) {
                        proj.attachments[i].edtm = typeof(proj.attachments[i].entry_dtm) == 'undefined' ? '' : dateFormat(proj.attachments[i].entry_dtm,dateFmt1);
                    }
                }
                //console.log(proj);
                res.json(proj);
                res.end();
            });
        },

        add_update_proj: (db, req, res, next) => {
            //console.log(req.body); res.end('TEST'); return;
            var doc = {
  "proj_cd": ''
, "name": req.body.name
, "user_id": req.body.user_id
, "po_nbr": req.body.po_nbr
, "priority": req.body.priority
, "status": req.body.status
, "description": req.body.description
, "hourly_rate": req.body.hourly_rate
, "mileage_rate": req.body.mileage_rate
, "distance": req.body.distance
, "dates": {}
};
            if (typeof(req.body['id']) == 'undefined' || req.body.id == '') { // add
                console.log(req);
                // assign a project code
                db.collection('counters').findOneAndUpdate (
                    { "_id": 'proj_cd' },
                    { '$inc': { 'seq': 1 } },
                    {
                        "returnNewDocument": true,
                        "upsert": true
                    },
                    (err, updoc) => {
                        assert.equal(null, err);
                        console.log(updoc);
                        var id = updoc.value.seq.valueOf();
                        var client_cd = req.body.client.split(',');
                        doc.client_id = new ObjectId(client_cd[0]);
                        doc.proj_cd = client_cd[1] + id;
                        doc.entry_dtm = new Date();
                        doc.dates = {
                            "due": req.body.due != "" ? new Date(req.body.due) : null,
                            "started": req.body.started != "" ? new Date(req.body.started) : null,
                            "completed": req.body.completed != "" ? new Date(req.body.completed) : null
                        }
                        //console.log(doc); res.end('TEST'); return;
                        db.collection('projects')
                        .insertOne(
                            doc,
                            (err, result) => {
                                assert.equal(err, null);
                                console.log("Inserted a document into the projects collection.");
                                //console.log(result);
                                res.send('SUCCESS '+id+','+doc.proj_cd);
                                res.end();
                            }
                        );
                    }
                )
            }
            else { // update
                var pid = req.body.proj_cd.replace(/.*(\d+)$/,'$1');
                var proj_cd = req.body.proj_cd;
                delete doc.proj_cd;
                doc.dates = {
                    "due": req.body.due != "" ? new Date(req.body.due) : null,
                    "started": req.body.started != "" ? new Date(req.body.started) : null,
                    "completed": req.body.completed != "" ? new Date(req.body.completed) : null
                }
                //console.log(doc); res.end('TEST'); return;
                var id = req.body.id;
                db.collection('projects')
                .updateOne(
                    { '_id': new ObjectId(id) },
                    { '$set': doc },
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Updated a document in the projects collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
        },

        delete_contact: (db, req, res) => {
            console.log('delete_contact:',req.body); res.end('SUCCESS'); return false;
            var id = req.body.id;
            var cname = req.body.cname;
            // check for link to clients
            db.collection('clients')
            .findOne(
                { '$or': [ { 'client': id }, { 'contacts': { '$all': [ id ] } } ] },
                (err, client) => {
                    if (client)
                    {
                        assert.equal(null, err);
                        console.log(cname + " linked in the clients collection.");
                        //console.log(result);
                        res.send('FAIL ' + cname + ' found in clients!');
                        res.end();
                        return false;
                    }
                    else { // good to go
                        db.collection('contacts')
                        .removeOne(
                        { '_id': new ObjectId(id) },
                        (err, result) => {
                              assert.equal(err, null);
                              console.log("Removed document from the contacts collection.");
                              //console.log(result);
                              res.send('SUCCESS');
                              res.end();
                            }
                        );
                    }
                }
            );
        },

        delete_client: (db, req, res) => {
            console.log('delete_client:',req.body); res.end('SUCCESS'); return false;
            var id = req.body.id;
            var cname = req.body.client_name;
            // check for link to clients
            db.collection('projects')
            .findOne(
                { 'client': id },
                (err, project) => {
                    if (project)
                    {
                        assert.equal(null, err);
                        console.log(cname + " linked in the projects collection.");
                        //console.log(result);
                        res.send('FAIL ' + cname + ' found in projects!');
                        res.end();
                        return false;
                    }
                    else { // good to go
                        db.collection('clients')
                        .removeOne(
                        { '_id': new ObjectId(id) },
                        (err, result) => {
                              assert.equal(err, null);
                              console.log("Removed document from the clients collection.");
                              //console.log(result);
                              res.send('SUCCESS');
                              res.end();
                            }
                        );
                    }
                }
            );
        },

        delete_proj: (db, req, res) => {
            console.log(req.body); res.end('SUCCESS'); return;
            var id = req.body.id;
            db.collection('projects')
            .removeOne(
                { '_id': new ObjectId(id) },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Removed document from the projects collection.");
                    //console.log(result);
                    res.send('SUCCESS');
                    res.end();
                }
            );
        },

        contacts_list: (db, req, res) => {
            //console.log('contacts_list',req);
            var results = [];
            var crit = {};
            var cursor = db.collection('contacts').find(crit);
            cursor.sort({'lname':1, 'fname':1});
            cursor.forEach((doc) => {
                //console.log(doc);
                //doc.entry_dtm = date("m/d/Y g:i a",doc.entry_dtm.sec);
                doc.name = doc.lname + ', ' + doc.fname;
                doc.active = doc.active == 'y' ? 'Yes' : 'No';
                //doc.status = getWDDlookup("status",doc.status);
                results.push(doc);
            }, (err) => {
                assert.equal(null, err);
                results = {'data':results};
                //console.log(results);
                res.json(results);
                res.end();
            });
        },

        get_contact: (db, req, res) => {
            var id = req.query.id;
            db.collection('contacts')
            .findOne(
                { '_id': new ObjectId(id) },
                (err, contact) => {
                    assert.equal(null, err);
                    contact.edtm = dateFormat(contact.entry_dtm,dateFmt1);
                    contact.udtm = typeof(contact.update_dtm) == 'undefined' ? '' : dateFormat(contact.update_dtm,dateFmt1);
                    console.log(contact);
                    res.json(contact);
                    res.end();
                }
            );
        },

        contact_add_update: (db, req, res, next) => {
            // cname, lname, fname, email, addr_number, addr_street, addr_city, addr_state, addr_zip, addr_country, active
            //console.log('add/edit',req.body); res.end('TEST'); return;
            // setup the db document
            var cname = req.body.lname + ', ' + req.body.fname;
            var doc = {
  "cname": cname
, "lname": req.body.lname
, "fname": req.body.fname
, "email": req.body.email
, "address": {
      "number": req.body.addr_number
    , "street": req.body.addr_street
    , "city": req.body.addr_city
    , "state": req.body.addr_state
    , "zip": req.body.addr_zip
    , "country": req.body.addr_country
}
, "phone": {
      "work": req.body.work
    , "cell": req.body.cell
    , "fax": req.body.fax
}
, "active": req.body.active
};
            // check action
            if (req.body.id == '') { // add
                // check for duplicate
                db.collection('contacts')
                .findOne(
                    { 'cname': cname },
                    (err, contact) => {
                        if (contact && contact._id != id)
                        {
                            assert.equal(null, err);
                            console.log(cname + " already in the contacts collection.");
                            //console.log(result);
                            res.send('FAIL ' + cname + ' already exist!');
                            res.end();
                            return false;
                        }
                        else {
                            doc.entry_dtm = new Date();
                            var rec = db.collection('contacts')
                            .insertOne(
                                doc,
                                (err, result) => {
                                    assert.equal(err, null);
                                    console.log("Inserted a document into the contacts collection.");
                                    //console.log(result);
                                    res.send('SUCCESS');
                                    res.end();
                                }
                            );
                        }
                    }
                );
            }
            else { // update
                var id = req.body.id;
                // check for duplicate
                db.collection('contacts')
                .findOne(
                    { 'cname': cname },
                    (err, contact) => {
                        assert.equal(null, err);
                        //console.log('read',contact);
                        if (contact && contact._id != id)
                        {
                            console.log(cname + " already in the contacts collection (2).");
                            //console.log(result);
                            res.send('FAIL ' + cname + ' already exist!');
                            res.end();
                            return false;
                        }
                        else { // good to go
                            doc.update_dtm = new Date();
                            var rec = db.collection('contacts')
                            .updateOne(
                                { '_id': new ObjectId(id) },
                                { '$set': doc },
                                (err, result) => {
                                    assert.equal(err, null);
                                    console.log("Updated a document into the contacts collection.");
                                    //console.log(result);
                                    res.send('SUCCESS');
                                    res.end();
                                }
                            );
                        }
                    }
                );
            }
        },

        clients_list: (db, req, res) => {
            //console.log('clients_list',req);
            var results = [];
            var crit = {};
            // link to client contact
            db.collection('clients')
            .aggregate([
                { '$match': crit },
                { '$sort': {'name':1} },
                // join to contacts
                { '$lookup':
                    {
                        from: 'contacts',
                        localField: 'client',
                        foreignField: '_id',
                        as: 'contact_info'
                    }
               }
           ]).toArray( (err, res2) => {
                res2.forEach( (doc) => {
                    //console.log('client:',doc);
                    //doc.entry_dtm = date("m/d/Y g:i a",doc.entry_dtm.sec);
                    //doc.status = getWDDlookup("status",doc.status);
                    doc.cname = doc.contact_info[0].cname;
                    doc.active = doc.active == 'y' ? 'Yes' : 'No';
                    results.push(doc);
                });
                results = {'data':results};
                //console.log('results:',results);
                res.json(results);
                res.end();
            });
        },

        get_client: (db, req, res) => {
            var id = req.query.id;
            // join to contacts twice
            db.collection('clients')
            .aggregate([
                { '$match': { '_id': new ObjectId(id) } },
                // join to contacts for client name
                { '$lookup':
                    {
                        from: 'contacts',
                        localField: 'client',
                        foreignField: '_id',
                        as: 'contact_info'
                    }
                },
                { '$addFields': { contact_name: '$contact_info.cname' } },
                { '$unwind': '$contact_info' },
                // join to contacts for other contacts
                { '$lookup':
                    {
                        from: 'contacts',
                        localField: 'contacts',
                        foreignField: '_id',
                        as: 'contacts_data'
                    }
                },
                { '$sort': {'name':1} }
            ]).toArray( (err, results) => {
                var res2 = results[0];
                //console.log('results:',res2);
                res2.edtm = dateFormat(res2.entry_dtm,dateFmt1);
                res2.udtm = typeof(res2.update_dtm) == 'undefined' ? '' : dateFormat(res2.update_dtm,dateFmt1);
                res.json(res2);
                res.end();
            });
        },

        get_client_contacts: (db, req, res, next) => {
            var cids = req.query.contacts.split(',');
            var ids = [];
            cids.forEach((item, i) => {
                ids.push(new ObjectId(item));
            });
            // TODO determine multiple _id query
            db.collection('contacts')
            .find(
                { '_id': { '$in': ids } },
                (err, contacts) => {
                    assert.equal(null, err);
                    var contacts2 = contacts.toArray();
                    console.log(contacts2);
                    res.json(contacts2);
                    res.end();
                }
            );
        },

        client_add_update: (db, req, res, next) => {
            // client_cd, client_name, client, contacts, hourly_rate, mileage_rate, distance, active
            //console.log('add/edit',req.body); res.end('TEST'); return;
            var client_cd = req.body.client_cd;
            var contacts = [];
            req.body.contacts_ids.split(',').forEach((item, i) => {
                contacts.push(new ObjectId(item.trim()));
            });
            // setup db document
            var doc = {
  "client_cd": client_cd
, "client_name": req.body.client_name
, "client": new ObjectId(req.body.client)
, "contacts": contacts
, "type": req.body.client_type
, "hourly_rate": req.body.hourly_rate
, "mileage_rate": req.body.mileage_rate
, "distance": req.body.distance
, "active": req.body.active
};
            // check action
            if (req.body.id == '') { // add
                // check for duplicate
                db.collection('clients')
                .findOne(
                    { 'client_cd': client_cd },
                    (err, client) => {
                        if (client && client._id != id)
                        {
                            assert.equal(null, err);
                            console.log(client_cd + " already in the clients collection.");
                            //console.log(result);
                            res.send('FAIL ' + client_cd + ' already exist!');
                            res.end();
                            return false;
                        }
                        else {
                            doc.entry_dtm = new Date();
                            var rec = db.collection('clients')
                            .insertOne(
                                doc,
                                (err, result) => {
                                    assert.equal(err, null);
                                    console.log("Inserted a document into the clients collection.");
                                    //console.log(result);
                                    res.send('SUCCESS');
                                    res.end();
                                }
                            );
                        }
                    }
                );
            }
            else { // update
                var id = req.body.id;
                delete doc.client_cd;
                doc.update_dtm = new Date();
                var rec = db.collection('clients')
                .updateOne(
                    { '_id': new ObjectId(id) },
                    { '$set': doc },
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Updated a document into the clients collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
        },

        worklog_add: (db, req, res, next) => {
            //console.log(req.body); res.end('TEST'); return;
            var id = req.body.id;
            var doc = {
  "user_nm": req.body.usernm
, "comments": req.body.wl_comments
, "wl_public": req.body.wl_public
, "entry_dtm": new Date()
};
            //console.log(bug,doc); res.end('SUCCESS'); return;
            var rec = db.collection('bugs')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$push': { 'worklog': doc } },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Inserted a worklog into the bugs collection.");
                    //console.log(result);
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        worklog_updateX: (db, req, res, next) => {
            //console.log(req.body); res.end('TEST'); return;
            var id = req.body.id;
            var idx = req.body.idx;
            db.collection('bugs')
            .findOne(
                { '_id': new ObjectId(id) },
                (err, bug) => {
                    assert.equal(null, err);
                    var doc = {
  "user_nm": req.body.usernm
, "comments": req.body.wl_comments
, "wl_public": req.body.wl_public
, "entry_dtm": new Date()
};
                    bug.worklog[idx] = doc;
                    var rec = db.collection('bugs')
                    .updateOne(
                        { '_id': new ObjectId(id) },
                        { '$set': { 'worklog': bug.worklog } },
                        (err, result) => {
                            assert.equal(err, null);
                            console.log("Updated a worklog in the bugs collection.");
                            //console.log(result);
                            res.send('SUCCESS');
                            res.end();
                        }
                    )
                }
            )
        },

        assign_user: (db, req, res, next) => {
            //console.log(req.body); res.end('TEST'); return;
            var id = req.body.id;
            var doc = {
  "assigned_to": req.body.uid
, "update_dtm": new Date()
};
            //console.log(bug,doc); res.end('SUCCESS'); return;
            var rec = db.collection('projects')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$set': doc },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Updated assignment in the bugs collection.");
                    //console.log(result);
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        proj_email: (db, req, res, next) => {
            //console.log(req.body); res.end('TEST'); return;
            var id = req.body.id;
            db.collection('projects')
            .findOne(
                { '_id': new ObjectId(id) },
                (err, bug) => {
                    assert.equal(null, err);
                    var status = getWDDlookup("status",bug.status);
                    var priority = getWDDlookup("priority",bug.priority);
                    var bt = getWDDlookup("type",bug.bug_type);
                    var edtm = dateFormat(bug.entry_dtm,dateFmt1);
                    var udtm = typeof(bug.update_dtm) == 'undefined' ? '' : dateFormat(bug.update_dtm,dateFmt1);
                    var cdtm = typeof(bug.closed_dtm) == 'undefined' ? '' : dateFormat(bug.closed_dtm,dateFmt1);
                    if (typeof(bug.user_nm) == 'string') {
                        var obj = lookups.users[bug.user_nm];
                        var ename = obj.lname + ', ' + obj.fname;
                        var email = obj.email;
                    } else { var ename=""; var email="";}
                    if (typeof(bug.assigned_to) == 'string') {
                        var obj = lookups.users[bug.assigned_to];
                        var aname = obj.lname + ', ' + obj.fname;
                        var aemail = obj.email;
                    } else { var aname=""; var aemail="";}
                    var msg = req.body.msg2 +"\n\
\n\
Details of Bug ID " + req.body.bug_id + "\n\
\n\
Description: " + bug.descr + "\n\
Product or Application: " + bug.product + "\n\
Bug Type: " + bt + "\n\
Status: " + status + "\n\
Priority: " + priority + "\n\
Comments: " + bug.comments + "\n\
Solution: " + bug.solution + "\n\
Assigned To: " + aname + "\n\
Entry By: " + ename + "\n\
Entry Date/Time: " + edtm + "\n\
Update Date/Time: " + udtm + "\n\
Closed Date/Time: " + cdtm + "\n\
\n\
";
                    var rows = typeof(bug.worklog) == 'object' ? bug.worklog : [];
                    msg += rows.length + " Worklog entries found\n\n";
                    if (rows.length > 0) {
                        for (var x=0; x<rows.length; ++x) {
                            var row = rows[x];
                            if (row.user_nm != "") {
                                var obj = lookups.users[row.user_nm];
                                var ename = obj.lname + ', ' + obj.fname;
                            } else var ename="";
                            var edtm = typeof(row.entry_dtm) == 'undefined' ? '' : dateFormat(row.entry_dtm,dateFmt1);
                            msg += "Date/Time: " + edtm + ", By: " + ename + "\n\
Comments: " + row.comments + "\n";
                        }
                    }
                    console.log(msg);
                    // Use Smtp Protocol to send Email
                    var transporter = mailer.createTransport('smtps://'+smtp_user+':'+smtp_pw+'@'+smtp_host);
                    var mail = {
                        from: "WD Billing <ronlpatterson@gmail.com>",
                        to: req.body.sendto,
                        subject: req.body.subject,
                        text: msg
                        //html: "<b>Node.js New world for me</b>"
                    }
                    if (req.body.cc != '') mail.cc = req.body.cc;
                    transporter.sendMail(mail, (error, response) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log("Message sent: "); console.log(response);
                        }
                        transporter.close();
                    });
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        attachment_add: (db, req, res, next) => {
            //console.log('Upload:',req,req.file); res.end('SUCCESS'); return;
/*
{ fieldname: 'upfile',
  originalname: 'hsm_dates.txt',
  encoding: '7bit',
  mimetype: 'text/plain',
  buffer: <Buffer 30 35 2f 32 30 2f 32 30 31 32 0a 30 35 2f 32 37 2f 32 30 31 32 0a 30 36 2f 30 33 2f 32 30 31 32 0a 30 36 2f 31 37 2f 32 30 31 32 0a 30 37 2f 30 38 2f 32 ...>,
  size: 220 }
*/
            var id = req.body.id;
            var upfile = req.files.upfile;
            var raw_file = upfile.data;
            var hash = crypto.createHash('md5').update(raw_file).digest("hex");
            var doc = {
  "file_name": upfile.name
, "file_size": upfile.size
, "file_hash": hash
, "entry_dtm": new Date()
};
            //console.log('upfile:',id,doc); res.end('SUCCESS'); return;
            var rec = db.collection('projects')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$push': { 'attachments': doc } },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Inserted a attachment into the projects collection.");
                    console.log(result);
                    var pdir = hash.substr(0,3);
                    fs.access(adir + pdir, fs.R_OK | fs.W_OK, (err) => {
                        if (err) fs.mkdirSync(adir + pdir);
                        // fs.open(adir + pdir + "/" + hash,"w", (err, fd) => {
                        //     assert.equal(err, null);
                        //     fs.writeFile(fd, raw_file, (err) => {
                        //         assert.equal(err, null);
                        //     });
                        // });
                        upfile.mv(adir + pdir + "/" + hash, (err) => {
                            assert.equal(err, null);
                        });
                    });
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        attachment_get: (db, req, res) => {
            var id = req.query.id;
            var idx = req.query.idx;
            db.collection('projects')
            .findOne(
                { '_id': new ObjectId(id) },
                (err, proj) => {
                    assert.equal(null, err);
                    //console.log(proj);
                    var file = proj.attachments[idx];
                    var pdir = file.file_hash.substr(0,3);
                    res.download(adir + pdir + "/" + file.file_hash, file.file_name, (err, data) => {
                        assert.equal(err, null);
                        res.end();
                    });
                }
            );
        },

        attachment_delete: (db, req, res) => {
            //console.log(req.body); res.end('SUCCESS'); return;
            var id = req.body.id;
            var hash = req.body.hash;
            // remove from bugs.attachments
            db.collection('projects')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$pull': { 'attachments.file_hash': hash } },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Removed attachment from the projects collection.");
                    //console.log(result);
                    // delete file from fs
                    var pdir = hash.substr(0,3);
                    fs.unlink(adir + pdir + hash);
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        link_add: (db, req, res, next) => {
            //console.log('link_add:',req.body); res.end('SUCCESS'); return;
            var id = req.body.link_proj_id;
            var link = req.body.lk_link;
            var doc = {
  "url": link
, "entry_dtm": new Date()
};
            //console.log('link:',id,doc); res.end('SUCCESS'); return;
            var rec = db.collection('projects')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$push': { 'links': doc } },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Inserted a link into the projects collection.");
                    console.log(result);
                    res.send('SUCCESS');
                    res.end();
                }
            );
        },

        link_delete: (db, req, res) => {
            console.log('link_delete:',req.body); res.end('SUCCESS'); return;
            var id = req.body.link_proj_id;
            var link = req.body.lk_link;
            // remove from bugs.attachments
            db.collection('projects')
            .updateOne(
                { '_id': new ObjectId(id) },
                { '$pull': { 'links.url': link } },
                (err, result) => {
                    assert.equal(err, null);
                    console.log("Removed link from the projects collection.");
                    //console.log(result);
                    res.send('SUCCESS');
                    res.end();
                }
            )
        },

        note_add_update: (db, req, res, next) => {
            //console.log('note_add_update:',req.body); res.end('SUCCESS'); return;
            var id = req.body.note_proj_id;
            var note = req.body.comments.substr(0,512);
            var note_old = req.body.note_old;
            var idx = req.body.note_idx;
            var doc = {
  "user_nm": req.body.user_nm
, "comments": note
, "entry_dtm": new Date()
};
            if (idx === "")
            { // add note
                //console.log('add note:',id,doc); res.end('SUCCESS'); return;
                var rec = db.collection('projects')
                .updateOne(
                    { '_id': new ObjectId(id) },
                    { '$push': { 'notes': doc } },
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Inserted a note into the projects collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
            else { // update note
                //console.log('link:',id,doc); res.end('SUCCESS'); return;
                var rec = db.collection('projects')
                .updateOne(
                    { '_id': new ObjectId(id) },
                    { "$set": { "notes.$[element].comments": note } },
                    { "arrayFilters": [ { "element.comments": { "$eq": note_old } } ] },
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Updated a note into the projects collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
        },

        admin_lu_list: (db, req, res) => {
            var type = req.query.type;
            db.collection('lookups')
            .findOne(
                { '_id': type },
                { 'items': 1 },
                (err, lu) => {
                    assert.equal(null, err);
                    var results = { 'data': lu.items };
                    //console.log(results);
                    res.json(results);
                    res.end();
                }
            );
        },

        admin_lu_get: (db, req, res) => {
            var type = req.query.type;
            db.collection('lookups')
            .findOne(
                { '_id': type },
                                { 'items': 1 },
                (err, lu) => {
                    assert.equal(null, err);
                    res.json(lu.items);
                    res.end();
                }
            );
        },

        lu_add_update: (db, req, res, next) => {
            // check action
            //console.log(req.body); res.end('TEST'); return;
            var type = req.body.lu_type;
            // setup db document
            var doc = {
  "cd": req.body.cd
, "descr": req.body.descr
, "active": req.body.active
};
            db.collection('lookups')
            .findOne(
                { '_id': type },
                (err, lu) => {
                    if (req.body.lu_action == 'add') { // add
                        // find array entry
                        var i = 0;
                        while (i < lu.items.length && lu.items[i].cd != req.body.cd) ++i;
                        if (i < lu.items.length) {
                            res.send('ERROR, Code already exist!');
                            res.end();
                            return;
                        }
                        lu.items.push(doc);
                        var rec = db.collection('lookups')
                        .updateOne(
                            { '_id': type },
                            { '$set': { 'items': lu.items } },
                            (err, result) => {
                                assert.equal(err, null);
                                console.log("Inserted a lookup into the lookups collection.");
                                //console.log(result);
                                res.send('SUCCESS');
                                res.end();
                            }
                        );
                    }
                    else { // change
                        // find array entry
                        var i = 0;
                        while (i < lu.items.length && lu.items[i].cd != req.body.cd) ++i;
                        // update array
                        if (i < lu.items.length) {
                            lu.items[i] = doc;
                            //console.log(lu,id); //res.end('TEST'); return;
                            var rec = db.collection('lookups')
                            .updateOne(
                                { '_id': type },
                                { '$set': { 'items': lu.items } },
                                (err, result) => {
                                    assert.equal(err, null);
                                    console.log("Updated a lookup in the lookups collection.");
                                    //console.log(result);
                                    res.send('SUCCESS');
                                    res.end();
                                }
                            );
                        }
                    }
                }
            )
        },

        admin_users: (db, req, res) => {
            //console.log('admin_users called ');
            //console.log(req);
            var crit = {};
            var temp = [];
            // check for possible criteria
            var lname = req.query.lname;
            var fname = req.query.fname;
            if (lname && lname.trim() != '')
                temp.push({'lname':{'$regex':'^'+lname,'$options':'i'}});
            if (fname && fname.trim() != '')
                temp.push({'fname':{'$regex':'^'+fname,'$options':'i'}});
            if (temp.length == 2)
                crit = {'$and':temp};
            else if (temp.length == 1)
                crit = temp[0];
            var results = [];
            var cursor = db.collection('users').find(crit);
            cursor.sort( [ [ 'lname', 1 ], [ 'fname', 1 ] ] );
            //console.log(cursor);
            cursor.forEach((doc) => {
                //console.log(doc);
                doc.name = doc.lname + ', ' + doc.fname;
                results.push(doc);
            }, (err) => {
                assert.equal(null, err);
                results = { 'data': results };
                //console.log(results);
                res.json(results);
                //res.send('<p>here</p>');
                res.end();
            });
        },

        user_get: (db, req, res) => {
            var uid = req.query.uid;
            db.collection('users')
            .findOne(
                { 'uid': uid },
                (err, user) => {
                    assert.equal(null, err);
                    //console.log(user);
                    user.name = user.lname + ', ' + user.fname;
                    res.json(user);
                    res.end();
                }
            );
        },

        user_add_update: (db, req, res, next) => {
            // uid, lname, fname, email, active, roles, pw, group
            var pw5 = crypto.createHash('md5').update(req.body.pw).digest("hex");
            // setup db document
            var doc = {
  "uid": req.body.uid2
, "lname": req.body.lname
, "fname": req.body.fname
, "email": req.body.email
, "active": req.body.active
, "roles": [req.body.roles]
, "pw": pw5
, "group": req.body.group
};
            // check action
            //console.log(req.body); res.end('TEST'); return;
            if (req.body.id == '') { // add
                var rec = db.collection('users')
                .insert(
                    doc,
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Inserted a document into the users collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
            else { // update
                if (req.body.pw == req.body.pw2) pw5 = req.body.pw;
                else pw5 = crypto.createHash('md5').update(req.body.pw).digest("hex");
                delete doc.uid; // don't change
                var id = req.body.id;
                var rec = db.collection('users')
                .updateOne(
                    { '_id': new ObjectId(id) },
                    { '$set': doc },
                    (err, result) => {
                        assert.equal(err, null);
                        console.log("Updated a document in the users collection.");
                        //console.log(result);
                        res.send('SUCCESS');
                        res.end();
                    }
                );
            }
        }
    }
}
