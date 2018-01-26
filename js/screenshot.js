/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 * 
 * show/share/save the last screenshot
 */

$(function(){
	//----------------------------------------------------------------------------//
	//Get current saved screenshot
	chrome.storage.local.get(["last_screenshot"],function(result){ 
		if(typeof result.last_screenshot != "undefined"){
			var finalCanvasScreen = document.createElement("canvas");
			var finalCanvasScreenContext = finalCanvasScreen.getContext("2d");

			//Drow screenshot
			var finalScreenshot = new Image();
			finalScreenshot.onload = function(){
				finalCanvasScreen.width = finalScreenshot.width - 10;
				finalCanvasScreen.height = finalScreenshot.height + 30;
				finalCanvasScreenContext.fillStyle = "#FAFAFA";
				finalCanvasScreenContext.fillRect(0,0,finalScreenshot.width - 10,finalScreenshot.height + 30);
				finalCanvasScreenContext.drawImage(finalScreenshot, 0, 0);

				//Drow stroke
				finalCanvasScreenContext.strokeStyle = "#CFCFCF";
			    finalCanvasScreenContext.lineWidth   = 1;
			    finalCanvasScreenContext.strokeRect(0,0, finalScreenshot.width - 10,finalScreenshot.height);
			    finalCanvasScreenContext.strokeRect(0,0, finalScreenshot.width - 10,finalScreenshot.height+30);

			    wmark.init({
					"position": "center",
					"opacity": 20,
					"className": "watermark",
					"path": "../images/js-logo-full.png"
				});
				
			    //Underneath text
				finalCanvasScreenContext.fillStyle="#595959";
				finalCanvasScreenContext.font="bold 13px sans-serif";
				finalCanvasScreenContext.fillText("Data Collected with Tokopedia Scrapper. Ready to make tokopedia product research easy? ", (finalScreenshot.width-800)/2, finalScreenshot.height + 20);

				$(".screenshot-image img").attr("src",finalCanvasScreen.toDataURL());
			}//If image loaded
			finalScreenshot.src = result.last_screenshot;
		}else{
			window.close();
		}
	});
	//----------------------------------------------------------------------------//
	//Download btn event
	$("body").on("click","#jsScreenshotDownloadBtn",function(e){
		var downloadedImage = $(".screenshot-image img").attr("src");
		if(downloadedImage){
			var downloadedImage = downloadedImage.replace("image/jpg","image/octet-stream");
			$(this).attr("download", "Tokopedia-screenshot.jpg");
			$(this).attr("href",downloadedImage);
		}
	});
	//----------------------------------------------------------------------------//
	//Close btn event
	$("body").on("click","#jsScreenshotCloseBtn",function(e){
		e.preventDefault();
		chrome.storage.local.remove("last_screenshot");
		window.close();
	});
	//----------------------------------------------------------------------------//
	//Facebook share buttons
	$("#facebookShare").on("click",function(e){
		e.preventDefault();
		window.open("https://www.facebook.com");
    });
	//Twitter share buttons
	$("#twitterShare").on("click",function(e){
		e.preventDefault();
        window.open("https://twitter.com");
    });
	//Google+ share buttons
	$("#googlePlusShare").on("click",function(e){
		e.preventDefault();
        window.open("https://plus.google.com");
    });
});
 