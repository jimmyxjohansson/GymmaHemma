/**
 * Utförande per övning: start/slut-foton, numrerade steg och vanliga misstag.
 *
 * Foton: Free Exercise DB (https://github.com/yuhonas/free-exercise-db), public domain (Unlicense).
 * De ligger i public/ovningar/<mapp>/0.webp (start) och 1.webp (slut).
 *
 * Nyckeln är övningens namn i gym_exercises. Egna övningar utan guide visar bara beskrivningen.
 */
export interface ExerciseGuide {
  /** Mapp under /public/ovningar med 0.webp och 1.webp */
  img?: string;
  steps: string[];
  mistakes: string[];
}

const g = (img: string | undefined, steps: string[], mistakes: string[]): ExerciseGuide => ({ img, steps, mistakes });

export const GUIDES: Record<string, ExerciseGuide> = {
  // Hantlar ------------------------------------------------------------------
  "Hantelpress på bänk": g(
    "Dumbbell_Bench_Press",
    [
      "Sätt dig på bänken med hantlarna på låren och luta dig bakåt. Låt knäna hjälpa till att lyfta upp hantlarna.",
      "Fötterna i golvet, skulderbladen ihop och nedåt. Håll hantlarna i brösthöjd med armbågarna ca 45° ut från kroppen.",
      "Pressa hantlarna rakt upp tills armarna nästan är raka.",
      "Sänk kontrollerat tillbaka till brösthöjd.",
    ],
    ["Armbågarna rakt ut åt sidorna – sliter på axlarna", "Studsar i botten eller tappar kontrollen på vägen ner"],
  ),
  "Lutande hantelpress": g(
    "Incline_Dumbbell_Press",
    [
      "Ställ bänken i 30–45°.",
      "Luta dig bakåt med hantlarna vid övre bröstet, skulderbladen ihop.",
      "Pressa upp och lätt inåt tills armarna nästan är raka.",
      "Sänk långsamt tillbaka.",
    ],
    ["För brant bänk – då blir det en axelövning", "Svankar och lyfter rumpan från bänken"],
  ),
  Hantelflyes: g(
    "Dumbbell_Flyes",
    [
      "Ligg på bänken med hantlarna rakt ovanför bröstet, handflatorna mot varandra.",
      "Böj armbågarna lätt och lås den vinkeln.",
      "Sänk hantlarna i en båge ut åt sidorna tills du känner en stretch i bröstet.",
      "För tillbaka i samma båge, som om du kramar ett träd.",
    ],
    ["Böjer och sträcker armarna – då blir det en press", "Går för djupt med för tung vikt"],
  ),
  "Enarmsrodd med hantel": g(
    "One-Arm_Dumbbell_Row",
    [
      "Stöd samma sidas hand och knä på bänken, ryggen rak och parallell med golvet.",
      "Håll hanteln i rak arm under axeln.",
      "Dra hanteln mot höften med armbågen nära kroppen.",
      "Sänk långsamt tills armen är rak. Byt sida efter alla reps.",
    ],
    ["Roterar överkroppen för att få upp vikten", "Drar mot bröstet i stället för mot höften"],
  ),
  "Framåtböjd hantelrodd": g(
    "Bent_Over_Two-Dumbbell_Row",
    [
      "Stå med fötterna höftbrett, lätt böjda knän.",
      "Fäll överkroppen framåt från höften till ca 45°, med rak rygg.",
      "Dra båda hantlarna mot nedre delen av magen och kläm ihop skulderbladen.",
      "Sänk kontrollerat.",
    ],
    ["Rundar ryggen", "Reser sig upp och gungar med kroppen"],
  ),
  "Pullover med hantel": g(
    "Straight-Arm_Dumbbell_Pullover",
    [
      "Ligg på bänken och håll en hantel med båda händerna rakt ovanför bröstet.",
      "Håll armarna nästan raka.",
      "Sänk hanteln i en båge bakom huvudet tills du känner stretch i bröst och sidor.",
      "Dra tillbaka hanteln till startläget.",
    ],
    ["Böjer armarna mer och mer", "Svankar kraftigt när vikten går bakåt"],
  ),
  "Axelpress med hantlar": g(
    "Dumbbell_Shoulder_Press",
    [
      "Sitt med stöd för ryggen (eller stå stadigt) med hantlarna i axelhöjd.",
      "Handflatorna framåt, armbågarna lite framför kroppen.",
      "Pressa rakt upp tills armarna nästan är raka.",
      "Sänk till axelhöjd.",
    ],
    ["Svankar och lutar sig bakåt", "Kortar rörelsen och sänker inte hela vägen"],
  ),
  Sidolyft: g(
    "Side_Lateral_Raise",
    [
      "Stå med hantlarna längs sidorna och lätt böjda armbågar.",
      "Lyft armarna ut åt sidorna tills de är i axelhöjd.",
      "Led med armbågarna, tummarna pekar lätt nedåt eller rakt fram.",
      "Sänk långsamt.",
    ],
    ["Svingar med kroppen", "Drar upp axlarna mot öronen"],
  ),
  "Omvända flyes": g(
    "Seated_Bent-Over_Rear_Delt_Raise",
    [
      "Sitt längst fram på bänken och fäll överkroppen framåt mot låren (eller stå framåtböjd).",
      "Låt hantlarna hänga under bröstet med lätt böjda armbågar.",
      "Lyft armarna ut åt sidorna tills de är i linje med kroppen.",
      "Sänk kontrollerat. Lätt vikt räcker.",
    ],
    ["För tung vikt – ryggen tar över", "Drar ihop armbågarna som i en rodd"],
  ),
  Arnoldpress: g(
    "Arnold_Dumbbell_Press",
    [
      "Sitt med hantlarna framför axlarna, handflatorna mot dig.",
      "Pressa uppåt och vrid samtidigt händerna utåt.",
      "Överst pekar handflatorna framåt.",
      "Vrid tillbaka på vägen ner.",
    ],
    ["Vrider först och pressar sedan – rörelsen ska vara ett flöde", "Svankar"],
  ),
  "Bicepscurl med hantlar": g(
    "Dumbbell_Bicep_Curl",
    [
      "Stå rakt med hantlarna längs sidorna, handflatorna framåt.",
      "Håll armbågarna stilla intill kroppen.",
      "Curla upp hantlarna mot axlarna.",
      "Sänk långsamt hela vägen ner.",
    ],
    ["Gungar med överkroppen", "Armbågarna glider framåt"],
  ),
  Hammercurl: g(
    "Hammer_Curls",
    [
      "Stå med hantlarna längs sidorna, tummarna framåt (neutralt grepp).",
      "Håll armbågarna stilla intill kroppen.",
      "Curla upp utan att vrida handlederna.",
      "Sänk kontrollerat.",
    ],
    ["Gungar med kroppen", "Halvt rörelseomfång"],
  ),
  "Fransk press med hantel": g(
    "Seated_Triceps_Press",
    [
      "Sitt med rak rygg och håll en hantel med båda händerna rakt över huvudet.",
      "Håll överarmarna nära huvudet och stilla.",
      "Sänk hanteln bakom huvudet genom att böja armbågarna.",
      "Sträck armarna igen.",
    ],
    ["Armbågarna glider ut åt sidorna", "Svankar"],
  ),
  Kickbacks: g(
    "Tricep_Dumbbell_Kickback",
    [
      "Stöd en hand och ett knä mot bänken, ryggen rak.",
      "Lyft överarmen parallellt med golvet och håll den stilla.",
      "Sträck armen bakåt tills den är rak.",
      "Böj tillbaka till 90° i armbågen. Byt sida.",
    ],
    ["Överarmen sjunker under rörelsen", "Svingar vikten"],
  ),
  "Goblet squat med hantel": g(
    "Goblet_Squat",
    [
      "Håll hanteln lodrätt mot bröstet med båda händerna.",
      "Stå lite bredare än höftbrett med tårna lätt utåt.",
      "Sitt ner mellan hälarna med rak rygg tills låren är minst parallella med golvet.",
      "Pressa upp genom hela foten.",
    ],
    ["Hälarna lyfter", "Knäna faller inåt"],
  ),
  "Utfallssteg med hantlar": g(
    "Dumbbell_Lunges",
    [
      "Stå med en hantel i varje hand.",
      "Ta ett långt kliv framåt.",
      "Sänk bakre knät mot golvet tills båda knäna är i ca 90°.",
      "Tryck ifrån med främre foten tillbaka till start. Växla ben.",
    ],
    ["För kort kliv – främre knät går långt förbi tårna", "Lutar överkroppen framåt"],
  ),
  "Bulgarisk utfallsböj": g(
    "Split_Squat_with_Dumbbells",
    [
      "Stå med ryggen mot bänken och lägg bakre fotens ovansida på bänken.",
      "Hantlar i händerna, främre foten en bra bit fram.",
      "Sänk dig rakt ner tills främre låret är nästan parallellt med golvet.",
      "Pressa upp genom främre hälen. Alla reps på ena benet först.",
    ],
    ["Står för nära bänken", "Främre knät faller inåt"],
  ),
  "Step-ups med hantlar": g(
    "Dumbbell_Step_Ups",
    [
      "Stå framför bänken eller lådan med en hantel i varje hand.",
      "Sätt hela ena foten på bänken.",
      "Kliv upp genom att trycka med den foten, inte genom att skjuta ifrån med det nedre benet.",
      "Kliv ner kontrollerat. Byt ben.",
    ],
    ["Skjuter ifrån med nedre foten", "För hög låda – ryggen rundas"],
  ),
  "Rumänska marklyft med hantlar": g(
    "Stiff-Legged_Dumbbell_Deadlift",
    [
      "Stå höftbrett med hantlarna framför låren.",
      "Lätt böjda knän som du håller still.",
      "Skjut höften bakåt och låt hantlarna glida nära benen ner till mitten av underbenen.",
      "Res dig genom att föra fram höften och spänna sätet.",
    ],
    ["Rundar ryggen", "Böjer knäna för mycket – det blir en knäböj"],
  ),
  "Höftlyft med hantel": g(
    "Barbell_Hip_Thrust",
    [
      "Sitt på golvet med övre delen av ryggen mot bänkens kant.",
      "Lägg hanteln på höften och håll den med händerna. Fötterna i golvet, knäna böjda.",
      "Pressa upp höften tills kroppen är rak från knä till axlar.",
      "Kläm sätet en sekund och sänk.",
    ],
    ["Svankar i toppen i stället för att spänna sätet", "Fötterna för långt fram"],
  ),
  "Tåhävningar med hantlar": g(
    "Standing_Dumbbell_Calf_Raise",
    [
      "Stå på en trappkant med fotbladen, hantlar i händerna.",
      "Sänk hälarna så långt det går.",
      "Res dig så högt upp på tårna du kan.",
      "Håll en sekund i toppen och sänk långsamt.",
    ],
    ["Studsar", "Kort rörelse"],
  ),
  "Farmers walk": g(
    "Farmers_Walk",
    [
      "Lyft två tunga hantlar med rak rygg.",
      "Stå rakt, axlarna bakåt och nedåt, spänd mage.",
      "Gå med korta, kontrollerade steg under hela tiden.",
      "Ställ ner hantlarna med rak rygg.",
    ],
    ["Lutar åt sidan eller rundar axlarna", "För långa steg"],
  ),
  "Thrusters med hantlar": g(
    "Kettlebell_Thruster",
    [
      "Håll hantlarna vid axlarna, fötterna axelbrett.",
      "Gör en djup knäböj.",
      "Res dig explosivt och använd farten till att pressa hantlarna över huvudet.",
      "Sänk vikterna till axlarna och gå direkt ner i nästa knäböj.",
    ],
    ["Stannar mellan knäböj och press", "Hälarna lyfter i botten"],
  ),
  "Rysk twist med hantel": g(
    "Russian_Twist",
    [
      "Sitt med böjda knän och luta dig bakåt ca 45° med rak rygg.",
      "Håll hanteln med båda händerna framför bröstet. Lyft fötterna om du orkar.",
      "Rotera överkroppen och för hanteln mot ena höften.",
      "Rotera till andra sidan. En rep = båda sidorna.",
    ],
    ["Rundar ryggen", "Bara armarna rör sig, inte överkroppen"],
  ),

  // Kettlebells --------------------------------------------------------------
  Kettlebellswing: g(
    "One-Arm_Kettlebell_Swings",
    [
      "Stå lite bredare än höftbrett med klockan en bit framför dig.",
      "Fäll i höften, greppa med båda händerna och dra klockan bakåt mellan benen.",
      "Skjut fram höften explosivt så att klockan flyger upp till brösthöjd. Armarna bara följer med.",
      "Låt klockan falla tillbaka och fäll i höften igen.",
    ],
    ["Gör en knäböj i stället för en höftfällning", "Lyfter med armarna"],
  ),
  "Goblet squat med kettlebell": g(
    "Goblet_Squat",
    [
      "Håll klockan i hornen mot bröstet.",
      "Stå lite bredare än höftbrett med tårna lätt utåt.",
      "Sitt ner djupt med rak rygg och armbågarna innanför knäna.",
      "Pressa upp genom hela foten.",
    ],
    ["Hälarna lyfter", "Ryggen rundas i botten"],
  ),
  "Kettlebell-marklyft": g(
    undefined,
    [
      "Stå med klockan mellan fötterna.",
      "Fäll i höften och böj knäna lätt. Greppa handtaget med båda händerna och rak rygg.",
      "Res dig genom att trycka i golvet och föra fram höften.",
      "Sänk klockan på samma sätt.",
    ],
    ["Rundar ryggen", "Klockan för långt fram"],
  ),
  "Turkish get-up": g(
    "Kettlebell_Turkish_Get-Up_Lunge_style",
    [
      "Ligg på rygg med klockan i rak arm över bröstet och samma sidas knä böjt.",
      "Rulla upp på motsatt armbåge och sedan upp på handen. Titta hela tiden på klockan.",
      "Lyft höften, för det raka benet bakåt till knästående.",
      "Res dig upp. Gör hela rörelsen baklänges ner igen.",
    ],
    ["Tappar blicken från klockan", "Armen böjs – håll den rak hela tiden"],
  ),
  "Kettlebell clean & press": g(
    "One-Arm_Kettlebell_Clean",
    [
      "Starta som en sving med en hand.",
      "Dra klockan nära kroppen upp till axeln. Den rullar runt handen till racked position, vilande mot underarmen.",
      "Spänn mage och säte och pressa klockan rakt upp.",
      "Sänk till axeln, sedan tillbaka mellan benen.",
    ],
    ["Klockan slår i underarmen – håll den nära kroppen", "Svankar i pressen"],
  ),
  Kettlebellrodd: g(
    "One-Arm_Kettlebell_Row",
    [
      "Stå i ett brett steg eller stöd handen mot bänken, ryggen rak.",
      "Låt klockan hänga i rak arm.",
      "Dra klockan mot höften med armbågen nära kroppen.",
      "Sänk kontrollerat. Byt sida.",
    ],
    ["Roterar överkroppen", "Rundar ryggen"],
  ),
  "Kettlebell snatch": g(
    "One-Arm_Kettlebell_Snatch",
    [
      "Starta som en sving med en hand.",
      "Skjut fram höften och dra klockan nära kroppen uppåt.",
      "Stansa handen genom handtaget så att klockan landar mjukt i rak arm över huvudet.",
      "Låt den falla tillbaka till sving. Byt sida.",
    ],
    ["Klockan slår i underarmen", "Lyfter med armen i stället för höften"],
  ),
  Halo: g(
    undefined,
    [
      "Stå stadigt och håll klockan upp och ner i hornen framför bröstet.",
      "För klockan runt huvudet nära kroppen.",
      "Håll mage och säte spända så att kroppen står still.",
      "Byt håll varannan rep.",
    ],
    ["Svankar", "För klockan för långt från huvudet"],
  ),
  "Suitcase carry": g(
    undefined,
    [
      "Lyft en tung klocka i ena handen, som en resväska.",
      "Stå helt rakt – luta dig inte åt något håll.",
      "Gå med lugna steg under hela tiden.",
      "Byt hand och gå lika länge.",
    ],
    ["Lutar mot klockan eller bort från den", "Drar upp axeln"],
  ),

  // Multigym -----------------------------------------------------------------
  Latsdrag: g(
    "Wide-Grip_Lat_Pulldown",
    [
      "Sitt med låren under dynan och greppa stången brett.",
      "Luta dig lite bakåt med bröstet upp.",
      "Dra stången till övre bröstet genom att föra armbågarna ner mot sidorna.",
      "Släpp upp kontrollerat tills armarna är raka.",
    ],
    ["Drar bakom nacken", "Gungar bakåt för att få ner vikten"],
  ),
  "Latsdrag med smalt grepp": g(
    "V-Bar_Pulldown",
    [
      "Sätt på ett smalt eller V-format handtag.",
      "Sitt med låren under dynan, bröstet upp.",
      "Dra handtaget mot bröstet med armbågarna nära kroppen.",
      "Släpp upp kontrollerat.",
    ],
    ["Lutar sig långt bakåt", "Kort rörelse – sträck armarna helt överst"],
  ),
  "Sittande kabelrodd": g(
    "Seated_Cable_Rows",
    [
      "Sitt med fötterna mot stödet och lätt böjda knän.",
      "Greppa handtaget med rak rygg och raka armar.",
      "Dra handtaget mot magen och kläm ihop skulderbladen.",
      "Sträck armarna igen utan att runda ryggen.",
    ],
    ["Gungar fram och tillbaka med överkroppen", "Drar upp axlarna"],
  ),
  "Raka armar pulldown": g(
    "Straight-Arm_Pulldown",
    [
      "Stå framför övre taljan och greppa stången axelbrett.",
      "Fäll lätt i höften, armarna nästan raka.",
      "Dra stången i en båge ner mot låren med raka armar.",
      "Släpp upp till ögonhöjd.",
    ],
    ["Böjer armarna – det blir en triceps-övning", "Svankar"],
  ),
  "Face pulls": g(
    "Face_Pull",
    [
      "Sätt ett rep i övre taljan i ansiktshöjd.",
      "Greppa repändarna med tummarna mot dig och kliv bakåt tills armarna är raka.",
      "Dra repet mot ansiktet med armbågarna högt och ut åt sidorna.",
      "Dra isär repändarna i slutet, släpp sedan tillbaka.",
    ],
    ["Armbågarna sjunker – det blir en rodd", "För tung vikt"],
  ),
  "Triceps pushdown": g(
    "Triceps_Pushdown",
    [
      "Stå framför övre taljan med stången i bröstgrepp.",
      "Lås armbågarna mot sidorna.",
      "Pressa stången nedåt tills armarna är helt raka.",
      "Låt stången komma upp till ca 90° i armbågen.",
    ],
    ["Armbågarna glider fram och bak", "Lutar sig över stången"],
  ),
  "Triceps overhead med kabel": g(
    "Triceps_Overhead_Extension_with_Rope",
    [
      "Greppa repet i övre (eller nedre) taljan och vänd ryggen mot maskinen.",
      "Kliv fram i ett steg och håll händerna bakom huvudet, armbågarna pekar framåt.",
      "Sträck armarna framåt/uppåt tills de är raka.",
      "Böj tillbaka kontrollerat.",
    ],
    ["Armbågarna glider isär", "Svankar"],
  ),
  "Bicepscurl i låg talja": g(
    "Standing_Biceps_Cable_Curl",
    [
      "Stå framför nedre taljan med stången i underhandsgrepp.",
      "Armbågarna intill sidorna.",
      "Curla upp stången mot bröstet.",
      "Sänk tills armarna är raka.",
    ],
    ["Gungar med kroppen", "Armbågarna åker framåt"],
  ),
  "Bröstpress i maskin": g(
    "Machine_Bench_Press",
    [
      "Ställ in sätet så att handtagen är i höjd med mitten av bröstet.",
      "Rygg och skulderblad mot dynan.",
      "Pressa handtagen framåt tills armarna nästan är raka.",
      "För tillbaka långsamt utan att vikterna slår i.",
    ],
    ["Fel sitthöjd – handtagen i axelhöjd", "Axlarna lyfter från dynan"],
  ),
  Butterfly: g(
    "Butterfly",
    [
      "Ställ in sätet så att armarna är i axelhöjd.",
      "Lägg underarmarna eller händerna mot handtagen med lätt böjda armbågar.",
      "För ihop armarna framför bröstet.",
      "Låt dem gå tillbaka tills du känner stretch i bröstet.",
    ],
    ["Rycker", "Lutar sig fram från ryggstödet"],
  ),
  Benspark: g(
    "Leg_Extensions",
    [
      "Sitt med knäna i linje med maskinens led och dynan mot nedre delen av smalbenen.",
      "Håll i handtagen.",
      "Sträck benen helt.",
      "Sänk långsamt utan att vikterna slår i.",
    ],
    ["Sparkar upp vikten med fart", "Lyfter rumpan från sätet"],
  ),
  Lårcurl: g(
    "Lying_Leg_Curls",
    [
      "Ställ in dynan så att den ligger strax ovanför hälarna (liggande, sittande eller stående – beroende på maskin).",
      "Knäna i linje med maskinens led.",
      "Böj benen och dra hälarna mot sätet.",
      "Sänk långsamt.",
    ],
    ["Lyfter höften", "Kort rörelse"],
  ),
  Kabelcrunch: g(
    "Cable_Crunch",
    [
      "Stå på knä framför övre taljan och håll repet vid huvudet.",
      "Håll höften stilla.",
      "Rulla ihop överkroppen nedåt mot knäna med magmusklerna.",
      "Rulla tillbaka upp kontrollerat.",
    ],
    ["Drar med armarna", "Sätter sig ner på hälarna"],
  ),
  "Pallof press": g(
    "Pallof_Press",
    [
      "Stå med sidan mot taljan, handtaget i brösthöjd med båda händerna.",
      "Kliv ut tills det drar i kabeln. Fötterna axelbrett, mjuka knän.",
      "Pressa handtaget rakt fram och stå emot vridningen.",
      "För tillbaka till bröstet. Byt sida.",
    ],
    ["Roterar med kroppen", "Står för nära – inget motstånd"],
  ),

  // Kondition ----------------------------------------------------------------
  "Rodd – jämn distans": g(
    "Rowing_Stationary",
    [
      "Fötterna fast i remmarna, greppa handtaget med raka armar.",
      "Tryck ifrån med benen först.",
      "Luta dig lite bakåt och dra handtaget mot nedre bröstet.",
      "Tillbaka i omvänd ordning: armar, överkropp, ben. Håll ett jämnt tempo.",
    ],
    ["Drar med armarna innan benen är raka", "Rundar ryggen"],
  ),
  "Rodd – intervaller": g(
    "Rowing_Stationary",
    [
      "Värm upp 3–5 min i lugnt tempo.",
      "Ro hårt den bestämda distansen eller tiden (t.ex. 250 m).",
      "Vila aktivt med lugn rodd eller helt stilla under vilan.",
      "Upprepa. Logga total tid och distans.",
    ],
    ["Går ut för hårt i första intervallet", "Tappar tekniken när det blir jobbigt"],
  ),
  "Uppvärmning rodd": g(
    "Rowing_Stationary",
    ["Ro lugnt i 5 minuter.", "Börja med bara ben, lägg sedan till överkropp och armar.", "Öka tempot lite mot slutet."],
    ["Börjar för hårt"],
  ),
  "Cykel – jämnt tempo": g(
    "Bicycling_Stationary",
    [
      "Ställ in sadeln så att benet är nästan rakt i nedersta läget.",
      "Välj ett motstånd där du kan prata korta meningar.",
      "Håll jämn kadens (ca 80–90 varv/min).",
    ],
    ["För låg sadel – sliter på knäna"],
  ),
  "Cykel – intervaller": g(
    "Bicycling_Stationary",
    [
      "Värm upp 5 min lugnt.",
      "Trampa hårt i t.ex. 30 s.",
      "Trampa lätt i 30 s.",
      "Upprepa 8–10 gånger och varva ner.",
    ],
    ["För lågt motstånd i de hårda delarna"],
  ),
  "Uppvärmning cykel": g(
    "Bicycling_Stationary",
    ["Trampa lugnt i 5 minuter.", "Öka motståndet lite de sista minuterna."],
    ["Börjar för hårt"],
  ),
  "Löpning – jämnt tempo": g(
    "Jogging_Treadmill",
    [
      "Börja med några minuters gång.",
      "Öka till ett tempo där du kan prata.",
      "Korta, lätta steg och rak hållning. Håll inte i handtagen.",
    ],
    ["Håller i handtagen", "För långa steg"],
  ),
  "Löpning – intervaller": g(
    "Jogging_Treadmill",
    [
      "Värm upp 5 min.",
      "Spring snabbt i t.ex. 2 min.",
      "Gå eller jogga lugnt i 1 min.",
      "Upprepa och varva ner.",
    ],
    ["Hoppar av bandet i farten – sänk farten först"],
  ),

  // Kroppsvikt ---------------------------------------------------------------
  Armhävningar: g(
    "Pushups",
    [
      "Händerna lite bredare än axlarna, kroppen rak från huvud till häl.",
      "Spänn mage och säte.",
      "Sänk bröstet mot golvet med armbågarna ca 45° från kroppen.",
      "Pressa upp. För lätt? Höj fötterna. För tungt? Gör på knä.",
    ],
    ["Höften hänger eller sticker upp", "Halvt rörelseomfång"],
  ),
  "Dips mellan bänkar": g(
    "Bench_Dips",
    [
      "Händerna på bänkkanten bakom dig, fingrarna framåt.",
      "Benen raka fram (lättare med böjda knän).",
      "Sänk dig tills armbågarna är ca 90°.",
      "Pressa upp.",
    ],
    ["Går för djupt – belastar axlarna", "Armbågarna pekar ut åt sidorna"],
  ),
  Knäböj: g(
    "Bodyweight_Squat",
    [
      "Stå axelbrett med tårna lätt utåt.",
      "Sträck armarna framåt eller håll händerna bakom huvudet.",
      "Sitt ner bakåt och nedåt så djupt du kan med rak rygg.",
      "Pressa upp genom hela foten.",
    ],
    ["Hälarna lyfter", "Knäna faller inåt"],
  ),
  "Utfall bakåt": g(
    "Dumbbell_Rear_Lunge",
    [
      "Stå med fötterna ihop.",
      "Ta ett långt kliv bakåt.",
      "Sänk bakre knät mot golvet.",
      "Tryck tillbaka med främre foten. Växla ben (eller gör alla reps per ben).",
    ],
    ["Främre knät faller inåt", "Lutar överkroppen framåt"],
  ),
  "Höftlyft på golvet": g(
    "Butt_Lift_Bridge",
    [
      "Ligg på rygg med böjda knän, fötterna i golvet nära rumpan.",
      "Armarna längs sidorna.",
      "Pressa upp höften genom hälarna tills kroppen är rak från knä till axlar.",
      "Kläm sätet en sekund och sänk.",
    ],
    ["Svankar i toppen", "Trycker med tårna i stället för hälarna"],
  ),
  Planka: g(
    "Plank",
    [
      "Underarmarna i golvet med armbågarna under axlarna.",
      "Sträck ut benen och stå på tårna.",
      "Kroppen rak från huvud till häl – spänn mage och säte.",
      "Andas lugnt och håll positionen.",
    ],
    ["Höften hänger", "Rumpan sticker upp"],
  ),
  Sidoplanka: g(
    "Side_Bridge",
    [
      "Ligg på sidan med armbågen under axeln och benen raka.",
      "Lyft höften tills kroppen är rak.",
      "Håll tiden. Byt sida.",
    ],
    ["Höften sjunker", "Roterar framåt"],
  ),
  "Dead bug": g(
    "Dead_Bug",
    [
      "Ligg på rygg med armarna rakt upp och knäna i 90° över höften.",
      "Pressa ländryggen mot golvet.",
      "Sträck ut motsatt arm och ben långsamt mot golvet.",
      "För tillbaka och byt sida. En rep = båda sidorna.",
    ],
    ["Ländryggen släpper från golvet", "För snabbt"],
  ),
  "Mountain climbers": g(
    "Mountain_Climbers",
    [
      "Starta i armhävningsposition med händerna under axlarna.",
      "Dra ett knä mot bröstet.",
      "Byt ben snabbt, som om du springer på stället.",
      "Håll höften låg och stilla.",
    ],
    ["Höften åker upp", "Axlarna hamnar bakom händerna"],
  ),
  Burpees: g(
    undefined,
    [
      "Stå upp, sätt händerna i golvet framför fötterna.",
      "Hoppa bakåt med fötterna till armhävningsposition (gör gärna en armhävning).",
      "Hoppa fram med fötterna till händerna.",
      "Hoppa upp och klappa händerna över huvudet.",
    ],
    ["Höften hänger i planka-läget", "Landar hårt – landa mjukt"],
  ),
  Tåhävningar: g(
    "Standing_Dumbbell_Calf_Raise",
    [
      "Stå på en trappkant med fotbladen. Håll i något för balans.",
      "Sänk hälarna så långt det går.",
      "Res dig så högt upp på tårna du kan.",
      "Svårare: ett ben i taget.",
    ],
    ["Studsar", "Kort rörelse"],
  ),
};

export function guideFor(name: string): ExerciseGuide | undefined {
  return GUIDES[name];
}
