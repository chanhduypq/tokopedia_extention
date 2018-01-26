/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 *
 * Save the current state of JS
 */

//If the file has injected many times
if($(".jsContainer").length >= 1){
   throw new Error("Injected!");
}

var currentState = function(url){

	var getCurrentAvgSales = function(){
		return $(".summary-result.js-avg-sales").text();
	}
	
	var getCurrentAvgSalesRank = function(){
		return $(".summary-result.js-avg-sales-rank").text();
	}

	var getCurrentAvgPrice = function(){
		return $(".summary-result.js-avg-price").text();
	}

	var getCurrentAvgReviwes = function(){
		return $(".summary-result.js-avg-reviews").text();
	}
	var getCurrentAvgSold = function(){
		return $(".summary-result.js-avg-sold").text();
	}
	var getCurrentAvgViews = function(){
		return $(".summary-result.js-avg-views").text();
	}

	var getCurrentTable = function(){
		return $("section.jsContainer #js-table").html();
	}

	var getCurrentFirstRow = function(){
		return $("section.jsContainer #js-table").attr("data-firstRow");
	}

	var getCurrentExtractElement = function(){
		return {
			dataSection: $("section.jsContainer #extractResults").attr("data-section")
		}
	}

	var getExtractUrl = function(){
		return $("#js-table").attr("data-extractUrl");
	}

	var saveCurrentState = function(){

		var tabKey = "tab_" + md5(url);
		var tabData = JSON.stringify({
					currentUrl: url,
					currentAvgSales:getCurrentAvgSales(),
					currentAvgSalesRank:getCurrentAvgSalesRank(),
					currentAvgPrice:getCurrentAvgPrice(),
					currentAvgReviwes:getCurrentAvgReviwes(),
					currentAvgSold:getCurrentAvgSold(),
					currentAvgViews:getCurrentAvgViews(),
					currentTable:getCurrentTable(),
					currentExtractElement:getCurrentExtractElement(),
					currentExtractUrl:getExtractUrl(),
					currentFirstRow:getCurrentFirstRow(),
					lastScraped:Date.now()
				});

		var setOption = {};
			setOption[tabKey] = tabData;
		chrome.storage.local.set(setOption);
		
	}

	return {
		saveCurrentState:saveCurrentState
	}

}// End currentState Module

