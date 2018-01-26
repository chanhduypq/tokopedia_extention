/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 *
 * The background of the extension
 */

lastXMLRequests = [];
documentsList = [];
successAjaxRequests = 0;
numberOfAjaxRequests = 0;
$.ajaxSetup({
	timeout: 60000,
	error: function(jqXHR, textStatus, errorThrown) {
		stopAllAjaxRequests();
	}
});

//All supported stores
var supportedStoresList = ["*://www.tokopedia.com/*"];
//Connection between injected scripts and background to make requests to Amazon
tokopediaProductsPorts = [];
chrome.runtime.onConnect.addListener(function(port) { 
	chrome.storage.local.remove("checked_tokopedia_tool");	
	if(port.name == "tokopediaProductsPort"){
		tokopediaProductsPorts.push(port);
		port.onDisconnect.addListener(function(port) { 
			$.each(tokopediaProductsPorts, function(index, deletePort) {
				if(port == deletePort){
					tokopediaProductsPorts.splice(index, 1);
				}
			});
		});
	} else if(port.name == "newPermissionRequested"){
		//On the popup is closed, refresh amazon pages
		port.onDisconnect.addListener(function(port) { 
			refreshTokopediaPages();
		});
	}
});

//When the ajax is stopped, let injected scripts know about that
$(document).ajaxStop(function() {
	setTimeout(function(){

		if(tokopediaProductsPorts.length > 0 && successAjaxRequests == numberOfAjaxRequests){
			$.each(tokopediaProductsPorts, function(index, port){
				port.postMessage({action: "ajaxStopped"});
			});
			$.each(documentsList, function(index, neededDocument){
				neededDocument.remove();
			});
			lastXMLRequests = [];
			documentsList = [];
			successAjaxRequests = 0;
			numberOfAjaxRequests = 0;
		}
	}, 1500);
});

//Auto check the lastScraped URL every ten minutes
setInterval(checkLastScraped,600000);

// Refresh Amazon pages on new versions available
chrome.runtime.onInstalled.addListener(function(details){
	 if(details.reason == "update" || details.reason == "install"){
		//Refresh Amazon pages
		refreshTokopediaPages();
	}
});

