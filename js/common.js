/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 * 
 * Contains the common and pupblic functions to use
 */

//If the file has injected many times
if($(".jsContainer").length >= 1){
   throw new Error("Injected!");
}
//--------------------------------------------------------------------------------//
function updateParameter(uri, key, value) {
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	} else {
		return uri + separator + key + "=" + value;
	}
}
//--------------------------------------------------------------------------------//
function escapeHTML(s) {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}
//--------------------------------------------------------------------------------//
function getParameter(name, url) {
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
	return results ? results[1] : null;
}
//--------------------------------------------------------------------------------//
function getAllParameter(url){
	
        var vars = [], hash;
        var hashes = url.slice(url.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
                hash = hashes[i].split('=');                        
                vars[hash[0]] = hash[1];
        }
        return vars;
}
//--------------------------------------------------------------------------------//
//Show no products screen
function showNoProductsScreen() {
	$("section.jsContainer #js-table").css("display", "none");
	$("section.jsContainer #extractResults").css("display", "none");
	$("section.jsContainer .export-section").css("display", "none");
	$("section.jsContainer #filterPopup").css("display", "none");
	$("section.jsContainer #optionsPage").css("display", "none");
	$("section.jsContainer .main-screen").css("display", "block");
}
//--------------------------------------------------------------------------------//
//Show products screen, that will show the tables and footer section in injected JS popup 
function showProductsScreen() {
	//Show next page
	if($("#js-table").attr("data-extractUrl")){
		$("section.jsContainer #extractResults").text("Extract Next Page");
		$("section.jsContainer #extractResults").fadeIn();
	}else{
		$("section.jsContainer #extractResults").css("display","none");
	}
	
	$("section.jsContainer .main-screen").css("display","none");
	$("section.jsContainer .export-section").fadeIn();
	$("section.jsContainer #js-table").fadeIn();
}
//--------------------------------------------------------------------------------//
//Sort table based on its id
function sortTable(table) {
	var store = [];
	for (var i = 0, len = table.rows.length; i < len; i++) {
		var row = table.rows[i];
		var sortnr = parseInt(row.id);
		if (!isNaN(sortnr)) store.push([sortnr, row]);
	}
	store.sort(function(x, y) {
		return x[0] - y[0];
	});
	for (var i = 0, len = store.length; i < len; i++) {
		$(store[i][1]).find("td:first").text(i + 1);
		$("section.jsContainer #js-table tbody").append($(store[i][1]).get(0));
	}
	store = null;
}
//--------------------------------------------------------------------------------//
//Add comma
function numberWithCommas(x) {
	var parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}
//--------------------------------------------------------------------------------//
//Clean previous data of JS
function cleanJsPopup(){
	$("#js-table tbody tr").remove();
	$(".summary-result.js-avg-price").html("<i class='none-info'>--</i>");
	//$("section.jsContainer #extractResults").html("<i class='none-info'>--</i>");
	reInitializeTableSorter(false);
}
//--------------------------------------------------------------------------------//
//To initial table sorter library
function reInitializeTableSorter(init) {
	$('section.jsContainer #js-table').unbind('appendCache applyWidgetId applyWidgets sorton update updateCell').removeClass('tablesorter').find('thead th').unbind('click mousedown').removeClass('header headerSortDown headerSortUp');
	if (init) {
		$("section.jsContainer #js-table").tablesorter({
			textExtraction: function (node) {
					var txt = $(node).text();
					txt = txt.replace('N.A.', '');
					txt = txt.replace('Rp', '');
					return txt;
				}
			});
		$("section.jsContainer #js-table").trigger("updateAll");
	}
}
//--------------------------------------------------------------------------------//
//Use sync storage
function syncStorage(key, value, callback) {
	var obj = {};
	var key = key;
	obj[key] += key;
	obj[key] = value;
	if(callback){
		chrome.storage.sync.set(obj,function(){
			callback.call(this);
		});
	}else{
		chrome.storage.sync.set(obj);
	}
}
function setWellcomeMsg(){
	chrome.storage.local.get("showWellcom", function(storeResult) {
		//check showWellcom variable
		if(typeof storeResult.showWellcom != "undefined" && storeResult.showWellcom == false){	

			alert(window.location.href);					 		
			//showWellcom 
			$( "body" ).append( "<div id='wellcome-msg'>You have logged in successfully and the tool is ready now to use</div>" );
			setTimeout(function() {
				$("#wellcome-msg").remove();
			}, 5000);
			//update showWellcom value
			chrome.storage.local.set({ 'showWellcom': true });
		}
	})
}
//--------------------------------------------------------------------------------//
//Use local storage
function localStorage(key, value, callback) {
	var obj = {};
	var key = key;
	obj[key] += key;
	obj[key] = value;
	if(callback){
		chrome.storage.local.set(obj,function(){
			callback.call(this);
		});
	}else{
		chrome.storage.local.set(obj);
	}
}
//--------------------------------------------------------------------------------//
//return just any number
function pureNumber(number){
	if(number && typeof number == "string"){
		number = number.match(/[0-9.]/g);
		number = number ? number.join("") : "N.A.";
		return number;
	}else if(typeof number == "number"){
		return number;
	}
	else{
		return "N.A.";
	}
}

