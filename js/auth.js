$(function() {
    //---------------------------------------------------------------------------------//
    //Google Analytics
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-98168130-3']);
    _gaq.push(['_trackPageview', 'login.js']);
    (function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();
    //---------------------------------------------------------------------------------//
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    var todayDate = month + "-" + day + "-" + year;
    var msg = GetURLParameter('msg');
    var loginUrl = 'http://login.justnile.com/login-ajx.php';
    var resetpassUrl = 'http://login.justnile.com/resetpass-ajx.php';
    var appSecret = 'pNzJVyDJv2HoIrdyKyaj';
    if (msg) {
        $(".message").removeClass("error success info");
        $(".message").addClass("error");
        $(".message").text(msg);
        $(".message").fadeIn();
        return false;
    }
    $("body").on("click", "#submit", function(e) {
        e.preventDefault();
        $(".message").removeClass("error success info");
        $(".message").addClass("info");
        $(".message").text("Checking...");
        $(".message").fadeIn("fast");
        var username = $("#username").val();
        var password = $("#password").val();
        username = username ? username.trim() : null;
        password = password ? password.trim() : null;
        if (!username || !password) {
            $(".message").removeClass("error success info");
            $(".message").addClass("error");
            $(".message").text("Please check username and password!");
            $(".message").fadeIn();
            return false;
        }
        $.ajax({
            url: loginUrl,
            method: "POST",
            crossDomain: true,
            data: {
                username: username,
                password: password
            },
            dataType: "json",
            success: function(result) {
                $(".message").removeClass("error success info");
                if (result && result.status) {
                    $(".message").addClass("success");
                    $(".message").text('Successfully logged in!');
                    var authObject = {
                        'username': result.username,
                        'userSecret': result.userSecret ? result.userSecret : null,
                        'secret': appSecret
                    }
                    chrome.storage.local.set({
                        'authObject': authObject
                    });
                    //Close current page
                    setTimeout(function() {
                        window.close();
                    }, 000);
                    2
                } else if (result && !result.status) {
                    $(".message").addClass("error");
                    $(".message").text(result.message);
                }
                $(".message").fadeIn();
            },
            error: function(xhr, status, error) {
                console.log(status);
                console.log(error);
                console.log(xhr);
                $(".message").removeClass("error success info");
                $(".message").addClass("error");
                $(".message").text("Something went wrong, please try again later 222.");
                $(".message").fadeIn();
            }
        });
    });
    $("body").on("click", "#submitResetPass", function(e) {
        e.preventDefault();
        $(".message").removeClass("error success info");
        $(".message").addClass("info");
        $(".message").text("Checking...");
        $(".message").fadeIn("fast");
        var username = $("#username").val();
        username = username ? username.trim() : null;
        if (!username) {
            $(".message").removeClass("error success info");
            $(".message").addClass("error");
            $(".message").text("Please enter your email!");
            $(".message").fadeIn();
            return false;
        }
        $.ajax({
            url: resetpassUrl,
            method: "POST",
            crossDomain: true,
            data: {
                usermail: username,
                appSecret: appSecret
            },
            dataType: "json",
            success: function(result) {
                $(".message").removeClass("error success info");
                if (result && result.status) {
                    $(".message").addClass("success");
                    $(".message").text(result.message);
                } else if (result && !result.status) {
                    $(".message").addClass("error");
                    $(".message").text(result.message);
                }
                $(".message").fadeIn();
            },
            error: function(xhr, status, error) {
                console.log(status);
                console.log(error);
                console.log(xhr);
                $(".message").removeClass("error success info");
                $(".message").addClass("error");
                $(".message").text("Something went wrong, please try again later 222.");
                $(".message").fadeIn();
            }
        });
    });
    //---------------------------------------------------------------------------------//
    $("body").on("keypress", "input[name='username'], input[name='password']", function(e) {
        var key = e.which;
        if (key == 13) // the enter key code
        {
            $("#submit").click();
            return false;
        }
    });
});
//---------------------------------------------------------------------------------//
function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}