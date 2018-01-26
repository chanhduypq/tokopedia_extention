/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 * 
 * Parse the content of Amazon pages
 */
var Parser = function(data) {
    //Product Title
    var getProductTitle = function() {
        var productTitle = $(data, "body").find(".product-title, h1").text();
        if (productTitle) {
            productTitle = productTitle.trim();
            productTitle = productTitle.length == 0 ? "N.A." : productTitle;
        } else {
            productTitle = "N.A.";
        }
        return productTitle;
    }
    //BB seller
    var getBbSeller = function() {
        var bbSeller = $(data, "body").find("#shop-name-info").text();
        if (bbSeller) {
            bbSeller = bbSeller.trim();
            bbSeller = bbSeller.length == 0 ? "N.A." : bbSeller;
        } else {
            bbSeller = "N.A.";
        }
        return bbSeller;
    }
    //Product seller Url
    var getsellerUrl = function() {
        var sellerUrl = $(data, "body").find("#shop-name-info").attr('href');
        if (sellerUrl) {
            sellerUrl = sellerUrl.trim();
            sellerUrl = sellerUrl.length == 0 ? "" : sellerUrl;
        } else {
            sellerUrl = "";
        }
        return sellerUrl;
    }
    //Product category Url
    var getcategoryUrl = function() {
        var categoryUrl = $(data, "body").find("#breadcrumb-container a:last").attr('href');
        if (categoryUrl) {
            categoryUrl = categoryUrl.trim();
            categoryUrl = categoryUrl.length == 0 ? "" : categoryUrl;
        } else {
            categoryUrl = "";
        }
        return categoryUrl;
    }
    //Get Price
    var getPrice = function(passingData) {
        var price = $(data, "body").find(".product-pricetag").text();
        price = price.match(priceRegex) ? price.match(priceRegex)[0] : "N.A.";
        price = price.replace(currencyRegex, ""); //Take it just a number
        price = price.replace(thousandSeparatorRegex, "$1"); //remove any thousand separator
        price = price.replace(",", "."); //Because of Germany and French stores, the decimal problem
        if (price == "N.A." && typeof passingData != "undefined" && typeof passingData.price != "undefined") {
            price = passingData.price;
        }
        return price;
    }
    //Get Product Image
    var getProductImage = function(passingData) {
        if (passingData != "undefined" && typeof passingData.productImage != "undefined") {
            productImage = passingData.productImage;
        }
        if (!productImage) {
            productImage = null;
        }
        return productImage;
    }
    //Get category
    var getCategory = function() {
        var category = $(data, "body").find("#breadcrumb-container a:last").text();
        if (category) {
            category = category.trim();
            category = category.length == 0 ? "N.A." : category;
        } else {
            category = "N.A.";
        }
        return {
            category: category,
            rank: "N.A."
        };
    }
    //Get rating
    var getRating = function() {
        var rating = $(data, "body").find(".product-reviewsummary-1 .rate-accuracy p.bold").text();
        if (rating) {
            rating = rating.split("/")[0];
            rating = rating.trim();       
            console.log(rating);     
            rating = rating.length == 0 ? "N.A." : rating;
        } else {
            rating = "N.A.";
        }
        return rating;
    }
    //Get Sellerlocation
    var getSellerlocation = function() {
        var sellerlocation = $(data, "body").find('[itemprop=addressLocality]').text();
        if (sellerlocation) {
            sellerlocation = sellerlocation.trim();
            sellerlocation = sellerlocation.length == 0 ? "N.A." : sellerlocation;
        } else {
            sellerlocation = "N.A.";
        }
        return sellerlocation;
    }
    //Get reviews
    var getReviews = function() {
        //var reviews = $(data, "body").find(".product-reviewsummary-1 .rate-accuracy .clear-b span.bold").text();
        var reviews = 0;
        $.each($(data, "body").find(".product-reviewsummary-1 .ratingtotal"), function (index,review) {            
            count = $.trim($(review).text());
            reviews += count*1.0;
        });
        if (reviews) {
            reviews = reviews.length == 0 ? "N.A." : reviews;
        } else {
            reviews = "N.A.";
        }
        return reviews;
    }
    //Get Sold
    var getSold = function() {
//        var product_id = $(data, "body").find("#product-id").attr('value');
        var temp = productImage.split('/');
        var product_id = temp[temp.length - 2];
        var sold = 0;
        if (product_id != '') {
            //get review
            var response = $.ajax({
                type: "GET",
                url: "https://js.tokopedia.com/productstats/check?pid=" + product_id,
                async: false
            }).responseText;
            if (typeof response != "undefined") {
                tmp = response.match(/\(([^)]+)\)/);
                if (!tmp) return 0;
                tmp_sold = JSON.parse(tmp[1]);
                if (typeof tmp_sold.item_sold != "undefined") {
                    sold = tmp_sold.item_sold;
                }
            }
        }
        return sold;
    }
    //Get Views
    var getViews = function() {
//        var product_id = $(data, "body").find("#product-id").attr('value');
        var temp = productImage.split('/');
        var product_id = temp[temp.length - 2];
        var reviews = 0;
        if (product_id != '') {
            //get review
            $.ajax({
                type: "GET",
                url: "https://www.tokopedia.com/provi/check?pid=" + product_id,
                async: false,
                success: function(data, textStatus) {
                    tmp = data.match(/\(([^)]+)\)/);
                    if (!tmp) return 0;
                    tmp_view = JSON.parse(tmp[1]);
                    if (typeof tmp_view.view != "undefined") {
                        reviews = tmp_view.view;
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    reviews = 0;
                }
            });
        }
        return reviews;
    }
    //Return
    return {
        getProductTitle: getProductTitle,
        getBbSeller: getBbSeller,
        getsellerUrl: getsellerUrl,
        getcategoryUrl: getcategoryUrl,
        getPrice: getPrice,
        getProductImage: getProductImage,
        getCategory: getCategory,
        getRating: getRating,
        getSold: getSold,
        getReviews: getReviews,
        getViews: getViews,
        getSellerlocation: getSellerlocation,
    }
}