function hashCode (str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
//----------------------------------------------------//
//Get average Price
var renderAvgPrice = function(){
	var price = 0;
	var counter = 0;
	$("#js-table td.js-price").each(function(index, val) {
		val = $(val).text().match(/[0-9.]+/);
		val = val ? val[0] : null;
		if(val && !isNaN(val)){
			val = parseFloat(val);
			price = (price + val);
			++counter;
		}
	});

	var avg = price/counter;
	if(!isNaN(avg)){
		avg = numberWithCommas(avg.toFixed(2));
		$(".summary-result.js-avg-price").text(currentCurrency+avg);
		$(".summary-result.js-avg-price").attr("title", currentCurrency+avg);
	}
}
//----------------------------------------------------//
//Get average Reviews
var renderAvgReviews = function(){
	var review = 0;
	var counter = 0;
	$("#js-table td.js-reviews").each(function(index, val) {
		val = $(val).text().match(/[0-9]/g);
		val = val ? val.join("") : null;

		if(val){
			val = parseInt(val);
			review = (review + val);
			++counter;
		}
	});

	var avg = review/counter;
	avg = Math.round(avg.toFixed(2));
	
	if(!isNaN(avg)){
		  avg = numberWithCommas(avg);
		$(".summary-result.js-avg-reviews").text(avg);
		$(".summary-result.js-avg-reviews").attr("title", avg);
	}
}
//Get average Sold
var renderAvgSold = function(){
	var sold = 0;
	var counter = 0;
	$("#js-table td.js-sold").each(function(index, val) {
		val = $(val).text().match(/[0-9]/g);
		val = val ? val.join("") : null;

		if(val){
			val = parseInt(val);
			sold = (sold + val);
			++counter;
		}
	});

	var avg = sold/counter;
	avg = Math.round(avg.toFixed(2));
	
	if(!isNaN(avg)){
		  avg = numberWithCommas(avg);
		$(".summary-result.js-avg-sold").text(avg);
		$(".summary-result.js-avg-sold").attr("title", avg);
	}
}
//Get average Views
var renderAvgViews = function(){
	var views = 0;
	var counter = 0;
	$("#js-table td.js-views").each(function(index, val) {
		val = $(val).text().match(/[0-9]/g);
		val = val ? val.join("") : null;

		if(val){
			val = parseInt(val);
			views = (views + val);
			++counter;
		}
	});

	var avg = views/counter;
	avg = Math.round(avg.toFixed(2));
	
	if(!isNaN(avg)){
		  avg = numberWithCommas(avg);
		$(".summary-result.js-avg-views").text(avg);
		$(".summary-result.js-avg-views").attr("title", avg);
	}
}
//Render all header boxes
var renderHeaderBoxes = function(){
	// alert('123');
	//Current results
	var rowsNumber = $("#js-table tbody tr:visible").length;
	$(".summary-result.js-results").text("1-"+rowsNumber);
	//Get average Sales
	if(rowsNumber > 0){
		//render Avg
		renderAvgPrice();
		renderAvgReviews();
		renderAvgSold();
		renderAvgViews();
	} else{
		cleanHeader();
	}
}

function cleanHeader(){
	$(".summary-result.js-avg-sales").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-sales").attr("title", "");
	$(".summary-result.js-avg-sales-rank").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-sales-rank").attr("title", "");
	$(".summary-result.js-avg-price").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-price").attr("title", "");
	$(".summary-result.js-avg-reviews").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-reviews").attr("title", "");
	$(".summary-result.js-avg-views").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-views").attr("title", "");
	$(".summary-result.js-avg-sold").html("<i class='none-info'>--</i>");
	$(".summary-result.js-avg-sold").attr("title", "");
}

//Convert all paramaters from url to array
function URLParamatersToArray(url) {
	var request = [];
	var pairs = url.substring(url.indexOf('?') + 1).split('&');
	for (var i = 0; i < pairs.length; i++) {
		if(!pairs[i])
			continue;
		var pair = pairs[i].split('=');
		request.push(decodeURIComponent(pair[0]));
	}
	return request;
}

//Responsible to get next pages of Amazon
function Pagination(resultsRow){
	var allResultsNumber = 0;
	var currentPage = 1;
	var nextResult = "N.A.";

	if(resultsRow){
		 //All results number
		allResultsNumber = $(resultsRow).find(".ng-scope.normal:last, span:last").text();
		if(parseInt(allResultsNumber)<=0 ||parseInt(allResultsNumber)!='NaN' ){
			allResultsNumber = $(resultsRow).find("ul li:not(:contains('»')):last").text();
		}
		//Current page
		currentPage = $(resultsRow).find(".ng-scope.active, span.active, li.active").text();
		//Nect Result
		nextResult = $(resultsRow).find(".ng-scope.active, span.active").next().text();
	}

	var getAllResultsNumber = function (){
		return allResultsNumber;
	}
	var getCurrentPage = function(){
		return currentPage;
	}
	var getNextResult = function(){
		return nextResult;
	}

	return{
		getAllResultsNumber:getAllResultsNumber,
		getCurrentPage:getCurrentPage,
		getNextResult:getNextResult
	}
}

//Hide all opened popups, either true or selector string
function hidePopups(hideAll){
	if(typeof hideAll == "boolean"){
		$(".js-product-history-section").css("display","none");
	}else if(typeof hideAll == "string"){
		$(hideAll).css("display","none");
	}
}

// getASINFromURL
function getASINFromURL(productUrl){
	var asin = "N.A.";
	asin = productUrl.match(asinRegex);
	asin = asin ? asin[0].replace(/(dp\/)|(ASIN\/)|(product\/)|(\/)/,"") : null;
	return asin;
}