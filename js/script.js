var db;
var path_to_server = "http://easykcal.com"
 // var path_to_server = "http://192.168.1.7/EasyKcal";
var path_to_process = path_to_server + "/api/";
var mega_secret_code = "1337";
var show_warnings = false;
var postinfo = "";
var current_edit_id = 0;
var deletepressed = false;
// var cid = window.localStorage.getItem("company_id");
// var company_id = cid != null ? cid : 0;

// default camera options
var deviceReady = false;
var pageStartTime = +new Date();

$(function() {
    $(document).ready(function() {
	$(".firstpanel").load("parts.html #parts_menu");

	$("body").on("click", ".date", function() {
	    var ths = $(this);
	    var options = {
		date : new Date(),
		mode : 'date'
	    };

	    datePicker.show(options, function(date) {
		var dateback = $.format.date(date, "yyyy-MM-dd");
		ths.val(dateback);
	    });
	});

	$("body").on("click", ".time", function() {
	    var ths = $(this);
	    var options = {
		date : new Date(),
		mode : 'time'
	    };

	    datePicker.show(options, function(date) {
		var dateback = $.format.date(date, "HH:mm");
		ths.val(dateback);
	    });
	});

	document.addEventListener('deviceready', function() {
	    db = window.openDatabase("easykcal", "1.0", "EasyKcal DB", 1000000);
	    deviceReady = true;
	    $("#network_info").html("There is something fishy with the network-plugin");

	    document.addEventListener("offline", setNetworkInfoOffline(), false);
	    document.addEventListener("online", setNetworkInfoOnline(), false);

	    // checkConnection();
	    checkAuth();
	    show_warnings = window.localStorage.getItem("settings-warnings") == "on" ? true : false;
	    show_rejected_deals = window.localStorage.getItem("settings-rejecteddeals") == "on" ? true : false;

	    klog("You have the settings for warnings on, this is one.");
	    // check network status
	    /*
	     * document.addEventListener("offline", checkConnection(), false);
	     * document.addEventListener("online", checkConnection(), false);
	     */

	    /*
	     * if (window.localStorage.hasItem("authtoken")) klog("authtoken is
	     * set" + window.localStorage.getItem("authtoken"));
	     */

	    /**
	     * For the network info
	     * 
	     * @param infostr
	     */
	    function setNetworkInfoOnline() {
		var nwc = checkConnection();
		$("#network_info").html("Network info: <span style='color:green;'>You are online.</span>" + nwc);

	    }

	    function setNetworkInfoOffline() {
		var nwc = checkConnection();
		$("#network_info").html("Network info: <span style='color:red;'>You are not online right now.</span>" + nwc);
	    }

	}, false);

	$("body").on("click", "#update-db", function() {
	    update_db();
	});

	$("body").on("click", "#minalistor", function() {
		    $.mobile.changePage('#page-lists', {
			transition : 'slide',
			changeHash : true,
			role : 'page'
		    });
		    update_list_list();
	});

	$("body").on("click", ".left-menu ul li", function() {
	    var ths = $(this).attr("id");
	    switch (ths) {
		case "page-lists":
		    $.mobile.changePage('#page-lists', {
			transition : 'slide',
			changeHash : true,
			role : 'page'
		    });
		    update_list_list();
		    break;
		case "menu-home":
		    $.mobile.changePage('#home', {
			transition : 'slide',
			changeHash : true,
			role : 'page'
		    });
		    break;	
		case "update-db":
		    update_db();
		    $( "#firstpanel" ).panel( "close" );
		    break;			    
		    
	    }
	});
	
	$("body").on("click",".closebutton",function(e){
	   e.preventDefault();
	   var ths = $(this).parent().attr("id").split("_");
	   console.log("delete!"+ths[0]);
	   deletepressed = true;
	   switch(ths[0]){
	       case "foodslistbox":
		   console.log("removed this");
		   deleteFoodItem(current_edit_id,ths[1]);
		   update_salpos_info(current_edit_id);
		   update_food_list(current_edit_id);
		break;
	       case "listbox":
		   console.log("removed that");
		   deleteList(ths[1]);
		   update_list_list(current_edit_id);
		break;		
	   }
	});

	$("body").on("click", ".listbox", function() {
	    var ths = $(this).attr("id").split("_");
	    if(!deletepressed){
	    switch(ths[0]){
		case "listbox":
		    current_edit_id = parseInt(ths[1]);	    
		    $.mobile.changePage('#salpos-page', {
			transition : 'slide',
			changeHash : true,
			role : 'page'
	    		});
	    		setCategories("category");
	    		$("#addfoodbox input").val("");
	    		update_salpos_info(current_edit_id);
	    		update_food_list(current_edit_id);
	    	break;
		case "foodslistbox":
		    console.log("KLIKK!");
	    	break;	    	
	    }
	    }
	    deletepressed = false;
	});

	

	$("body").on("click", "#add-list-button", function() {
	    var sal = $("#sal").val();
	    var position = $("#position").val();
	    var listdate = $("#listdate").val();
	    var texten = $("#texten").val();
	    if(sal != "" && position != "" && listdate!= "")
		add_new_list(sal, position, listdate, texten);
	    else
		alert("Det saknas information");
	    update_list_list();
	    
	    
	    
	});

	$("body").on("change","#category",function(){
	    var category_id = $(this).val();
	    console.log("catid: "+category_id);
	    getFoodsByCategoryId(category_id);
	});
	
	$("body").on("change","#food",function(){
	    var food_id = $(this).val();
	    var food_arr = food_id.split("_");
	    console.log("food: "+food_id);
	    $("#unit").html(food_arr[1]);
	});
	
	$("body").on("click","#add-food",function(){
	   var category_id = $("#category").val();
	   var food_id = $("#food").val().split("_")[0];
	   var antal = $("#antal").val();
	   
	   console.log("current_list_id: " + current_edit_id +" cat: " + category_id + " food: " + food_id + " antal: " + antal );
	   add_new_food_item(current_edit_id, food_id, antal);
	});
	
	/**
	 * 
	 * To login.
	 * 
	 */
	$("body").on("click", ".menu_button", function() {
	    var ths = $(this).attr("id");
	    var actionstring = "";
	    $(".firstpanel:visible").panel("close");
	    console.log("button clicked: " + ths);
	    switch (ths) {
		case "login":
		    actionstring = "loginapi";
		    username = $("#username").val();
		    password = $("#password").val();

		    // klog(username + " " + password);

		    var data = {
			mega_secret_code : mega_secret_code,
			email : username,
			password : password
		    };

		    $.ajax({
			type : "POST",
			url : path_to_process + actionstring,
			data : data,
			cache : false,
			success : function(response) {
			    console.log(response);
			    if (response.token != null) {
				klog("You are logged in as" + response.user.name + ".");
				window.localStorage.setItem("userid", response.user.id);
				window.localStorage.setItem("username", response.user.name);
				window.localStorage.setItem("useremail", username);
				window.localStorage.setItem("authtoken", response.token);
				// klog("token fetched");
				// updateDealsInfo();
				// klog("infos updated");
				$.mobile.changePage('#home', {
				    transition : 'fade',
				    changeHash : true,
				    role : 'page'
				});
			    }
			    else {
				var chckit = checkConnectionBool();
				if (chckit)
				    $("#login-info").html("No connection to Internet " + response);
				else
				    $("#login-info").html("Det blev något fel vid inloggning..." + response);
			    }
			},
			error : function(e) {
			    $("#login-info").html("Check your login credentials and your internet connection ");
			}
		    });

		    break;
	    }
	});

    });
});

