/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 *
 * JS popup icon beside address bar
 */
 
$(function(){
	var port = null;
  var supportedStores = /(tokopedia.com$)/i;
    function goLogin(msg = null) {

        //close the forgotpass
        chrome.tabs.query({
            url: chrome.extension.getURL("forgotpass.html")
        }, function(tabs) {
            if (tabs.length != 0) {
                chrome.tabs.remove(tabs[0].id);
            }
        });
        
        //Check if the page opened
        chrome.tabs.query({
            url: chrome.extension.getURL("login.html")
        }, function(tabs) {

            if (tabs.length == 0) {
                chrome.tabs.create({
                    url: chrome.extension.getURL("login.html" + (msg == null ? "" : "?msg=" + msg))
                });
                window.close();
                return false;
            } else {
                chrome.tabs.update(tabs[0].id, {
                    highlighted: true
                });
                window.close();
                return false;
            }
        });


    };
    chrome.storage.local.get("authObject", function(storeResult) {
        if (storeResult && storeResult.authObject && storeResult.authObject.username && storeResult.authObject.secret) {
            $(".userinfo .username").text(storeResult.authObject.username);
            chrome.storage.local.get("checked_tokopedia_tool", function(storecheckResult) {
                if (storecheckResult.checked_tokopedia_tool) {
                    startScrapper();
                } else {
                    var checkUrl = 'http://login.justnile.com/check-ajx.php';
                    $.ajax({
                        url: checkUrl,
                        method: "POST",
                        crossDomain: true,
                        data: {
                            username: storeResult.authObject.username,
                            secret: storeResult.authObject.secret,
                            userSecret: storeResult.authObject.userSecret ? storeResult.authObject.userSecret : ''
                        },
                        dataType: "json",
                        success: function(result) {
                            if (result && result.status && result.canUseTool) {
                                // Here we go                                                
                                startScrapper();
                                chrome.storage.local.set({
                                    'checked_tokopedia_tool': true
                                });
                            } else {
                                if (result.message == "user inactive!") {
                                    goLogin();
                                } else {
                                    $('.main-screen').html('<h1>Your account is inactive or not have permission to use this tool!</h1>');
                                }
                            }
                        },
                        error: function(xhr, status, error) {
                            goLogin();
                        }
                    });
                }
            })
        } else {
            goLogin();
        }
    });
    //----------------------------------------------------------------//
    $(".logout").click(function(){
        //update title
        chrome.storage.local.remove('authObject',function(){            
            goLogin();    
        });        
    });

    $(".closeJsPopup").on("click",function() {        
        window.close();
    });

    $(".container").on("mouseenter", ".userPopup", function() {
        $(".userinfo").stop(true,true).delay(100).show(0);
    }).on('mouseleave', '.userPopup', function( event ) {
        $(".userinfo").stop(true,true).delay(500).hide(0);
    });

    //----------------------------------------------------------------//
    function startScrapper() {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            //Check url if it Amazon or not
            var url = tabs[0].url;
            var domainURL = getDomain(url);
            if (supportedStores.test(domainURL)) {
                port = chrome.tabs.connect(tabs[0].id, {
                    name: "jsPopupChannel"
                });
                port.postMessage({
                    url: url,
                    action: "openCloseJsPopup"
                });
                window.close();
                return false;
            }
        });
    }
	//----------------------------------------------------------------//
	function getDomain(url) {
		url = url.replace(/https?:\/\/(www.)?/i, '');
		if (url.indexOf('/') === -1) {
			return url;
		}
		return url.split('/')[0];
	}
});