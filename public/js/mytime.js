// mytime.js (node.js version)
//
// Ron Patterson, WildDog Design

// some utility functions
if (typeof(String.trim) == 'undefined')
{
    String.prototype.trim = function()
    {
        return this.replace(/^\s+/,'').replace(/\s+$/,'');
    }
}

if (typeof(String.blank) == 'undefined')
{
    String.prototype.blank = function()
    {
        return /^\s*$/.test(this);
    }
}

var wdb = // setup the wdb namespace
{

    login_content: { 'uid': 'rlpatter' },
    stimer: 0,
    group_def: 'WDD', // default group
    group_data: {},
    contact_doc: {},
    client_doc: {},
    proj_doc: {},
	dateFmt1: 'mm/dd/yyyy h:MM tt',
    dateFmt2: 'mm/dd/yyyy',

    //-- session/login/logout functions

    check_session: function (event)
    {
        var params = "action=mt_check_session";
        $.ajax({
            url: 'mt_check_session',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (response == 0)
            {
                if (wdb.stimer != 0) window.clearInterval(wdb.stimer);
                wdb.stimer = 0;
                wdb.login_form();
            }
            else
            {
                $('#mt_user_heading').show();
            }
        });
        return false;
    },

    login_form: function (event)
    {
        if (wdb.stimer != 0) window.clearInterval(wdb.stimer);
        wdb.stimer = 0;
        $('#mt_user_heading').hide();
        $('#mt_login_form input[type="password"]').val('');
        $('#dialog-login').dialog({
            width: 400,
            maxHeight: 700,
            modal: true,
            title: 'WDD MyTime Login',
            show: 'fade',
            hide: 'fade',
            draggable: false,
            resizeable: false,
            closeOnEscape: false,
            dialogClass: "no-close"
            //beforeClose: function( event, ui ) {return false;}
        });
        $('#login_errors').html('');
        $('#mt_login_form').on('submit',wdb.login_handler);
        $('input[name="uid"]').focus();
        return false;
    },

    login_handler: function (event)
    {
        var params = "action=mt_login_handler";
        params += '&'+$('#mt_login_form').serialize();
        $.ajax({
            url: 'mt_login_handler',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/FAIL/.test(response))
            {
                $('#login_errors').html(response);
                return false;
            }
            else
            {
                var row = $.parseJSON(response);
                $('#dialog-login').dialog('close');
//                     var user = $('<div></div>')
//                         .css('position','absolute')
//                         .css('width','30em')
//                         .css('top','15px')
//                         .css('right','1em')
//                         .css('text-align','right')
//                         .css('font-size','9pt')
//                         .html('Welcome '+row.fname+' '+'<a href="#" onclick="return wdb.logout_handler();">Logout</a>');
//                     $('body').append(user);
                $('#mt_user_name_top').html(row.fname+' '+row.lname);
                $('#mt_user_heading').show();
                $('#mt_admin_btn').show();
                if (!/admin/.test(row.roles)) $('#mt_admin_btn').hide();
                wdb.stimer = window.setInterval(wdb.check_session,300000);
            }
        });
        return false;
    },

    logout_handler: function (event)
    {
        var params = "action=mt_logout_handler";
        $.ajax({
            url: 'mt_logout_handler',
            type: 'post',
            data: params,
            dataType: 'html'
        });
        window.setTimeout(wdb.check_session,1000); // a bit of a delay
        return false;
    },

    //-- projects support functions

    mtprojects: function ( event, type )
    {
        console.log(event,type);
        var type2 = type ? type : '';
        var sel_val = {};
        if (type2 == 'bytype')
        {
            //sel_val = " and mt_type = '"+$('select[name="mt_type2"]').val()+"'";
            sel_val = {"proj_type": $('select[name="proj_type2"]').val()};
        }
        if (type2 == 'bystatus')
        {
            //sel_val = " and b.status = '"+$('select[name="status2"]').val()+"'";
            sel_val = {"status": $('select[name="status2"]').val()};
        }
        //$('#content_div').html(response);
        $('#content_div').show();
        wdb.projlist2(event, type2, sel_val);
        return false;
    },

    projlist2: function ( event, type, sel_arg )
    {
        //console.log(event,type,sel_arg);
        var params = {
            'action': 'list2',
            'type': type,
            'sel_arg': JSON.stringify(sel_arg)
        };
        $('#mt_proj_tbl tbody').off( 'click', 'button');
        var table = $('#mt_proj_tbl').DataTable({
            'ajax': {
                'url': 'mt_proj_list',
                'type': 'get',
                'data': params
            },
            'destroy': true,
            'order': [[ 0, "asc" ]],
            'columns': [
                {'data': 'proj_cd'},
                {'data': 'name'},
                {'data': 'client'},
                {'data': 'entry_dtm'},
                {'data': 'status'},
                null
            ],
            'columnDefs': [ {
                'targets': -1,
                'data': null,
                'defaultContent': '<button>Show</button>'
            } ]
        });
        $('#mt_proj_tbl tbody').on( 'click', 'button', function () {
            var data = table.row( $(this).parents('tr') ).data();
            //alert( 'id='+data[4]);
            wdb.projshowdialog(event,data._id);
        } );
        $('#projects_list').show();
        $('#contacts_list').hide();
        $('#clients_list').hide();
        return false;
    },

    mtprojadd: function ( event )
    {
        wdb.showDialogDiv('WDD MyTime Project Add','projedit_div');
        $('#projedit_errors').html('');
        $('#pid').val('');
        $('#projedit_form1 input[type="text"]').val('');
        $('#projedit_form1 textarea').val('');
        $('#euser').html(wdb.login_content.uid);
        $('select[name="status"]').val('o');
        $('select[name="priority"]').val('3');
        $('#projedit_form1 input[name="hourly_rate"]').val('0.0');
        $('#projedit_form1 input[name="mileage_rate"]').val('0.0');
        $('#projedit_form1 input[name="distance"]').val('0');
        $('.projdate').val('');
        $('#mtshow_div').hide();
        $('#mtedit_div').show();
        return false;
    },

    mt_proj_handler: function( event )
    {
        //alert('mt_proj_handler '+$('#projedit_form1').serialize()); return false;
        debugger;
        var err = wdb.validate_proj();
        if (err != '')
        {
            $('#mt_projedit_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        $('#mt_projedit_errors').html('');
        var params = 'action=add_update&'+$('#projedit_form1').serialize();
        params += '&id='+$('#pid').val();
        params += '&user_id='+$('#userid').val();
        //alert('mthandler '+params);
        $.ajax({
            url: 'mt_add_update_proj',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            //console.log(response);
            if (!/SUCCESS/.test(response))
            {
                $('#mt_projedit_errors').html(response);
            }
            else
            {
                wdb.mtprojects(event);
                if ($('#pid').val() == '') {
                    wdb.mt_save_cancel(event);
                    var arr = response.split(/ ,/);
                    wdb.projshow(event,arr[1]);
                }
                else wdb.projshow(event,$('#pid').val());
                //$('#mt_mts_list_edit').dialog('close');
                //window.setTimeout(function(e) {$('#mtedit_div').dialog('close');},3000);
            }
        });
        return false;
    },

    validate_proj: function ( )
    {
        var datere = /^[01][0-9]\/[0-3][0-9]\/(19|20)[0-9]{2}$/;
        var hoursre = /^[0-9]+([.][0-9]+)?$/;
        var numre = /^[0-9]+$/;
        var err = '';
        var f = document.proj_form1;
        //alert(f.serialize()); return err;
        if (f.client && f.client.value.blank())
            err += ' - Client must be selected<br>';
        if (f.name.value.blank())
            err += ' - Name must not be blank<br>';
        if (f.po_nbr.value.blank())
            err += ' - PO Number must not be blank<br>';
        if (f.priority.value.blank())
            err += ' - Priority must be selected<br>';
        if (f.hourly_rate.value.blank())
            err += ' - Client Type must be selected<br>';
        if (!hoursre.test(f.hourly_rate.value))
            err += ' - Hourly Rate is not valid (decimal number)<br>';
        if (!hoursre.test(f.mileage_rate.value))
            err += ' - Mileage Rate is not valid (decimal number)<br>';
        if (!numre.test(f.distance.value))
            err += ' - Distance is not valid (integer)<br>';
        // if (f.mt_type.value.blank())
        //     err += ' - Bug Type must be selected<br>';
        // if (f.comments.value.blank())
        //     err += ' - Comments must not be blank<br>';
         if (f.due.value != '' && !datere.test(f.due.value))
             err += ' - Due Date is not valid (mm/dd/yyyy)<br>';
        if (f.started.value != '' && !datere.test(f.started.value))
             err += ' - Start Date is not valid (mm/dd/yyyy)<br>';
        if (f.completed.value != '' && !datere.test(f.completed.value))
             err += ' - Complete Date is not valid (mm/dd/yyyy)<br>';
        return err;
    },

    mt_projedit_cancel: function( event )
    {
        //alert('mt_proj_cancel');
        $('#project_show_edit').dialog('close');
        return false;
    },

    edit_project: function ( event, id )
    {
        var id2 = $('#pid').val();
        if (id) id2 = id;
        //alert('edit_proj '+id2);
        var params = "action=edit&id="+id2;
        $.ajax({
            url: 'mt_get_proj',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //$('#content_div').html(response);
            //$('#mtshow_div').dialog('close');
            //wdb.showDialogDiv('MyTime Bug '+data.mt_id,'mt_mts_show_edit');
            $('#mt_projedit_errors').html('');
            $('#pid').html(data.id);
            $('#oldstatus').val(data.status);
            $('#projedit_cd').html(data.proj_cd);
            $('#projedit_form1 input[name="proj_cd"]').val(data.proj_cd);
            $('#client').html(data.client_name);
            $('#projedit_form1 input[name="name"]').val(data.name);
            $('#projedit_form1 input[name="po_nbr"]').val(data.po_nbr);
            $('#projedit_form1 select[name="status"]').val(data.status);
            $('#projedit_form1 select[name="priority"]').val(data.priority);
            $('#projedit_form1 textarea[name="description"]').val(data.description);
            $('#projedit_form1 input[name="hourly_rate"]').val(data.hourly_rate);
            $('#projedit_form1 input[name="mileage_rate"]').val(data.mileage_rate);
            $('#projedit_form1 input[name="distance"]').val(data.distance);
            //$('#assignedDiv2').html(data.aname);
            //$('#mt_assign_btn2').show();
            $('#pedtm').html(data.edtm);
            $('#pddt').val(data.ddt);
            $('#psdt').val(data.sdt);
            $('#pcdt').val(data.cdt);
            wdb.hideview_content($('#projects_list'),$('#project_show_edit'));
            $('#projshow_div').hide();
            $('#projedit_div').show();
        });
        return false;
    },

    projshowdialog: function ( event, id )
    {
        wdb.showDialogDiv('WDD MyTime Project','project_show_edit');
        wdb.projshow(event,id);
        return false;
    },

    projshow: function ( event, id )
    {
        //alert(id);
        //var id2 = parseInt(id.replace(/[^\d]/g,''));
        var params = "action=show&id="+id;
        $.ajax({
            url: 'mt_get_proj',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            wdb.proj_doc = data;
            //$('#mt_projs_show_edit').dialog('option','title','WDD MyTime Project '+data.mt_id);
            $('#mt_admin_errors').html('');
            $('#proj_cd').val(data.proj_cd);
            $('#proj_cd2_v').html(data.proj_cd);
            $('#pid').val(id);
            $('#client_v').html(data.client_name);
            $('#name_v').html(data.name);
            $('#po_nbr_v').html(data.po_nbr);
            //$('#mt_v').html(wdb.get_lookup(wdb.group_data.mt_type,data.mt_type));
            $('#status_v').html(data.status_descr);
            $('#priority_v').html(data.priority_descr);
            $('#description_v').html(data.description);
            $('#hourly_rate_v').html(data.hourly_rate);
            $('#mileage_rate_v').html(data.mileage_rate);
            $('#distance_v').html(data.distance);
            $('#ename_v').html(data.user_id);
            $('#pedtm_v').html(data.edtm);
            $('#pddt_v').html(data.ddt);
            $('#sudt_v').html(data.sdt);
            $('#pcdt_v').html(data.cdt);
            wdb.get_files(event);
            wdb.get_links(event);
            wdb.notes_show(event);
            wdb.worklog_show(event);
            //wdb.mt_save_cancel();
            wdb.hideview_content($('#projects_list'),$('#project_show_edit'));
            $('#projshow_div').show();
            $('#projedit_div').hide();
        });
        return false;
    },

    //-- contacts support functions

    mtcontacts: function ( event )
    {
        var params = {
            'action': 'contacts_list'
        };
        $('#mt_contact_tbl tbody').off( 'click', 'button');
        var table = $('#mt_contact_tbl').DataTable({
            'ajax': {
                'url': 'mt_contacts_list',
                'type': 'get',
                'data': params
            },
            'destroy': true,
            'order': [[ 0, "asc" ]],
            'columns': [
                {'data': 'cname'},
                {'data': 'email'},
                {'data': 'phone.cell'},
                {'data': 'active'},
                null
            ],
            'columnDefs': [ {
                'targets': -1,
                'data': null,
                'defaultContent': '<button>Show</button>'
            } ]
        });
        $('#mt_contact_tbl tbody').on( 'click', 'button', function () {
            var data = table.row( $(this).parents('tr') ).data();
            //alert( 'id='+data[4]);
            wdb.contactshowdialog(event,data._id);
        } );
        $('#projects_list').hide();
        $('#clients_list').hide();
        $('#contacts_list').show();
        return false;
    },

    mtcontactadd: function ( event )
    {
        wdb.showDialogDiv('WDD MyTime Contact Add','contact_show_edit');
        $('#mt_contactedit_errors').html('');
        $('#contact_id').val('');
        $('#contactedit_form1 input[type="text"]').val('');
        //$('#euser').html(wdb.login_content.uid);
        $('#addr_country').html('USA');
        $('input[name="active"]').removeAttr('checked');
        $('input[name="active"][value="y"]').prop('checked',true);
        $('#cedtm').html('');
        $('#uedtm').html('');
        wdb.hideview_content($('#contact_show_edit'));
        $('#contactshow_div').hide();
        $('#contactedit_div').show();
        return false;
    },

    mt_contactedit_handler: function( event ) {
        //alert('mt_contactedit_handler '+$('#mt_form2').serialize()); return false;
        //var err = wdb.validate();
        var err = wdb.validate_contact();
        if (err != '')
        {
            $('#mt_contactedit_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var id = $('#contact_id').val();
        var params = 'action=contact_add_update&'+$('#contactedit_form1').serialize();
        $.ajax({
            url: 'mt_add_update_contact',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#contact_show_edit').dialog('close');
                wdb.mtcontacts(event);
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#mt_contactedit_errors').html(response);
        });
        return false;
    },

    validate_contact: function ( )
    {
        var err = '';
        var f = document.contact_form1;
        //alert(f.serialize()); return err;
        if (f.lname.value.blank())
            err += ' - Last Name must not be blank<br>';
        if (f.email.value.blank())
            err += ' - Email Address must not be blank<br>';
        // if (f.mt_type.value.blank())
        //     err += ' - Bug Type must be selected<br>';
        // if (f.comments.value.blank())
        //     err += ' - Comments must not be blank<br>';
    //     if (!datere.test($('#bdate').val()))
    //         err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
        return err;
    },

    mt_contactedit_cancel: function( event )
    {
        //alert('mt_proj_cancel');
        $('#contact_show_edit').dialog('close');
        return false;
    },

    contactshowdialog: function ( event, id )
    {
        wdb.showDialogDiv('WDD MyTime Contact','contact_show_edit');
        wdb.contactshow(event,id);
        return false;
    },

    contactshow: function ( event, id )
    {
        //alert(id);
        //var id2 = parseInt(id.replace(/[^\d]/g,''));
        var params = "action=show&id="+id;
        $.ajax({
            url: 'mt_get_contact',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            wdb.contact_doc = data;
            // $('#mt_contact_show').dialog('option','title','WDD MyTime Contact '+data.mt_id);
            $('#cname_v').html(data.cname);
            $('#lname_v').html(data.lname);
            $('#fname_v').html(data.fname);
            $('#cid').val(id);
            $('#email_v').html(data.email);
            $('#addr_number_v').html(data.address.number);
            $('#addr_street_v').html(data.address.street);
            $('#addr_city_v').html(data.address.city);
            $('#addr_state_v').html(data.address.state);
            $('#addr_zip_v').html(data.address.zip);
            $('#addr_country_v').html(data.address.country);
            $('#addr_work_v').html(data.phone.work);
            $('#addr_cell_v').html(data.phone.cell);
            $('#addr_fax_v').html(data.phone.fax);
            $('#contact_active_v').html(data.active == 'y' ? 'Yes' : 'No' );
            $('#cedtm_v').html(data.edtm);
            $('#cudtm_v').html(data.udtm);
            $('#contactshow_div').show();
            $('#contactedit_div').hide();
        });
        return false;
    },

    edit_contact: function ( event, id )
    {
        var id2 = $('#cid').val();
        if (id) id2 = id;
        //alert('edit_proj '+id2);
        var params = "action=edit&id="+id2;
        $.ajax({
            url: 'mt_get_contact',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //$('#content_div').html(response);
            //$('#mtshow_div').dialog('close');
            wdb.contact_doc = data;
            //wdb.showDialogDiv('MyTime Bug '+data.mt_id,'mt_mts_show_edit');
            $('#mt_contactedit_errors').html('');
            $('#contact_id').val(data._id);
            $('#cname').html(data.cname);
            $('input[name="lname"]').val(data.lname);
            $('input[name="fname"]').val(data.fname);
            $('input[name="email"]').val(data.email);
            $('input[name="addr_number"]').val(data.address.number);
            $('input[name="addr_street"]').val(data.address.street);
            $('input[name="addr_city"]').val(data.address.city);
            $('input[name="addr_state"]').val(data.address.state);
            $('input[name="addr_zip"]').val(data.address.zip);
            $('input[name="addr_country"]').val(data.address.country);
            $('input[name="work"]').val(data.phone.work);
            $('input[name="cell"]').val(data.phone.cell);
            $('input[name="fax"]').val(data.phone.fax);
            $('input[name="active"]').removeAttr('checked');
            if (data.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
            else $('input[name="active"][value="n"]').prop('checked',true);
            $('#cedtm').html(data.edtm);
            $('#cudtm').html(data.udtm);
            $('#contactshow_div').hide();
            $('#contactedit_div').show();
        });
        return false;
    },

    mt_contactedit_handler: function( event ) {
        //alert('mt_contactedit_handler '+$('#mt_form2').serialize()); return false;
        //var err = wdb.validate();
        var err = wdb.validate_contact();
        if (err != '')
        {
            $('#mt_contactedit_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var id = $('#contact_id').val();
        var params = 'action=contact_add_update&'+$('#contactedit_form1').serialize();
        $.ajax({
            url: 'mt_add_update_contact',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#contact_show_edit').dialog('close');
                wdb.mtcontacts(event);
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#mt_contactedit_errors').html(response);
        });
        return false;
    },

    delete_contact: function ( event )
    {
        if (!confirm("Really delete this contact?")) return false;
        var params = 'action=delete';
        params += '&id=' + $('#cid').val();
        params += '&cname=' + $('#cname_v').text();
        $.ajax({
            url: 'mt_delete_contact',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#contact_show_edit').dialog('close');
                wdb.mtcontacts(event);
            }
            else
                alert(response);
        });
        return false;
    },

    mt_contact_cancel: function( event )
    {
        $('#contactshow_div').show();
        $('#contactedit_div').hide();
        return false;
    },

    //-- contacts support functions

    mtclients: function ( event )
    {
        var params = {
            'action': 'clients_list'
        };
        $('#mt_clients_tbl tbody').off( 'click', 'button');
        var table = $('#mt_clients_tbl').DataTable({
            'ajax': {
                'url': 'mt_clients_list',
                'type': 'get',
                'data': params
            },
            'destroy': true,
            'order': [[ 0, "asc" ]],
            'columns': [
                {'data': 'client_cd'},
                {'data': 'client_name'},
                {'data': 'cname'},
                {'data': 'active'},
                null
            ],
            'columnDefs': [ {
                'targets': -1,
                'data': null,
                'defaultContent': '<button>Show</button>'
            } ]
        });
        $('#mt_clients_tbl tbody').on( 'click', 'button', function () {
            var data = table.row( $(this).parents('tr') ).data();
            //alert( 'id='+data[4]);
            wdb.clientshowdialog(event,data._id);
        } );
        wdb.hideview_content($('#clients_list'));
        // $('#projects_list').hide();
        // $('#clients_list').show();
        // $('#contacts_list').hide();
        return false;
    },

    mtclientadd: function ( event )
    {
        wdb.showDialogDiv('WDD MyTime Client Add','client_show_edit');
        $('#mt_clientedit_errors').html('');
        $('#client_id').val('');
        $('#clientedit_form1 input[type="text"]').val('');
        $('#clientedit_form1 input[name="client_cd"]').removeAttr('readonly');
        //$('#euser').html(wdb.login_content.uid);
        $('#clientedit_form1 input[name="client_name"]').val('');
        $('#clientedit_form1 select[name="client"]').val('');
        $('#clientedit_form1 select[name="client_type"]').val('');
        $('#clientedit_form1 input[name="hourly_rate"]').val('0.0');
        $('#clientedit_form1 input[name="mileage_rate"]').val('0.0');
        $('#clientedit_form1 input[name="distance"]').val('0');
        $('#clientedit_form1 input[name="active"]').removeAttr('checked');
        $('#clientedit_form1 input[name="active"][value="y"]').prop('checked',true);
        $('#cedtm').html('');
        $('#uedtm').html('');
        wdb.hideview_content($('#clients_list'),$('#client_show_edit'));
        $('#clientshow_div').hide();
        $('#clientedit_div').show();
        return false;
    },

    clientshowdialog: function ( event, id )
    {
        wdb.showDialogDiv('WDD MyTime Client','client_show_edit');
        wdb.clientshow(event,id);
        return false;
    },

    clientshow: function ( event, id )
    {
        //alert(id);
        //var id2 = parseInt(id.replace(/[^\d]/g,''));
        var params = "action=show&id="+id;
        $.ajax({
            url: 'mt_get_client',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            wdb.client_doc = data;
            // $('#mt_client_show').dialog('option','title','WDD MyTime Client '+data.client_cd);
            $('#clientid').val(id);
            $('#client_cd_v').html(data.client_cd);
            $('#client_name_v').html(data.client_name);
            $('#client_contact_v').html(data.contact_name);
            $('#contacts_v').html('');
            data.contacts_data.forEach((item, i) => {
                $('#contacts_v').append(item.cname + '<br>');
            });
            $('#client_type_v').html(wdb.get_lookup(wdb.group_data.mt_type,data.type));
            $('#client_hourly_rate_v').html(data.hourly_rate);
            $('#client_mileage_rate_v').html(data.mileage_rate);
            $('#client_distance_v').html(data.distance);
            $('#client_active_v').html(data.active == 'y' ? 'Yes' : 'No' );
            $('#client_edtm_v').html(data.edtm);
            $('#client_udtm_v').html(data.udtm);
            wdb.hideview_content($('#clients_list'),$('#client_show_edit'));
            $('#clientshow_div').show();
            $('#clientedit_div').hide();
        });
        return false;
    },

    edit_client: function ( event, id )
    {
        var id2 = $('#clientid').val();
        if (id) id2 = id;
        //alert('edit_proj '+id2);
        var params = "action=edit&id="+id2;
        $.ajax({
            url: 'mt_get_client',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //$('#content_div').html(response);
            //$('#mtshow_div').dialog('close');
            wdb.client_doc = data;
            //wdb.showDialogDiv('MyTime Bug '+data.mt_id,'mt_mts_show_edit');
            $('#mt_clientedit_errors').html('');
            $('#client_id').val(data._id);
            $('#clientedit_form1 input[name="client_cd"]').val(data.client_cd);
            $('#clientedit_form1 input[name="client_cd"]').attr('readonly',true);
            $('#clientedit_form1 input[name="client_name"]').val(data.client_name);
            $('#clientedit_form1 select[name="client"]').val(data.client);
            $('#client_contacts_hidden').val(data.contacts);
            $('#client_contacts_div').html('');
            data.contacts_data.forEach((item, i) => {
                $('#client_contacts_div').append(item.cname + '<br>');
            });
            $('#clientedit_form1 select[name="client_type"]').val(data.type);
            $('#clientedit_form1 input[name="hourly_rate"]').val(data.hourly_rate);
            $('#clientedit_form1 input[name="mileage_rate"]').val(data.mileage_rate);
            $('#clientedit_form1 input[name="distance"]').val(data.distance);
            $('input[name="active"]').removeAttr('checked');
            if (data.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
            else $('input[name="active"][value="n"]').prop('checked',true);
            $('#client_edtm').html(data.edtm);
            $('#client_udtm').html(data.udtm);
            wdb.hideview_content($('#clients_list'),$('#client_show_edit'));
            $('#clientshow_div').hide();
            $('#clientedit_div').show();
        });
        return false;
    },

    mt_clientedit_handler: function( event ) {
        //alert('mt_clientedit_handler '+$('#mt_form2').serialize()); return false;
        //var err = wdb.validate();
        var err = wdb.validate_client();
        if (err != '')
        {
            $('#mt_clientedit_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var id = $('#client_id').val();
        var params = 'action=client_add_update&'+$('#clientedit_form1').serialize();
        $.ajax({
            url: 'mt_add_update_client',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#client_show_edit').dialog('close');
                wdb.mtclients(event);
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#mt_clientedit_errors').html(response);
        });
        return false;
    },

    validate_client: function ( )
    {
        var err = '';
        var codere = /^[A-Z][A-Za-z]+$/;
        var hoursre = /^[0-9]+([.][0-9]+)?$/;
        var numre = /^[0-9]+$/;
        var f = document.client_form1;
        //alert(f.serialize()); return err;
        if (f.client_cd.value.blank())
            err += ' - Client Code must not be blank<br>';
        if (!codere.test(f.client_cd.value))
            err += ' - Client Code is not valid<br>';
        if (f.client_cd.value.blank())
            err += ' - Client Code must not be blank<br>';
        if (f.client.value.blank())
            err += ' - Client Contact must be selected<br>';
        if (f.client_type.value.blank())
            err += ' - Client Type must be selected<br>';
        if (f.hourly_rate.value.blank())
            err += ' - Client Type must be selected<br>';
        if (!hoursre.test(f.hourly_rate.value))
            err += ' - Hourly Rate is not valid (decimal number)<br>';
        if (!hoursre.test(f.mileage_rate.value))
            err += ' - Mileage Rate is not valid (decimal number)<br>';
        if (!numre.test(f.distance.value))
            err += ' - Distance is not valid (integer)<br>';
        // if (f.comments.value.blank())
        //     err += ' - Comments must not be blank<br>';
    //     if (!datere.test($('#bdate').val()))
    //         err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
        return err;
    },

    delete_client: function ( event )
    {
        if (!confirm("Really delete this client?")) return false;
        var params = 'action=delete';
        params += '&id=' + $('#clientid').val();
        params += '&client_name=' + $('#client_contact_v').text();
        $.ajax({
            url: 'mt_delete_client',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#client_show_edit').dialog('close');
                wdb.mtclients(event);
            }
            else
                alert(response);
        });
        return false;
    },

    mt_clientedit_cancel: function( event )
    {
        //alert('mt_proj_cancel');
        $('#client_show_edit').dialog('close');
        return false;
    },

    //-- other functions

    mthelp: function ( event )
    {
        wdb.showDialogDiv('MyTime Help','mthelp_div');
        return false;
    },

    delete_mt: function ( event )
    {
        if (!confirm("Really delete this entry?")) return false;
        var params = 'action=delete';
        params += '&id='+$('#bid').val();
        $.ajax({
            url: 'mt_delete',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#mt_mts_show_edit').dialog('close');
                wdb.mtlist(event);
            }
            else
                alert(response);
        });
        return false;
    },

    assign_search: function ( event )
    {
        //alert('assign_search');
        wdb.showDialogDiv('MyTime Assign','mt_users_search', 700);
        return false;
    },

    handle_search: function ( event )
    {
        $('#mt_user_assign_tbl tbody').off( 'click', 'button');
        var f = document.mt_form9;
        var table = $('#mt_user_assign_tbl').DataTable({
            'ajax': {
                'url': 'admin_users',
                'type': 'get',
                'data': {
                    'action': 'getUsersSearch',
                    'lname': f.lname.value,
                    'fname': f.fname.value
                }
            },
            'destroy': true,
            'order': [[ 0, "asc" ]],
            'columns': [
                {'data': 'uid'},
                {'data': 'name'},
                {'data': 'email'},
                {'data': 'roles'},
                {'data': 'active'},
                null
            ],
            'columnDefs': [ {
                'targets': -1,
                'data': null,
                'defaultContent': '<button>Select</button>'
            } ]
        });
        $('#mt_user_assign_tbl tbody').on( 'click', 'button', function () {
            var data = table.row( $(this).parents('tr') ).data();
            //alert( 'user='+data[0]);
            wdb.assign_user(event,data.uid);
        } );
        return false;
    },

    assign_user: function ( event, user )
    {
        var id = $('#bid').val();
        var params = 'action=assign_user';
        params += '&id='+id;
        params += '&uid='+user;
        $.ajax({
            url: 'assign_user',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            $('#mt_users_search').dialog('close');
            wdb.mtshow(event,id);
        });
        return false;
    },

    //-- project links functions

    add_link: function ( event ) {
        wdb.showDialogDiv('MyTime Links','links_div');
        $('#lk_proj_cd').html($('#proj_cd2_v').html());
        $('#links_form input[name="link_proj_id"]').val($('#pid').val());
        $('#links_form input[name="lk_link"]').val('');
        $('#lk_errors').html('');
        $('#links_div').show();
        return true;
    },

    linkhandler: function( event ) {
        //alert('linkhandler '+$('#links_form').serialize()); return false;
        //var err = wdb.validate();
        var err = '';
        if ($('#links_form input[name="lk_link"]').val().blank())
            err += ' - URL Link must not be blank<br>';
        if (err != '')
        {
            $('#lk_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var id = $('#pid').val();
        var params = 'action=link_add&'+$('#links_form').serialize();
        params += '&id='+id;
        $.ajax({
            url: 'link_add',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#links_div').dialog('close');
                wdb.projshow(event,$('#pid').val());
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#lk_errors').html(response);
        });
        return false;
    },

    //-- project notes support functions

    add_proj_note: function ( event ) {
        wdb.showDialogDiv('MyTime Notes','notes_div');
        $('#note_proj_cd').html($('#proj_cd2_v').html());
        $('#notes_form input[name="user_nm"]').val('rlpatter');
        $('#notes_form input[name="note_idx"]').val('');
        $('#notes_form input[name="note_proj_id"]').val($('#pid').val());
        $('#notes_form input[name="note_old"]').val('');
        $('#notes_form textarea[name="comments"]').val('');
        $('#notes_errors').html('');
        $('#notes_div').show();
        return true;
    },

    edit_proj_note: function ( event, idx ) {
        wdb.showDialogDiv('MyTime Notes','notes_div');
        var unm = wdb.proj_doc.notes[idx].user_nm;
        var note = wdb.proj_doc.notes[idx].comments;
        $('#note_proj_cd').html($('#proj_cd2_v').html());
        $('#notes_form input[name="user_nm"]').val('');
        $('#notes_form input[name="note_idx"]').val(idx);
        $('#notes_form input[name="note_proj_id"]').val($('#pid').val());
        $('#notes_form input[name="note_old"]').val(note);
        $('#notes_form textarea[name="comments"]').val(note);
        $('#notes_errors').html('');
        $('#notes_div').show();
        return true;
    },

    notehandler: function( event ) {
        //alert('notehandler '+$('#notes_form').serialize()); return false;
        //var err = wdb.validate();
        var err = '';
        if ($('#notes_form textarea[name="comments"]').val().blank())
            err += ' - Note must not be blank<br>';
        if (err != '')
        {
            $('#notes_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var id = $('#pid').val();
        var params = 'action=note_add_update&'+$('#notes_form').serialize();
        params += '&id='+id;
        $.ajax({
            url: 'note_add_update',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#notes_div').dialog('close');
                wdb.projshow(event,$('#pid').val());
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#notes_errors').html(response);
        });
        return false;
    },

    mt_note_cancel: function( event )
    {
        $('#notes_div').dialog('close');
        return false;
    },

    //-- worklog support functions

    show_proj_worklog: function ( event, wlid ) {
        wdb.showDialogDiv('MyTime Worklog','worklog_show');
        var params = "action=show&wlid="+wlid;
        $.ajax({
            url: 'get_worklog',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            $('#wlid_v').val(wlid);
            $('#wl_title_v').text(data.title);
            $('#wl_userid_v').html(data.userid);
            $('#wl_comments_v').html(data.comments.replace(/\n/g, "<br />"));
            $('#wl_public_v').text(data.public_v);
            $('#wl_category_v').text(data.category_v);
            $('#wl_kind_v').text(data.kind_v);
            $('#wl_billable_v').text(data.billable_v);
            $('#wl_due_dt_v').text(data.duedt);
            $('#wl_duration_v').text(sprintf('%d:%02d',data.duration.hours,data.duration.mins));
            $('#wl_start_dtm_v').text(data.sdtm);
            $('#wl_end_dtm_v').text(data.edtm);
            $('#wl_edtm_v').text(data.entrydtm);
        });
        return true;
    },

    worklog_show_cancel: function ( event )
    {
        $('#worklog_show').dialog('close');
        //wdb.worklog_show(event);
    },

    add_worklog: function ( event ) {
        var dtm = new Date();
        // var hr = dtm.getHours();
        // var dtm1 = (hr<10?'0':hr) + ':15';
        // ++hr; if (hr>23) hr = 0;
        // var dtm2 = (hr<10?'0':hr) + ':15';
        var cdt = sprintf('%02d/%02d/%04d', dtm.getMonth(), dtm.getDate(), dtm.getFullYear());
        wdb.showDialogDiv('MyTime Worklog','worklog_form');
        $('#wl_form input[name="wl_proj_id"]').val($('#pid').val());
        $('#wl_proj_cd').html($('#proj_cd2_v').html());
        $('#wl_form input[name="wlid').val('');
        $('#wl_form input[type="text"]').val('');
        $('#wl_form input[name="user_nm"]').val('rlpatter');
        $('#wl_form textarea[name="wl_comments"]').text('');
        $('#wl_form input[name="wl_public"]').removeAttr('checked');
        $('#wl_form input[name="wl_public"][value="y"]').prop('checked',true);
        $('#wl_form select[name="wl_category"]').val('');
        $('#wl_form select[name="wl_kind"]').val('');
        $('#wl_form input[name="wl_billable"]').removeAttr('checked');
        $('#wl_form input[name="wl_billable"][value="y"]').prop('checked',true);
        $('#wl_form select[name="wl_duration"]').val('1:00');
        $('#wl_ename').html($('#ename_v').html());
        $('#wl_form input[name="wl_start_dt"]').val(cdt);
        $('#wl_form input[name="wl_end_dt"]').val(cdt);
        $('#wl_form select[name="wl_start_tm"]').val('08:00');
        $('#wl_form select[name="wl_end_tm"]').val('17:00');
        $('#wl_entry_dtm').html('');
        $('#wl_errors').html('');
        return true;
    },

    edit_worklog: function ( event ) {
        wdb.showDialogDiv('MyTime Worklog','worklog_form');
        var wlid = $('#wlid_v').val();
        $('#wl_form input[name="wl_proj_id"]').val($('#pid').val());
        $('#wl_proj_cd').html($('#proj_cd2_v').html());
        $('#wl_form input[name="wlid').val(wlid);
        var params = "action=show&wlid="+wlid;
        $.ajax({
            url: 'get_worklog',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            $('#wl_form input[type="text"]').val(data.title);
            $('#wl_form input[name="user_nm"]').val(data.usernm);
            $('#wl_form textarea[name="wl_comments"]').text(data.comments);
            $('#wl_form input[name="wl_public"]').removeAttr('checked');
            if (data.public == 'y') $('#wl_form input[name="wl_public"][value="y"]').prop('checked',true);
            else $('#wl_form input[name="wl_public"][value="n"]').prop('checked',true);
            $('#wl_form select[name="wl_category"]').val(data.category);
            $('#wl_form select[name="wl_kind"]').val(data.kind);
            $('#wl_form input[name="wl_billable"]').removeAttr('checked');
            if (data.billable == 'y') $('#wlform input[name="wl_billable"][value="y"]').prop('checked',true);
            else $('#wl_form input[name="wl_billable"][value="n"]').prop('checked',true);
            $('#wl_form input[name="wl_due_dt"]').val(data.duedt);
            $('#wl_form select[name="wl_duration"]').val(sprintf('%d:%02d',data.duration.hours,data.duration.mins));
            $('#wl_ename').html(data.usernm);
            $('#wl_form input[name="wl_start_dt"]').val(data.sdt);
            $('#wl_form input[name="wl_end_dt"]').val(data.edt);
            $('#wl_form select[name="wl_start_tm"]').val(data.stm);
            $('#wl_form select[name="wl_end_tm"]').val(data.etm);
            $('#wl_form input[name="wl_entry_dtm"]').val(data.entry_dtm);
            $('#wl_errors').html('');
        });
        return true;
    },

    workloghandler: function( event ) {
        //alert('workloghandler '+$('#wl_form').serialize()); return false;
        var err = wdb.validate_worklog();
        if (err != '')
        {
            $('#wl_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var params = 'action=worklog_add_edit&'+$('#wl_form').serialize();
        params += '&userid='+$('#userid').val();
        $.ajax({
            url: 'worklog_add_edit',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            if (/^SUCCESS/.test(response))
            {
                $('#worklog_form').dialog('close');
                wdb.worklog_show(event);
                //window.setTimeout(function(){wdb.mtshow(event,id);},200);
            }
            else
                $('#wl_errors').html(response);
        });
        return false;
    },

    validate_worklog: function ( )
    {
        var datere = /^[01][0-9]\/[0-3][0-9]\/(19|20)[0-9]{2}$/;
        var err = '';
        var f = document.wl_form;
        if (f.wl_title.value.blank())
            err += ' - Title must not be blank<br>';
        if (f.wl_comments.value.blank())
            err += ' - Comments must not be blank<br>';
        if (f.wl_category.value.blank())
            err += ' - Category must be selected<br>';
        if (f.wl_kind.value.blank())
            err += ' - Kind must be selected<br>';
        if (f.wl_duration.value.blank())
            err += ' - Duration must be selected<br>';
         if (!(f.wl_due_dt.value.blank()) && !datere.test(f.wl_due_dt.value))
             err += ' - Due date is not valid (mm/dd/yyyy)<br>';
        return err;
    },

    worklogCancelDialog: function ( event )
    {
        $('#worklog_form').dialog('close');
        //wdb.worklog_show(event);
    },

    worklog_show: function ( event )
    {
        $('#worklog_div').empty();
        var params = "action=showem";
        $.ajax({
            url: 'get_worklog_entries',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log('worklog_show:',data);
            out = '<table id="mt_worklog_tbl" class="display" border="1" cellspacing="0" cellpadding="2"><thead><tr><th>Date</th><th>User</th><th>Title</th><th>&nbsp;</th></tr></thead></table>';
            $('#worklog_div').html(out);
            var table = $('#mt_worklog_tbl').DataTable({
                'data': data.data,
                'destroy': true,
                'order': [[ 0, "desc" ]],
                'columns': [
                    {'data': 'edtm'},
                    {'data': 'userid'},
                    {'data': 'title'},
                    null
                ],
                'columnDefs': [ {
                    'targets': -1,
                    'data': null,
                    'defaultContent': '<button>Show</button>'
                } ]
            });
            $('#mt_worklog_tbl tbody').on( 'click', 'button', function () {
                var data = table.row( $(this).parents('tr') ).data();
                //alert( 'user='+data[0]);
                wdb.show_proj_worklog(event,data._id);
            });
        });
    },

    //-- utility functions

    get_files: function ( event )
    {
        $('#filesDiv').empty();
        var out = '';
        var data = typeof(wdb.proj_doc.attachments) == 'object' ? wdb.proj_doc.attachments : [];
        if (data.length == 0)
            out = 'No attachments';
        else
        {
            $.each(data,function (i)
            {
                var id = $('#pid').val();
                out += '<a href="get_attachment?id='+id+'&idx='+i+'" target="_blank">'+data[i].file_name+'</a> ('+data[i].file_size+') <span onclick="return wdb.remove_attachment(\''+id+'\','+i+');" style="cursor: pointer;">Remove</span><br>';
            });
        }
        $('#filesDiv').html(out);
    },

    get_links: function ( event )
    {
        $('#linksDiv').empty();
        var out = '';
        var data = typeof(wdb.proj_doc.links) == 'object' ? wdb.proj_doc.links : [];
        if (data.length == 0)
            out = 'No links';
        else
        {
            $.each(data,function (i)
            {
                var id = $('#pid').val();
                out += '<a href="' + data[i].url + '" target="_blank">'+data[i].url+'</a> <span onclick="return wdb.remove_link(\''+id+'\','+i+');" style="cursor: pointer;">Remove</span><br>';
            });
        }
        $('#linksDiv').html(out);
    },

    notes_show: function ( event )
    {
        $('#notesDiv').empty();
        var out = '';
        var data = typeof(wdb.proj_doc.notes) == 'object' ? wdb.proj_doc.notes : [];
        if (data.length == 0)
            $('#notesDiv').html('No notes');
        else
        {
            $.each(data, (i) => {
                // data[i].edt = new Intl.DateTimeFormat("en-US",
				// 	{month: "2-digit",day: "2-digit",year: "numeric"})
				// 	.format(new Date(data[i].entry_dtm));
                data[i].idx = i;
				data[i].comments = data[i].comments.replace(/\n/,'<br />');
            });
            out = '<table id="mt_notes_tbl" class="display" border="1" cellspacing="0" cellpadding="2"><thead><tr><th>Date</th><th>User</th><th>Notes</th><th></th></tr></thead></table>';
            $('#notesDiv').html(out);
            var table = $('#mt_notes_tbl').DataTable({
                'data': data,
                'destroy': true,
                'order': [[ 0, "desc" ]],
                'columns': [
                    {'data': 'edt'},
                    {'data': 'user_nm'},
                    {'data': 'comments'},
                    null
                ],
                'columnDefs': [ {
                    'targets': -1,
                    'data': null,
                    'defaultContent': '<button>Edit</button>'
                } ]
            });
            $('#mt_notes_tbl tbody').on( 'click', 'button', function () {
                var data = table.row( $(this).parents('tr') ).data();
                //alert( 'user='+data[0]);
                wdb.edit_proj_note(event,data.idx);
            });
        }
    },

    attach_file: function ( event )
    {
        //$('errors').update();
        $('#update_list').val("0");
        //alert("add_file called");
//        w = window.open('views/add_file.html?id='+$('#bid').val()+'&mt_id='+$('#mt_id').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
        w = window.open('src/add_file.html?id='+$('#pid').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
        //setTimeout("watch_add(w)",2000);
        wdb.get_files(event);
        return false;
    },

    remove_file: function ( id, idx )
    {
        if (!confirm('Really remove this attachment file?')) return false;
        var params = 'action=remove_file';
        params += '&id='+id;
        params += '&idx='+idx;
        $.ajax({
            url: 'attachment_delete',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            console.log(response);
            wdb.get_files(null);
        });
        return false;
    },

    show_email: function ( event ) {
        wdb.showDialogDiv('MyTime Email','mt_email_div');
        $('#mt_id_email').html($('#mt_id2_v').text());
        $('#descr_email').html($('#descr_v').html());
        $('input[name="subject"]').val($('#mt_id2_v').text()+' - '+$('#descr_v').html());
        $('#email_errors').html('');
        return true;
    },

    email_mt: function (e) {
        var err = '';
        var emailre = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
        if ($('input[name="sendto"]').val().blank())
            err += ' - Send To must not be blank<br>';
        if ($('input[name="subject"]').val().blank())
            err += ' - Subject must not be blank<br>';
        if (err != '')
        {
            $('#email_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var params = 'action=email_mt';
        params += '&id='+$('#bid').val();
        params += '&mt_id='+$('#mt_id').val();
        params += '&'+$('#mt_email_form').serialize();
        $.ajax({
            url: 'mt_email',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            $('#email_errors').html(response);
        });
        return false;
    },

    mtadmin: function ( event )
    {
    var codes = ["mt_type","mt_status","mt_priority","mt_users"];
    var descrs = ["Type","Status","Priority","Users"];
        var obj = $('<select></select>');
        var opt = $('<option></option>').attr('value','').html('--Select One--');
        obj.append(opt);
        for (var i=0; i<codes.length; ++i)
        {
            var opt = $('<option></option>').attr('value',codes[i]).html(descrs[i]);
            obj.append(opt);
        }
        $('#mt_admin_types').empty().append(obj);
        wdb.showDialogDiv('MyTime Admin','mt_admin',700);
        $('#mt_admin_lu_add').on('click',wdb.mtadmin_lu_add);
        $('#mt_admin_users_add').on('click',wdb.user_add);
        $('#mt_admin_types select').on('change',wdb.mtadmin_lu);
        //wdb.mtadmin_users();
        wdb.hideview_content($('#mt_admin'));
        return false;
    },

    mtadmin_lu: function ( event )
    {
        $('.mtadmin').hide();
        var type = $('#mt_admin_types select').val();
        switch (type)
        {
            case 'mt_type':
            case 'mt_status':
            case 'mt_priority':
                wdb.mtadmin_lu_list(type);
                break;
            case 'mt_users':
                wdb.mtadmin_users();
                break;
            default:
                alert('ERROR: Unknown type ('+type+')');
        }
    },

    mtadmin_lu_list: function ( type )
    {
        $('#mt_lu_tbl tbody').off( 'click', 'button');
        $.ajax({
            url: 'admin_lu_list',
            type: 'get',
            dataType: 'json',
            data: 'action=admin_lu_get&type='+type
        }).done(function (data)
        {
      var table = $('#mt_lu_tbl').DataTable({
          'data': data.data,
          'destroy': true,
          'order': [[ 0, "asc" ]],
          'columns': [
              {'data': 'cd'},
              {'data': 'descr'},
              {'data': 'active'},
              null
          ],
          'columnDefs': [ {
              'targets': -1,
              'data': null,
              'defaultContent': '<button>Edit</button>'
          } ]
      });
      $('#mt_lu_tbl tbody').on( 'click', 'button', function () {
          var data = table.row( $(this).parents('tr') ).data();
          //alert( 'user='+data[0]);
          //console.log(data);
          wdb.mtadmin_lu_show(event,type,data.cd);
      } );
        });
        wdb.hideview_content($('#mt_lu_list'),$('#mt_admin'));
        return false;
    },

    mtadmin_lu_add: function ( event )
    {
        //wdb.showDialogDiv('Lookup Add','mtadmin_lu_add');
        $('#mt_lu_errors').html('');
        $('#mt_users_form input[type="text"]').val('');
        $('input[name="cd"]').removeAttr('readonly');
        $('input[name="active"]').removeAttr('checked');
        $('input[name="active"][value="y"]').prop('checked',true);
        $('input[name="lu_type"]').val($('#mt_admin_types select').val());
        $('input[name="lu_action"]').val('add');
        wdb.hideview_content($('#mt_lu_form'),$('#mt_admin'));
    },

    mtadmin_lu_show: function ( event, type, cd )
    {
        var params = "action=mt_lu_show";
        params += '&type='+type;
        $.ajax({
            url: 'admin_lu_get',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            var rec = {};
            for (var i=0; i<data.length; ++i)
            {
                var item = data[i];
                if (cd == item.cd)
                {
                    rec = item;
                    break;
                }
            }
            $('#mt_lu_errors').html('');
            $('input[name="cd"]').val(cd);
            $('input[name="cd"]').attr('readonly',true);
            $('input[name="descr"]').val(rec.descr);
            $('input[name="active"]').removeAttr('checked');
            if (rec.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
            else $('input[name="active"][value="n"]').prop('checked',true);
            $('input[name="lu_type"]').val(type);
            $('input[name="lu_action"]').val('change');
        });
        wdb.hideview_content($('#mt_lu_form'),$('#mt_admin'));
        return false;
    },

    luhandler: function( event ) {
        //alert('luhandler '+$('#mt_lu_form_id').serialize());
//         var err = wdb.validate();
        //debugger;
        var f = document.mt_lu_form;
        //console.log(f); return false;
        var err = '';
        if (f.cd.value.blank())
            err += " - Code must not be blank<br>";
        //console.log(f.lu_action.value,f.lu_type.value,f.cd.value.trim(),wdb.get_lookup(wdb.group_data[f.lu_type.value],f.cd.value.trim())); return false;
        if (f.lu_action.value == 'add'
          && wdb.get_lookup(wdb.group_data[f.lu_type.value],f.cd.value.trim()) != 'n/a')
            err += " - Code is already used<br>";
        if (f.descr.value.blank())
            err += " - Description must not be blank<br>";
        if (err != '')
        {
            $('#mt_lu_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var params = 'action=lu_add_update';
        params += '&'+$('#mt_lu_form_id').serialize();
        //alert('userhandler '+params); return false;
        $.ajax({
            url: 'lu_add_update',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            $('#mt_lu_errors').html(response);
            wdb.reload_lookups();
            wdb.mtadmin_lu_list(f.lu_type.value);
        });
        return false;
    },

    lu_save_cancel: function( event )
    {
        wdb.hideview_content($('#mt_lu_list'),$('#mt_admin'));
        return false;
    },

    mtadmin_users: function ( event )
    {
        $('#mt_user_tbl tbody').off( 'click', 'button');
        $.ajax({
            url: 'admin_users',
            type: 'get',
            dataType: 'json'
        }).done(function (data)
        {
      var table = $('#mt_user_tbl').DataTable({
          'data': data.data,
          'destroy': true,
          'order': [[ 0, "asc" ]],
          'columns': [
              {'data': 'uid'},
              {'data': 'name'},
              {'data': 'email'},
              {'data': 'roles'},
              {'data': 'active'},
              null
          ],
          'columnDefs': [ {
              'targets': -1,
              'data': null,
              'defaultContent': '<button>Edit</button>'
          } ]
      });
      $('#mt_user_tbl tbody').on( 'click', 'button', function () {
          var data = table.row( $(this).parents('tr') ).data();
          //alert( 'user='+data[0]);
          //console.log(data);
          wdb.user_show(event,data.uid);
      } );
        });
        wdb.hideview_content($('#mt_users_list'),$('#mt_admin'));
        return false;
    },

    user_add: function ( event )
    {
        //wdb.showDialogDiv('User Add','mt_users_form');
        $('#mt_admin_errors').html('');
        $('#mt_users_form input[type="text"]').val('');
        $('input[name="pw"]').val('');
        $('input[name="pw2"]').val('');
        $('input[name="uid1"]').val('');
        $('input[name="uid1"]').removeAttr('readonly');
        $('input[name="uid"]').val('');
        $('input[name="id"]').val('');
        $('input[name="active"]').removeAttr('checked');
        $('input[name="active"][value="y"]').prop('checked',true);
        $('input[name="roles"]').removeAttr('checked');
        $('input[name="roles"][value="user"]').prop('checked',true);
        $('#mt_users_form').show();
        wdb.hideview_content($('#mt_users_form'),$('#mt_admin'));
    },

    user_show: function ( event, uid )
    {
        uid2 = !uid ? '' : uid;
        var params = "action=mt_user_show";
        params += '&uid='+uid2;
        $.ajax({
            url: 'user_get',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            //wdb.showDialogDiv('User Edit','mt_users_form');
            //$('#mt_user_form_id').on('submit',wdb.userhandler);
            $('#mt_admin_errors').html('');
            $('input[name="uid"]').val(uid);
            $('input[name="id"]').val(data._id);
            $('input[name="uid1"]').val(uid);
            $('input[name="uid1"]').attr('readonly',true);
            $('input[name="lname"]').val(data.lname);
            $('input[name="fname"]').val(data.fname);
            $('input[name="email"]').val(data.email);
            $('input[name="active"]').removeAttr('checked');
            if (data.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
            else $('input[name="active"][value="n"]').prop('checked',true);
            $('input[name="roles"]').removeAttr('checked');
            if (data.roles == 'admin') $('input[name="roles"][value="admin"]').prop('checked',true);
            else if (data.roles == 'ro') $('input[name="roles"][value="ro"]').prop('checked',true);
            else $('input[name="roles"][value="user"]').prop('checked',true);
            $('input[name="pw"]').val(data.pw);
            $('input[name="pw2"]').val(data.pw);
        });
        wdb.hideview_content($('#mt_users_form'),$('#mt_admin'));
        return false;
    },

    user_edit_cancel: function( event )
    {
        wdb.hideview_content($('#mt_users_list'),$('#mt_admin'));
        return false;
    },

    userhandler: function( event ) {
        //alert('userhandler '+$('#mt_user_form_id').serialize());
        var emailre = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
//         var err = wdb.validate();
        var f = document.mt_user_form;
        var err = '';
        if (f.uid1.value.blank())
            err += " - UID must not be blank<br>";
        if (f.lname.value.blank())
            err += " - Last Name must not be blank<br>";
        if (!emailre.test(f.email.value))
            err += ' - Email is not valid<br>';
        if (err != '')
        {
            $('#mt_admin_errors').html('Errors encountered:<br>'+err);
            return false;
        }
        var params = 'action=user_add_update';
        params += '&'+$('#mt_user_form_id').serialize();
        //alert('userhandler '+params); return false;
        $.ajax({
            url: 'user_add_update',
            type: 'post',
            data: params,
            dataType: 'html'
        }).done(function (response)
        {
            $('#mt_admin_errors').html(response);
            wdb.mtadmin_users(event);
        });
        return false;
    },

    assign_locate: function ( file )
    {
        $.get(
            file,
            function (response)
            {
                wdb.showDialog('MyTime Maintenance',response);
            }
        );
        return false;
    },

    // utility functions

    showDialog: function ( title, content )
    {
        //if ($('#dialog-modal').dialog) $('#dialog-modal').dialog('destroy');
        $('#dialog-content').html(content);
        $('#dialog-modal').dialog({
          width: 700,
          maxHeight: 700,
          modal: true,
          title: title,
          show: 'fade',
          hide: 'fade',
          close: function (e,ui)
          {
                $(this).dialog('destroy');
          }
        });
    },

    showDialogDiv: function ( title, div, width )
    {
        //alert('showDialogDiv');
        var w = width ? width : 700;
        $('#'+div).dialog({
          width: w,
          maxHeight: 700,
          modal: true,
          title: title,
          show: 'fade',
          hide: 'fade',
          close: function (e,ui)
          {
              $('#'+div+' > div.mtform').hide();
                $(this).dialog('destroy');
          }
        });
    },

    mtCancelDialog: function ( event )
    {
        if ($('#mtedit_id').text() == '')
            $('#mt_proj_show_edit').dialog('close');
        else
        {
            $('#mtshow_div').show();
            $('#mtedit_div').hide();
        }
        wdb.mtlist();
    },

    nl2br: function ( val )
    {
        return val.replace(/\r?\n/g,'<br>');
    },

    /**
     * @param name string
     * @param data array({val,text},...);
     */
    build_selection: function ( name, data )
    {
        //demtger;
        var obj = $('<select></select>').attr('name',name);
        var opt = $('<option></option>').attr('value','').html('--Select One--');
        obj.append(opt);
        for (var i=0; i<data.length; ++i)
        {
            if (typeof(data[i]) != 'object')
                rec = { 'cd': i, 'descr': data[i] };
            else
                rec = data[i];
            var opt = $('<option></option>').attr('value',rec.cd).html(rec.descr);
            obj.append(opt);
        }
        //console.log(obj);
        return obj;
    },

    build_client_selection: function ( name )
    {
        //debugger;
        var obj = $('<select></select>').attr('name',name);
        var opt = $('<option></option>').attr('value','').html('--Select One--');
        obj.append(opt);
        var params = 'action=mt_clients_data';
        $.ajax({
            url: 'mt_clients_list',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            for (var i=0; i<data.data.length; ++i)
            {
                var rec = data.data[i];
                //console.log(rec);
                var opt = $('<option></option>').attr('value',rec._id + ',' + rec.client_cd).html(rec.client_name);
                obj.append(opt);
            }
        });
        //console.log(obj);
        return obj;
    },

    build_contact_selection: function ( name )
    {
        //debugger;
        var obj = $('<select></select>').attr('name',name);
        var opt = $('<option></option>').attr('value','').html('--Select One--');
        obj.append(opt);
        var params = 'action=mt_contacts_data';
        $.ajax({
            url: 'mt_contacts_list',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            for (var i=0; i<data.data.length; ++i)
            {
                var rec = data.data[i];
                //console.log(rec);
                var opt = $('<option></option>').attr('value',rec._id).html(rec.cname);
                obj.append(opt);
            }
        });
        //console.log(obj);
        return obj;
    },

    build_contacts_checkboxes: function ( name )
    {
        //debugger;
        var obj = $('<div></div>');
        var params = 'action=mt_contacts_data';
        $.ajax({
            url: 'mt_contacts_list',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            for (var i=0; i<data.data.length; ++i)
            {
                var rec = data.data[i];
                //console.log(rec);
                var input = $('<input></input>').attr('type','checkbox')
                    .attr('name',name)
                    .attr('value',rec._id + '|' + rec.cname);
                obj.append(input);
                var span = $('<span></span>').html(rec.cname + '&nbsp&nbsp&nbsp');
                obj.append(span);
            }
        });
        //console.log(obj);
        return obj;
    },

    select_contacts: function ( event ) {
        var ids = $('#client_contacts_hidden').val().split(',');
        //console.log(ids);
        $('#contacts_checkboxes input[type="checkbox"]').removeAttr('checked');
        ids.forEach((item, i) => {
            //console.log(item);
            $('#contacts_checkboxes input:checkbox[value^="' + item + '"]').prop('checked',true);
        });
        wdb.showDialogDiv('MyTime Contacts Selections','contacts_selections');
        $('#contacts_checkboxes input[type="checkbox"]').on('click',wdb.toggle_contacts);
        return false;
    },

    toggle_contacts: function( event )
    {
        console.log('click:',this.checked,this.value);
        return true;
    },

    toggle_contacts_done: function( event )
    {
        var arr = []; var arr2 = [];
        $('#contacts_checkboxes input[type="checkbox"]').each( (i, item) => {
            //console.log('check:',item.checked,item.value);
            var id = item.value.split('|');
            if (item.checked) {
                arr.push(id[0]);
                arr2.push(id[1]);
            }
        });
        $('#client_contacts_hidden').val(arr.toString());
        $('#client_contacts_div').html('');
        arr2.forEach((name, i) => {
            $('#client_contacts_div').append(name + '<br>');
        });
        $('#contacts_selections').dialog('close');
        return true;
    },

    build_time_selection: function ( name )
    {
        //debugger;
        var hours = [ 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
        var min_int = 15; // minutes interval
        var obj = $('<select></select>').attr('name',name);
        var opt = $('<option></option>').attr('value','').html('--');
        obj.append(opt);
        var ampm = 'AM';
        hours.forEach( (hr, i) => {
            for (var m=0; m<60; m+=min_int)
            {
                var time = sprintf('%i:%02i %s',hr,m,ampm);
                var time2 = sprintf('%02i:%02i',hr,m);
                var opt = $('<option></option>').attr('value', time2).html(time);
                obj.append(opt);
            }
        });
        ampm = 'PM';
        hours.forEach( (hr, i) => {
            for (var m=0; m<60; m+=min_int)
            {
                var time = sprintf('%i:%02i %s',hr,m,ampm);
                var h = i+12;
                var time2 = sprintf('%02i:%02i',h,m);
                var opt = $('<option></option>').attr('value', time2).html(time);
                obj.append(opt);
            }
        });
        console.log(obj);
        return obj;
    },

    build_duration_selection: function ( name )
    {
        //debugger;
        var min_int = 15; // minutes interval
        var obj = $('<select></select>').attr('name',name);
        //var opt = $('<option></option>').attr('value','').html('--');
        obj.append(opt);
        for (var hr=0; hr<12; ++hr)
        {
            for (var m=0; m<60; m+=min_int)
            {
                var time = sprintf('%i:%02i',hr,m);
                var opt = $('<option></option>').attr('value', time).html(time);
                obj.append(opt);
            }
        };
        console.log(obj);
        return obj;
    },

    reload_lookups: function ( )
    {
        var params = 'action=mt_init';
        $.ajax({
            url: 'mt_init',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            wdb.group_data = data;
            wdb.rebuild_selections(data);
        });
    },

    get_lookup: function ( group, cd )
    {
        //demtger;
        var descr = '';
        for (var i=0; i<group.length; ++i)
        {
            var item = group[i];
            if (cd.trim() == item.cd.trim())
            {
                return item.descr;
            }
        }
        return 'n/a';
    },

    hideview_content: function ( ...theArgs )
    {
        // hide content divs and show specified
        $('.content_divs').hide();
        for (var i = 0; i < theArgs.length; i++) {
            var div = theArgs[i];
            if (typeof(div) != 'undefined') div.show();
        }
        return false;
    },

    init: function ( )
    {
        $('#mt_refresh_btn').button();
        $('#mt_refresh_btn').on('click',wdb.mtprojects);
        $('#mt_add_project_btn').button();
        $('#mt_add_project_btn').on('click',wdb.mtprojadd);
        $('#mt_clients_btn').button();
        $('#mt_clients_btn').on('click',wdb.mtclients);
        $('#mt_add_client_btn').button();
        $('#mt_add_client_btn').on('click',wdb.mtclientadd);
        $('#mt_contacts_btn').button();
        $('#mt_contacts_btn').on('click',wdb.mtcontacts);
        $('#mt_add_contact_btn').button();
        $('#mt_add_contact_btn').on('click',wdb.mtcontactadd);
        $('#mt_admin_btn').button();
        $('#mt_admin_btn').on('click',wdb.mtadmin);
        $('#mt_help_btn').button();
        $('#mt_help_btn').on('click',wdb.mthelp);
        $('#projedit_form1').on('submit',wdb.mt_proj_handler);
        $('#proj_edit_cancel').on('click',wdb.mt_projedit_cancel);
        $('#contactshow_form').on('submit',wdb.mt_contactshow_handler);
        $('#contactedit_form1').on('submit',wdb.mt_contactedit_handler);
        $('#contact_edit_cancel').on('click',wdb.mt_contactedit_cancel);
        $('#clientshow_form').on('submit',wdb.mt_clientshow_handler);
        $('#clientedit_form1').on('submit',wdb.mt_clientedit_handler);
        $('#client_edit_cancel').on('click',wdb.mt_clientedit_cancel);
        $('#mt_contacts_done_btn').on('click',wdb.toggle_contacts_done);
        $('#mt_form9').on('submit',wdb.handle_search);
        $('#links_form').on('submit',wdb.linkhandler);
        $('#notes_form').on('submit',wdb.notehandler);
        $('#note_cancel').on('click',wdb.mt_note_cancel);
        $('#mt_email_form').on('submit',wdb.email_mt);
        $('#wl_form').on('submit',wdb.workloghandler);
        $('#cancel2').on('click',wdb.worklogCancelDialog);
        $('#wl_show_edit').on('click',wdb.edit_worklog);
        $('#wl_show_cancel').on('click',wdb.worklog_show_cancel);
        $('#mt_lu_form_id').on('submit',wdb.luhandler);
        $('#mt_lu_save_cancel').on('click',wdb.lu_save_cancel);
        $('#mt_user_form_id').on('submit',wdb.userhandler);
        $('#mt_user_edit_cancel').on('click',wdb.user_edit_cancel);
        var sel = wdb.build_time_selection('wl_start_tm');
        $('#wl_start_tm').empty().append(sel);
        var sel = wdb.build_time_selection('wl_end_tm');
        $('#wl_end_tm').empty().append(sel);
        var sel = wdb.build_duration_selection('wl_duration');
        $('#wl_duration').empty().append(sel);
        $('#contact_show_buttons span').button();
        $('#client_show_buttons span').button();
        $('#proj_show_buttons span').button();
        $('#mt_admin_btn').show();
        var params = 'action=mt_init';
        $.ajax({
            url: 'mt_init',
            type: 'get',
            data: params,
            dataType: 'json'
        }).done(function (data)
        {
            //console.log(data);
            // setup verious selection lists
            wdb.group_data = data;
            wdb.rebuild_selections(data);
            $('.projdate').datepicker(
            {
                yearRange: '-5:+10',
                changeMonth: true,
                changeYear: true
            });
            //$('#contacts_checkboxes input[type="checkbox"]').on('click',wdb.toggle_contacts);
            //console.log(sel);
        });
    },

    rebuild_selections: function (data)
    {
        var sel = wdb.build_selection('mt_type',data.mt_type);
        $('#btypes_s').empty().append(sel);
        var sel = wdb.build_selection('status',data.mt_status);
        $('#status_s').empty().append(sel);
        var sel = wdb.build_selection('priority',data.mt_priority);
        $('#priority_s').empty().append(sel);
        var sel = wdb.build_selection('mt_type2',data.mt_type);
        $('#btc_types').empty().append(sel);
        var sel = wdb.build_selection('client_type',data.mt_type);
        $('#client_types').empty().append(sel);
        var sel = wdb.build_selection('status2',data.mt_status);
        $('#btc_status').empty().append(sel);
        var sel = wdb.build_selection('wl_category',data.mt_category);
        $('#wl_category').empty().append(sel);
        var sel = wdb.build_selection('wl_kind',data.mt_kind);
        $('#wl_kind').empty().append(sel);
        if (!/admin/.test(wdb.group_data.roles)) $('#mt_admin_btn').hide();
        var sel = wdb.build_contact_selection('client');
        $('#client_contact_div').empty().append(sel);
        var sel = wdb.build_contacts_checkboxes('contacts');
        $('#contacts_checkboxes').empty().append(sel);
        var sel = wdb.build_client_selection('client');
        $('#client').empty().append(sel);
    }

} // end of wdb namespace

$(function ()
{
    $( document ).ajaxError(function(event, jqxhr, settings, thrownError) {
        wdb.showDialog( "ERROR!", "A error occurred during server call.<br>" + thrownError );
    });
    wdb.init();
    //login_content = $('#login_content').html();
    //$('#login_content').html('');
    //wdb.check_session();
});
