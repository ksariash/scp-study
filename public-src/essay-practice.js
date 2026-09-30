(() => {
  'use strict';

  window.ESSAY_PRACTICE_DATA = [
  {
    "id": "nbn-intentional-cooking",
    "title": "נ״ט בר נ״ט — deliberate cooking",
    "prompt": "A parve food is deliberately cooked in a clean meat or dairy vessel with the intention of later adding the opposite type. Discuss the relevant opinions for a ben-yomo vessel and an eino-ben-yomo vessel, and include the dry-food-on-the-opposite-plate application.",
    "facts": [
      {
        "id": "nbn1",
        "label": "Ben-yomo — stricter S”A-track authorities",
        "tokens": [
          [
            "nbn1a",
            "Shach / Ben Ish Chai / Kaf HaChaim"
          ],
          [
            "nbn1b",
            "forbid deliberately creating the weak taste לכתחילה when the vessel is ben-yomo."
          ]
        ]
      },
      {
        "id": "nbn2",
        "label": "Ben-yomo — Rav Ovadya",
        "tokens": [
          [
            "nbn2a",
            "Rav Ovadya"
          ],
          [
            "nbn2b",
            "permits the deliberate ben-yomo case on the lenient S”A track."
          ]
        ]
      },
      {
        "id": "nbn3",
        "label": "Eino-ben-yomo — permissive Ashkenazic authorities",
        "tokens": [
          [
            "nbn3a",
            "Gra / Badei HaShulchan"
          ],
          [
            "nbn3b",
            "permit deliberate cooking in an eino-ben-yomo vessel for the opposite type."
          ]
        ]
      },
      {
        "id": "nbn4",
        "label": "Eino-ben-yomo — stricter Ashkenazic authorities",
        "tokens": [
          [
            "nbn4a",
            "Chochmat Adam / Rav Elyashiv"
          ],
          [
            "nbn4b",
            "forbid it initially, but allow it when no other pot is available."
          ]
        ]
      },
      {
        "id": "nbn5",
        "label": "Dry solid on opposite plate",
        "tokens": [
          [
            "nbn5a",
            "Rav Moshe"
          ],
          [
            "nbn5b",
            "permits לכתחילה placing dry parve food cooked in a ben-yomo meat/dairy vessel on the opposite clean plate."
          ]
        ]
      },
      {
        "id": "nbn6",
        "label": "Dry solid dissent",
        "tokens": [
          [
            "nbn6a",
            "Pri Megadim"
          ],
          [
            "nbn6b",
            "dissents from the taught lenient dry-plate application."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nbnd1",
        "permits deliberate ben-yomo cooking לכתחילה."
      ],
      [
        "nbnd2",
        "permits only when the pot is ben-yomo."
      ],
      [
        "nbnd3",
        "says the resulting food becomes intrinsic בשר בחלב."
      ]
    ],
    "modelAnswer": "For a ben-yomo vessel, Shach, Ben Ish Chai, and Kaf HaChaim forbid deliberately creating the weak taste in order to add the opposite type, while Rav Ovadya permits on the lenient S”A track. For an eino-ben-yomo vessel, Gra and Badei HaShulchan permit; Chochmat Adam and Rav Elyashiv initially forbid but allow when no other pot is available. Rav Moshe permits the taught dry-plate application לכתחילה, with a Pri Megadim dissent."
  },
  {
    "id": "nbn-model-failures",
    "title": "נ״ט בר נ״ט — when the model may fail",
    "prompt": "When does a transfer qualify as נ״ט בר נ״ט? Discuss the dispute over food-to-food transfer and the case where the original source and recipient are still cooking together.",
    "facts": [
      {
        "id": "nbf1",
        "label": "Food → food → vessel — strict",
        "tokens": [
          [
            "nbf1a",
            "Pri Megadim / Aruch HaShulchan"
          ],
          [
            "nbf1b",
            "do not count the first food-to-food transfer as נ״ט בר נ״ט."
          ]
        ]
      },
      {
        "id": "nbf2",
        "label": "Food → food → vessel — lenient",
        "tokens": [
          [
            "nbf2a",
            "Pnei Aryeh / Rav Ovadya"
          ],
          [
            "nbf2b",
            "do count it as a valid weakened transfer."
          ]
        ]
      },
      {
        "id": "nbf3",
        "label": "Food → food → vessel — intermediate",
        "tokens": [
          [
            "nbf3a",
            "Chavot Da’at / Yad Yehuda"
          ],
          [
            "nbf3b",
            "take intermediate positions between the strict and lenient food-to-food approaches."
          ]
        ]
      },
      {
        "id": "nbf4",
        "label": "Ongoing connection — strict",
        "tokens": [
          [
            "nbf4a",
            "Chavot Da’at"
          ],
          [
            "nbf4b",
            "says it is not yet נ״ט בר נ״ט while the source and recipient are still cooking together."
          ]
        ]
      },
      {
        "id": "nbf5",
        "label": "Ongoing connection — lenient",
        "tokens": [
          [
            "nbf5a",
            "Beit Ephraim"
          ],
          [
            "nbf5b",
            "says it can be נ״ט בר נ״ט despite the continuing cooking connection."
          ]
        ]
      },
      {
        "id": "nbf6",
        "label": "Practical reliance",
        "tokens": [
          [
            "nbf6a",
            "Ashkenazic practice"
          ],
          [
            "nbf6b",
            "is initially cautious, but can rely on Beit Ephraim בדיעבד or for significant loss."
          ]
        ]
      },
      {
        "id": "nbf7",
        "label": "Rav Ovadya on ongoing connection",
        "tokens": [
          [
            "nbf7a",
            "Rav Ovadya"
          ],
          [
            "nbf7b",
            "follows the lenient view on the ongoing-connection dispute."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nbfd1",
        "requires the first weakened transfer to enter a כלי."
      ],
      [
        "nbfd2",
        "counts every food-to-food transfer automatically as נ״ט בר נ״ט."
      ],
      [
        "nbfd3",
        "follows Chavot Da’at on the ongoing-connection dispute."
      ]
    ],
    "modelAnswer": "Pri Megadim and Aruch HaShulchan do not count the first food-to-food transfer as נ״ט בר נ״ט; Pnei Aryeh and Rav Ovadya do, while Chavot Da’at and Yad Yehuda are intermediate. For an ongoing cooking connection, Chavot Da’at says the weakening has not yet occurred, Beit Ephraim says it can, Ashkenazic practice can rely on Beit Ephraim בדיעבד or for significant loss, and Rav Ovadya follows the lenient view."
  },
  {
    "id": "fish-meat-bitul",
    "title": "Fish and meat — bitul and סכנה",
    "prompt": "Fish accidentally became mixed with meat. Discuss whether bitul applies to a סכנה mixture and what additional grounds for leniency the course gives when there is no ששים.",
    "facts": [
      {
        "id": "fmb1",
        "label": "Bitul — Maharil",
        "tokens": [
          [
            "fmb1a",
            "Maharil"
          ],
          [
            "fmb1b",
            "says bitul does not apply to a סכנה mixture."
          ]
        ]
      },
      {
        "id": "fmb2",
        "label": "Bitul — Issur VeHeiter",
        "tokens": [
          [
            "fmb2a",
            "Issur VeHeiter"
          ],
          [
            "fmb2b",
            "permits bitul; the practical custom in the course follows the lenient view."
          ]
        ]
      },
      {
        "id": "fmb3",
        "label": "Accidental rabbinic mixture — S”A",
        "tokens": [
          [
            "fmb3a",
            "S”A"
          ],
          [
            "fmb3b",
            "permits adding היתר to an accidental rabbinic mixture."
          ]
        ]
      },
      {
        "id": "fmb4",
        "label": "אין מבטלין route",
        "tokens": [
          [
            "fmb4a",
            "Pitchei Teshuvah"
          ],
          [
            "fmb4b",
            "argues that אין מבטלין איסור לכתחילה may not govern a סכנה case."
          ]
        ]
      },
      {
        "id": "fmb5",
        "label": "Changed danger route",
        "tokens": [
          [
            "fmb5a",
            "Magen Avraham"
          ],
          [
            "fmb5b",
            "questions whether the danger applies today, providing another possible tziruf."
          ]
        ]
      },
      {
        "id": "fmb6",
        "label": "Extension to actual mixture",
        "tokens": [
          [
            "fmb6a",
            "Divrei Malkiel"
          ],
          [
            "fmb6b",
            "can extend the changed-danger consideration even to an actual mixture."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "fmbd1",
        "permits the סכנה mixture whenever there is ששים."
      ],
      [
        "fmbd2",
        "says סכנה always follows the ordinary rule of אין מבטלין איסור לכתחילה."
      ],
      [
        "fmbd3",
        "requires immediate kashering of every vessel involved in the mixture."
      ]
    ],
    "modelAnswer": "Maharil says bitul does not apply to סכנה, while Issur VeHeiter permits and the course follows the lenient practical custom. Without ששים after an accidental mixture, S”A’s rule allowing added היתר to an accidental rabbinic mixture, Pitchei Teshuvah’s question whether אין מבטלין governs סכנה, Magen Avraham’s question whether the danger applies today, and Divrei Malkiel’s extension to actual mixture are distinct possible tzirufim."
  },
  {
    "id": "dish-transfer",
    "title": "Dish transfer — simultaneous vessels, עירוי, and a continuous stream",
    "prompt": "Discuss the main disputes governing meat/dairy taste transfer in hot water: simultaneous clean ben-yomo vessels, עירוי onto dirty opposite dishes, and a continuous stream of hot parve soup into a cold opposite-type bowl.",
    "facts": [
      {
        "id": "dt1",
        "label": "Simultaneous clean ben-yomo vessels — S”A",
        "tokens": [
          [
            "dt1a",
            "S”A"
          ],
          [
            "dt1b",
            "permits clean ben-yomo meat and dairy vessels together in hot parve water."
          ]
        ]
      },
      {
        "id": "dt2",
        "label": "Simultaneous clean ben-yomo vessels — Rama",
        "tokens": [
          [
            "dt2a",
            "Rama"
          ],
          [
            "dt2b",
            "forbids that simultaneous ben-yomo-vessel case because the connected tastes meet too directly."
          ]
        ]
      },
      {
        "id": "dt3",
        "label": "עירוי — Rama",
        "tokens": [
          [
            "dt3a",
            "Rama"
          ],
          [
            "dt3b",
            "permits עירוי כלי ראשון onto dirty meat and dairy dishes."
          ]
        ]
      },
      {
        "id": "dt4",
        "label": "עירוי — Shach",
        "tokens": [
          [
            "dt4a",
            "Shach"
          ],
          [
            "dt4b",
            "forbids that עירוי because it can transfer כדי קליפה."
          ]
        ]
      },
      {
        "id": "dt5",
        "label": "Continuous stream — Rama",
        "tokens": [
          [
            "dt5a",
            "Rama"
          ],
          [
            "dt5b",
            "forbids the cold opposite-type bowl when hot parve soup pours continuously from a ben-yomo meat pot."
          ]
        ]
      },
      {
        "id": "dt6",
        "label": "Continuous stream — Shach",
        "tokens": [
          [
            "dt6a",
            "Shach"
          ],
          [
            "dt6b",
            "permits the bowl because the stream is already counted as נ״ט בר נ״ט."
          ]
        ]
      },
      {
        "id": "dt7",
        "label": "Piped hot water",
        "tokens": [
          [
            "dt7a",
            "Ohr L’Tzion"
          ],
          [
            "dt7b",
            "treats travel through pipes as weakening the water to כלי שני."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "dtd1",
        "forbids the simultaneous clean-vessel case whenever both vessels are ben-yomo."
      ],
      [
        "dtd2",
        "permits עירוי because it cannot transfer even a surface layer."
      ],
      [
        "dtd3",
        "permits the continuous-stream bowl because תתאה גבר ends every connection to the source."
      ]
    ],
    "modelAnswer": "S”A permits simultaneous clean ben-yomo meat and dairy vessels in hot parve water, while Rama forbids. For עירוי onto dirty opposite dishes, Rama permits and Shach forbids because עירוי can transfer כדי קליפה. For a continuous hot parve stream from a ben-yomo meat pot into a cold dairy bowl, Rama forbids the bowl while Shach permits it as נ״ט בר נ״ט. Ohr L’Tzion supplies an additional sink leniency by treating travel through pipes as weakening to כלי שני."
  },
  {
    "id": "soap-dishwasher",
    "title": "Soap and dishwashers",
    "prompt": "May one dishwasher be used sequentially for meat and dairy? Discuss the role of soap as פוגם, the major permissive opinions, and the concern raised by modern filters.",
    "facts": [
      {
        "id": "sd1",
        "label": "Soap — concern",
        "tokens": [
          [
            "sd1a",
            "Piskei Uteshuvot"
          ],
          [
            "sd1b",
            "raises a concern whether ordinary dish soap is sufficiently פוגם."
          ]
        ]
      },
      {
        "id": "sd2",
        "label": "Soap — practical course approach",
        "tokens": [
          [
            "sd2a",
            "Chazon Ish / Rav Forst"
          ],
          [
            "sd2b",
            "give substantial weight to ordinary dish soap as פוגם."
          ]
        ]
      },
      {
        "id": "sd3",
        "label": "Dishwasher — separate racks",
        "tokens": [
          [
            "sd3a",
            "Rav Moshe"
          ],
          [
            "sd3b",
            "permits sequential meat/dairy dishwasher use with separate racks."
          ]
        ]
      },
      {
        "id": "sd4",
        "label": "Dishwasher — same racks",
        "tokens": [
          [
            "sd4a",
            "Rav Shmuel Tuvia Stern"
          ],
          [
            "sd4b",
            "permits sequential meat/dairy dishwasher use even with the same racks."
          ]
        ]
      },
      {
        "id": "sd5",
        "label": "Dishwasher — cold initial rinse",
        "tokens": [
          [
            "sd5a",
            "Rav Ovadya"
          ],
          [
            "sd5b",
            "permits meat/dairy dishwasher use when the initial rinse is cold, more broadly than Ashkenazic practice."
          ]
        ]
      },
      {
        "id": "sd6",
        "label": "Dishwasher — modern filter concern",
        "tokens": [
          [
            "sd6a",
            "Agurah B’Ohalecha"
          ],
          [
            "sd6b",
            "argues that modern filters can undermine the older dishwasher analysis."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sdd1",
        "requires the same rack to be used for meat and dairy."
      ],
      [
        "sdd2",
        "permits the dishwasher only when the initial rinse is hot."
      ],
      [
        "sdd3",
        "holds that soap can never make the transferred taste פגום."
      ]
    ],
    "modelAnswer": "Piskei Uteshuvot raises a concern whether ordinary soap is sufficiently פוגם; Chazon Ish and Rav Forst give it substantial weight. Rav Moshe permits sequential use with separate racks, Rav Shmuel Tuvia Stern permits even with the same racks, and Rav Ovadya permits when the initial rinse is cold. Agurah B’Ohalecha cautions that modern filters can undermine older dishwasher analysis."
  },
  {
    "id": "stam-benefit",
    "title": "סתם יינם — why benefit was prohibited and the modern-non-Jew dispute",
    "prompt": "Why is benefit from סתם יינם prohibited, and how do the major opinions treat benefit today when ordinary non-Jews are not assumed to make wine libations? Include the practical S”A/Rama framework.",
    "facts": [
      {
        "id": "syb1",
        "label": "Benefit rationale — Beit Yosef",
        "tokens": [
          [
            "syb1a",
            "Beit Yosef"
          ],
          [
            "syb1b",
            "explains that Chazal modeled סתם יינם on יין נסך."
          ]
        ]
      },
      {
        "id": "syb2",
        "label": "Benefit rationale — Ran",
        "tokens": [
          [
            "syb2a",
            "Ran"
          ],
          [
            "syb2b",
            "explains that the benefit ban prevents people from benefiting from actual יין נסך."
          ]
        ]
      },
      {
        "id": "syb3",
        "label": "Benefit rationale — Rashba",
        "tokens": [
          [
            "syb3a",
            "Rashba"
          ],
          [
            "syb3b",
            "explains that drinking was prohibited first and benefit was added later when people became lax around libation wine."
          ]
        ]
      },
      {
        "id": "syb4",
        "label": "Modern non-Jews — Rashi/Geonim",
        "tokens": [
          [
            "syb4a",
            "Rashi / Geonim"
          ],
          [
            "syb4b",
            "permit benefit today from both non-Jewish wine and Jewish wine touched by a non-Jew, while drinking remains prohibited."
          ]
        ]
      },
      {
        "id": "syb5",
        "label": "Modern non-Jews — Rosh",
        "tokens": [
          [
            "syb5a",
            "Rosh"
          ],
          [
            "syb5b",
            "keeps benefit from the non-Jew’s own wine prohibited, but permits benefit from Jewish wine touched by the non-Jew."
          ]
        ]
      },
      {
        "id": "syb6",
        "label": "Modern non-Jews — Rambam",
        "tokens": [
          [
            "syb6a",
            "Rambam"
          ],
          [
            "syb6b",
            "keeps benefit prohibited in both categories."
          ]
        ]
      },
      {
        "id": "syb7",
        "label": "Practical psak — S”A",
        "tokens": [
          [
            "syb7a",
            "S”A"
          ],
          [
            "syb7b",
            "follows Rambam as the formal baseline."
          ]
        ]
      },
      {
        "id": "syb8",
        "label": "Practical psak — Rama",
        "tokens": [
          [
            "syb8a",
            "Rama"
          ],
          [
            "syb8b",
            "allows reliance on the Geonic/Rashi leniency בדיעבד or for loss, but not as a routine profit model."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sybd1",
        "permits benefit from all non-Jewish wine today."
      ],
      [
        "sybd2",
        "permits benefit whenever the toucher does not practice wine libation."
      ],
      [
        "sybd3",
        "allows a routine business to be built around the benefit leniency."
      ]
    ],
    "modelAnswer": "Beit Yosef explains the benefit ban by modeling סתם יינם on יין נסך; Ran connects it to preventing benefit from actual יין נסך; Rashba describes a later benefit decree after the original drinking decree. Rashi and the Geonim permit benefit today while drinking remains prohibited; Rosh distinguishes the non-Jew’s own wine from Jewish wine touched by a non-Jew; Rambam keeps benefit prohibited in both. S”A follows Rambam, while Rama allows Geonic/Rashi reliance בדיעבד or for loss."
  },
  {
    "id": "mevushal-pasteurization",
    "title": "מבושל — ownership and pasteurization",
    "prompt": "A non-Jew owns kosher mevushal wine, and another case involves modern pasteurization of kosher wine. Discuss the major opinions on whether מבושל protects the wine in each situation.",
    "facts": [
      {
        "id": "mp1",
        "label": "Non-Jew owns mevushal — permissive line",
        "tokens": [
          [
            "mp1a",
            "Rosh / Ritva / Ramban"
          ],
          [
            "mp1b",
            "permit non-Jewish ownership of kosher mevushal wine on the “not ordinary wine” logic."
          ]
        ]
      },
      {
        "id": "mp2",
        "label": "Non-Jew owns mevushal — stringent analysis",
        "tokens": [
          [
            "mp2a",
            "R. Akiva Eiger"
          ],
          [
            "mp2b",
            "keeps the non-Jew-owned wine decree in his analysis."
          ]
        ]
      },
      {
        "id": "mp3",
        "label": "Practical reading",
        "tokens": [
          [
            "mp3a",
            "S”A / Taz"
          ],
          [
            "mp3b",
            "are read in the notes practically toward permission in the non-Jew-owned mevushal case."
          ]
        ]
      },
      {
        "id": "mp4",
        "label": "Pasteurization — evaporation focus",
        "tokens": [
          [
            "mp4a",
            "Shach / Ran / Rashba"
          ],
          [
            "mp4b",
            "focus on heating with some evaporation as the classical cooking marker."
          ]
        ]
      },
      {
        "id": "mp5",
        "label": "Pasteurization — yad soledet",
        "tokens": [
          [
            "mp5a",
            "Rav Moshe / Rav Ovadya"
          ],
          [
            "mp5b",
            "accept יד סולדת בו as sufficient for the taught modern threshold."
          ]
        ]
      },
      {
        "id": "mp6",
        "label": "Pasteurization — stronger change",
        "tokens": [
          [
            "mp6a",
            "R. Shlomo Zalman and others"
          ],
          [
            "mp6b",
            "require a more meaningful cooking/evaporation change for modern pasteurization."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "mpd1",
        "holds that cooking can purify wine that was already prohibited."
      ],
      [
        "mpd2",
        "requires visible boiling in every pasteurization case."
      ],
      [
        "mpd3",
        "prohibit non-Jewish ownership because ownership turns the wine back into ordinary non-mevushal wine."
      ]
    ],
    "modelAnswer": "Rosh, Ritva, and Ramban permit non-Jewish ownership of kosher mevushal wine on the “not ordinary wine” logic; R. Akiva Eiger’s analysis keeps the ownership decree, while the notes read S”A/Taz practically toward permission. On pasteurization, Shach, Ran, and Rashba emphasize heating with some evaporation; Rav Moshe and Rav Ovadya accept יד סולדת בו; R. Shlomo Zalman and others require a more meaningful cooking/evaporation change."
  },
  {
    "id": "sherry-casks",
    "title": "Sherry-cask whisky",
    "prompt": "A whisky is aged in a sherry cask. Discuss the major reasons to prohibit or permit it, including the amount needed for bitul, whether the sherry contributes positive flavor, and the issue of אין מבטלין איסור לכתחילה.",
    "facts": [
      {
        "id": "sc1",
        "label": "Quantity — Shach",
        "tokens": [
          [
            "sc1a",
            "Shach"
          ],
          [
            "sc1b",
            "can require ששים against the absorbed wine / barrel thickness."
          ]
        ]
      },
      {
        "id": "sc2",
        "label": "Quantity — S”A/Taz",
        "tokens": [
          [
            "sc2a",
            "S”A / Taz"
          ],
          [
            "sc2b",
            "use a 1:6 measure against כדי קליפה."
          ]
        ]
      },
      {
        "id": "sc3",
        "label": "Flavor — Rav Moshe",
        "tokens": [
          [
            "sc3a",
            "Rav Moshe"
          ],
          [
            "sc3b",
            "characterizes the remnant as weakened קיוהא rather than meaningful positive wine flavor."
          ]
        ]
      },
      {
        "id": "sc4",
        "label": "Flavor — Mishna Halachot",
        "tokens": [
          [
            "sc4a",
            "Mishna Halachot"
          ],
          [
            "sc4b",
            "frames the sherry as preventing bad oak flavor rather than adding a tasted wine flavor."
          ]
        ]
      },
      {
        "id": "sc5",
        "label": "Deliberate bitul — non-Jewish manufacture",
        "tokens": [
          [
            "sc5a",
            "One route in the notes/key"
          ],
          [
            "sc5b",
            "relies on manufacture for non-Jews to address אין מבטלין איסור לכתחילה."
          ]
        ]
      },
      {
        "id": "sc6",
        "label": "Deliberate bitul — Rav Moshe",
        "tokens": [
          [
            "sc6a",
            "Rav Moshe"
          ],
          [
            "sc6b",
            "limits the deliberate-bitul rule for a rabbinic prohibition that no longer has a practical biblical libation root."
          ]
        ]
      },
      {
        "id": "sc7",
        "label": "Second-fill casks",
        "tokens": [
          [
            "sc7a",
            "Second-fill casks"
          ],
          [
            "sc7b",
            "have substantially more room for leniency because the retained taste is older and weaker."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "scd1",
        "uses the 1:6 כדי קליפה measure as the only bitul rule."
      ],
      [
        "scd2",
        "says the sherry is added specifically to contribute a tasted wine flavor."
      ],
      [
        "scd3",
        "treats first-fill and second-fill casks identically."
      ]
    ],
    "modelAnswer": "Shach can require ששים against the absorbed wine/barrel thickness; S”A and Taz use a 1:6 measure against כדי קליפה. Rav Moshe describes the remnant as weakened קיוהא, while Mishna Halachot says the sherry prevents bad oak flavor rather than adding tasted wine flavor. For אין מבטלין איסור לכתחילה, the notes/key give a manufacture-for-non-Jews route and Rav Moshe’s limitation for a rabbinic prohibition without a practical biblical libation root. Second-fill casks have more room because the retained taste is older/weaker."
  },
  {
    "id": "social-drinking-business",
    "title": "Social drinking — beer, business drinks, and coffee",
    "prompt": "A Jew is invited to have drinks with non-Jews in several settings: ordinary beer, a business drink at a non-Jewish bar, and coffee at a coffee shop. Discuss the relevant opinions and distinctions.",
    "facts": [
      {
        "id": "sdb1",
        "label": "Ordinary beer — Rama",
        "tokens": [
          [
            "sdb1a",
            "Rama"
          ],
          [
            "sdb1b",
            "limits the beer decree so ordinary grain beer is not included."
          ]
        ]
      },
      {
        "id": "sdb2",
        "label": "Ordinary beer — Gra",
        "tokens": [
          [
            "sdb2a",
            "Gra"
          ],
          [
            "sdb2b",
            "rejects that narrowing of the beer decree."
          ]
        ]
      },
      {
        "id": "sdb3",
        "label": "Non-fixed drinking factors",
        "tokens": [
          [
            "sdb3a",
            "Kaf HaChaim / Pri Chadash"
          ],
          [
            "sdb3b",
            "stress both sporadic place and infrequency in the non-fixed permissive case."
          ]
        ]
      },
      {
        "id": "sdb4",
        "label": "Business drink — baseline",
        "tokens": [
          [
            "sdb4a",
            "S”A / Gra"
          ],
          [
            "sdb4b",
            "prohibit a business drink in a non-Jewish bar as the baseline."
          ]
        ]
      },
      {
        "id": "sdb5",
        "label": "Business drink — איבה",
        "tokens": [
          [
            "sdb5a",
            "Rav Moshe"
          ],
          [
            "sdb5b",
            "allows room for a business drink where refusal would create איבה."
          ]
        ]
      },
      {
        "id": "sdb6",
        "label": "Business drink — caution",
        "tokens": [
          [
            "sdb6a",
            "Ohr L’Tzion"
          ],
          [
            "sdb6b",
            "remains cautious about the business-drink case."
          ]
        ]
      },
      {
        "id": "sdb7",
        "label": "Coffee shop — stricter views",
        "tokens": [
          [
            "sdb7a",
            "Gra / Panim Meirot"
          ],
          [
            "sdb7b",
            "are stricter about prestigious non-alcoholic social drinking such as a coffee shop."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sdbd1",
        "includes every ordinary grain beer in the social-drinking decree."
      ],
      [
        "sdbd2",
        "permits every business drink in a non-Jewish bar without qualification."
      ],
      [
        "sdbd3",
        "treats איבה as an automatic permission for a business drink."
      ]
    ],
    "modelAnswer": "Rama limits the beer decree so ordinary grain beer is outside it; Gra rejects that narrowing. Kaf HaChaim and Pri Chadash stress sporadic place and infrequency in the non-fixed case. For a business drink, S”A/Gra prohibit as the baseline, Rav Moshe allows room where refusal creates איבה, and Ohr L’Tzion remains cautious. Gra and Panim Meirot are among the stricter views on prestigious coffee-shop social drinking."
  },
  {
    "id": "social-drinking-weddings",
    "title": "Social drinking — weddings and family celebrations",
    "prompt": "A Jew is invited to non-Jewish celebrations. Discuss the rules for drinking at a non-Jewish party or wedding, the role of איבה, and the special discussions of a Muslim wedding and a ger attending a family celebration.",
    "facts": [
      {
        "id": "sdw1",
        "label": "Non-Jewish party",
        "tokens": [
          [
            "sdw1a",
            "Rambam"
          ],
          [
            "sdw1b",
            "forbids drinking even one’s own kosher/mevushal wine at a non-Jewish party."
          ]
        ]
      },
      {
        "id": "sdw2",
        "label": "Wedding — S”A",
        "tokens": [
          [
            "sdw2a",
            "S”A"
          ],
          [
            "sdw2b",
            "has an especially strong rule against eating or drinking at a non-Jewish wedding feast."
          ]
        ]
      },
      {
        "id": "sdw3",
        "label": "Wedding — Taz",
        "tokens": [
          [
            "sdw3a",
            "Taz"
          ],
          [
            "sdw3b",
            "rejects a general איבה waiver for the wedding prohibition."
          ]
        ]
      },
      {
        "id": "sdw4",
        "label": "Wedding — Shach",
        "tokens": [
          [
            "sdw4a",
            "Shach"
          ],
          [
            "sdw4b",
            "records possible room in an איבה case rather than a categorical permission."
          ]
        ]
      },
      {
        "id": "sdw5",
        "label": "Muslim wedding",
        "tokens": [
          [
            "sdw5a",
            "Rav Ovadya"
          ],
          [
            "sdw5b",
            "permits a Muslim wedding because the idolatry dimension differs."
          ]
        ]
      },
      {
        "id": "sdw6",
        "label": "Muslim wedding — social concern",
        "tokens": [
          [
            "sdw6a",
            "Darchei Teshuva"
          ],
          [
            "sdw6b",
            "still invokes the intermarriage/social concern despite the different idolatry dimension."
          ]
        ]
      },
      {
        "id": "sdw7",
        "label": "Ger family celebration",
        "tokens": [
          [
            "sdw7a",
            "Shav V’Rafah"
          ],
          [
            "sdw7b",
            "permits a ger’s family celebration in its circumstances."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sdwd1",
        "creates a blanket איבה permission for non-Jewish weddings."
      ],
      [
        "sdwd2",
        "prohibits Muslim weddings because they are treated exactly like idolatrous celebrations."
      ],
      [
        "sdwd3",
        "permits one’s own mevushal wine at a non-Jewish party."
      ]
    ],
    "modelAnswer": "Rambam forbids drinking even one’s own kosher/mevushal wine at a non-Jewish party; S”A’s wedding rule is especially strong. Taz rejects a general איבה waiver, while Shach records possible room rather than a categorical permission. Rav Ovadya permits a Muslim wedding because the idolatry dimension differs; Darchei Teshuva still invokes intermarriage/social concern; Shav V’Rafah permits a ger’s family celebration in its circumstances."
  },
  {
    "id": "wine-touch-actors",
    "title": "Who can prohibit Jewish wine?",
    "prompt": "How does the identity of the person touching Jewish wine affect the ruling? Discuss the course’s treatment of modern non-Jews, Muslims—including doubtful touch—and a public Shabbat desecrator.",
    "facts": [
      {
        "id": "wta1",
        "label": "Today’s non-Jews — Rama",
        "tokens": [
          [
            "wta1a",
            "Rama"
          ],
          [
            "wta1b",
            "can downgrade some touch results because non-Jews today are treated as non-libaters in this framework."
          ]
        ]
      },
      {
        "id": "wta2",
        "label": "Today’s non-Jews — Shach",
        "tokens": [
          [
            "wta2a",
            "Shach"
          ],
          [
            "wta2b",
            "often limits practical reliance on that downgrade, especially to a case of loss."
          ]
        ]
      },
      {
        "id": "wta3",
        "label": "Muslim baseline",
        "tokens": [
          [
            "wta3a",
            "Muslim touch"
          ],
          [
            "wta3b",
            "creates a drinking concern while benefit remains permitted because the libation concern is lower."
          ]
        ]
      },
      {
        "id": "wta4",
        "label": "Doubtful Muslim touch",
        "tokens": [
          [
            "wta4a",
            "Rav Ovadya"
          ],
          [
            "wta4b",
            "permits drinking in a doubtful Muslim-touch case."
          ]
        ]
      },
      {
        "id": "wta5",
        "label": "Public Shabbat desecrator",
        "tokens": [
          [
            "wta5a",
            "Public Shabbat desecrator"
          ],
          [
            "wta5b",
            "can forbid the touched wine to drink while benefit remains permitted."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "wtad1",
        "treats the Rama’s modern-non-Jew downgrade as an automatic לכתחילה rule."
      ],
      [
        "wtad2",
        "says doubtful Muslim touch always forbids benefit."
      ],
      [
        "wtad3",
        "makes benefit from the touched wine prohibited in every case."
      ]
    ],
    "modelAnswer": "Rama’s “non-Jews today” approach can downgrade some touch results; Shach often limits reliance especially to loss. Muslim touch retains a drinking concern but permits benefit, and Rav Ovadya permits drinking in doubtful Muslim-touch cases. The course separately teaches that wine touched by a public Shabbat desecrator can be forbidden to drink while benefit remains permitted."
  },
  {
    "id": "wine-contact-actions",
    "title": "What act of contact forbids the wine?",
    "prompt": "A non-Jew or nonreligious Jew handles Jewish wine in several ways: pouring, accidental touch, shaking an open bottle, or deliberately pouring the wine. Discuss the major opinions and practical qualifications for each act.",
    "facts": [
      {
        "id": "wca1",
        "label": "Pouring — S”A",
        "tokens": [
          [
            "wca1a",
            "S”A"
          ],
          [
            "wca1b",
            "prohibits drinking but permits benefit for pouring without full shaking."
          ]
        ]
      },
      {
        "id": "wca2",
        "label": "Pouring — Rama",
        "tokens": [
          [
            "wca2a",
            "Rama"
          ],
          [
            "wca2b",
            "can permit drinking after pouring under the today’s-non-Jew downgrade."
          ]
        ]
      },
      {
        "id": "wca3",
        "label": "Pouring — Shach",
        "tokens": [
          [
            "wca3a",
            "Shach"
          ],
          [
            "wca3b",
            "says practical reliance on that pouring downgrade is especially for a case of loss."
          ]
        ]
      },
      {
        "id": "wca4",
        "label": "Accidental touch — S”A",
        "tokens": [
          [
            "wca4a",
            "S”A"
          ],
          [
            "wca4b",
            "prohibits drinking but permits benefit after accidental touch."
          ]
        ]
      },
      {
        "id": "wca5",
        "label": "Accidental touch — Rama/Shach",
        "tokens": [
          [
            "wca5a",
            "Rama / Shach"
          ],
          [
            "wca5b",
            "Rama can permit accidental touch by today’s non-Jews, while Shach is more cautious without a case of loss."
          ]
        ]
      },
      {
        "id": "wca6",
        "label": "Shake open bottle",
        "tokens": [
          [
            "wca6a",
            "S”A / Rama"
          ],
          [
            "wca6b",
            "S”A prohibits drinking and benefit after an open bottle is shaken without lifting, while Rama permits on his downgrade."
          ]
        ]
      },
      {
        "id": "wca7",
        "label": "Muslim deliberate pour",
        "tokens": [
          [
            "wca7a",
            "Rav Ovadya"
          ],
          [
            "wca7b",
            "still forbids drinking after a Muslim’s deliberate pour."
          ]
        ]
      },
      {
        "id": "wca8",
        "label": "Nonreligious Jew deliberate pour",
        "tokens": [
          [
            "wca8a",
            "Rav Elyashiv"
          ],
          [
            "wca8b",
            "treats a nonreligious Jew’s deliberate pour as significant because pouring can function like shaking."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "wcad1",
        "permits drinking after every accidental touch."
      ],
      [
        "wcad2",
        "treats a Muslim’s deliberate pour as harmless."
      ],
      [
        "wcad3",
        "treats pouring as irrelevant unless the bottle is separately shaken."
      ]
    ],
    "modelAnswer": "For pouring without full shaking, S”A prohibits drinking but permits benefit; Rama’s downgrade can permit drinking, with Shach emphasizing reliance especially for loss. S”A similarly prohibits drinking after accidental touch while permitting benefit; Rama can be more lenient for today’s non-Jews, with Shach more cautious without loss. On shaking an open bottle, S”A prohibits drinking and benefit while Rama permits on his downgrade. Rav Ovadya still forbids drinking after a Muslim’s deliberate pour, and Rav Elyashiv treats a nonreligious Jew’s pour as significant because pouring can function like shaking."
  },
  {
    "id": "nitzok",
    "title": "נצוק — the stream connection",
    "prompt": "Kosher wine is poured in a continuous stream into prohibited wine or prohibited residue. Discuss whether נצוק connects the source to the receiving wine, the significant-loss rule, and how mevushal status or ששים may affect the case.",
    "facts": [
      {
        "id": "nz1",
        "label": "Connection view",
        "tokens": [
          [
            "nz1a",
            "Rashi / Rav Chisda"
          ],
          [
            "nz1b",
            "treat the continuous stream as a halachic connection, so the source can be affected."
          ]
        ]
      },
      {
        "id": "nz2",
        "label": "Non-connection view",
        "tokens": [
          [
            "nz2a",
            "Rabbeinu Tam"
          ],
          [
            "nz2b",
            "does not treat נצוק as connecting the source for this prohibition."
          ]
        ]
      },
      {
        "id": "nz3",
        "label": "Significant loss",
        "tokens": [
          [
            "nz3a",
            "S”A / Rama"
          ],
          [
            "nz3b",
            "allow reliance on the non-connection view in a genuine significant-loss case."
          ]
        ]
      },
      {
        "id": "nz4",
        "label": "Mevushal source limitation",
        "tokens": [
          [
            "nz4a",
            "Mevushal source wine"
          ],
          [
            "nz4b",
            "can still face a נצוק problem when poured into already-forbidden non-mevushal residue."
          ]
        ]
      },
      {
        "id": "nz5",
        "label": "Bitul route",
        "tokens": [
          [
            "nz5a",
            "ששים in the source against the residue"
          ],
          [
            "nz5b",
            "can provide a bitul route, but deliberately creating the ratio can raise אין מבטלין איסור לכתחילה."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nzd1",
        "holds that the stream always transfers prohibition upward into the source."
      ],
      [
        "nzd2",
        "require the connection view even in a genuine significant-loss case."
      ],
      [
        "nzd3",
        "automatically purifies forbidden residue in the receiving cup."
      ]
    ],
    "modelAnswer": "Rashi and Rav Chisda treat נצוק as a connection, while Rabbeinu Tam does not. S”A and Rama allow reliance on the non-connection view in genuine significant loss. A mevushal source can still face the issue when poured into already-forbidden non-mevushal residue; sufficient ששים can provide a bitul route, though deliberately creating the ratio raises אין מבטלין איסור לכתחילה."
  },
  {
    "id": "unattended-wine",
    "title": "Wine left with a non-Jew",
    "prompt": "Jewish wine is left with a non-Jew. Explain the rules for open wine left with an idolater or Muslim, when יוצא ונכנס works, and what kinds of seals or other protections can preserve the wine.",
    "facts": [
      {
        "id": "uw1",
        "label": "Open wine with idolater",
        "tokens": [
          [
            "uw1a",
            "S”A"
          ],
          [
            "uw1b",
            "prohibits immediately when open wine is left alone with an idolater and the access conditions are met."
          ]
        ]
      },
      {
        "id": "uw2",
        "label": "Open wine with Muslim",
        "tokens": [
          [
            "uw2a",
            "Course rule for a Muslim"
          ],
          [
            "uw2b",
            "prohibits open wine after enough time to walk a mil."
          ]
        ]
      },
      {
        "id": "uw3",
        "label": "Muslim — Shach qualification",
        "tokens": [
          [
            "uw3a",
            "Shach"
          ],
          [
            "uw3b",
            "can be stricter where drinking itself is the concern."
          ]
        ]
      },
      {
        "id": "uw4",
        "label": "יוצא ונכנס",
        "tokens": [
          [
            "uw4a",
            "יוצא ונכנס"
          ],
          [
            "uw4b",
            "works when the non-Jew does not know a meaningful absence window, cannot see the Jew approaching, and the area is not locked against return."
          ]
        ]
      },
      {
        "id": "uw5",
        "label": "Fixed schedule",
        "tokens": [
          [
            "uw5a",
            "A fixed weekly run / known schedule"
          ],
          [
            "uw5b",
            "undermines יוצא ונכנס because predictability removes the deterrent."
          ]
        ]
      },
      {
        "id": "uw6",
        "label": "Protective options",
        "tokens": [
          [
            "uw6a",
            "Protective options"
          ],
          [
            "uw6b",
            "include double seals, effective locking/combination closures, monitored cameras, or hidden wine when they create tamper evidence or credible fear of being caught."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "uwd1",
        "always gives a Muslim a longer unattended period than the time to walk a mil."
      ],
      [
        "uwd2",
        "works best when the non-Jew knows the Jew’s exact return schedule."
      ],
      [
        "uwd3",
        "requires enough tamper time before open wine can ever become prohibited."
      ]
    ],
    "modelAnswer": "S”A prohibits open wine immediately when it is left alone with an idolater under the access conditions. For a Muslim, the course rule uses enough time to walk a mil, though Shach can be stricter where drinking itself is the concern. יוצא ונכנס depends on unpredictability of return and lack of visual/locking barriers; a fixed known schedule undermines it. Effective seals or other protections must create tamper evidence or credible fear of being caught."
  }
];
})();