/**
 * Setting the settings
 */
function setSettings() {
    var show_warnings = window.localStorage.getItem("settings-warnings") == "on" ? true : false;
    var show_rejected_deals = window.localStorage.getItem("settings-rejecteddeals") == "on" ? true : false;
    klog("Setting settings " + window.localStorage.getItem("settings-warnings"));

    if (show_warnings) {
	$("#settings-warnings").val("on");
    }
    else {
	$("#settings-warnings").val("off");
    }

    if (show_rejected_deals) {
	$("#settings-rejecteddeals").val("on");
    }
    else {
	$("#settings-rejecteddeals").val("off");
    }
}

/**
 * Fetch info for the apps local database.
 * 
 * @param email
 */
var updated_items = 0;

function update_db(tx) {
    var encodedData = ("Bearer " + window.localStorage.getItem("authtoken"));

    var data = {
	iss : "webbigt.se",
	from: updated_items
    };

    $.ajax({
	        type : "POST",
	        url : path_to_process + "update_db",
	        data : data,
	        cache : false,
	        headers : {
	            "Authorization" : encodedData
	        },
	        success : function(response) {
	            console.log(response);
	            response = JSON.parse(response);
	            if (response.response == "ok") {
	        	db.transaction(function(tx) {
	        	    if(updated_items==0)
	        		tx.executeSql('DROP TABLE IF EXISTS foods');
		            tx.executeSql("CREATE TABLE IF NOT EXISTS foods (id INTEGER PRIMARY KEY AUTOINCREMENT,category_id INTEGER NOT NULL,category_name TEXT NOT NULL,name TEXT NOT NULL,amount FLOAT,unit TEXT NOT NULL,kcal FLOAT,liquid FLOAT)");
		        }, errorCB, successCB);

		        db.transaction(function(tx) {
		            for ( var iii in response.info) {
			        postinfo = response.info[iii];
			        console.log(postinfo.category_id + "<" + iii);
			        tx.executeSql('INSERT INTO foods(category_id,category_name,name,amount,unit,kcal,liquid) VALUES ("' + postinfo.category_id
			                + '", "' + postinfo.category_name + '", "' + postinfo.name + '", "' + postinfo.amount + '", "' + postinfo.unit + '", "'
			                + postinfo.kcal + '", "' + postinfo.liquid + '")');
			        updated_items++;
			        
		            }
		        }, function(e) {
		            console.log(e.message)
		        }, function() {
		            console.log("worked...")
		        });
		        if(updated_items<response.numberofposts){
		            update_db();
		            console.log("go agian!");
		        }
	            }
	            else
		        klog("woo ooo errooooor!");
	            // Update info in db with stuff from response.
	        },
	        error : function(e) {
	            klog("Error: " + e);
	        }
	    });
}


