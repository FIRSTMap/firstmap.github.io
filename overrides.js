/*****************************************
 * Team Level Overrides - LOGO / POS
 *
 * LOGOS: Add your image to /logos with
 * the file name "{team_number}.png" and
 * then add your team number to the icons
 * array below.
 *
 * POSITION: Add your team's lattitude
 * and longitude to the updatedLocations
 * array below, following the documented
 * syntax.
 ****************************************/

// icons array - Add your team number here to pull your team's marker from /logos instead of using the default FIRST marker
var icons = [
    16,
    171,
    236,
    330,
    457,
    525,
    548,
    967,
    1058,
    1108,
    1360,
    1418,
    1452,
    1540,
    1741,
    1982,
    2158,
    2370,
    2403,
    2412,
    2626,
    2713,
    2827,
    2851,
    2855,
    2848,
    3015,
    3223,
    3680,
    3928,
    3946,
    4150,
    4201,
    4646,
    4909,
    4924,
    5041,
    5113,
    5115,
    5431,
    5482,
    5587,
    5837,
    5859,
    5881,
    5938,
    6164,
    6412,
    6419,
    6467,
    6630,
    7308,

    // Scraped images
    4,
    25,
    33,
    34,
    41,
    66,
    67,
    68,
    69,
    71,
    73,
    74,
    133,
    168,
    171,
    199,
    228,
    303,
    316,
    321,
    401,
    418,
    476,
    509,
    527,
    540,
    619,
    640,
    701,
    830,
    836,
    967,
    968,
    1024,
    1185,
    1222,
    1262,
    1263,
    1277,
    1288,
    1298,
    1334,
    1389,
    1422,
    1425,
    1429,
    1502,
    1597,
    1692,
    1712,
    1730,
    1766,
    1768,
    1778,
    1923,
    1939,
    1967,
    1977,
    1999,
    2096,
    2135,
    2335,
    2363,
    2374,
    2408,
    2410,
    2451,
    2456,
    2506,
    2529,
    2605,
    2626,
    2630,
    2704,
    2723,
    2805,
    2823,
    2846,
    2853,
    2883,
    2903,
    2905,
    2916,
    2945,
    2984,
    2993,
    3005,
    3023,
    3128,
    3129,
    3130,
    3158,
    3196,
    3208,
    3260,
    3322,
    3417,
    3459,
    3489,
    3572,
    3735,
    3756,
    3770,
    3824,
    3847,
    3946,
    4003,
    4085,
    4121,
    4159,
    4180,
    4207,
    4213,
    4248,
    4276,
    4308,
    4458,
    4468,
    4481,
    4499,
    4518,
    4586,
    4622,
    4646,
    4678,
    4828,
    4930,
    4961,
    4990,
    5030,
    5099,
    5232,
    5410,
    5412,
    5477,
    5494,
    5502,
    5514,
    5526,
    5528,
    5553,
    5582,
    5625,
    5667,
    5700,
    5818,
    5822,
    5877,
    5924,
    5966,
    5973,
    5990,
    6063,
    6064,
    6325,
    6331
]

// updatedLocations Array.  Add your team's lat and lng to this array to modify the exact position of your team's marker.
/* Data Structure
    team_number: {
        lat: latitude,
        lng: longitude
    }

    All values should be numerical values, not strings.
 */
