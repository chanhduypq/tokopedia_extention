/*
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 * 
 * Contains the core of JS
 */
$(function() {

	//If the file has injected many times
	if ($(".jsContainer").length >= 1) {
		return false;
	}

	setInterval(setWellcomeMsg,2000);

	//None info messages
	noneCategoryInfo 	= "<i data-tooltip='This listing does not have a parent category' class='none-info'>--i</i>";
	noneRankInto 		= "<i data-tooltip='Tokopedia does not rank this listing in a parent category, only sub-categories. In order to compare apples to apples, sub-category ranks are not displayed in this window' class='none-info'>--i</i>";
	nonePriceInfo 		= "<i data-tooltip='This listing does not have a seller who controls the buy box' class='none-info'>--i</i>";
	noneReviewsInfo 	= "<i data-tooltip='Tokopedia does not display the number of reviews for this product' class='none-info'>--i</i>";
	noneSoldInfo 		= "<i data-tooltip='Tokopedia does not display the number of sold for this product' class='none-info'>--i</i>";
	noneSellerlocationInfo = "<i data-tooltip='Tokopedia does not display the number of sold for this product' class='none-info'>--i</i>";
	noneViewsInfo 		= "<i data-tooltip='Tokopedia does not display the number of views for this product' class='none-info'>--i</i>";
	noneRatingInfo 		= "<i data-tooltip='Tokopedia does not display the star rating for this product' class='none-info'>--i</i>";
	noneBBSellerInfo 	= "<i data-tooltip='No sellers currently control the buy box, therefore a seller type cannot be displayed' class='none-info'>--i</i>";
	noneEstSalesInfo 	= "<i data-tooltip='Monthly sales cannot be estimated for this product because Tokopedia does not rank it in a parent category. Unfortunately, sub-category ranks cannot provide accurate sales estimates, therefore should not be used by sellers to predict sales and are not used by Jungle Scout' class='none-info'>--i</i>";
	noneEstRevenueInfo 	= "<i data-tooltip='Monthly revenue cannot be estimated for this product because it either does not have a monthly sales estimate or a buy box price' class='none-info'>--i</i>";
	//Globals
	tabUrl = window.location.href;
	tokopediaProductsPort = chrome.runtime.connect({
		name: "tokopediaProductsPort"
	}); //Makes request to Amazon
	//    
	var mainJsPopupPath = chrome.extension.getURL("jsPopup.html");
	var imagesPath 		= chrome.extension.getURL("images");
	var jsContainer 	= $("<section class='jsContainer'></section>");
	var getProductsData = new GetProductsData();
	var state 			= null;
	var showProductImageTimeout = null;
	var time_delay 		= 1000; //mls
	//Current website details
	currentProtocol = location.protocol;
	currentBaseUrl = currentProtocol + "//" + location.hostname;
	currentCurrency = "Rp";
	//Tooltip effect
	$("body").on("mouseenter mouseleave mousemove", "[data-tooltip]", function(e) {
		if (e.type == "mouseenter") {
			// Hover over code
			var theToolTip = $(this).attr('data-tooltip');
			if (theToolTip.length > 0) {
				$('<p class="jsToolTip"></p>').text(theToolTip).appendTo('.jsContainer').fadeIn('slow');
			}
		} else if (e.type == "mousemove") {
			$('.jsToolTip').css({
				top: $(this).position().top + 30,
				left: $(this).position().left
			});
		} else if (e.type == "mouseleave") {
			$('.jsToolTip').remove();
		}
	});
	//--------------------------------------------------------------------------------//
	//Inject popup
	$("body").prepend(jsContainer);

	jsContainer.load(mainJsPopupPath, function() {
		$("#jsLogo").attr("src", imagesPath + "/full-logo.png");
		$("#jsFbImage").attr("src", imagesPath + "/fb.png");
		$("#jsScreenshotImage").attr("src", imagesPath + "/screenshot.png");
		chrome.storage.local.get("authObject", function(storeResult) {
			if(typeof storeResult.authObject != "undefined" && typeof storeResult.authObject.username != "undefined"){
			 $(".jsContainer .username").text(storeResult.authObject.username);
			}
		})
	});
	//Waiting messages from browser action
	chrome.runtime.onConnect.addListener(function(port) {
		if (port.name == "jsPopupChannel") {
			port.onMessage.addListener(function(response) {

				if (response.url == window.location.href) {
					//Check auth object
					if (response.action == "openCloseJsPopup") {
						if ($(".jsContainer").is(":visible")) {
							$(".jsContainer .closeJsPopup").click();
						} else {

							//check user
							if($(".jsContainer .username").text()==''){
								chrome.storage.local.get("authObject", function(storeResult) {
									if(typeof storeResult.authObject != "undefined" && typeof storeResult.authObject.username != "undefined"){
									 $(".jsContainer .username").text(storeResult.authObject.username);
									}
								})
							}

							tabUrl = window.location.href;
							state = new currentState(tabUrl);
							checkCurrentState(tabUrl,false);
							$(".jsContainer").fadeIn("fast");
							renderHeaderBoxes();
						}
					} //End if openCloseJsPopup
				}
			});
		}
	});
	//--------------------------------------------------------------------------------//
	//Userinfo jsPopup button
	$(".jsContainer").on("mouseenter", ".userPopup", function() {
		$(".jsContainer .userinfo").stop(true,true).delay(100).show(0);
	}).on('mouseleave', '.userPopup', function( event ) {
		$(".jsContainer .userinfo").stop(true,true).delay(500).hide(0);
	});

	$(".jsContainer").on("click",".logout", function() {


		hidePopups(true);
		$(".jsContainer").fadeOut("fast");
		chrome.runtime.sendMessage({
			action: "stopAllAjaxRequests"
		});

		// chrome.runtime.sendMessage({
		// 	action: "resetTitle"
		// });
		chrome.storage.local.remove("showWellcom");
		//clear all tab data
		chrome.storage.local.get(null, function(items) {
			for (key in items) {
				if (key.indexOf("tab_") >= 0) {
					chrome.storage.local.remove(key);
				}
			}
		});
		chrome.storage.local.remove('authObject',function(){     
			window.open(chrome.extension.getURL("login.html"), '_blank');
		});  

	});
	//--------------------------------------------------------------------------------//
	//Close jsPopup button
	$("body").on("click", ".jsContainer .closeJsPopup", function() {
		//Close other popup
		hidePopups(true);
		$(".jsContainer").fadeOut("fast");
		//Remove content table to save Amazon pages!
		chrome.runtime.sendMessage({
			action: "stopAllAjaxRequests"
		});        
	});
	//--------------------------------------------------------------------------------//
	//Refresh jsPopup button
	$("body").on("click", ".jsContainer .reFreshJsPopup", function() {

		//Remove all requests
		chrome.runtime.sendMessage({
			action: "stopAllAjaxRequests"
		});
		$("#js-table").attr("data-extractUrl", "");
		tabUrl = window.location.href;
		//Start clear the current state
		chrome.storage.local.get("tab_"+md5(tabUrl), function(result) {
			if(Object.keys(result).length > 0){
				chrome.storage.local.remove("tab_"+md5(tabUrl));
			}
		});
		cleanHeader();
		hidePopups(true);
		cleanJsPopup();
		// $("#js-table .loading_hide").remove();
		setTimeout(function() {
			checkCurrentState(tabUrl,true);
		}, 3000);
		
	});
	//After the ajax requests have been stopped
	tokopediaProductsPort.onMessage.addListener(function(response) {
		if (response.action == "ajaxStopped") {
			var currentRowsNumber = $("#js-table tbody tr").length;
			if (state && currentRowsNumber > 0) {
				//In products page and children products
				var currentChildrenProducts = $("#js-table .child-product").length;
				if (currentChildrenProducts >= 1) {
					var firstVariationPrice = $("#js-table tbody tr:first").attr("data-price");
					firstVariationPrice = pureNumber(firstVariationPrice);
					var isAllPriceMatch = true;
					//Check price match compared to the main product
					$("#js-table .child-product").each(function(index, row) {
						var currentPrice 	= $(this).attr("data-price");
						currentPrice 		= pureNumber(currentPrice);
						if (currentPrice != firstVariationPrice) {
							isAllPriceMatch = false;
							return false;
						}
					});
				} //end if there are children
				//Render all avg boxes
				renderHeaderBoxes();
				//Save the current state after 3 seconds (To make sure)
				setTimeout(function() {
					reInitializeTableSorter(true);
					state.saveCurrentState();
				}, 5000);
			}
		}
	});
	//Add X button beside results
	var currentTdNumber = null;
	$("body").on("mouseenter mouseleave", "#js-table td.js-number", function(ev) {
		if ($("#js-table tbody tr").length >= 2) {
			if (ev.type === 'mouseenter') {
				currentTdNumber = $(this).text();
				$(this).html("<img id='removeCurrentRow' src='" + imagesPath + "/jsRemoveRowButton.png' width='15' height='15' />");
			} else {
				$(this).text(currentTdNumber);
				currentTdNumber = null;
			}
		}
	});
	//On X button is clicked to remove current row
	$("body").on("click", "#removeCurrentRow", function(e) {
		e.preventDefault();
		$(this).parents("tr").remove();
		renderHeaderBoxes();
		if (state) {
			reInitializeTableSorter(true);
			state.saveCurrentState();
		}
	});
	//Image Preview for products
	$("body").on("mouseenter mouseleave", "section.jsContainer .product-image-cell", function(ev) {
		var theProductImage = $(this).attr("data-image");
		if (ev.type === 'mouseenter' && (theProductImage.indexOf("http") == 0 || theProductImage.indexOf("data:image") == 0)) {
			showProductImageTimeout = setTimeout(function() {
				$("section.jsContainer .product-image img").attr("src", theProductImage);
				$("section.jsContainer .product-image").fadeIn("fast");
			}, 500);
		} else if (ev.type === 'mouseleave') {
			if (showProductImageTimeout) {
				clearTimeout(showProductImageTimeout);
				$("section.jsContainer .product-image img").attr("src", "");
				$("section.jsContainer .product-image").fadeOut("fast");
			}
		}
	});
	//Hide product image viewer anyway when the mouse leaves JS
	$("body").on("mouseleave", "section.jsContainer .content-table", function(ev) {
		$("section.jsContainer .product-image").fadeOut("fast");
	});
	//Download to CSV
	$("body").on("click", ".footer #csvExport", function(e) {
		e.preventDefault();
		if ($('#js-table tr').length > 1) {
			$("#js-table .hiddenable").removeClass('hidden');
			//The file name
			var fileName 	= $('section.jsContainer #js-table').attr("data-firstRow");
			fileName 		= fileName.replace(":", " of");
			var firstRow 	= $('section.jsContainer #js-table').attr("data-firstRow");
			firstRow = firstRow.replace(/\,/g, "");
			//Print averages
			var avgPrice 	= "Average Price: " + $(".summary-result.js-avg-price").text();
			var avgReviews 	= "Average Reviews: " + $(".summary-result.js-avg-reviews").text();
			var avgSold 	= "Average Sold: " + $(".summary-result.js-avg-sold").text();
			var avgViews 	= "Average Views: " + $(".summary-result.js-avg-views").text();
			//Print date and time
			var today 	= new Date();
			var day 	= today.getDate();
			var month 	= today.getMonth() + 1;
			var year 	= today.getFullYear();
			var hours 	= today.getHours();
			var mins 	= today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
			var exportDate = "Export date: " + month + "/" + day + "/" + year + " | Export time: " + hours + ":" + mins;
			$('#js-table').table2CSV({
				fileName: fileName,
				firstRows: [exportDate, firstRow, avgPrice, avgReviews, avgSold, avgViews]
			});
			$("#js-table .hiddenable").addClass('hidden');
		}
	});
	//Print Screen button
	$("body").on("click", ".footer #screenshotPage", function(e) {
		e.preventDefault();
		if ($('#js-table tr').length > 1) {
			$('section.jsContainer .content-table').scrollTop(0);
			$('section.jsContainer .content-table').scrollLeft(0);
			//Hide un-needed columns
			$("#js-table .screenshot-hiddenable").addClass('screenshot-hide');
			//Just show first 25 row
			// $("#js-table tr:gt(26)").hide();
			//Hide all popups
			hidePopups(true);
			//Remove fixed header
			$("#js-table thead tr:first").removeClass("float-header");
			$("#js-table").removeClass("float-header");
			//Take pic.
			html2canvas($("section.jsContainer #js-table").get(0), {
				onrendered: function(canvas) {
					localStorage("last_screenshot", canvas.toDataURL(), function() {
						window.open(chrome.extension.getURL("screenshot.html"), '_blank');
						//Back un-needed columns
						$("#js-table .screenshot-hiddenable").removeClass('screenshot-hide');
						//Back all rows
						$("#js-table tr:gt(26)").show();
						//Back float header
						$("#js-table thead tr:first").addClass("float-header");
						$("#js-table").addClass("float-header");
					});
				}
			});
		}
	});
	//Extract results 
	$("body").on("click", "section.jsContainer #extractResults", function(e) {
		e.preventDefault();

		//disable next page
		if($(".loading_hide").length<=0){

			var currentExtractURL = $("#js-table").attr("data-extractUrl");
			if ($('#js-table tr').length > 1 && currentExtractURL!='' ) {

				//scroll next page
				$('section.jsContainer .content-table').animate({scrollTop:$('#js-table').height()+200}, 4000);			
				//set next extract URL
				var current_page    = getParameter("page", currentExtractURL) ? getParameter("page", currentExtractURL) : 1;
				currentExtractURL = currentExtractURL.replace('page='+current_page,'page='+(parseInt(current_page)+1));
				//update start
				if(getParameter("start", currentExtractURL) && getParameter("rows", currentExtractURL) ){
					var current_start = parseInt(getParameter("rows", currentExtractURL))+parseInt(getParameter("start", currentExtractURL)); 
					currentExtractURL = currentExtractURL.replace('start='+getParameter("start", currentExtractURL),'start='+current_start);
				}
				$("#js-table").attr("data-extractUrl", currentExtractURL);
				//end set next extract URL
				
				var endPages  	= $("#js-table").attr("data-endpageNumber");
				if(parseInt(current_page)>=parseInt(endPages)){
					//Don't show extract next page
					$("#js-table").attr("data-extractUrl", "");
					showProductsScreen();
				}

				//searchResultsData
				getProductsData.searchResultsData(currentExtractURL);
			}
		}
		else{
			alert('Loadding, please Wait... !');
		}

	});
	//Check previous state from local storage
	function checkCurrentState(tabUrl,isClear) {
		// $("#js-table tbody").html("");
		
		chrome.storage.local.get(["tab_" + md5(tabUrl)],function(result){

			result = Object.keys(result).length > 0 ? JSON.parse(result["tab_" + md5(tabUrl)]) : null;

			if(isClear==true){
				cleanJsPopup();
				getProductsData.searchResultsData(tabUrl);
			}
			else if( result && tabUrl == result.currentUrl ){
				
				$("#js-table").html(result.currentTable);
				$("#js-table").attr("data-firstRow",result.currentFirstRow);
				$("#js-table").fadeIn();
				reInitializeTableSorter(true);

				$(".summary-result.js-avg-sales").text(result.currentAvgSales);
				$(".summary-result.js-avg-sales").attr("title", result.currentAvgSales);
				$(".summary-result.js-avg-sales-rank").text(result.currentAvgSalesRank);
				$(".summary-result.js-avg-sales-rank").attr("title", result.currentAvgSalesRank);
				$(".summary-result.js-avg-price").text(result.currentAvgPrice);
				$(".summary-result.js-avg-price").attr("title", result.currentAvgPrice);
				$(".summary-result.js-avg-reviews").text(result.currentAvgReviwes);
				$(".summary-result.js-avg-reviews").attr("title", result.currentAvgReviwes);
				$(".summary-result.js-avg-views").text(result.currentAvgViews);
				$(".summary-result.js-avg-views").attr("title", result.currentAvgViews);
				$(".summary-result.js-avg-sold").text(result.currentAvgSold);
				$(".summary-result.js-avg-sold").attr("title", result.currentAvgSold);

				//remove loadding hide
				$("#js-table .loading_hide").remove();

				//Extract next page button
				if(typeof result.currentExtractUrl != "undefined" && result.currentExtractUrl && typeof result.currentExtractElement != "undefined"){
					$("section.jsContainer #extractResults").attr("data-section",result.currentExtractElement.dataSection);
					$("section.jsContainer #js-table").attr("data-extracturl",result.currentExtractUrl);
					$("section.jsContainer #extractResults").text("Extract Next Page");
					$("section.jsContainer #extractResults").fadeIn();
				}else{
					$("section.jsContainer #extractResults").fadeOut();
				}

			}else{
				//Clean previous data
				cleanJsPopup();
				getProductsData.searchResultsData(tabUrl);
			}
		});
		
	}
	// Scrapping Module
	function GetProductsData() {

		var searchResultsData = function(searchUrl) {

			if (searchUrl) {

				// set currentExtractURL
				var currentExtractURL = $("#js-table").attr("data-extractUrl");
				if(currentExtractURL == ''){

					if (searchUrl.indexOf("/search") > 0) {
						//search
						var searchedText = $("body").find("#search-keyword").attr("value");
						if (searchedText != '' && currentExtractURL == '') {
							//get pramare
							var current_page    = getParameter("page", searchUrl) ? getParameter("page", searchUrl) : 1;
							var current_start   = (current_page * 60)-60;
							//set extrac URL
							currentExtractURL = "https://ace.tokopedia.com/search/product/v3?st=product&q=" + searchedText + "&ob=23&page=" + current_page + "&source=search_product&device=desktop&rows=60&start=" + current_start;
							$("#extractResults").attr("data-section", "SearchPage");
						}

					} else if (searchUrl.indexOf("tokopedia.com/p/") > 0) {
						// department id
						var department_id = 0;
						if ($("html").text().indexOf("department_id") > 0) {
							// department_id = string.replace(/.*department_id\s+(.*)\;.*/, "$1").replace('=','');
							tmp_department_id 	= $("html").text().split('department_id');
							tmp_department_id 	= tmp_department_id[1].split(';')
							department_id 		= tmp_department_id[0].replace("=", "");
							department_id 		= department_id.trim();
						}
						// currentExtractURL
						if (department_id > 0 ) {

							var product_perPage = 50
							var check_products_num = $("html").find(".category-product-box, .products .product-item, .product-list .product-card").not(".product-placeholder .product-card");
							if (check_products_num.length <= 45) {
								product_perPage = 40;
							}
							//get pramare
							var current_page    = getParameter("page", searchUrl) ? getParameter("page", searchUrl) : 1;
							var current_start   = (current_page * product_perPage ) - product_perPage;
							//set extrac URL
							currentExtractURL = "https://ace.tokopedia.com/search/product/v3?image_size=200&page=" + current_page + "&rows=" + product_perPage + "&sc=" + department_id + "&device=desktop&source=directory&start=" + current_start + "&ob=23";
							$("#extractResults").attr("data-section", "DepartmentPage");
						}

					} else if (searchUrl.indexOf("tokopedia.com/hot/") > 0) {
						// hot id
						var hcid = 0;
						var qstr = '';
						if ($("html").text().indexOf('"hc":"') > 0) {

							tmp_hcid = $("html").text().split('"hc":"');
							tmp_hcid = tmp_hcid[1].split('"');
							hcid = tmp_hcid[0].trim();
						}

						//get pramare
						var current_page    = getParameter("page", searchUrl) ? getParameter("page", searchUrl) : 1;
						var current_start   = (current_page * 60)-60;

						// currentExtractURL
						if (hcid > 0 ) {
							currentExtractURL = "https://ace.tokopedia.com/search/product/v3?ob=23&page=" + current_page + "&source=hot_product&device=desktop&hc=" + hcid + "&pmax=0&pmin=0&start=" + current_start + "&scheme=https&q=&rows=60&full_domain=www.tokopedia.com";
							$("#extractResults").attr("data-section", "HotPage");
						}
						else if ($("html").text().indexOf('"q":"') > 0) {

							tmp_qstr = $("html").text().split('"q":"');
							tmp_qstr = tmp_qstr[1].split('"');
							qstr = tmp_qstr[0].trim();

							//fixed query string to array
							if(qstr.indexOf(", ")>0){
								qstr = qstr.replace(/, /g, "+OR+");
								qstr = qstr.replace(/ /g, "+");
								qstr = encodeURIComponent(qstr);
								qstr = qstr.replace(/%2B/g, "+");
								qstr = qstr.replace(/'/g, "%27");
								qstr = "("+qstr+")";
							}

							if(qstr!=''){
								currentExtractURL = "https://ace.tokopedia.com/search/product/v3?ob=23&page=" + current_page + "&source=hot_product&device=desktop&q=" + qstr + "&start=" + current_start + "&scheme=https&rows=60&full_domain=www.tokopedia.com";
								$("#extractResults").attr("data-section", "HotPage");
							}
						}

						//pmax
						if ( currentExtractURL.indexOf('pmax') <= 0 && $("html").text().indexOf('"pmax":"') > 0) {
							tmp_pmax = $("html").text().split('"pmax":"');
							tmp_pmax = tmp_pmax[1].split('"');
							currentExtractURL = currentExtractURL+'&pmax='+tmp_pmax[0].trim();
						}
						//pmin
						if ( currentExtractURL.indexOf('pmin') <= 0 && $("html").text().indexOf('"pmin":"') > 0) {
							tmp_pmin = $("html").text().split('"pmin":"');
							tmp_pmin = tmp_pmin[1].split('"');
							currentExtractURL = currentExtractURL+'&pmin='+tmp_pmin[0].trim();
						}
						//negative
						if ( currentExtractURL.indexOf('negative') <= 0 && $("html").text().indexOf('"negative":"') > 0) {
							tmp_pmin = $("html").text().split('"negative":"');
							tmp_pmin = tmp_pmin[1].split('"');
							tmp_pmin = tmp_pmin[0].trim();
							tmp_pmin = tmp_pmin.replace(/ /g, "");
							tmp_pmin = tmp_pmin.replace(/,/g, "%2C");
							currentExtractURL = currentExtractURL+'&negative='+tmp_pmin;
						}


						if ($("html").text().indexOf('"sc":["') > 0) {
							tmp_scids = $("html").text().split('"sc":[');
							tmp_scids = tmp_scids[1].split(']');
							scids = tmp_scids[0].trim();
							scids = scids.replace(/"/g, "");
							scids = scids.replace(/,/g, "%2C");
							currentExtractURL +="&sc=" + scids + "&default_sc=" + scids;
						}

					}else if ( $("html").text().indexOf("page_shop_id") > 0 ) {
						//page_shop_id
						tmp_page_shop_id = $("html").text().split('page_shop_id');
						tmp_page_shop_id = tmp_page_shop_id[1].split(';')
						page_shop_id = tmp_page_shop_id[0].replace("=", "").trim();
						//currentExtractURL
						if (page_shop_id > 0 ) {
							//get pramare
							var current_page    = getParameter("page", searchUrl) ? getParameter("page", searchUrl) : 1;
							var current_start   = (current_page * 80)-80;
							//set extrac URL
							currentExtractURL = "https://ace.tokopedia.com/search/v2.6/product?shop_id=" + page_shop_id + "&ob=11&rows=80&start=" + current_start + "&full_domain=www.tokopedia.com&scheme=https&device=desktop&source=shop_product";
							$("#extractResults").attr("data-section", "SearchPage");
							if (searchUrl.indexOf("sort=") > 0) {
								ob_value=11;
								var p_sort = getParameter("sort", searchUrl);
								p_sort = parseInt(p_sort);
								switch (p_sort) {
									case 1: ob_value =11;  break; 
									case 2: ob_value =9;   break;
									case 9: ob_value =3;   break;
									case 10: ob_value =4;  break;
									case 7: ob_value =15;  break;
									case 8: ob_value =14;  break;
									case 5: ob_value =13; break;
									case 3: ob_value =10; break;
								}
								if(ob_value!=11){
									currentExtractURL = currentExtractURL.replace('&ob=11','&ob='+ob_value);
								}
							}
						}
					}
					
					//add filter
					var url_vars = getAllParameter(searchUrl);
					for(var i in url_vars){

						//update slug
						para_ext = i+"="+getParameter(i, currentExtractURL);
						para_var = i+"="+url_vars[i];
						//check key
						if (  currentExtractURL.indexOf("&"+i+"=") <= 0 && currentExtractURL.indexOf("?"+i+"=") <= 0  ){
							//update currentExtractURL
							currentExtractURL += (currentExtractURL.indexOf("?") > 0  ) ? "&"+para_var : "?"+para_var;
						}
						else if ( currentExtractURL.indexOf("&"+i+"=") > 0  ){
							//update currentExtractURL
							currentExtractURL = currentExtractURL.replace("&"+para_ext,"&"+para_var);
							
						}
						else if ( currentExtractURL.indexOf("?"+i+"=") > 0  ){
							//update currentExtractURL
							currentExtractURL = currentExtractURL.replace("?"+para_ext,"?"+para_var);
						}
					}
					//end add filter
					
					// currentExtractURL
					if(currentExtractURL!=''){
						$("#js-table").attr("data-extractUrl", currentExtractURL);
					}
					// end set currentExtractURL
				}
				

				//current page loading
				if (searchUrl == window.location.href) {
					searchResultsInternalData($("body"));
				}
				//product page
				else if (searchUrl.indexOf("/product/") > 0) {

					//next_number
					var next_number = getParameter("page", currentExtractURL);
					next_number 	= parseInt(next_number) + 1;

					//loop all producs prom json
					chrome.runtime.sendMessage({
						action: "makeRequestNextPage",
						link: currentExtractURL
					}, function(response) {
						rederDataFromNextPage(response.data.products, next_number);
					});
				}
				//shop page
				else if (currentExtractURL.indexOf("/product?shop_id/") > 0) {

					//next_number
					var next_number = getParameter("page", currentExtractURL);
					next_number 	= parseInt(next_number) + 1;

					//loop all producs prom json
					chrome.runtime.sendMessage({
						action: "makeRequestNextPage",
						link: currentExtractURL
					}, function(response) {
						rederDataFromNextPage(response.data, next_number);
					});
				}
			}
		}
		var rederDataFromNextPage = function(products, page) {
			product_size = products.length;
			var table_html = "";//$("#js-table tbody").html();
			var referenceNum = $("#js-table .loaded").length +1;
			for (var i = referenceNum; i < product_size+referenceNum; i++) {
				table_html += "<tr id='" + i + "' class='loading_hide'><td class='js-number'>&nbsp;</td><td class='js-product-name product-image-cell' >&nbsp;</td><td class='js-productUrl hidden hiddenable'>&nbsp;</td><td class='js-price'>&nbsp;</td><td class='js-category screenshot-hiddenable'>&nbsp;</td><td class='js-reviews'>&nbsp;</td><td class='js-sold'>&nbsp;</td><td class='js-views'>&nbsp;</td><td class='js-rating'>&nbsp;</td><td class='js-bb-sellerName'>&nbsp;</td><td class='js-bb-sellerUrl hidden hiddenable'>&nbsp;</td><td class='js-location'>&nbsp;</td><td class='js-productError hidden hiddenable'>&nbsp;</td></tr>";
			}
			//Render the row
			$(table_html).appendTo("#js-table tbody");
			//$("#js-table tbody").html(table_html);
			eachasyncnext(products, 0,referenceNum);
		}
		var searchResultsInternalData = function(data, productCrawlFromNextPage) {

			products = $(data, "body").find(".category-product-box, .products .product-item, .product-list .product-card, #showcase-container .shop-product, .grid-shop-product .official-shop-product").not(".product-placeholder .product-card");
			//First Row
			// products = $(data, "body").find(".category-product-box:first, .products .product-item:first, .product-list .product-card:first, #showcase-container .shop-product:first, .grid-shop-product .official-shop-product:first").not(".product-placeholder .product-card");
			var searchedText = $(data, "body").find("#search-keyword").val();
			if (searchedText) {
				$("#js-table").attr("data-firstRow", "Search Term: " + escapeHTML(searchedText));
				$("#js-table").attr("data-searchTerm", escapeHTML(searchedText));
			}

			if (products.length <= 0) {
				showNoProductsScreen();
				return;
			}

			//Extract results
			var all_page_number = $(data, "body").find(".product-list__pagination .span4 strong.ng-binding:last").text();
			if(all_page_number.trim()==''){
				all_page_number = $(data, "body").find("#product-contents-header .count-records strong:last").text();
			}
			all_page_number = all_page_number.replace('.', '').replace('.', '').replace('.', '');
			all_page_number = parseInt(all_page_number);

			//eachpage
			var ext_page_number = $(data, "body").find(".product-list__pagination .span4 strong.ng-binding:first").text();
			if(ext_page_number.trim()==''){
				ext_page_number = $(data, "body").find("#product-contents-header .count-records strong:first").text();
			}
			ar_numnNext = ext_page_number.split('-');
			var rage_num = parseInt(ar_numnNext[1])-parseInt(ar_numnNext[0])+1;
			all_page_number = Math.ceil(all_page_number / rage_num);

			//limint 201 page for earch category by tokopedia
			if (all_page_number > 201) {
				all_page_number = 201;
			}
			//pagination
			var resultsRow = $(data, "body").find(".pagination");
			var pagination = new Pagination(resultsRow);
			var limitPagesNumber = pagination.getAllResultsNumber();
			var currentPageNumber = pagination.getCurrentPage();

			//reset the num page
			if (all_page_number > limitPagesNumber) {
				limitPagesNumber = all_page_number;
			}

			$("#js-table").attr("data-endpageNumber", limitPagesNumber);
			
			//show showProductsScreen
			if (parseInt(currentPageNumber) < parseInt(limitPagesNumber)) {
				showProductsScreen();
			} else {
				//Don't show extract next page
				$("#js-table").attr("data-extractUrl", "");
				showProductsScreen();
			}
			//add table
			product_size = products.length;
			var table_html = '';
			for (var i = 1; i <= product_size; i++) {
				table_html += "<tr id='" + i + "' class='loading_hide'><td class='js-number'>&nbsp;</td><td class='js-product-name product-image-cell' >&nbsp;</td><td class='js-productUrl hidden hiddenable'>&nbsp;</td><td class='js-price'>&nbsp;</td><td class='js-category screenshot-hiddenable'>&nbsp;</td><td class='js-reviews'>&nbsp;</td><td class='js-sold'>&nbsp;</td><td class='js-views'>&nbsp;</td><td class='js-rating'>&nbsp;</td><td class='js-bb-sellerName'>&nbsp;</td><td class='js-bb-sellerUrl hidden hiddenable'>&nbsp;</td><td class='js-location'>&nbsp;</td><td class='js-productError hidden hiddenable'>&nbsp;</td></tr>";
			}
			//Render the row
			// $(table_html).appendTo("#js-table tbody");
			$("#js-table tbody").html(table_html);        
			eachasync(products, 0,1);
		}


		function eachasyncnext(products, index,referenceNum){

			if (index > products.length) {
				return false;
			} else if( typeof products[index] != 'undefined' && typeof products[index].url != 'undefined' ) {

				var price;
				var category;
				var rating;
				var reviews;
				var sold;
				var views;
				var productUrl;
				var productImage;
				var sellerUrl;
				var categoryUrl;
				var sellerlocation;
				var val = products[index];                
				var link = val.url;
				price = "N.A.";
				productImage = val.image_url;
				product_size = products.length;
				
				if (link) {                    
					link = link.trim();
					getInternalProduct(link, {
						price: price,
						productImage: productImage,
						index: index,
						referenceNum: referenceNum,
						product_size: product_size
					});
				}
				//loop
				index++;
				referenceNum++;
				setTimeout(function() {
					eachasyncnext(products, index,referenceNum)
				}, time_delay);
			}
		}
		function eachasync(products, index,referenceNum) {

			if (index > products.length) {
				return false;                

			} else {   
				var title;             
				var price;
				var category;
				var rating;
				var reviews;
				var sold;
				var views;
				var productUrl;
				var productImage;
				var sellerUrl;
				var categoryUrl;
				var sellerlocation;
				var val = products[index];

				title = $(val).find(".product-name, .detail__name, .name").text();
				price = $(val).find(".product-price, .price, .detail__price").text();
				price = price.match(priceRegex) ? price.match(priceRegex)[0] : null;
				if (price) {
					price = price.replace(currencyRegex, ""); //Take it just a number
					price = price.replace(thousandSeparatorRegex, "$1"); //remove any thousand separator
					price = price.replace(",", "."); //Because of Germany and French stores
				} else {
					price = "N.A.";
				}

				productImage = $(val).find(".img-product img, .product-image img, .product-pict img, .image img").attr("src");
				if (!productImage) {
					productImage = null;
				}
				//Internal requests 
				var link = $(val).find("a:not('.hide'):first").attr("href");

				if (link && link.indexOf("http") == -1 && link.indexOf("https") == -1) {
					link = currentBaseUrl + link;
				}
				if (link) {
					link = link.trim();
					getInternalProduct(link, {
						title: title,
						price: price,
						productImage: productImage,
						index: index,
						referenceNum: referenceNum,
						product_size: product_size
					});
				}
				//loop
				index++;
				referenceNum++;
				setTimeout(function() {
					eachasync(products, index,referenceNum)
				}, time_delay);
			}
		}
		//-----------------------------------------------------//
		var mostPopularData = function(searchUrl) {}
		var mostPopularInternalData = function(data) {}
		//-----------------------------------------------------//
		var productPageData = function(searchUrl) {}
		//-----------------------------------------------------//
		var storeFrontPageData = function(result) {}
		var getInternalProduct = function(link, data) {
			var messageObj = null;
			//First Row
			var page_title = $('meta[name=title]').attr('content');
			if (typeof page_title == "undefined") {
				page_title = $('.banner h1').text();
				page_title = page_title + ' | Tokopedia';
			}
			var searchedText = $("section.jsContainer #js-table").attr("data-searchTerm");
			if (searchedText == "") {
				$("section.jsContainer #js-table").attr("data-firstRow", "Product Page: " + page_title);
			}
			if (typeof data.currentProductPage != "undefined") {
				messageObj = {
					action: "makeDataParse",
					htmlPage: $("body").html(),
					passingData: data
				};
			} else {
				messageObj = {
					action: "makeRequest",
					link: link,
					passingData: data
				};
			}
			chrome.runtime.sendMessage(messageObj, function(bgParser) {
				// //Some times it respond with undefined
				if (typeof bgParser == "undefined") {
					getInternalProduct(link, data);
					return true;
				}
				// I need it all times
				price = bgParser.getPrice;
				finalPrice = price != "N.A." ? currentCurrency + " " + parseFloat(price) : "N.A.";
				//I need it all times
				category = bgParser.getCategory.category;
				bbSeller = bgParser.getBbSeller;
				//Global to reach from parser
				productUrl = link;
				productTitle = bgParser.getProductTitle;
				productImage = bgParser.getProductImage;
				sellerUrl = bgParser.getsellerUrl;
				categoryUrl = bgParser.getcategoryUrl;
				rating = bgParser.getRating;
				reviews = bgParser.getReviews;
				sold = bgParser.getSold;
				views = bgParser.getViews;
				sellerlocation = bgParser.getSellerlocation;
				// isNotFound

				// Start render rows on tables
				if(typeof bgParser.isNotFound !="undefined" ){
					renderRow(data,bgParser.isNotFound);
				}
				else{
					renderRow(data,'');
				}
				
			});
		}
		//Get estimated Revenue
		var getEstimatedRevenue = function(salesEq, thePrice) {
			return "N.A.";
		}
		//Start render the row
		var renderRow = function(passingData,isNotFound) {
			
			if ($("#js-table tbody").html() == '') {
				//add table
				var table_html = '';                
				for (var i = 1; i <= passingData.product_size; i++) {
					table_html += "<tr id='" + i + "' class='loading_hide'><td class='js-number'>&nbsp;</td><td class='js-product-name product-image-cell' >&nbsp;</td><td class='js-productUrl hidden hiddenable'>&nbsp;</td><td class='js-price'>&nbsp;</td><td class='js-category screenshot-hiddenable'>&nbsp;</td><td class='js-reviews'>&nbsp;</td><td class='js-sold'>&nbsp;</td><td class='js-views'>&nbsp;</td><td class='js-rating'>&nbsp;</td><td class='js-bb-sellerName'>&nbsp;</td><td class='js-bb-sellerUrl hidden hiddenable'>&nbsp;</td><td class='js-location'>&nbsp;</td><td class='js-productError hidden hiddenable'>&nbsp;</td></tr>";
				}
				//Render the row
				$(table_html).appendTo("#js-table tbody");
			}

			var currentcount = $("#js-table .loaded").length +1;
			//Global variables | 0 in current product page
			var currentRow = "<td class='js-number'>" + (passingData.referenceNum) + "</td>";
			if (typeof passingData != "undefined" && typeof passingData.child != "undefined") {
				var currentRow = "<tr class='child-product' id='" + passingData.referenceNum + "'><td class='js-number'>" + (passingData.referenceNum) + "</td>";
				currentRow += "<td class='js-product-name product-image-cell' data-image='" + productImage + "'><a href='" + productUrl + "' target='_blank'>&#x27a5; &nbsp;" + productTitle + "</a></td>";
				currentRow += "<td class='js-productUrl hidden hiddenable'>" + productUrl + "</td>";
			} else {
				var currentRow = "<tr id='" + passingData.referenceNum + "'><td class='js-number'>" + (passingData.referenceNum) + "</td>";
				currentRow += "<td class='js-product-name product-image-cell' data-image='" + productImage + "'><a href='" + productUrl + "' target='_blank'>" + productTitle + "</a></td>";
				currentRow += "<td class='js-productUrl hidden hiddenable'>" + productUrl + "</td>";
			}
			//finalPrice
			if (finalPrice == "N.A.") {
				currentRow += "<td class='js-price'>" + nonePriceInfo + "</td>";
			} else {
				currentRow += "<td class='js-price'>" + finalPrice + "</td>";
			}
			//category
			if (category == "N.A.") {
				currentRow += "<td class='js-category screenshot-hiddenable'>" + noneCategoryInfo + "</td>";
			} else {
				if (categoryUrl == "") {
					currentRow += "<td class='js-category screenshot-hiddenable' title='" + category + "'>" + category + "</td>";
				} else {
					currentRow += "<td class='js-category screenshot-hiddenable' title='" + category + "'><a href='" + categoryUrl + "'  title='" + category + "' target='_blank'>" + category + "</a></td>";
				}
			}
			if (reviews == "N.A.") {
				currentRow += "<td class='js-reviews'>" + noneReviewsInfo + "</td>";
			} else {
				currentRow += "<td class='js-reviews' title='" + reviews + "'>" + reviews + "</td>";
			}            
			if (sold == "N.A.") {
				currentRow += "<td class='js-sold'>" + noneSoldInfo + "</td>";
			} else {
				currentRow += "<td class='js-sold' title='" + sold + "'>" + sold + "</td>";
			}
			if (views == "N.A.") {
				currentRow += "<td class='js-views'>" + noneViewsInfo + "</td>";
			} else {
				currentRow += "<td class='js-views' title='" + views + "'>" + views + "</td>";
			}
			//rating
			if (rating == "N.A.") {
				currentRow += "<td class='js-rating'>" + noneRatingInfo + "</td>";
			} else {
				currentRow += "<td class='js-rating' title='" + rating + "'>" + rating + "</td>";
			}
			if (bbSeller == "N.A.") {
				currentRow += "<td class='js-bb-sellerName'>" + noneBBSellerInfo + "</td>";
				currentRow += "<td class='js-bb-sellerUrl hidden hiddenable'>N.A.</td>";
			} else {
				if (sellerUrl == "") {
					currentRow += "<td class='js-bb-sellerName' title='" + bbSeller + "'>" + bbSeller + "</td>";
					if(isNotFound==''){
						currentRow += "<td class='js-bb-sellerUrl hidden hiddenable'>N.A.</td>";
					}
					else{
						currentRow += "<td class='js-bb-sellerUrl hidden hiddenable'>&nbsp;</td>";
					}
					
				} else {
					currentRow += "<td class='js-bb-sellerName' title='" + bbSeller + "'><a href='" + sellerUrl + "' target='_blank'>" + bbSeller + "</a></td>";
					currentRow += "<td class='js-bb-sellerUrl hidden hiddenable'>" + sellerUrl + "</td>";
				}
			}
			if (sellerlocation == "N.A.") {
				currentRow += "<td class='js-location'>" + noneSellerlocationInfo + "</td>";
			} else {
				currentRow += "<td class='js-location' title='" + sellerlocation + "'>" + sellerlocation + "</td>";
			}

			if (isNotFound == "") {
				currentRow += "<td class='js-productError hidden hiddenable'>&nbsp;</td>";
			} else {
				currentRow += "<td class='js-productError hidden hiddenable'>" + isNotFound + "</td>";
			}

			currentRow = $(currentRow);
			//Attributes
			currentRow.attr({
				"data-price": finalPrice,
			});
			//Render the row
			$("#js-table tr#" + passingData.referenceNum).html(currentRow.html());
			$("#js-table tr#" + passingData.referenceNum).removeClass("loading_hide");
			$("#js-table tr#" + passingData.referenceNum).addClass("loaded");

			//disable next page
			if($(".loading_hide").length>0){
				$("#extractResults").css("color", "gray");
			}
			else{
				$("#extractResults").css("color", "#044c89");
			}
			renderHeaderBoxes();
			if (state) {
				reInitializeTableSorter(true);
				state.saveCurrentState();
			}

		}
		return {
			getInternalProduct: getInternalProduct,
			searchResultsData: searchResultsData,
			mostPopularData: mostPopularData,
			productPageData: productPageData,
			storeFrontPageData: storeFrontPageData
		}
	}
});