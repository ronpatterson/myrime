// add_file.js
// Ron Patterson, WildDog Design

// depends on the jQuery library

var w = "";

function init () {
	var urlParams = new URLSearchParams(window.location.search);
	// console.log(urlParams.has('id')); // true
	// console.log(urlParams.get('id')); // "edit"
	$('#id').val(urlParams.get('id'));
	return true;
}

function upload_file () {
	$('#errors').html('Uploading...');
	return true;
}

function fini_upload () {
	opener.document.form1.update_list.value = "1";
	//alert('Uploaded');
	//opener.get_files($F('id'));
}

function close_win (w) {
	clearTimeout(w);
	window.close();
}
