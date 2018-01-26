/**
 * @Author: Tung Mai
 * Copyright © 2017 Tokopedia Scrapper
 *
 * This file contains on all regexs patterns
*/

//If the file has injected many times
if($(".jsContainer").length >= 1){
   throw new Error("Injected!");
}

mostPopularRegex = /(best\-?sellers)|(new\-?releases)|(movers\-?and\-?shakers)|(top\-?rated)|(most\-?wished\-?for)|(most\-?gifted)/i;
bestSellerRegx = /(best\-?sellers)/i;
newReleasesRegx = /(new\-?releases)/i;
moversAndShakersRegx = /(movers\-?and\-?shakers)/i;
topRatedRegx = /(top\-?rated)/i;
mostWishesRegx = /(most\-?wished\-?for)/i;
mostGiftedRegx = /(most\-?gifted)/i;
priceRegex = /(\$|\€|\£|\₹\s?|CDN\$\s|EUR\s)?[0-9,.]+/i;
currencyRegex = /(\$|\€|\£|\₹\s?|CDN\$\s|EUR\s)/i;
asinRegex = /(dp|product|asin)?\/[0-9A-Z]{10,}/;
generalSearchRegex = /(field\-keywords)/i;
thousandSeparatorRegex = /(\d+)[\,\.](?=\d{3}(\D|$))/g;//Get thousand separator on Germany and French Store