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
            "forbid לכתחילה deliberately cooking parve food in a ben-yomo meat or dairy vessel when the plan is to add the opposite type."
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
            "permits לכתחילה deliberately cooking parve food in a ben-yomo meat or dairy vessel when the plan is to add the opposite type."
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
            "permit לכתחילה deliberately cooking parve food in an eino-ben-yomo meat or dairy vessel for later use with the opposite type."
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
            "forbid deliberately cooking parve food in an eino-ben-yomo meat or dairy vessel for the opposite type, but allow it when no other pot is available."
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
            "permits לכתחילה placing dry parve food cooked in a ben-yomo meat or dairy vessel onto a clean plate of the opposite type."
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
            "forbids the taught dry-plate application that Rav Moshe permits."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nbn-safe-1",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
      ],
      [
        "nbn-safe-2",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
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
            "do not treat the first food-to-food transfer as a valid נ״ט בר נ״ט transfer."
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
            "do treat the first food-to-food transfer as a valid weakened transfer for נ״ט בר נ״ט."
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
            "take intermediate positions on whether a food-to-food transfer counts as נ״ט בר נ״ט."
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
            "holds that נ״ט בר נ״ט has not yet occurred while the original source and recipient are still cooking together."
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
            "holds that נ״ט בר נ״ט can apply even while the original source and recipient remain connected through cooking."
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
            "is initially cautious when the source and recipient are still cooking together, but can rely on Beit Ephraim בדיעבד or for significant loss."
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
            "follows the lenient position that נ״ט בר נ״ט can apply even while the original source and recipient remain connected through cooking."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nbf-safe-1",
        "Modern dishwasher filters can undermine assumptions used in older dishwasher leniencies."
      ],
      [
        "nbf-safe-2",
        "A Muslim wedding has a different idolatry dimension from a classic idolatrous celebration."
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
            "holds that ordinary bitul does not apply to a fish-and-meat סכנה mixture."
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
            "permits bitul for a fish-and-meat סכנה mixture; the practical course custom follows this lenient approach."
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
            "permits adding היתר to an accidentally created rabbinic mixture."
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
            "argues that אין מבטלין איסור לכתחילה may not govern a סכנה mixture in the ordinary way."
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
            "questions whether the fish-and-meat danger applies today, creating an additional possible tziruf."
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
            "extends the changed-danger consideration even to a case in which fish and meat actually became mixed."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "fmb-safe-1",
        "Hot water that traveled through pipes can be treated as weakened to כלי שני in the sink application."
      ],
      [
        "fmb-safe-2",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
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
            "permits clean ben-yomo meat and dairy vessels to be together in hot parve water."
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
            "forbids clean ben-yomo meat and dairy vessels from being together in hot parve water because the connected tastes meet too directly."
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
            "forbids עירוי כלי ראשון onto dirty meat and dairy dishes because עירוי can transfer taste כדי קליפה."
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
            "forbids a cold opposite-type bowl when hot parve soup pours into it continuously from a ben-yomo meat or dairy pot."
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
            "permits the cold opposite-type bowl because the continuous stream is already treated as נ״ט בר נ״ט."
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
            "treats hot water that traveled through pipes as weakened to the level of כלי שני for the sink application taught in the course."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "dt-safe-1",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
      ],
      [
        "dt-safe-2",
        "A Muslim wedding has a different idolatry dimension from a classic idolatrous celebration."
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
            "questions whether ordinary dish soap is sufficiently פוגם to support the dishwasher leniency."
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
            "give substantial weight to ordinary dish soap as פוגם in the dishwasher analysis."
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
            "permits sequential meat-and-dairy dishwasher use when separate racks are used."
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
            "permits sequential meat-and-dairy dishwasher use even when the same racks are used."
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
            "permits meat-and-dairy dishwasher use when the initial rinse is cold, more broadly than the Ashkenazic practice taught in the course."
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
            "argues that modern dishwasher filters can undermine the assumptions used in older dishwasher leniencies."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sd-safe-1",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
      ],
      [
        "sd-safe-2",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
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
            "explains that Chazal modeled the prohibition of סתם יינם on the rules of יין נסך."
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
            "explains that the benefit prohibition on סתם יינם helps prevent people from benefiting from actual יין נסך."
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
            "explains that drinking was prohibited first and benefit was prohibited later when people became lax around libation wine."
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
            "permit benefit today from both a non-Jew’s own wine and Jewish wine touched by a non-Jew, while drinking remains prohibited."
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
            "keeps benefit from a non-Jew’s own wine prohibited but permits benefit from Jewish wine touched by the non-Jew."
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
            "keeps benefit prohibited both from a non-Jew’s own wine and from Jewish wine touched by the non-Jew."
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
            "follows Rambam as the formal baseline and keeps benefit prohibited in both modern-non-Jew categories."
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
            "allows reliance בדיעבד or for loss on the Rashi/Geonim leniency permitting benefit today, but not as a routine profit model."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "syb-safe-1",
        "Separate racks are one basis for permitting sequential meat-and-dairy dishwasher use."
      ],
      [
        "syb-safe-2",
        "Dry parve food cooked in a ben-yomo vessel may be placed on a clean plate of the opposite type according to the taught lenient application."
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
            "permit non-Jewish ownership of kosher mevushal wine because cooked wine is treated as outside the ordinary wine category for this rule."
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
            "retains the non-Jew-owned wine decree even when the kosher wine is mevushal."
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
            "are read in the course notes as supporting practical permission for non-Jewish ownership of kosher mevushal wine."
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
            "focus on heating with some evaporation as the classical marker that wine has become מבושל."
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
            "accept יד סולדת בו as sufficient for the modern pasteurization threshold taught in the course."
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
            "require a more meaningful cooking or evaporation change before modern pasteurization qualifies as מבושל."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "mp-safe-1",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
      ],
      [
        "mp-safe-2",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
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
            "can require ששים against the absorbed wine represented by the barrel thickness."
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
            "use a 1:6 measure against כדי קליפה when evaluating absorbed sherry in the cask."
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
            "characterizes the remaining sherry taste as weakened קיוהא rather than meaningful positive wine flavor."
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
            "frames the sherry as preventing bad oak flavor rather than contributing a tasted positive wine flavor."
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
            "uses manufacture for non-Jews as one route for addressing אין מבטלין איסור לכתחילה in the sherry-cask discussion."
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
            "limits the deliberate-bitul concern where the prohibition is rabbinic and no longer has a practical biblical wine-libation root."
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
            "have substantially more room for leniency because the retained sherry taste is older and weaker than in first-fill casks."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sc-safe-1",
        "Hot water that traveled through pipes can be treated as weakened to כלי שני in the sink application."
      ],
      [
        "sc-safe-2",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
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
            "rejects the view that ordinary grain beer is outside the social-drinking decree."
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
            "require attention to both an infrequent drinking occasion and a non-fixed or sporadic place when using the non-fixed-drinking leniency."
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
            "allows room for a business drink in a non-Jewish bar when refusing would create איבה."
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
            "remains cautious about permitting a business drink in a non-Jewish bar even when איבה is a concern."
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
            "are stricter about prestigious non-alcoholic social drinking, such as sitting for coffee in a coffee shop."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sdb-safe-1",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
      ],
      [
        "sdb-safe-2",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
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
            "forbids drinking even one’s own kosher or mevushal wine at a non-Jewish party."
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
            "has an especially strong prohibition against eating or drinking at a non-Jewish wedding feast."
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
            "rejects a general איבה waiver for the prohibition on eating or drinking at a non-Jewish wedding."
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
            "records possible room in an איבה case at a non-Jewish wedding, rather than a categorical permission."
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
            "permits attendance at a Muslim wedding because the idolatry dimension differs from a classic non-Jewish idolatrous celebration."
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
            "still applies the intermarriage and social-concern dimension to a Muslim wedding despite the different idolatry issue."
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
            "permits a ger to attend a family celebration in the circumstances discussed in the course."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "sdw-safe-1",
        "Hot water that traveled through pipes can be treated as weakened to כלי שני in the sink application."
      ],
      [
        "sdw-safe-2",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
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
            "can reduce some wine-touch restrictions for ordinary non-Jews today because they are treated as non-libaters in this framework."
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
            "limits practical reliance on the modern-non-Jew touch leniency, especially to a case of loss."
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
            "creates a drinking prohibition while benefit remains permitted because the wine-libation concern is lower for a Muslim."
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
            "permits drinking when there is only a doubt whether a Muslim touched the wine."
          ]
        ]
      },
      {
        "id": "wta5",
        "label": "Public Shabbat desecrator",
        "tokens": [
          [
            "wta5a",
            "A public Shabbat desecrator"
          ],
          [
            "wta5b",
            "can make the touched wine prohibited for drinking while benefit remains permitted."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "wta-safe-1",
        "Separate racks are one basis for permitting sequential meat-and-dairy dishwasher use."
      ],
      [
        "wta-safe-2",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
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
            "prohibits drinking but permits benefit when a non-Jew pours Jewish wine without fully shaking it."
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
            "can permit drinking after a non-Jew pours Jewish wine under the Rama’s modern-non-Jew downgrade."
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
            "limits practical reliance on the Rama’s pouring leniency especially to a case of loss."
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
            "prohibits drinking but permits benefit after accidental non-Jewish touch."
          ]
        ]
      },
      {
        "id": "wca5",
        "label": "Accidental touch — Rama",
        "tokens": [
          [
            "wca5a",
            "Rama"
          ],
          [
            "wca5b",
            "can permit drinking and benefit after accidental touch by ordinary non-Jews today."
          ]
        ]
      },
      {
        "id": "wca5s",
        "label": "Accidental touch — Shach",
        "tokens": [
          [
            "wca5sa",
            "Shach"
          ],
          [
            "wca5sb",
            "is more cautious about permitting drinking after accidental touch by ordinary non-Jews today when there is no case of loss."
          ]
        ]
      },
      {
        "id": "wca6",
        "label": "Shake open bottle — S”A",
        "tokens": [
          [
            "wca6a",
            "S”A"
          ],
          [
            "wca6b",
            "prohibits both drinking and benefit when a non-Jew shakes an open bottle without lifting it."
          ]
        ]
      },
      {
        "id": "wca6r",
        "label": "Shake open bottle — Rama",
        "tokens": [
          [
            "wca6ra",
            "Rama"
          ],
          [
            "wca6rb",
            "permits the open-bottle shaking case under the Rama’s modern-non-Jew downgrade."
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
            "forbids drinking after a Muslim deliberately pours the wine."
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
            "treats deliberate pouring by a nonreligious Jew as significant because pouring can function like shaking."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "wca-safe-1",
        "Separate racks are one basis for permitting sequential meat-and-dairy dishwasher use."
      ],
      [
        "wca-safe-2",
        "A fixed weekly return schedule undermines יוצא ונכנס because predictability removes the deterrent."
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
            "treat the continuous pouring stream as a halachic connection that can transmit the prohibition back to the source wine."
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
            "does not treat the continuous pouring stream as connecting the source wine to the prohibited wine below."
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
            "allow reliance on Rabbeinu Tam’s non-connection view when there is a genuine significant loss."
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
            "can still be affected by נצוק when it is poured into residue that is already forbidden non-mevushal wine."
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
            "can provide a bitul route against forbidden residue, although deliberately creating the ratio can raise אין מבטלין איסור לכתחילה."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "nz-safe-1",
        "Modern dishwasher filters can undermine assumptions used in older dishwasher leniencies."
      ],
      [
        "nz-safe-2",
        "Ordinary grain beer is treated more leniently than prestigious social drinking in the course’s social-drinking framework."
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
            "prohibits open Jewish wine immediately when it is left alone with an idolater and the relevant access conditions are present."
          ]
        ]
      },
      {
        "id": "uw2",
        "label": "Open wine with Muslim",
        "tokens": [
          [
            "uw2a",
            "The course rule for a Muslim"
          ],
          [
            "uw2b",
            "prohibits open Jewish wine left alone with a Muslim after enough time has passed to walk a mil."
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
            "can be stricter in an unattended-Muslim case when drinking the wine itself is the concern."
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
            "protects the wine when the non-Jew does not know a meaningful absence window, cannot see the Jew approaching, and cannot lock the Jew out from returning."
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
            "undermines יוצא ונכנס because a predictable return schedule removes the deterrent."
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
            "include double seals, effective locks or combinations, monitored cameras, or hiding the wine when those measures create tamper evidence or a credible fear of being caught."
          ]
        ]
      }
    ],
    "distractors": [
      [
        "uw-safe-1",
        "Second-fill sherry casks have more room for leniency because the retained taste is older and weaker."
      ],
      [
        "uw-safe-2",
        "Hot water that traveled through pipes can be treated as weakened to כלי שני in the sink application."
      ]
    ],
    "modelAnswer": "S”A prohibits open wine immediately when it is left alone with an idolater under the access conditions. For a Muslim, the course rule uses enough time to walk a mil, though Shach can be stricter where drinking itself is the concern. יוצא ונכנס depends on unpredictability of return and lack of visual/locking barriers; a fixed known schedule undermines it. Effective seals or other protections must create tamper evidence or credible fear of being caught."
  }
];
})();
