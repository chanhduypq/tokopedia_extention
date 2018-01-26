/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 *
 * Contains Tokopedia Scrapper Settings
 */

$(function() { 
	//---------------------------------------------------------------------------------//
	//Google Analytics
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-52913301-9']);
	_gaq.push(['_trackPageview','settings.js']);

	(function() {
	  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	  ga.src = 'https://ssl.google-analytics.com/ga.js';
	  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();
	//---------------------------------------------------------------------------------//
	//Select all / unselect all
	$("body").on("click","#selectAllSettings",function(e){
		e.preventDefault();
		$("input[type='checkbox']:enabled").prop("checked",true);
	});
	$("body").on("click","#unSelectAllSettings",function(e){
		e.preventDefault();
		$("input[type='checkbox']:enabled").prop("checked",false);
	});
	//---------------------------------------------------------------------------------//
	$("body").on("click","#clear",function(e){ 
		//Check the selected settings
		if($("input[type='checkbox']:checked").length == 0){
			$(".message").removeClass("error success");
			$(".message").addClass("error");
			$(".message").text("Please select something to clear!");
			$(".message").fadeIn();
		}else{

			if($("input[name='clearCache']").is(":checked")){
				//clear all tab data
				chrome.storage.local.get(null, function(items) {
					for (key in items) {
						if (key.indexOf("tab_") >= 0) {
							chrome.storage.local.remove(key);
						}
					}
				});
			}

			if($("input[name='clearLastScreenshot']").is(":checked")){
				chrome.storage.local.remove("last_screenshot");
			}

			$(".message").removeClass("error success");
			$(".message").addClass("success");
			$(".message").text("Settings have been reset successfully!");
			$(".message").fadeIn();

			$("input[type='checkbox']").prop("checked",false);
			//Send message to refresh Amazon pages
	        chrome.runtime.sendMessage({
	            action: "refreshTokopediaPages"
	        });

	        setTimeout(function(){
	        	$(".message").removeClass("error success");
	        	$(".message").fadeOut();
	        },5000);
		}
	});
	//---------------------------------------------------------------------------------//
	//Close current page
	$("body").on("click","#close", function(e){ 
		e.preventDefault();
		window.close();
	});
	//---------------------------------------------------------------------------------//
	//Go to URL with form data
	function goToUrl(path, params, method) {
	    //Null check
	    method = method || "post"; // Set method to post by default if not specified.

	    // The rest of this code assumes you are not using a library.
	    // It can be made less wordy if you use one.
	    var form = document.createElement("form");
	    form.setAttribute("method", method);
	    form.setAttribute("action", path);

	    //Fill the hidden form
	    if (typeof params === 'string') {
	        var hiddenField = document.createElement("input");
	        hiddenField.setAttribute("type", "hidden");
	        hiddenField.setAttribute("name", 'data');
	        hiddenField.setAttribute("value", params);
	        form.appendChild(hiddenField);
	    }
	    else {
	        for (var key in params) {
	            if (params.hasOwnProperty(key)) {
	                var hiddenField = document.createElement("input");
	                hiddenField.setAttribute("type", "hidden");
	                hiddenField.setAttribute("name", key);
	                if(typeof params[key] === 'object'){
	                    hiddenField.setAttribute("value", JSON.stringify(params[key]));
	                }
	                else{
	                    hiddenField.setAttribute("value", params[key]);
	                }
	                form.appendChild(hiddenField);
	            }
	        }
	    }

	    document.body.appendChild(form);
	    form.submit();
	}
});
