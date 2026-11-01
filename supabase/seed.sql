-- Gymma Hemma: redskap och startövningar. Kan köras flera gånger.

insert into public.gym_equipment (id, name, emoji, weight_step, sort) values
  ('hantlar',     'Hantlar',     '🏋️', 2,   1),
  ('kettlebell',  'Kettlebells', '🔔', 4,   2),
  ('multigym',    'Multigym',    '⚙️', 5,   3),
  ('roddmaskin',  'Roddmaskin',  '🚣', 0,   4),
  ('cykel',       'Motionscykel','🚴', 0,   5),
  ('lopband',     'Löpband',     '🏃', 0,   6),
  ('kroppsvikt',  'Kroppsvikt',  '🤸', 0,   7)
on conflict (id) do nothing;

insert into public.gym_exercises
  (name, equipment_id, primary_muscle, secondary_muscles, measure, is_compound, unilateral, description)
values
  -- Hantlar ------------------------------------------------------------------
  ('Hantelpress på bänk',        'hantlar','chest',     '{triceps,shoulders}','weight_reps',true, false,'Ligg på bänk, pressa hantlarna rakt upp över bröstet. Vikt per hantel.'),
  ('Lutande hantelpress',        'hantlar','chest',     '{shoulders,triceps}','weight_reps',true, false,'Bänk i 30–45°. Fokus på övre bröst.'),
  ('Hantelflyes',                'hantlar','chest',     '{shoulders}',        'weight_reps',false,false,'Lätt böjda armar, sänk ut åt sidorna och för ihop.'),
  ('Enarmsrodd med hantel',      'hantlar','back',      '{biceps}',           'weight_reps',true, true, 'Stöd hand och knä på bänk, dra hanteln mot höften. Reps per sida.'),
  ('Framåtböjd hantelrodd',      'hantlar','back',      '{biceps,core}',      'weight_reps',true, false,'Rak rygg, fällt fram i höften, dra båda hantlar mot magen.'),
  ('Pullover med hantel',        'hantlar','back',      '{chest}',            'weight_reps',false,false,'Ligg tvärs över bänk, för hanteln bakom huvudet och tillbaka.'),
  ('Axelpress med hantlar',      'hantlar','shoulders', '{triceps}',          'weight_reps',true, false,'Sittande eller stående, pressa hantlarna rakt upp.'),
  ('Sidolyft',                   'hantlar','shoulders', '{}',                 'weight_reps',false,false,'Lyft armarna ut åt sidorna till axelhöjd.'),
  ('Omvända flyes',              'hantlar','shoulders', '{back}',             'weight_reps',false,false,'Framåtböjd, lyft armarna ut åt sidorna. Baksida axel.'),
  ('Arnoldpress',                'hantlar','shoulders', '{triceps}',          'weight_reps',true, false,'Starta med handflatorna mot dig och rotera under pressen.'),
  ('Bicepscurl med hantlar',     'hantlar','biceps',    '{}',                 'weight_reps',false,false,'Stå still i överkroppen och curla upp.'),
  ('Hammercurl',                 'hantlar','biceps',    '{}',                 'weight_reps',false,false,'Neutralt grepp, tummarna uppåt.'),
  ('Fransk press med hantel',    'hantlar','triceps',   '{}',                 'weight_reps',false,false,'Liggande eller sittande, sänk hanteln bakom huvudet.'),
  ('Kickbacks',                  'hantlar','triceps',   '{}',                 'weight_reps',false,true, 'Framåtböjd, sträck armen bakåt. Reps per sida.'),
  ('Goblet squat med hantel',    'hantlar','quads',     '{glutes,core}',      'weight_reps',true, false,'Håll hanteln mot bröstet och sitt djupt.'),
  ('Utfallssteg med hantlar',    'hantlar','quads',     '{glutes,hamstrings}','weight_reps',true, true, 'Kliv fram, sänk bakre knät mot golvet. Reps per ben.'),
  ('Bulgarisk utfallsböj',       'hantlar','quads',     '{glutes}',           'weight_reps',true, true, 'Bakre foten på bänk. Reps per ben.'),
  ('Step-ups med hantlar',       'hantlar','quads',     '{glutes}',           'weight_reps',true, true, 'Kliv upp på bänk eller låda. Reps per ben.'),
  ('Rumänska marklyft med hantlar','hantlar','hamstrings','{glutes,back}',    'weight_reps',true, false,'Lätt böjda knän, fäll i höften med rak rygg.'),
  ('Höftlyft med hantel',        'hantlar','glutes',    '{hamstrings}',       'weight_reps',true, false,'Övre rygg mot bänk, hantel på höften, pressa upp.'),
  ('Tåhävningar med hantlar',    'hantlar','calves',    '{}',                 'weight_reps',false,false,'Gärna på ett trappsteg för fullt rörelseomfång.'),
  ('Farmers walk',               'hantlar','fullbody',  '{core}',             'time',       true, false,'Gå med tunga hantlar i händerna. Logga tid.'),
  ('Thrusters med hantlar',      'hantlar','fullbody',  '{quads,shoulders}',  'weight_reps',true, false,'Knäböj direkt följt av axelpress i ett flöde.'),
  ('Rysk twist med hantel',      'hantlar','core',      '{}',                 'reps',       false,false,'Sitt med lyfta fötter och rotera hanteln sida till sida.'),

  -- Kettlebells --------------------------------------------------------------
  ('Kettlebellswing',            'kettlebell','glutes',   '{hamstrings,core}', 'weight_reps',true, false,'Explosiv höftfällning, låt klockan flyga till brösthöjd.'),
  ('Goblet squat med kettlebell','kettlebell','quads',    '{glutes,core}',     'weight_reps',true, false,'Håll klockan i hornen mot bröstet.'),
  ('Kettlebell-marklyft',        'kettlebell','hamstrings','{glutes,back}',    'weight_reps',true, false,'Klockan mellan fötterna, lyft med rak rygg.'),
  ('Turkish get-up',             'kettlebell','fullbody', '{shoulders,core}',  'weight_reps',true, true, 'Från liggande till stående med klockan över huvudet. Reps per sida.'),
  ('Kettlebell clean & press',   'kettlebell','shoulders','{fullbody}',        'weight_reps',true, true, 'Vänd upp klockan till racked position och pressa. Reps per sida.'),
  ('Kettlebellrodd',             'kettlebell','back',     '{biceps}',          'weight_reps',true, true, 'Framåtböjd enarmsrodd. Reps per sida.'),
  ('Kettlebell snatch',          'kettlebell','fullbody', '{shoulders,glutes}','weight_reps',true, true, 'Från sving direkt upp över huvudet. Reps per sida.'),
  ('Halo',                       'kettlebell','shoulders','{core}',            'weight_reps',false,false,'Cirkla klockan runt huvudet, byt håll.'),
  ('Suitcase carry',             'kettlebell','core',     '{fullbody}',        'time',       false,true, 'Bär en klocka i ena handen utan att luta dig. Tid per sida.'),

  -- Multigym -----------------------------------------------------------------
  ('Latsdrag',                   'multigym','back',     '{biceps}',     'weight_reps',true, false,'Brett grepp, dra stången till övre bröstet.'),
  ('Latsdrag med smalt grepp',   'multigym','back',     '{biceps}',     'weight_reps',true, false,'Smalt/neutralt grepp, dra till bröstet.'),
  ('Sittande kabelrodd',         'multigym','back',     '{biceps}',     'weight_reps',true, false,'Rak rygg, dra handtaget mot magen.'),
  ('Raka armar pulldown',        'multigym','back',     '{}',           'weight_reps',false,false,'Raka armar, dra stången från ögonhöjd ner mot låren.'),
  ('Face pulls',                 'multigym','shoulders','{back}',       'weight_reps',false,false,'Rep från övre talja, dra mot ansiktet med armbågarna högt.'),
  ('Triceps pushdown',           'multigym','triceps',  '{}',           'weight_reps',false,false,'Armbågarna mot sidan, pressa ner.'),
  ('Triceps overhead med kabel', 'multigym','triceps',  '{}',           'weight_reps',false,false,'Vänd ryggen mot taljan och sträck armarna framåt/upp.'),
  ('Bicepscurl i låg talja',     'multigym','biceps',   '{}',           'weight_reps',false,false,'Stå framför nedre taljan och curla upp.'),
  ('Bröstpress i maskin',        'multigym','chest',    '{triceps,shoulders}','weight_reps',true,false,'Pressa handtagen framåt, kontrollerat tillbaka.'),
  ('Butterfly',                  'multigym','chest',    '{}',           'weight_reps',false,false,'För ihop armarna framför bröstet.'),
  ('Benspark',                   'multigym','quads',    '{}',           'weight_reps',false,false,'Sträck benen helt, sänk kontrollerat.'),
  ('Lårcurl',                    'multigym','hamstrings','{}',          'weight_reps',false,false,'Böj benen mot sätet.'),
  ('Kabelcrunch',                'multigym','core',     '{}',           'weight_reps',false,false,'Knästående, rulla ihop överkroppen mot övre taljan.'),
  ('Pallof press',               'multigym','core',     '{}',           'weight_reps',false,true, 'Stå i sidled mot taljan och pressa rakt fram utan att rotera.'),

  -- Kondition ----------------------------------------------------------------
  ('Rodd – jämn distans',        'roddmaskin','cardio','{back,quads}', 'cardio',true,false,'Jämnt tempo, logga tid och meter.'),
  ('Rodd – intervaller',         'roddmaskin','cardio','{back,quads}', 'cardio',true,false,'T.ex. 8 × 250 m med 1 min vila.'),
  ('Cykel – jämnt tempo',        'cykel',     'cardio','{quads}',      'cardio',false,false,'Lugnt till medelhårt tempo.'),
  ('Cykel – intervaller',        'cykel',     'cardio','{quads}',      'cardio',false,false,'T.ex. 30 s hårt / 30 s lätt.'),
  ('Löpning – jämnt tempo',      'lopband',   'cardio','{quads,calves}','cardio',false,false,'Jämnt tempo, logga tid och distans.'),
  ('Löpning – intervaller',      'lopband',   'cardio','{quads,calves}','cardio',false,false,'T.ex. 6 × 2 min snabbt med 1 min gång.'),
  ('Uppvärmning rodd',           'roddmaskin','cardio','{fullbody}',   'cardio',false,false,'5 min lugnt.'),
  ('Uppvärmning cykel',          'cykel',     'cardio','{fullbody}',   'cardio',false,false,'5 min lugnt.'),

  -- Kroppsvikt ---------------------------------------------------------------
  ('Armhävningar',               'kroppsvikt','chest',     '{triceps,shoulders,core}','reps',true, false,'Rak kropp från huvud till häl.'),
  ('Dips mellan bänkar',         'kroppsvikt','triceps',   '{chest}',      'reps',true, false,'Händerna på en bänk bakom dig.'),
  ('Knäböj',                     'kroppsvikt','quads',     '{glutes}',     'reps',true, false,'Kroppsviktsknäböj, sitt djupt.'),
  ('Utfall bakåt',               'kroppsvikt','quads',     '{glutes}',     'reps',true, true, 'Kliv bakåt. Reps per ben.'),
  ('Höftlyft på golvet',         'kroppsvikt','glutes',    '{hamstrings}', 'reps',false,false,'Ligg på rygg, pressa upp höften.'),
  ('Planka',                     'kroppsvikt','core',      '{shoulders}',  'time',false,false,'Raka linjer, spänn mage och säte.'),
  ('Sidoplanka',                 'kroppsvikt','core',      '{}',           'time',false,true, 'Tid per sida.'),
  ('Dead bug',                   'kroppsvikt','core',      '{}',           'reps',false,false,'Ländryggen i golvet, sträck motsatt arm och ben.'),
  ('Mountain climbers',          'kroppsvikt','cardio',    '{core}',       'time',false,false,'Snabba knän mot bröstet i plankposition.'),
  ('Burpees',                    'kroppsvikt','fullbody',  '{cardio}',     'reps',true, false,'Ner i armhävning, upp i hopp.'),
  ('Tåhävningar',                'kroppsvikt','calves',    '{}',           'reps',false,false,'På ett trappsteg, gärna ett ben i taget.')
on conflict (name, equipment_id) do nothing;