/**
 * Add a new list.
 * @param sal
 * @param pos
 * @param listdate
 * @param texten
 */
function add_new_list(sal, pos, listdate, texten) {
    db.transaction(
	            function(tx) {
	                // tx.executeSql('DROP TABLE IF EXISTS datelist');
	                tx
	                        .executeSql("CREATE TABLE IF NOT EXISTS datelist (id INTEGER PRIMARY KEY AUTOINCREMENT,listdate DATE NOT NULL, sal TEXT NOT NULL,position TEXT NOT NULL,texten TEXT)");
	            }, errorCB, successCB);

    db.transaction(function(tx) {
	tx.executeSql('INSERT INTO datelist(listdate,sal,position,texten) VALUES ("' + listdate + '", "' + sal + '", "' + pos + '", "' + texten + '")');
    }, function(e) {
	console.log(e.message)
    }, function() {
	console.log("worked...")
    });
}

function add_new_food_item(listdate_id, food_id, amount) {
    db.transaction(function(tx) {
	//tx.executeSql('DROP TABLE IF EXISTS food_items');
	tx.executeSql("CREATE TABLE IF NOT EXISTS food_items (id INTEGER PRIMARY KEY AUTOINCREMENT,listdate_id INTEGER NOT NULL, food_id INTEGER NOT NULL, set_amount FLOAT NOT NULL, date_added DATETIME)");
    }, errorCB, successCB);

    db.transaction(function(tx) {
	var tajmen = Date.now();
	tx.executeSql('INSERT INTO food_items(listdate_id,food_id,set_amount,date_added) VALUES ("' + listdate_id + '", "' + food_id + '", "' + amount + '", "' + tajmen + '")');
    }, function(e) {
	console.log(e.message)
    }, function() {
	update_food_list(listdate_id);
	console.log("worked...")
    });
}

function deleteFoodItem(listdate_id, food_id) {
    
    db.transaction(function(tx) {
	var tajmen = Date.now();
	tx.executeSql('DELETE FROM food_items WHERE listdate_id='+listdate_id+' AND  food_id='+food_id);
    }, function(e) {
	console.log(e.message)
    }, function() {
	update_food_list(listdate_id);
	console.log("worked...")
    });
}


function deleteList(listdate_id) {
    
    db.transaction(function(tx) {
	var tajmen = Date.now();
	tx.executeSql('DELETE FROM datelist WHERE id='+listdate_id);
	tx.executeSql('DELETE FROM food_items WHERE listdate_id='+listdate_id);
    }, function(e) {
	console.log(e.message)
    }, function() {
	update_list_list(listdate_id);
	console.log("worked, list deleted")
    });
}



function update_salpos_info(listdate_id){
    console.log("update salpos info"+listdate_id);
    db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM datelist WHERE id = '+listdate_id, [], function(tx, result) {

	    $.each(result.rows,function(index) {
		var row = result.rows.item(index);
		console.log("LISTA: "+row["sal"] + " " + row["position"]);
		$("#salpos-head").html("Sal "+row["sal"] + " - " + "Position " + row["position"]);
		$("#salspo-date").html(row["listdate"]);
		$("#texten").html(row["texten"]);
	    });

	}, function(tx,err){
	    console.log("error: "+ err.message);
	});
    }, errorCB);
}

