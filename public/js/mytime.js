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
	mt_doc: {},

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
// 					var user = $('<div></div>')
// 						.css('position','absolute')
// 						.css('width','30em')
// 						.css('top','15px')
// 						.css('right','1em')
// 						.css('text-align','right')
// 						.css('font-size','9pt')
// 						.html('Welcome '+row.fname+' '+'<a href="#" onclick="return wdb.logout_handler();">Logout</a>');
// 					$('body').append(user);
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
		return false;
	},

	mtprojadd: function ( event )
	{
		wdb.showDialogDiv('WDD MyTime Project Add','projedit_div');
		$('#projedit_errors').html('');
		$('#projedit_form1 input[type="text"]').val('');
		$('#projedit_form1 textarea').val('');
		$('#euser').html(wdb.login_content.uid);
		$('input[name="pid"]').val('');
		$('select[name="mt_type"]').val('');
		$('select[name="status"]').val('o');
		$('#assignedDiv2').html('');
		$('#mt_assign_btn2').hide();
		$('select[name="priority"]').val('3');
		$('#filesDiv,#bfiles,#assignedDiv').html('');
		$('.mt_date').html('');
		$('#mtshow_div').hide();
		$('#mtedit_div').show();
		return false;
	},

	mt_projedit_cancel: function( event )
	{
		//alert('mt_proj_cancel');
		$('#projedit_div').dialog('close');
		return false;
	},

	edit_proj: function ( event, id )
	{
		var id2 = $('#pid').val();
		if (id) id2 = id;
		//alert('edit_proj '+id2);
		var params = "action=edit&id="+id2;
		$.ajax({
			url: 'proj_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//$('#content_div').html(response);
			//$('#mtshow_div').dialog('close');
			//wdb.showDialogDiv('MyTime Bug '+data.mt_id,'mt_mts_show_edit');
			$('#mtedit_errors').html('');
			$('#mtedit_id').html(data.mt_id);
			$('#oldstatus').val(data.status);
			var grp = data.mt_id.replace(/\d+$/,'');
			$('input[name="descr"]').val(data.descr);
			$('input[name="product"]').val(data.product);
			$('select[name="mt_type"]').val(data.mt_type);
			$('select[name="status"]').val(data.status);
			$('select[name="priority"]').val(data.priority);
			$('#assignedDiv2').html(data.aname);
			$('#mt_assign_btn2').show();
			$('textarea[name="comments"]').val(data.comments);
			$('textarea[name="solution"]').val(data.solution);
			$('#edtm').html(data.edtm);
			$('#udtm').html(data.udtm);
			$('#cdtm').html(data.cdtm);
// 			$('#bdate').datepicker(
// 			{
// 				yearRange: '-80:+1',
// 				changeMonth: true,
// 				changeYear: true
// 			});
			$('#mtshow_div').hide();
			$('#mtedit_div').show();
		});
		return false;
	},

	projshowdialog: function ( event, id )
	{
		wdb.showDialogDiv('WDD MyTime Project','mt_projs_show_edit');
		wdb.projshow(event,id);
		return false;
	},

	projshow: function ( event, id )
	{
		//alert(id);
		//var id2 = parseInt(id.replace(/[^\d]/g,''));
		var params = "action=show&id="+id;
		$.ajax({
			url: 'proj_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			wdb.proj_doc = data;
			$('#mt_projs_show_edit').dialog('option','title','WDD MyTime Project '+data.mt_id);
			$('#mt_admin_errors').html('');
			$('#proj_cd').val(data.proj_cd);
			$('#proj_cd2_v').html(data.proj_cd);
			$('#pid').val(id);
			$('#descr_v').html(data.descr);
			$('#product_v').html(data.product);
			$('#mt_v').html(wdb.get_lookup(wdb.group_data.mt_type,data.mt_type));
			$('#status_v').html(data.status_descr);
			$('#priority_v').html(data.priority_descr);
			$('#assignedDiv1').html(data.aname);
			$('#comments_v').html(data.comments);
			$('#solution_v').html(data.solution);
			$('#ename_v').html(data.ename);
			$('#edtm_v').html(data.edtm);
			$('#udtm_v').html(data.udtm);
			$('#cdtm_v').html(data.cdtm);
			wdb.get_files(event);
			wdb.worklog_show(event,data);
			wdb.mt_save_cancel();
			$('#mtshow_div').show();
		});
		return false;
	},

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
		//alert('workloghandler '+params);
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
			wdb.proj_doc = data;
			$('#mt_contact_show').dialog('option','title','WDD MyTime Contact '+data.mt_id);
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
			$('input[name="active"]').removeAttr('checked');
			if (data.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
			else $('input[name="active"][value="n"]').prop('checked',true);
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

	delete_contact: function ( event )
	{
		if (!confirm("Really delete this entry?")) return false;
		var params = 'action=delete';
		params += '&id='+$('#cid').val();
		$.ajax({
			url: 'contact_delete',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (/^SUCCESS/.test(response))
			{
				$('#contact_show_edit').dialog('close');
				wdb.mt_contacts_list(event);
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

	worklog_show: function ( event, data )
	{
		$('#mt_worklog_div').empty();
		var div = $('#mt_worklog_div');
		if (!data.worklog || data.worklog.length == 0)
			div.html('No worklog records');
		else
		{
			var tbl = $('<table></table>');
			div.append(tbl);
			var wl = data.worklog;
			for (var x=0; x<wl.length; ++x)
			{
			    var uname = wdb.group_data.users[wl[x].user_nm] ? wdb.group_data.users[wl[x].user_nm].name : 'n/a';
				var tr = $('<tr><th>Date/Time: '+wl[x].edtm+' by '+uname+'</th></tr>');
				div.append(tr);
				tr = $('<tr><td>'+wdb.nl2br(wl[x].comments)+'<hr></td></tr>');
				div.append(tr);
			}
		}
	},

	mt_worklog_cancel: function( event )
	{
		$('#mtshow_div').show();
		$('#mtedit_div').hide();
		return false;
	},

	mthelp: function ( event )
	{
		wdb.showDialogDiv('MyTime Help','mthelp_div');
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
		params += '&id='+$('#bid').val();
		params += '&mt_id='+$('#mt_id').val();
		params += '&user_id='+$('#userid').val();
		//alert('mthandler '+params);
		$.ajax({
			url: 'mt_add_update',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
		    //console.log(response);
			if (!/SUCCESS/.test(response))
			{
				$('#mtedit_errors').html(response);
			}
			else
			{
				wdb.mtlist(event);
				if ($('#bid').val() == '') {
				    wdb.mt_save_cancel(event);
				    var arr = response.split(/ ,/);
				    wdb.mtshow(event,arr[1]);
				}
				else wdb.mtshow(event,$('#bid').val());
				//$('#mt_mts_list_edit').dialog('close');
				//window.setTimeout(function(e) {$('#mtedit_div').dialog('close');},3000);
			}
		});
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

	add_worklog: function ( event ) {
		wdb.showDialogDiv('MyTime Worklog','mt_worklog_form');
		$('#mt_wl_mt_id').html($('#mt_id2_v').text());
		$('#mt_wl_descr').html($('#descr_v').html());
		$('#mt_mt_comments').html($('#comments_v').html());
		$('input[name="wl_public"][value="n"]').prop('checked',true);
		$('textarea[name="wl_comments"]').val('');
		$('#mt_wl_ename').html($('#usernm').html());
		$('#mt_wl_entry_dtm').html($('#edtm_v').html());
		$('#wl_errors').html('');
		$('textarea[name="wl_comments"]').focus();
		return true;
	},

	workloghandler: function( event ) {
		//alert('workloghandler '+$('#mt_form2').serialize()); return false;
		//var err = wdb.validate();
		var err = '';
		if ($('textarea[name="wl_comments"]').val().blank())
			err += ' - Worklog Comments must not be blank<br>';
		if (err != '')
		{
			$('#wl_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		var id = $('#bid').val();
		var params = 'action=worklog_add&'+$('#mt_form2').serialize();
		params += '&usernm='+$('#userid').val();
		params += '&id='+id;
		params += '&mt_id='+$('#mt_id').val();
		//alert('workloghandler '+params);
		$.ajax({
			url: 'worklog_add',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (/^SUCCESS/.test(response))
			{
				$('#mt_worklog_form').dialog('close');
				wdb.mtshow(event,$('#bid').val());
				//window.setTimeout(function(){wdb.mtshow(event,id);},200);
			}
			else
				$('#wl_errors').html(response);
		});
		return false;
	},

	get_worklog: function (id) {
		$('#worklogDiv').html("Loading...");
		//alert("search_list called");
		$('#worklogDiv').load('mtworklogAjax.php', { id: id });
		return false;
	},

	get_files: function ( event )
	{
		$('#filesDiv').empty();
        var out = '';
        var data = typeof(wdb.mt_doc.attachments) == 'object' ? wdb.mt_doc.attachments : [];
        if (data.length == 0)
            out = 'No attachments';
        else
        {
            $.each(data,function (i)
            {
                var id = $('#bid').val();
                out += '<a href="src/get_file.html?id='+id+'&idx='+i+'" target="_blank">'+data[i].file_name+'</a> ('+data[i].file_size+') <span onclick="return wdb.remove_file(\''+id+'\','+i+');" style="cursor: pointer;">Remove</span><br>';
            });
        }
        $('#filesDiv').html(out);
	},

	attach_file: function ( event )
	{
		//$('errors').update();
		$('#update_list').val("0");
		//alert("add_file called");
//		w = window.open('views/add_file.html?id='+$('#bid').val()+'&mt_id='+$('#mt_id').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
		w = window.open('src/add_file.html?id='+$('#bid').val()+'&mt_id='+$('#mt_id').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
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
		// 	err += ' - Bug Type must be selected<br>';
		// if (f.comments.value.blank())
		// 	err += ' - Comments must not be blank<br>';
	// 	if (!datere.test($('#bdate').val()))
	// 		err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
		return err;
	},

	validate_proj: function ( )
	{
		var datere = /^[01][0-9]\/[0-3][0-9]\/(19|20)[0-9]{2}$/;
		var err = '';
		var f = document.proj_form1;
		//alert(f.serialize()); return err;
		if (f.name.value.blank())
			err += ' - Name must not be blank<br>';
		if (f.po_nbr.value.blank())
			err += ' - PO Number must not be blank<br>';
		// if (f.mt_type.value.blank())
		// 	err += ' - Bug Type must be selected<br>';
		// if (f.comments.value.blank())
		// 	err += ' - Comments must not be blank<br>';
	// 	if (!datere.test($('#bdate').val()))
	// 		err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
		return err;
	},

	validate: function ( )
	{
		var datere = /^[01][0-9]\/[0-3][0-9]\/(19|20)[0-9]{2}$/;
		var err = '';
		var f = document.mt_form1;
		if (f.descr.value.blank())
			err += ' - Description must not be blank<br>';
		if (f.product.value.blank())
			err += ' - Product or Application must not be blank<br>';
		if (f.mt_type.value.blank())
			err += ' - Bug Type must be selected<br>';
		if (f.comments.value.blank())
			err += ' - Comments must not be blank<br>';
	// 	if (!datere.test($('#bdate').val()))
	// 		err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
		return err;
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
// 		var err = wdb.validate();
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
// 		var err = wdb.validate();
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

	worklogCancelDialog: function ( event )
	{
		$('#mt_worklog_form').dialog('close');
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

	hideview_content: function (div, div2)
	{
		// hide content divs and show specified
		$('.content_divs').hide();
		div.show();
		if (typeof(div2) != 'undefined') div2.show();
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
		$('#mt_form2').on('submit',wdb.workloghandler);
		$('#mt_form9').on('submit',wdb.handle_search);
		$('#mt_email_form').on('submit',wdb.email_mt);
		$('#cancel2').on('click',wdb.worklogCancelDialog);
		$('#mt_lu_form_id').on('submit',wdb.luhandler);
		$('#mt_lu_save_cancel').on('click',wdb.lu_save_cancel);
		$('#mt_user_form_id').on('submit',wdb.userhandler);
		$('#mt_user_edit_cancel').on('click',wdb.user_edit_cancel);
		$('#contact_show_buttons span').button();
		$('#mt_show_buttons span').button();
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
			var sel = wdb.build_selection('mt_type',data.mt_type);
			$('#btypes_s').empty().append(sel);
			var sel = wdb.build_selection('status',data.mt_status);
			$('#status_s').empty().append(sel);
			var sel = wdb.build_selection('priority',data.mt_priority);
			$('#priority_s').empty().append(sel);
			var sel = wdb.build_selection('mt_type2',data.mt_type);
			$('#btc_types').empty().append(sel);
			var sel = wdb.build_selection('status2',data.mt_status);
			$('#btc_status').empty().append(sel);
			if (!/admin/.test(wdb.group_data.roles)) $('#mt_admin_btn').hide();
		});
	}

} // end of bt namespace

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
