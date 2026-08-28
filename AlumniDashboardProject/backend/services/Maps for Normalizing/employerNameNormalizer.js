

export const employerAliases = {
    "BAE": [
        "bae",
        "iinternatbaesystems",
        "baesystems",
        "baesystemsinc"
    ],
    "Big-D Construction": [
        "bigdconstruction"
    ],
    "Boeing": [
        "boeing"
    ],
    "Clearlink": [
        "clearlink"
    ],
    "Datafy":
        [
            "datafy"
        ],
    "Davis School District":
        [
            "davisschooldistrict"
        ],

    "Northrop Grumman": [
        "northrup",
        "northrupgrumman",
        "northropgrumman",
        "groman",
        "northropgrummancorporation"
    ],
    "JD Machines": [
        "jdmachines",
        "jdmachine"
    ],
    "Williams International": [
        "williamsinternational",

    ],
    "Davis Tech College": [
        "davistechcollege",
        "davistech",
        "davistechnicalcollege"

    ],
    "Department of Defense": [
        "departmentofdefense",
        "dodairforce",
        "dod",
        "dodcivilianforusaf"
    ],
    "Ford Motor Company": [
        "fordmotorcompany",
        "ford"
    ],
    "Freeus": [
        "freeus"
    ],

    "GoEngineer": [
        "goengineer"
    ],
    "Hill AFB": [
        "hillafb",
        "hillairforce",
        "hillairforcebase",
        "hafb",
        "hill",
        "usafhillafb"

    ],
    "Intermountain Health":
        [
            "intermountainhealth",
            "intermountainhealthcare",
            "intermountaininc"
        ],
    "John Deere": [
        "johndeere"
    ],
    "Lifetime Products": [
        "lifetimeproducts",
        "lifetimeproductsinc"
    ],
    "Marketstar": [
        "marketstar",
        "marketstarcorporation"
    ],
    "Microsoft": [
        "microsoft"
    ],
    "Navitaire": [
        "navitaire"
    ],

    "Autoliv": [
        "autoliv",
        "autolivinc"
    ],
    "America First Credit Union":
        [
            "americafirst",
            "americafirstcreditunion",
            "americafirstcredit",
            "afcu",
            "americafirstcu"
        ],
    "Weber State University":
        [
            "weberstate",
            "weber",
            "wsu",
            "ws",
            "weberstateuniversity",
            "webetstate",
            "weberstate"
        ],
    "Ogden-Weber Technical College":
        [
            "ogdenwebertechnicalcollege",
            "ogdenwebertech",
            "otech",
            "owtc",
            "ogdenwebertechcollege"
        ],
    "NWL Architects": [
        "nwlarchitects"
    ],
    "Parker Hannifin": [
        "parkerhannifin",
        "parkerhanniffin"
    ],
    "PCC Structurals": [
        "pccstructurals",
        "pccogden",
        "pccstructuralsincogden",
        "pccstructuralsogden"
    ],
    "Petersen Inc": [
        "peterseninc"
    ],
    "Pluralsight": [
        "pluralsight"
    ],
    "R&O Construction": [
        "r&oconstruction"
    ],
    "Trace Minerals Research": [
        "tracemineralsresearch",
        "traceminerals"
    ],
    "Tukios": [
        "tukios"
    ],
    "FedEx":
        [
            "fedex",
            "fedexsupplychain"
        ],
    "The Church of Jesus Christ of Latter-day Saints":
        [
            "thechurchofjesuschristoflatterdaysaints",
            "churchofjesuschrist",
            "ldschurch"
        ],
    "United States Airforce":
        [
            "airforce",
            "usairforce",
            "unitedstatesairforce",
            "airforcecivilianservices",
            "usaf"
        ],
    "Starbucks":
        [
            "starbucks",
            "sbux"
        ],
    "Becklar": [
        "becklar"
    ],
    "United Postal Service":
        [
            "unitedstatespostalservice",
            "ups",
            "usps"
        ],
    "Home Depot": [
        "homedepot"
    ],
    "Kroger": [
        "kroger"
    ],
    "Williams International":
        [
            "williams",
            "williaminternational",
            "williamsinternational"
        ],
    "Kihomac": [
        "kihomac"
    ],
    "HP": [
        "hp"
    ],
    "IBM": [
        "ibm"
    ],
    "IRS": [
        "irs"
    ],
    "Mark Ashby": [
        "markashby"
    ],
    "Chromalox": [
        "chromalox"
    ],
    "Whitney Solutions LLC":
        [
            "whitneysolutions",
            "whitneysolutionsllc",
            "whitneyllc"
        ],
    "University of Utah":
        [
            "universityofutah",
            "uofu"
        ],
    "Walmart": [
        "walmart"
    ],
    "Enterprise Mobility":
        [
            "enterprisemobility"
        ],
    "Wayfair": [
        "wayfair"
    ]

};

export default employerAliases;


function clean(str) {
    return str
        .toLowerCase()
        // .replace(/[^\w\s]/g, "")
        // .replace(/-/g, "")
        // .replace(/\s+/g, "")
        .trim();
}

export function normalizeCompanyName(companyName) {
    if (!companyName) return companyName;

    const normalizedInput = clean(companyName);

    for (const [canonicalName, aliases] of Object.entries(employerAliases)) {
        if (
            aliases.some(alias => {
                const normalizedAlias = alias.toLowerCase();

                return (
                    normalizedInput.includes(normalizedAlias) ||
                    normalizedAlias.includes(normalizedInput)
                );
            })
        ) {
            console.log("Found canonical Name: " + canonicalName);
            return canonicalName;
        }
    }

    console.log("raw company name: " + companyName);
    return companyName;
}