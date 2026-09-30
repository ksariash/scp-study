(() => {
  'use strict';

  const E = (id, title, prompt, facts, distractors, modelAnswer) => ({
    id, title, prompt, facts, distractors, modelAnswer
  });

  window.ESSAY_PRACTICE_DATA = [
    E(
      'nbn-intentional-cooking',
      'נ״ט בר נ״ט — deliberate cooking',
      'Compare the named positions when parve food is deliberately cooked in a clean meat/dairy vessel with the intention of later adding the opposite type. Include both ben-yomo and eino-ben-yomo cases.',
      [
        { id:'nbn1', label:'Ben-yomo — stricter S”A-track authorities', tokens:[
          ['nbn1a','Shach / Ben Ish Chai / Kaf HaChaim'],
          ['nbn1b','forbid לכתחילה'],
          ['nbn1c','deliberately cooking now with a plan to add the opposite type']
        ]},
        { id:'nbn2', label:'Ben-yomo — Rav Ovadya', tokens:[
          ['nbn2a','Rav Ovadya'],
          ['nbn2b','permits'],
          ['nbn2c','the deliberate ben-yomo case on the lenient S”A track']
        ]},
        { id:'nbn3', label:'Eino-ben-yomo — permissive Ashkenazic authorities', tokens:[
          ['nbn3a','Gra / Badei HaShulchan'],
          ['nbn3b','permit'],
          ['nbn3c','deliberate cooking in an eino-ben-yomo vessel for the opposite type']
        ]},
        { id:'nbn4', label:'Eino-ben-yomo — stricter Ashkenazic authorities', tokens:[
          ['nbn4a','Chochmat Adam / Rav Elyashiv'],
          ['nbn4b','forbid initially'],
          ['nbn4c','but allow when no other pot is available']
        ]},
        { id:'nbn5', label:'Dry solid on opposite plate', tokens:[
          ['nbn5a','Rav Moshe'],
          ['nbn5b','permits לכתחילה'],
          ['nbn5c','placing the dry parve food on the opposite clean plate']
        ]},
        { id:'nbn6', label:'Dry solid dissent', tokens:[
          ['nbn6a','Pri Megadim'],
          ['nbn6b','dissents'],
          ['nbn6c','from the taught lenient dry-plate application']
        ]}
      ],
      [
        ['nbnd1','Rama permits deliberate ben-yomo cooking לכתחילה'],
        ['nbnd2','Rav Elyashiv permits only when the pot is ben-yomo'],
        ['nbnd3','Shach says the resulting food becomes intrinsic בשר בחלב']
      ],
      'For a ben-yomo vessel, Shach, Ben Ish Chai, and Kaf HaChaim forbid deliberately creating the weak taste in order to add the opposite type, while Rav Ovadya permits on the lenient S”A track. For an eino-ben-yomo vessel, Gra and Badei HaShulchan permit; Chochmat Adam and Rav Elyashiv initially forbid but allow when no other pot is available. Rav Moshe permits the taught dry-plate application לכתחילה, with a Pri Megadim dissent.'
    ),
    E(
      'nbn-model-failures',
      'נ״ט בר נ״ט — when the model may fail',
      'Explain the named disputes about whether נ״ט בר נ״ט applies to food-to-food transfer and to transfer while the source and recipient are still cooking together.',
      [
        { id:'nbf1', label:'Food → food → vessel — strict', tokens:[
          ['nbf1a','Pri Megadim / Aruch HaShulchan'],
          ['nbf1b','do not count the first food-to-food transfer'],
          ['nbf1c','as נ״ט בר נ״ט']
        ]},
        { id:'nbf2', label:'Food → food → vessel — lenient', tokens:[
          ['nbf2a','Pnei Aryeh / Rav Ovadya'],
          ['nbf2b','do count it'],
          ['nbf2c','as a valid weakened transfer']
        ]},
        { id:'nbf3', label:'Food → food → vessel — intermediate', tokens:[
          ['nbf3a','Chavot Da’at / Yad Yehuda'],
          ['nbf3b','take intermediate positions'],
          ['nbf3c','between the two food-to-food approaches']
        ]},
        { id:'nbf4', label:'Ongoing connection — strict', tokens:[
          ['nbf4a','Chavot Da’at'],
          ['nbf4b','says it is not yet נ״ט בר נ״ט'],
          ['nbf4c','while the source and recipient are still cooking together']
        ]},
        { id:'nbf5', label:'Ongoing connection — lenient', tokens:[
          ['nbf5a','Beit Ephraim'],
          ['nbf5b','says it can be נ״ט בר נ״ט'],
          ['nbf5c','despite the continuing cooking connection']
        ]},
        { id:'nbf6', label:'Practical reliance', tokens:[
          ['nbf6a','Ashkenazic practice'],
          ['nbf6b','is initially cautious but can rely on Beit Ephraim'],
          ['nbf6c','בדיעבד or for significant loss']
        ]},
        { id:'nbf7', label:'Rav Ovadya on ongoing connection', tokens:[
          ['nbf7a','Rav Ovadya'],
          ['nbf7b','follows the lenient view'],
          ['nbf7c','on the ongoing-connection dispute']
        ]}
      ],
      [
        ['nbfd1','Beit Ephraim requires the first transfer to enter a כלי'],
        ['nbfd2','Pri Megadim counts every food-to-food transfer automatically'],
        ['nbfd3','Rav Ovadya follows Chavot Da’at on the ongoing connection']
      ],
      'Pri Megadim and Aruch HaShulchan do not count the first food-to-food transfer as נ״ט בר נ״ט; Pnei Aryeh and Rav Ovadya do, while Chavot Da’at and Yad Yehuda are intermediate. For an ongoing cooking connection, Chavot Da’at says the weakening has not yet occurred, Beit Ephraim says it can, Ashkenazic practice can rely on Beit Ephraim בדיעבד or for significant loss, and Rav Ovadya follows the lenient view.'
    ),
    E(
      'fish-meat-bitul',
      'Fish and meat — bitul and סכנה',
      'A fish-and-meat mixture occurred. Present the named positions on whether bitul applies and the additional leniency routes discussed for an accidental mixture without ששים.',
      [
        { id:'fmb1', label:'Bitul — Maharil', tokens:[
          ['fmb1a','Maharil'],
          ['fmb1b','says bitul does not apply'],
          ['fmb1c','to a סכנה mixture']
        ]},
        { id:'fmb2', label:'Bitul — Issur VeHeiter', tokens:[
          ['fmb2a','Issur VeHeiter'],
          ['fmb2b','permits bitul'],
          ['fmb2c','and the practical course custom is lenient']
        ]},
        { id:'fmb3', label:'Accidental rabbinic mixture — S”A', tokens:[
          ['fmb3a','S”A'],
          ['fmb3b','permits adding היתר'],
          ['fmb3c','to an accidental rabbinic mixture']
        ]},
        { id:'fmb4', label:'אין מבטלין route', tokens:[
          ['fmb4a','Pitchei Teshuvah'],
          ['fmb4b','argues אין מבטלין איסור לכתחילה may not govern'],
          ['fmb4c','a סכנה case']
        ]},
        { id:'fmb5', label:'Changed danger route', tokens:[
          ['fmb5a','Magen Avraham'],
          ['fmb5b','questions whether the danger applies today'],
          ['fmb5c','as an additional tziruf']
        ]},
        { id:'fmb6', label:'Extension to actual mixture', tokens:[
          ['fmb6a','Divrei Malkiel'],
          ['fmb6b','can extend the changed-danger consideration'],
          ['fmb6c','even to an actual mixture']
        ]}
      ],
      [
        ['fmbd1','Maharil permits whenever there is ששים'],
        ['fmbd2','Pitchei Teshuvah says סכנה always follows ordinary אין מבטלין'],
        ['fmbd3','Magen Avraham requires kashering every vessel immediately']
      ],
      'Maharil says bitul does not apply to סכנה, while Issur VeHeiter permits and the course follows the lenient practical custom. Without ששים after an accidental mixture, S”A’s rule allowing added היתר to an accidental rabbinic mixture, Pitchei Teshuvah’s question whether אין מבטלין governs סכנה, Magen Avraham’s question whether the danger applies today, and Divrei Malkiel’s extension to actual mixture are distinct possible tzirufim.'
    ),
    E(
      'dish-transfer',
      'Dish transfer — simultaneous vessels, עירוי, and a continuous stream',
      'Compare the named positions in the course on clean ben-yomo meat/dairy vessels in hot parve water, עירוי onto dirty opposite dishes, and a continuous hot parve stream into a cold opposite bowl.',
      [
        { id:'dt1', label:'Simultaneous clean ben-yomo vessels — S”A', tokens:[
          ['dt1a','S”A'],
          ['dt1b','permits'],
          ['dt1c','clean ben-yomo meat and dairy vessels together in hot parve water']
        ]},
        { id:'dt2', label:'Simultaneous clean ben-yomo vessels — Rama', tokens:[
          ['dt2a','Rama'],
          ['dt2b','forbids'],
          ['dt2c','because the connected tastes meet too directly']
        ]},
        { id:'dt3', label:'עירוי — Rama', tokens:[
          ['dt3a','Rama'],
          ['dt3b','permits'],
          ['dt3c','עירוי כלי ראשון onto dirty meat and dairy dishes']
        ]},
        { id:'dt4', label:'עירוי — Shach', tokens:[
          ['dt4a','Shach'],
          ['dt4b','forbids'],
          ['dt4c','because עירוי can transfer כדי קליפה']
        ]},
        { id:'dt5', label:'Continuous stream — Rama', tokens:[
          ['dt5a','Rama'],
          ['dt5b','forbids the cold opposite bowl'],
          ['dt5c','when hot parve soup pours continuously from a ben-yomo meat pot']
        ]},
        { id:'dt6', label:'Continuous stream — Shach', tokens:[
          ['dt6a','Shach'],
          ['dt6b','permits the bowl'],
          ['dt6c','because the stream is already counted as נ״ט בר נ״ט']
        ]},
        { id:'dt7', label:'Piped hot water', tokens:[
          ['dt7a','Ohr L’Tzion'],
          ['dt7b','treats travel through pipes as weakening'],
          ['dt7c','to כלי שני']
        ]}
      ],
      [
        ['dtd1','S”A forbids whenever both clean vessels are ben-yomo'],
        ['dtd2','Shach permits עירוי because it cannot transfer even a surface layer'],
        ['dtd3','Rama permits the continuous-stream bowl because תתאה גבר ends all connection']
      ],
      'S”A permits simultaneous clean ben-yomo meat and dairy vessels in hot parve water, while Rama forbids. For עירוי onto dirty opposite dishes, Rama permits and Shach forbids because עירוי can transfer כדי קליפה. For a continuous hot parve stream from a ben-yomo meat pot into a cold dairy bowl, Rama forbids the bowl while Shach permits it as נ״ט בר נ״ט. Ohr L’Tzion supplies an additional sink leniency by treating travel through pipes as weakening to כלי שני.'
    ),
    E(
      'soap-dishwasher',
      'Soap and dishwashers',
      'Build the course’s named positions on soap as פוגם and on sequential meat/dairy dishwasher use. Include the main permissive views and the modern-filter limitation.',
      [
        { id:'sd1', label:'Soap — concern', tokens:[
          ['sd1a','Piskei Uteshuvot'],
          ['sd1b','raises a concern'],
          ['sd1c','whether ordinary dish soap is sufficiently פוגם']
        ]},
        { id:'sd2', label:'Soap — practical course approach', tokens:[
          ['sd2a','Chazon Ish / Rav Forst'],
          ['sd2b','give substantial weight to soap'],
          ['sd2c','as פוגם']
        ]},
        { id:'sd3', label:'Dishwasher — separate racks', tokens:[
          ['sd3a','Rav Moshe'],
          ['sd3b','permits sequential meat/dairy use'],
          ['sd3c','with separate racks']
        ]},
        { id:'sd4', label:'Dishwasher — same racks', tokens:[
          ['sd4a','Rav Shmuel Tuvia Stern'],
          ['sd4b','permits sequential use'],
          ['sd4c','even with the same racks']
        ]},
        { id:'sd5', label:'Dishwasher — cold initial rinse', tokens:[
          ['sd5a','Rav Ovadya'],
          ['sd5b','permits meat/dairy use when the initial rinse is cold'],
          ['sd5c','more broadly than Ashkenazic practice']
        ]},
        { id:'sd6', label:'Dishwasher — modern filter concern', tokens:[
          ['sd6a','Agurah B’Ohalecha'],
          ['sd6b','argues modern filters can undermine'],
          ['sd6c','the older dishwasher analysis']
        ]}
      ],
      [
        ['sdd1','Rav Moshe requires the same rack for meat and dairy'],
        ['sdd2','Rav Ovadya permits only when the initial rinse is hot'],
        ['sdd3','Chazon Ish says soap never affects absorbed taste']
      ],
      'Piskei Uteshuvot raises a concern whether ordinary soap is sufficiently פוגם; Chazon Ish and Rav Forst give it substantial weight. Rav Moshe permits sequential use with separate racks, Rav Shmuel Tuvia Stern permits even with the same racks, and Rav Ovadya permits when the initial rinse is cold. Agurah B’Ohalecha cautions that modern filters can undermine older dishwasher analysis.'
    ),
    E(
      'stam-benefit',
      'סתם יינם — why benefit was prohibited and the modern-non-Jew dispute',
      'Explain the named rationales for the benefit prohibition and compare the principal positions on benefit today when ordinary non-Jews no longer libate wine.',
      [
        { id:'syb1', label:'Benefit rationale — Beit Yosef', tokens:[
          ['syb1a','Beit Yosef'],
          ['syb1b','says Chazal modeled סתם יינם'],
          ['syb1c','on יין נסך']
        ]},
        { id:'syb2', label:'Benefit rationale — Ran', tokens:[
          ['syb2a','Ran'],
          ['syb2b','says the benefit ban prevents people from benefiting'],
          ['syb2c','from actual יין נסך']
        ]},
        { id:'syb3', label:'Benefit rationale — Rashba', tokens:[
          ['syb3a','Rashba'],
          ['syb3b','says drinking was prohibited first and benefit later'],
          ['syb3c','when people became lax around libation wine']
        ]},
        { id:'syb4', label:'Modern non-Jews — Rashi/Geonim', tokens:[
          ['syb4a','Rashi / Geonim'],
          ['syb4b','permit benefit today'],
          ['syb4c','from both non-Jewish wine and Jewish wine touched by a non-Jew; drinking remains prohibited']
        ]},
        { id:'syb5', label:'Modern non-Jews — Rosh', tokens:[
          ['syb5a','Rosh'],
          ['syb5b','keeps benefit from the non-Jew’s own wine prohibited'],
          ['syb5c','but permits benefit from Jewish wine touched by the non-Jew']
        ]},
        { id:'syb6', label:'Modern non-Jews — Rambam', tokens:[
          ['syb6a','Rambam'],
          ['syb6b','keeps benefit prohibited'],
          ['syb6c','in both categories']
        ]},
        { id:'syb7', label:'Practical psak — S”A', tokens:[
          ['syb7a','S”A'],
          ['syb7b','follows Rambam'],
          ['syb7c','as the formal baseline']
        ]},
        { id:'syb8', label:'Practical psak — Rama', tokens:[
          ['syb8a','Rama'],
          ['syb8b','allows reliance on the Geonic/Rashi leniency'],
          ['syb8c','בדיעבד or for loss, not as a routine profit model']
        ]}
      ],
      [
        ['sybd1','Rosh permits benefit from all non-Jewish wine today'],
        ['sybd2','Rambam permits benefit whenever the toucher does not libate'],
        ['sybd3','Rama allows building a routine business around prohibited wine']
      ],
      'Beit Yosef explains the benefit ban by modeling סתם יינם on יין נסך; Ran connects it to preventing benefit from actual יין נסך; Rashba describes a later benefit decree after the original drinking decree. Rashi and the Geonim permit benefit today while drinking remains prohibited; Rosh distinguishes the non-Jew’s own wine from Jewish wine touched by a non-Jew; Rambam keeps benefit prohibited in both. S”A follows Rambam, while Rama allows Geonic/Rashi reliance בדיעבד or for loss.'
    ),
    E(
      'mevushal-pasteurization',
      'מבושל — ownership and pasteurization',
      'A course essay asks about non-Jewish ownership of kosher mevushal wine and modern pasteurization. Give the named positions on both questions.',
      [
        { id:'mp1', label:'Non-Jew owns mevushal — permissive line', tokens:[
          ['mp1a','Rosh / Ritva / Ramban'],
          ['mp1b','permit'],
          ['mp1c','non-Jewish ownership of kosher mevushal wine on the “not ordinary wine” logic']
        ]},
        { id:'mp2', label:'Non-Jew owns mevushal — stringent analysis', tokens:[
          ['mp2a','R. Akiva Eiger'],
          ['mp2b','keeps the non-Jew-owned wine decree'],
          ['mp2c','in his analysis']
        ]},
        { id:'mp3', label:'Practical reading', tokens:[
          ['mp3a','S”A / Taz'],
          ['mp3b','are read practically toward permission'],
          ['mp3c','for the non-Jew-owned mevushal case']
        ]},
        { id:'mp4', label:'Pasteurization — evaporation focus', tokens:[
          ['mp4a','Shach / Ran / Rashba'],
          ['mp4b','focus on heating with some evaporation'],
          ['mp4c','as the classical cooking marker']
        ]},
        { id:'mp5', label:'Pasteurization — yad soledet', tokens:[
          ['mp5a','Rav Moshe / Rav Ovadya'],
          ['mp5b','accept יד סולדת בו'],
          ['mp5c','as sufficient for the taught modern threshold']
        ]},
        { id:'mp6', label:'Pasteurization — stronger change', tokens:[
          ['mp6a','R. Shlomo Zalman and others'],
          ['mp6b','require a more meaningful cooking/evaporation change'],
          ['mp6c','for modern pasteurization']
        ]}
      ],
      [
        ['mpd1','R. Akiva Eiger says cooking purifies wine already prohibited'],
        ['mpd2','Rav Moshe requires visible boiling in every case'],
        ['mpd3','Rosh / Ritva / Ramban prohibit because ownership alone creates new non-mevushal wine']
      ],
      'Rosh, Ritva, and Ramban permit non-Jewish ownership of kosher mevushal wine on the “not ordinary wine” logic; R. Akiva Eiger’s analysis keeps the ownership decree, while the notes read S”A/Taz practically toward permission. On pasteurization, Shach, Ran, and Rashba emphasize heating with some evaporation; Rav Moshe and Rav Ovadya accept יד סולדת בו; R. Shlomo Zalman and others require a more meaningful cooking/evaporation change.'
    ),
    E(
      'sherry-casks',
      'Sherry-cask whisky',
      'Present the named positions that organize the sherry-cask whisky discussion: quantity/bitul, positive flavor, and deliberate bitul.',
      [
        { id:'sc1', label:'Quantity — Shach', tokens:[
          ['sc1a','Shach'],
          ['sc1b','can require ששים'],
          ['sc1c','against absorbed wine / barrel thickness']
        ]},
        { id:'sc2', label:'Quantity — S”A/Taz', tokens:[
          ['sc2a','S”A / Taz'],
          ['sc2b','use a 1:6 measure'],
          ['sc2c','against כדי קליפה']
        ]},
        { id:'sc3', label:'Flavor — Rav Moshe', tokens:[
          ['sc3a','Rav Moshe'],
          ['sc3b','characterizes the remnant as weakened קיוהא'],
          ['sc3c','rather than meaningful positive wine flavor']
        ]},
        { id:'sc4', label:'Flavor — Mishna Halachot', tokens:[
          ['sc4a','Mishna Halachot'],
          ['sc4b','frames the sherry as preventing bad oak flavor'],
          ['sc4c','rather than adding a tasted wine flavor']
        ]},
        { id:'sc5', label:'Deliberate bitul — non-Jewish manufacture', tokens:[
          ['sc5a','One route in the notes/key'],
          ['sc5b','relies on manufacture for non-Jews'],
          ['sc5c','to address אין מבטלין איסור לכתחילה']
        ]},
        { id:'sc6', label:'Deliberate bitul — Rav Moshe', tokens:[
          ['sc6a','Rav Moshe'],
          ['sc6b','limits the deliberate-bitul rule'],
          ['sc6c','for a rabbinic prohibition that no longer has a practical biblical libation root']
        ]},
        { id:'sc7', label:'Second-fill casks', tokens:[
          ['sc7a','Second-fill casks'],
          ['sc7b','have substantially more room for leniency'],
          ['sc7c','because retained taste is older/weaker']
        ]}
      ],
      [
        ['scd1','Shach uses the 1:6 כדי קליפה measure as the only rule'],
        ['scd2','Mishna Halachot says the sherry is added specifically for tasted wine flavor'],
        ['scd3','Rav Moshe treats first-fill and second-fill casks identically']
      ],
      'Shach can require ששים against the absorbed wine/barrel thickness; S”A and Taz use a 1:6 measure against כדי קליפה. Rav Moshe describes the remnant as weakened קיוהא, while Mishna Halachot says the sherry prevents bad oak flavor rather than adding tasted wine flavor. For אין מבטלין איסור לכתחילה, the notes/key give a manufacture-for-non-Jews route and Rav Moshe’s limitation for a rabbinic prohibition without a practical biblical libation root. Second-fill casks have more room because the retained taste is older/weaker.'
    ),
    E(
      'social-drinking-business',
      'Social drinking — beer, business drinks, and coffee',
      'Compare the named positions on ordinary beer, a business drink in a non-Jewish bar, and coffee-shop social drinking.',
      [
        { id:'sdb1', label:'Ordinary beer — Rama', tokens:[
          ['sdb1a','Rama'],
          ['sdb1b','limits the beer decree'],
          ['sdb1c','so ordinary grain beer is not included']
        ]},
        { id:'sdb2', label:'Ordinary beer — Gra', tokens:[
          ['sdb2a','Gra'],
          ['sdb2b','rejects that narrowing'],
          ['sdb2c','of the beer decree']
        ]},
        { id:'sdb3', label:'Non-fixed drinking factors', tokens:[
          ['sdb3a','Kaf HaChaim / Pri Chadash'],
          ['sdb3b','stress both sporadic place and infrequency'],
          ['sdb3c','for the non-fixed permissive case']
        ]},
        { id:'sdb4', label:'Business drink — baseline', tokens:[
          ['sdb4a','S”A / Gra'],
          ['sdb4b','prohibit as the baseline'],
          ['sdb4c','a business drink in a non-Jewish bar']
        ]},
        { id:'sdb5', label:'Business drink — איבה', tokens:[
          ['sdb5a','Rav Moshe'],
          ['sdb5b','allows room'],
          ['sdb5c','where refusal creates איבה']
        ]},
        { id:'sdb6', label:'Business drink — caution', tokens:[
          ['sdb6a','Ohr L’Tzion'],
          ['sdb6b','remains cautious'],
          ['sdb6c','about the business-drink case']
        ]},
        { id:'sdb7', label:'Coffee shop — stricter views', tokens:[
          ['sdb7a','Gra / Panim Meirot'],
          ['sdb7b','are stricter'],
          ['sdb7c','about prestigious non-alcoholic social drinking']
        ]}
      ],
      [
        ['sdbd1','Rama says every ordinary grain beer is part of the decree'],
        ['sdbd2','Rav Moshe permits every non-Jewish-bar drink without qualification'],
        ['sdbd3','Ohr L’Tzion treats איבה as an automatic permission']
      ],
      'Rama limits the beer decree so ordinary grain beer is outside it; Gra rejects that narrowing. Kaf HaChaim and Pri Chadash stress sporadic place and infrequency in the non-fixed case. For a business drink, S”A/Gra prohibit as the baseline, Rav Moshe allows room where refusal creates איבה, and Ohr L’Tzion remains cautious. Gra and Panim Meirot are among the stricter views on prestigious coffee-shop social drinking.'
    ),
    E(
      'social-drinking-weddings',
      'Social drinking — weddings and family celebrations',
      'A student is asked about drinking or attending non-Jewish celebrations. Assemble the named positions taught in the course.',
      [
        { id:'sdw1', label:'Non-Jewish party', tokens:[
          ['sdw1a','Rambam'],
          ['sdw1b','forbids drinking even one’s own kosher/mevushal wine'],
          ['sdw1c','at a non-Jewish party']
        ]},
        { id:'sdw2', label:'Wedding — S”A', tokens:[
          ['sdw2a','S”A'],
          ['sdw2b','has an especially strong wedding rule'],
          ['sdw2c','against eating or drinking at the non-Jewish wedding feast']
        ]},
        { id:'sdw3', label:'Wedding — Taz', tokens:[
          ['sdw3a','Taz'],
          ['sdw3b','rejects a general איבה waiver'],
          ['sdw3c','for the wedding prohibition']
        ]},
        { id:'sdw4', label:'Wedding — Shach', tokens:[
          ['sdw4a','Shach'],
          ['sdw4b','records possible room'],
          ['sdw4c','rather than a categorical איבה permission']
        ]},
        { id:'sdw5', label:'Muslim wedding', tokens:[
          ['sdw5a','Rav Ovadya'],
          ['sdw5b','permits a Muslim wedding'],
          ['sdw5c','because the idolatry dimension differs']
        ]},
        { id:'sdw6', label:'Muslim wedding — social concern', tokens:[
          ['sdw6a','Darchei Teshuva'],
          ['sdw6b','still invokes the intermarriage/social concern'],
          ['sdw6c','despite the different idolatry dimension']
        ]},
        { id:'sdw7', label:'Ger family celebration', tokens:[
          ['sdw7a','Shav V’Rafah'],
          ['sdw7b','permits a ger’s family celebration'],
          ['sdw7c','in its circumstances']
        ]}
      ],
      [
        ['sdwd1','Taz creates a blanket איבה permission for weddings'],
        ['sdwd2','Rav Ovadya prohibits Muslim weddings because they are identical to idolatrous celebrations'],
        ['sdwd3','Rambam permits one’s own mevushal wine at a non-Jewish party']
      ],
      'Rambam forbids drinking even one’s own kosher/mevushal wine at a non-Jewish party; S”A’s wedding rule is especially strong. Taz rejects a general איבה waiver, while Shach records possible room rather than a categorical permission. Rav Ovadya permits a Muslim wedding because the idolatry dimension differs; Darchei Teshuva still invokes intermarriage/social concern; Shav V’Rafah permits a ger’s family celebration in its circumstances.'
    ),
    E(
      'wine-touch-actors',
      'Who can prohibit Jewish wine?',
      'Summarize the named course positions that affect wine touched by modern non-Jews and by Muslims, including doubtful touch.',
      [
        { id:'wta1', label:'Today’s non-Jews — Rama', tokens:[
          ['wta1a','Rama'],
          ['wta1b','can downgrade some touch results'],
          ['wta1c','because non-Jews today are treated as non-libaters in this framework']
        ]},
        { id:'wta2', label:'Today’s non-Jews — Shach', tokens:[
          ['wta2a','Shach'],
          ['wta2b','often limits practical reliance'],
          ['wta2c','especially to a case of loss']
        ]},
        { id:'wta3', label:'Muslim baseline', tokens:[
          ['wta3a','Muslim touch'],
          ['wta3b','creates a drinking concern while benefit is permitted'],
          ['wta3c','because the libation concern is lower']
        ]},
        { id:'wta4', label:'Doubtful Muslim touch', tokens:[
          ['wta4a','Rav Ovadya'],
          ['wta4b','permits drinking'],
          ['wta4c','in a doubtful Muslim-touch case']
        ]},
        { id:'wta5', label:'Public Shabbat desecrator', tokens:[
          ['wta5a','Public Shabbat desecrator'],
          ['wta5b','can forbid the touched wine to drink'],
          ['wta5c','while benefit remains permitted']
        ]}
      ],
      [
        ['wtad1','Shach treats the Rama’s downgrade as an automatic לכתחילה rule'],
        ['wtad2','Rav Ovadya says doubtful Muslim touch always forbids benefit'],
        ['wtad3','Public Shabbat desecration makes benefit prohibited in every case']
      ],
      'Rama’s “non-Jews today” approach can downgrade some touch results; Shach often limits reliance especially to loss. Muslim touch retains a drinking concern but permits benefit, and Rav Ovadya permits drinking in doubtful Muslim-touch cases. The course separately teaches that wine touched by a public Shabbat desecrator can be forbidden to drink while benefit remains permitted.'
    ),
    E(
      'wine-contact-actions',
      'What act of contact forbids the wine?',
      'Compare the named positions for pouring, accidental touch, shaking an open bottle, and deliberate pouring by a Muslim or nonreligious Jew.',
      [
        { id:'wca1', label:'Pouring — S”A', tokens:[
          ['wca1a','S”A'],
          ['wca1b','prohibits drinking but permits benefit'],
          ['wca1c','for pouring without full shaking']
        ]},
        { id:'wca2', label:'Pouring — Rama', tokens:[
          ['wca2a','Rama'],
          ['wca2b','can permit drinking'],
          ['wca2c','under the today’s-non-Jew downgrade']
        ]},
        { id:'wca3', label:'Pouring — Shach', tokens:[
          ['wca3a','Shach'],
          ['wca3b','says practical reliance is especially for loss'],
          ['wca3c','on the Rama’s pouring downgrade']
        ]},
        { id:'wca4', label:'Accidental touch — S”A', tokens:[
          ['wca4a','S”A'],
          ['wca4b','prohibits drinking but permits benefit'],
          ['wca4c','for accidental touch']
        ]},
        { id:'wca5', label:'Accidental touch — Rama/Shach', tokens:[
          ['wca5a','Rama / Shach'],
          ['wca5b','Rama can permit for today’s non-Jews; Shach is more cautious'],
          ['wca5c','without a case of loss']
        ]},
        { id:'wca6', label:'Shake open bottle', tokens:[
          ['wca6a','S”A / Rama'],
          ['wca6b','S”A prohibits drinking and benefit; Rama permits on his downgrade'],
          ['wca6c','when the open bottle is shaken without lifting']
        ]},
        { id:'wca7', label:'Muslim deliberate pour', tokens:[
          ['wca7a','Rav Ovadya'],
          ['wca7b','still forbids drinking'],
          ['wca7c','after a Muslim’s deliberate pour']
        ]},
        { id:'wca8', label:'Nonreligious Jew deliberate pour', tokens:[
          ['wca8a','Rav Elyashiv'],
          ['wca8b','treats the pour as significant'],
          ['wca8c','because pouring can function like shaking']
        ]}
      ],
      [
        ['wcad1','S”A permits drinking after every accidental touch'],
        ['wcad2','Rav Ovadya says a Muslim’s deliberate pour is harmless'],
        ['wcad3','Rav Elyashiv treats pouring as irrelevant unless the bottle is shaken separately']
      ],
      'For pouring without full shaking, S”A prohibits drinking but permits benefit; Rama’s downgrade can permit drinking, with Shach emphasizing reliance especially for loss. S”A similarly prohibits drinking after accidental touch while permitting benefit; Rama can be more lenient for today’s non-Jews, with Shach more cautious without loss. On shaking an open bottle, S”A prohibits drinking and benefit while Rama permits on his downgrade. Rav Ovadya still forbids drinking after a Muslim’s deliberate pour, and Rav Elyashiv treats a nonreligious Jew’s pour as significant because pouring can function like shaking.'
    ),
    E(
      'nitzok',
      'נצוק — the stream connection',
      'Explain the named dispute over whether נצוק connects the source wine to prohibited wine/residue, and state the significant-loss rule.',
      [
        { id:'nz1', label:'Connection view', tokens:[
          ['nz1a','Rashi / Rav Chisda'],
          ['nz1b','treat the continuous stream as a halachic connection'],
          ['nz1c','so the source can be affected']
        ]},
        { id:'nz2', label:'Non-connection view', tokens:[
          ['nz2a','Rabbeinu Tam'],
          ['nz2b','does not treat נצוק as connecting the source'],
          ['nz2c','for this prohibition']
        ]},
        { id:'nz3', label:'Significant loss', tokens:[
          ['nz3a','S”A / Rama'],
          ['nz3b','allow reliance on the non-connection view'],
          ['nz3c','in a genuine significant-loss case']
        ]},
        { id:'nz4', label:'Mevushal source limitation', tokens:[
          ['nz4a','Mevushal source wine'],
          ['nz4b','can still face a נצוק problem'],
          ['nz4c','when it is poured into already-forbidden non-mevushal residue']
        ]},
        { id:'nz5', label:'Bitul route', tokens:[
          ['nz5a','ששים in the source against the residue'],
          ['nz5b','can provide a bitul route'],
          ['nz5c','but deliberately creating the ratio can raise אין מבטלין איסור לכתחילה']
        ]}
      ],
      [
        ['nzd1','Rabbeinu Tam says the stream always transfers prohibition upward'],
        ['nzd2','S”A / Rama require the connection view even in significant loss'],
        ['nzd3','מבושל automatically purifies forbidden residue in the receiving cup']
      ],
      'Rashi and Rav Chisda treat נצוק as a connection, while Rabbeinu Tam does not. S”A and Rama allow reliance on the non-connection view in genuine significant loss. A mevushal source can still face the issue when poured into already-forbidden non-mevushal residue; sufficient ששים can provide a bitul route, though deliberately creating the ratio raises אין מבטלין איסור לכתחילה.'
    ),
    E(
      'unattended-wine',
      'Wine left with a non-Jew',
      'State the course rules for open wine left alone with an idolater or Muslim, and explain the conditions for יוצא ונכנס and protective closures.',
      [
        { id:'uw1', label:'Open wine with idolater', tokens:[
          ['uw1a','S”A'],
          ['uw1b','prohibits immediately'],
          ['uw1c','when open wine is left alone with an idolater and the access conditions are met']
        ]},
        { id:'uw2', label:'Open wine with Muslim', tokens:[
          ['uw2a','Course rule for a Muslim'],
          ['uw2b','prohibits after enough time to walk a mil'],
          ['uw2c','for open wine left alone']
        ]},
        { id:'uw3', label:'Muslim — Shach qualification', tokens:[
          ['uw3a','Shach'],
          ['uw3b','can be stricter'],
          ['uw3c','where drinking itself is the concern']
        ]},
        { id:'uw4', label:'יוצא ונכנס', tokens:[
          ['uw4a','יוצא ונכנס'],
          ['uw4b','works when the non-Jew does not know a meaningful absence window'],
          ['uw4c','cannot see the Jew approaching and the area is not locked against return']
        ]},
        { id:'uw5', label:'Fixed schedule', tokens:[
          ['uw5a','A fixed weekly run / known schedule'],
          ['uw5b','undermines יוצא ונכנס'],
          ['uw5c','because predictability removes the deterrent']
        ]},
        { id:'uw6', label:'Protective options', tokens:[
          ['uw6a','Protective options'],
          ['uw6b','include double seals, effective locking/combination closures, monitored cameras, or hidden wine'],
          ['uw6c','when they create tamper evidence or credible fear of being caught']
        ]}
      ],
      [
        ['uwd1','Shach always gives Muslims a longer time than a mil'],
        ['uwd2','יוצא ונכנס works best when the non-Jew knows the exact return schedule'],
        ['uwd3','Open wine requires tamper time before it can ever be prohibited']
      ],
      'S”A prohibits open wine immediately when it is left alone with an idolater under the access conditions. For a Muslim, the course rule uses enough time to walk a mil, though Shach can be stricter where drinking itself is the concern. יוצא ונכנס depends on unpredictability of return and lack of visual/locking barriers; a fixed known schedule undermines it. Effective seals or other protections must create tamper evidence or credible fear of being caught.'
    )
  ];
})();