function update_food_list(listdate_id) {
    console.log("update food items"+listdate_id);
    db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM food_items LEFT JOIN foods ON food_items.food_id = foods.id WHERE listdate_id = '+listdate_id, [], function(tx, result) {
	    var counter = 0;
	    var tha_string = "";
	    var total_kcal = 0;
	    var total_liquid = 0;

	    $.each(result.rows,function(index) {
		counter++;
		var row = result.rows.item(index);
		//console.log(counter + ": " + row['food_id'] + ": " +row['name'] + ": " + row['amount']);
		var datum = new Date(row["date_added"]);

		var amount = parseFloat(row["amount"]);
		var unit = row["unit"];
		var set_amount = parseFloat(row["set_amount"]);
		var totamount = set_amount/amount;
		var kcal = parseInt(row["kcal"])*totamount;
		total_kcal += kcal;
		var liquid = parseInt(row["liquid"])*totamount;
		total_liquid += liquid;
		
		$("#kcal-total").html("Kcal<br />"+total_kcal);
		$("#liquid-total").html("Vätska<br />"+total_liquid+" ml");
		
		datum = getFormattedDate(datum);
		tha_string += "<div class='listbox' id='foodslistbox_" + row['food_id'] + "'><div class='closebutton'>X</div>" 
			+ row['name'] + " " 
			+ row['set_amount'] + " "			
			+ row['unit'] + " "
			+"<br /><span style='font-size:10px'>Tillagd:" + datum +" - "+ kcal + " kcal " + liquid + " ml </span></div>";
	    });
	    $("#foodlistbox").html(tha_string);
	}, function(tx,err){
	    console.log("error: "+ err.message);
	});
    }, errorCB);

}

function getFormattedDate(date) {
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return year + '-' + month + '-' + day;
  }

/**
 * Update the list of dates.
 */
function update_list_list() {
    db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM datelist', [], function(tx, result) {
	    var counter = 0;
	    var tha_string = "";
	    $.each(result.rows,
		    function(index) {
		        counter++;
		        var row = result.rows.item(index);
		        tha_string += "<div class='listbox' id='listbox_" + row['id'] + "'><div class='closebutton'>X</div><div class='listbox-top'>Sal: " + row['sal']
		                + "<span style='float:right; margin-right: 10px;'>Pos: " + row['position'] + "</span></div><div class='listbox-bottom'>" + row['listdate']
		                + "</div></div>";
		    });
	    $("#postitions-listbox").html(tha_string);
	    
	    //reset form
	    $("#sal, #position, #listdate, #texten").val("");
	    
	    
	}, errorCB);
    }, errorCB);

}

function setCategories(category_placer) {
    var counter = 0;
    $("#"+category_placer).html("<option>Välj en kategori</option>");
    db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM foods GROUP BY category_id', [], function(tx,result){
		$.each(result.rows, function(index) {
			counter++;
			var row = result.rows.item(index);
			//console.log(counter + ": " + row['category_id'] + ": " + row['name'] + ' : ' + row['category_name'] + ' : ' + row['kcal']);
			$("#"+category_placer).append("<option value='" + row['category_id'] + "'>"+ row['category_name'] +"</option>");
		});
	}, errorCB);
    }, errorCB);
}

function getFoodsByCategoryId(category_id) {
    var counter = 0;
    $("#food").html("<option>Välj en</option>");
    db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM foods WHERE category_id ='+category_id, [], function(tx,result){
		$.each(result.rows, function(index) {
			counter++;
			var row = result.rows.item(index);
			$("#food").append("<option value='" + row['id'] + "_" + row['unit'] + "'>"+ row['name'] +"</option>");
		});
	}, errorCB);
    }, errorCB);
}

// function will be called when an error occurred
function errorCB(err) {
    alert("Error processing SQL: " + err.code);
}

// function will be called when process succeed
function successCB() {
    console.log("success!");

}

/**
 * To check that authorization still is valid.
 */
function checkAuth() {

    var encodedData = ("Bearer " + window.localStorage.getItem("authtoken"));
    // klog(encodedData);
    var data = {
	iss : "webbigt.se"
    };

    $.ajax({
	type : "POST",
	url : path_to_process + "me",
	data : data,
	cache : false,
	headers : {
	    "Authorization" : encodedData
	},
	success : function(response) {
	    if (response.user.name == undefined) {
		klog("Auth failed going to login-page");
		$.mobile.changePage('#page-login', {
		    transition : 'pop',
		    changeHash : true,
		    role : 'page'
		});
	    }
	    else {
		klog("You are logged in " + response.user.name + ", welcome!");
		// klog(response.user.name + " just logged in");
	    }
	},
	error : function(e) {
	    klog(e);
	    $.mobile.changePage('#page-login', {
	        transition : 'fade',
	        changeHash : true,
	        role : 'page'
	    });
	}
    });
}

function klog(stringout) {
    if (show_warnings)
	alert(stringout);
    else if (false)
	klog(stringout);
}

/**
 * Network stuff
 */

function checkConnection() {
    var networkState = navigator.connection != undefined ? navigator.connection.type : Connection.UNKNOWN;

    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    return ' Connection type: ' + states[networkState];
}

function checkConnectionBool() {
    var networkState = navigator.connection != undefined ? navigator.connection.type : Connection.UNKNOWN;

    return networkState == undefined || networkState == Connection.NONE ? false : true;
}