// Waiting a message to refresh all Tokopedia pages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action == "refreshTokopediaPages"){
		//Refresh Amazon pages
		refreshTokopediaPages();
	} else if(request.action == "makeRequest" && typeof request.link != "undefined"){
		++numberOfAjaxRequests;
		
		//setTimeout
		var XMLRequest = $.ajax({
			type: "GET",
			timeout:8000,
			url: request.link,
			success: function(data, textStatus) {

				//Product data
				++successAjaxRequests;				
				var myHTML = insertDocument(data);
				var parser = new Parser(myHTML);		
				sendResponse({
					data: data,
					getProductTitle: parser.getProductTitle(), 
					getProductImage: parser.getProductImage(request.passingData),
					getPrice: parser.getPrice(request.passingData),
					getCategory: parser.getCategory(),
					getBbSeller: parser.getBbSeller(),
					getsellerUrl: parser.getsellerUrl(),
					getcategoryUrl: parser.getcategoryUrl(),
					getReviews: toInt(parser.getReviews()),
					getSold: toInt(parser.getSold()),
					getViews: toInt(parser.getViews()),
					getRating: toInt(parser.getRating()),
					getSellerlocation: parser.getSellerlocation()
				});
			}, 
			error: function(jqXHR, textStatus, errorThrown){

				if(jqXHR.status==404){

					sendResponse({
							data: jqXHR,
							getProductTitle: request.passingData.title,
							getProductImage: request.passingData.productImage,
							getPrice: request.passingData.price,
							getCategory: { category: "" },
							getBbSeller: "",
							getsellerUrl: "",
							getcategoryUrl: "",
							getReviews: 0,
							getSold: 0,
							getViews: 0,
							getRating: 0,
							getSellerlocation: "",
							isNotFound: "Page not found"
					});
				}
				else if(numberOfAjaxRequests > 0){
					--numberOfAjaxRequests;
				}
			}
		});
		
		
		lastXMLRequests.push(XMLRequest);
		//Async
		return true;
	}
	else if(request.action == "makeRequestNextPage" && typeof request.link != "undefined"){
		++numberOfAjaxRequests;
		var XMLRequest = $.ajax({
			type: "GET",
			dataType : 'json',
			url: request.link,
			success: function(data, textStatus) {
				console.log(data);
				//Product data
				++successAjaxRequests;
				sendResponse(data);
			}, 
			error: function(jqXHR, textStatus, errorThrown){
				if(numberOfAjaxRequests > 0){
					--numberOfAjaxRequests;
				}
			}
		});
		lastXMLRequests.push(XMLRequest);
		//Async
		return true;
	}
	else if(request.action == "stopAllAjaxRequests"){
		stopAllAjaxRequests();
	} else if(request.action == "makeDataParse" && typeof request.htmlPage != "undefined"){ 
		var myHTML = request.htmlPage;
		myHTML = insertDocument(myHTML);
		var parser = new Parser(myHTML);
		sendResponse({
			getProductTitle: parser.getProductTitle(), 
			getProductImage: parser.getProductImage(request.passingData),
			getPrice: parser.getPrice(request.passingData),
			getCategory: parser.getCategory(),
			getBbSeller: parser.getBbSeller(),
			getsellerUrl: parser.getsellerUrl(),
			getcategoryUrl: parser.getcategoryUrl(),
			getReviews: toInt(parser.getReviews()),
			getSold: toInt(parser.getSold()),
			getViews: toInt(parser.getViews()),
			getRating: toInt(parser.getRating()),
			getSellerlocation: parser.getSellerlocation()
		});
	}
	// else if(request.action == "resetTitle"){
	// 	// chrome.browserAction.setTitle( {title: "Tokopedia plugin"});
	// }
});

//Remove last scraped data
function checkLastScraped(){

	chrome.storage.local.get(null, function(result) {
		for (key in result) {
			if (key.indexOf("tab_") >= 0) {
				//remove data after 12*60*60*1000 milisecond
				if( (Date.now() - JSON.parse(result[key]).lastScraped) > (12*60*60*1000) ){
					chrome.storage.local.remove(key);
				}
			}
		}
	});
}

//Get the time of last scraped data
function TimeLeft(lastScraped) {
	
	var now = new Date();    
	var lastScrapedTime = new Date(lastScraped);
	var getDiffInMins = function() {
		return (now - lastScrapedTime) / 1000 / 60;
	};
	var getDiffMins = function() {
		return Math.round(getDiffInMins() % 60);
	};
	return {
		getDiffMins: getDiffMins

	};
}

//Refresh All Amazon Pages
function refreshTokopediaPages(){
	chrome.tabs.query({ url: supportedStoresList}, function(tabs){	
		for(var i = 0; i < tabs.length; i++)
		{	
			chrome.tabs.reload(tabs[i].id);
		}
	});
}

//Stop all AjaxRequests that generated to Amazon products pages
function stopAllAjaxRequests(){
	if(lastXMLRequests.length > 0){
		$(lastXMLRequests).each(function(index, ajax) {
			ajax.abort();
			lastXMLRequests.splice(index, 1);
		});
		
		lastXMLRequests = [];
		successAjaxRequests = 0;
		numberOfAjaxRequests = 0;
	}
}

// insertDocument
function insertDocument (myHTML) {
	var newHTMLDocument = document.implementation.createHTMLDocument().body;
	newHTMLDocument.innerHTML = myHTML;
	[].forEach.call(newHTMLDocument.querySelectorAll("script, style, img:not(#landingImage):not(#imgBlkFront):not(#main-image)"), function(el) {el.remove(); });
	documentsList.push(newHTMLDocument);
	return $(newHTMLDocument.innerHTML);
}
function toInt(value){
	if(isNaN(value))
		return 0
	else
		return value
}