var updatedLocations = {
    330: {
        lat: 33.87253,
        lng: -118.395732
    },
    364: {
        lat: 30.3897667,
        lng: -89.0436744
    },
    456: {
        lat: 32.3257,
        lng: -90.9553
    },
    457: {
        lat: 29.34927,
        lng: -98.54999
    },
    590: {
        lat: 32.7809,
        lng: -89.228
    },
    653: {
        lat: 29.473216,
        lng: -98.506603
    },
    1421: {
        lat: 30.6252185,
        lng: -89.6565752
    },
    1540: {
        lat: 45.511433,
        lng: -122.769145
    },
    1741: {
        lat: 39.573578,
        lng: -86.191377
    },
    1818: {
        lat: 32.4089,
        lng: -93.8193
    },
    1912: {
        lat: 30.2715933,
        lng: -89.7455335
    },
    1920: {
        lat: 29.9419,
        lng: -90.114
    },
    1927: {
        lat: 30.552632,
        lng: -89.0239767
    },
    1982: {
        lat: 39.006258,
        lng: -94.732603
    },
    2078: {
        lat: 30.4675,
        lng: -90.1053
    },
    2080: {
        lat: 30.5172157,
        lng: -90.3809465
    },
    2158: {
        lat: 30.375667,
        lng: -97.752778
    },
    2183: {
        lat: 29.8891,
        lng: -90.4083
    },
    2190: {
        lat: 31.3515155,
        lng: -89.2072034
    },
    2221: {
        lat: 30.4068,
        lng: -90.0407
    },
    2403: {
        lat: 33.434551,
        lng: -111.672356
    },
    2410: {
        lat: 38.856385,
        lng: -94.672073
    },
    2626: {
        lat: 45.40345,
        lng: -71.894242
    },
    2851: {
        lat: 42.577834,
        lng: -82.99828500000001
    },
    2930: {
        lat: 47.868753,
        lng: -122.133521
    },
    2969: {
        lat: 29.426705,
        lng: -98.398804
    },
    2992: {
        lat: 30.3813461,
        lng: -90.1028666
    },
    3039: {
        lat: 29.9657,
        lng: -90.3839029
    },
    3223: {
        lat: 47.651672,
        lng: -122.698748
    },
    3240: {
        lat: 29.419972,
        lng: -98.638665
    },
    3337: {
        lat: 30.3742,
        lng: -91.0136
    },
    3345: {
        lat: 29.459931,
        lng: -98.489966
    },
    3468: {
        lat: 32.5109,
        lng: -92.1421
    },
    3481: {
        lat: 29.565468,
        lng: -98.645434
    },
    3561: {
        lat: 29.497299,
        lng: -98.723462
    },
    3572: {
        lat: 43.185072,
        lng: -86.272554
    },
    3606: {
        lat: 30.4407,
        lng: -91.1589
    },
    3616: {
        lat: 30.1567,
        lng: -92.035
    },
    3666: {
        lat: 31.2944,
        lng: -92.4582
    },
    3753: {
        lat: 30.3994,
        lng: -91.0514
    },
    3946: {
        lat: 30.2917489,
        lng: -89.7735559
    },
    3991: {
        lat: 30.4227,
        lng: -91.0351
    },
    4053: {
        lat: 30.101,
        lng: -91.0028
    },
    4087: {
        lat: 30.0248,
        lng: -90.0677
    },
    4107: {
        lat: 30.4349106,
        lng: -89.1967398
    },
    4201: {
        lat: 33.917085,
        lng: -118.3840815
    },
    4209: {
        lat: 30.4054359,
        lng: -91.153174
    },
    4309: {
        lat: 47.884388,
        lng: -121.863099
    },
    4316: {
        lat: 29.6931,
        lng: -90.5588
    },
    4336: {
        lat: 30.2045,
        lng: -92.0933
    },
    4353: {
        lat: 30.2482,
        lng: -91.9921
    },
    4512: {
        lat: 47.924402,
        lng: -122.222745
    },
    4681: {
        lat: 47.880796,
        lng: -122.178467
    },
    4805: {
        lat: 29.9255,
        lng: -90.1046
    },
    4915: {
        lat: 47.636593,
        lng: -122.524264
    },
    4978: {
        lat: 30.3831,
        lng: -91.0875
    },
    5168: {
        lat: 29.9685,
        lng: -90.0927
    },
    5241: {
        lat: 29.522215,
        lng: -98.529021
    },
    5325: {
        lat: 29.8829956,
        lng: -90.1317362
    },
    5572: {
        lat: 29.505621,
        lng: -98.516428
    },
    5681: {
        lat: 29.308076,
        lng: -98.666819
    },
    5785: {
        lat: 30.4369,
        lng: -91.159
    },
    5863: {
        lat: 30.393,
        lng: -91.2407
    },
    5864: {
        lat: 30.4599,
        lng: -91.2583
    },
    5881: {
        lat: 42.6918615,
        lng: -73.8357275
    },
    5938: {
        lat: 39.15819444,
        lng: -75.524405556
    },
    5953: {
        lat: 30.0001456,
        lng: -90.1606626
    },
    5965: {
        lat: 29.8927735,
        lng: -90.108323
    },
    5971: {
        lat: 29.99,
        lng: -90.1615
    },
    5986: {
        lat: 29.436584,
        lng: -98.486877
    },
    5997: {
        lat: 30.2605,
        lng: -91.104573
    },
    6068: {
        lat: 33.4427,
        lng: -90.6441
    },
    6103: {
        lat: 30.2619,
        lng: -91.2534
    },
    6155: {
        lat: 29.458398,
        lng: -98.534685
    },
    6489: {
        lat: 30.6520,
        lng: -91.1609
    },
    6677: {
        lat: 30.3610,
        lng: -88.5478
    },
    6923: {
        lat: 30.8262,
        lng: -91.3835
    },
    7049: {
        lat: 32.495,
        lng: -93.7107
    },
    7094: {
        lat: 30.3079,
        lng: -89.3282
    },
    7308: {
        lat: 37.363,
        lng: -122.095
    }
}
