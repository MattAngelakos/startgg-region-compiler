import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { createGameForPlayer, createPlayer, filterPlayers, getPlayer } from './data/players.js';
import { createRegion, getRegion, removeRegion } from './data/regions.js';
import { addPlayers, createSeason } from './data/seasons.js';
import { createUser } from './data/accounts.js';
import { do_h2h, filters, finish_h2h, getEventResultsByRegion, playerEligible, playerFilter, searchForPlayer, seasonFilter, setsRequest, sortOpponents, sortTournaments, tournamentFilter } from './data/playerData.js';
import { getMainTournament } from './data/tournaments.js';
import { createGame } from './data/games.js';
// const db = await dbConnection();
// await db.dropDatabase();
// let user
// try{
//     user = await createUser("Tabby", "Password1!", "mangelak@stevens.edu", "Admin");
// }catch (e) {
//     console.log(e);
// }
// let game
// try{
//     game = await createGame(1386)
//     console.log(game)
// }
// catch (e) {
//     console.log(e);
// }
// let nyc
// try {
//     nyc = await createRegion("NYC", 1386, false, 8, 3, 1, "NYC", 3, '67744c9e04e6435db0ca2c17');
//     console.log(nyc);
// } catch (e) {
//     console.log(e);
// }

// let q1_2026
// try {
//     q1_2026 = await createSeason('67744c9e04e6435db0ca2c18', "q2_2026", 2026, 4, 1, 2026, 7, 1)
//     console.log(q1_2026);
// }
// catch (e){
//     console.log(e);
// }

// let syrup 
// try {
//     syrup = await createPlayer(1605499)
//     syrup = await createPlayer(1138799)
//     syrup = await createPlayer(6301)
//     console.log(syrup);
// }
// catch (e){
//     console.log(e);
// }
// // let smashUlt
// try {
//     smashUlt = await createGameForPlayer(1605499, 1386)
//     smashUlt = await createGameForPlayer(1138799, 1386)
//     smashUlt = await createGameForPlayer(6301, 1386)
//     console.log(smashUlt);
// }
// catch (e){
//     console.log(e);
// }
try {
    // console.log(await setsRequest(370802, 1386)) //Zomba
    // console.log(await setsRequest(414731, 1386))//PkChris
    // console.log(await setsRequest(160103, 1386))//Gen
    // console.log(await setsRequest(1331707, 1386))//Layla
    // console.log(await setsRequest(1005189, 1386))//Quidd
    // console.log(await setsRequest(1650136, 1386))//Amayne
    // console.log(await setsRequest(1480033, 1386))//Gh0st
    // console.log(await setsRequest(1972274, 1386))//Cody
    // console.log(await setsRequest(1852344, 1386))//Karflo
    // console.log(await setsRequest(185802, 1386))//EJJ
    // console.log(await setsRequest(3321192, 1386))//Zuhiy
    // console.log(await setsRequest(152534, 1386))//SoulArts
    // console.log(await setsRequest(2516567, 1386))//Hikari
    // console.log(await setsRequest(1157788, 1386))//Glutamate
    //console.log(await setsRequest(2519248, 1386))//ZTN
    //console.log(await setsRequest(680006, 1386))//Wheezer
    // console.log(await setsRequest(415862, 1386))//Reed
    // console.log(await setsRequest(181830, 1386))//Vivi
    // console.log(await setsRequest(1825040, 1386))//Vitz
    //console.log(await setsRequest(241491, 1386))//Myles 

    //console.log(await setsRequest(1216463, 1386)) //syrup
    // console.log(await setsRequest(1071129, 1386))//Pharaoh
    //console.log(await setsRequest(231113, 1386))//Jakal 
    //console.log(await setsRequest(1064188, 1386))//Yeast 
    //console.log(await setsRequest(2220603, 1386))//Fhantum 
    // console.log(await setsRequest(54394, 1386))//Sumgai 
    // console.log(await setsRequest(662541, 1386))//Delta 
    //console.log(await setsRequest(1760115, 1386))//Synnister 
    //console.log(await setsRequest(15768, 1386))//Tweek 
    //console.log(await setsRequest(1463554, 1386))//Ant 
    // console.log(await setsRequest(1031199, 1386))//Obmcbob 
    //console.log(await setsRequest(1931564, 1386))//Petayaa 
    //console.log(await setsRequest(1797847, 1386))//Mr Thugz
    //console.log(await setsRequest(616232, 1386))//BeatyBean
    //console.log(await setsRequest(6301, 1386))//Rivers
    //console.log(await setsRequest(1138799, 1386))//9sp
    //console.log(await setsRequest(1605499, 1386))//Luigikid64
    //console.log(await setsRequest(942751, 1386))//Apple Reviewer
    //console.log(await setsRequest(2010954, 1386))//Char
    // console.log(await setsRequest(467656, 1386))//Fawn 
    //console.log(await setsRequest(1467525, 1386))//ZiggySmols
    //console.log(await setsRequest(540839, 1386))//Justin 
    //console.log(await setsRequest(1189720, 1386))//Marvale 
    // console.log(await setsRequest(1525089, 1386))//Krugbo 
    //console.log(await setsRequest(3304742, 1386))//Pizza Ant 
    // console.log(await setsRequest(1224902, 1386))//WebbJP 
    // console.log(await setsRequest(1700217, 1386))//Floppyfail 
    //console.log(await setsRequest(1290320, 1386))//AmericanWeeaboo 

    // console.log(await setsRequest(551860, 1386))//Noodl 
    // console.log(await setsRequest(1473392, 1386))//Hoo D. Nii
    // console.log(await setsRequest(1089023, 1386))//Hunter
    // console.log(await setsRequest(147246, 1386))//Leon 
    //console.log(await setsRequest(1769202, 1386))//Aquaze
    // console.log(await setsRequest(869771, 1386))//Kipp
    // console.log(await setsRequest(278439, 1386))//Haze 
    // console.log(await setsRequest(147679, 1386))//Mateo 
    // console.log(await setsRequest(2375975, 1386))//Vars 
    // console.log(await setsRequest(1863576, 1386))//Tay 
    // console.log(await setsRequest(2896387, 1386))//g0be 
    // console.log(await setsRequest(1727992, 1386))//Abe 
    // console.log(await setsRequest(571119, 1386))//Omni 
    // console.log(await setsRequest(2285604, 1386))//CandyKongLover1 
    // console.log(await setsRequest(1802504, 1386))//Curtle 
    // console.log(await setsRequest(3746597, 1386))//Hunky Monkey 
    // console.log(await setsRequest(1710348, 1386))//Nimbus 
    // console.log(await setsRequest(3069144, 1386))//Himzoo 
    // console.log(await setsRequest(1541123, 1386))//pawn 
    // console.log(await setsRequest(2520952, 1386))//swift 
    // console.log(await setsRequest(3619477, 1386))//dino 
    // console.log(await setsRequest(1277941, 1386))//Hollow 
    // console.log(await setsRequest(757280, 1386))//Kouhai 
    // console.log(await setsRequest(1100022, 1386))//Lakia 
    // console.log(await setsRequest(1322135, 1386))//Jellyfish 
    // console.log(await setsRequest(1708272, 1386))//Cheese 
    // console.log(await setsRequest(1063242, 1386))//Glob 
    //console.log(await setsRequest(2058734, 1386))//LVL6 
    // console.log(await setsRequest(2824423, 1386))//Sunbun 
    // console.log(await setsRequest(1585721, 1386))//Mimik 
    // console.log(await setsRequest(1804989, 1386))//AABattery 
    // console.log(await setsRequest(318918, 1386))//Diamond 
    // console.log(await setsRequest(2352081, 1386))//TheRam
    // console.log(await setsRequest(1721668, 1386))//Antoine 
    // console.log(await setsRequest(151395, 1386))//Sully 
    // console.log(await setsRequest(568434, 1386))//Sobriquet Sola  
    // console.log(await setsRequest(3220848, 1386))//Kelvin 
    // console.log(await setsRequest(1509599, 1386))//Wolfric
    // console.log(await setsRequest(2553113, 1386))//FalcoJoe 
    // console.log(await setsRequest(256474, 1386))//yoBBi 
    // console.log(await setsRequest(3097780, 1386))//Seel
    // console.log(await setsRequest(3576637, 1386))//Burst(NJ)
    // console.log(await setsRequest(993562, 1386))//JuanR 
    // console.log(await setsRequest(1773770, 1386))//GFlowZ 
    // console.log(await setsRequest(1804240, 1386))//Croix
    // console.log(await setsRequest(289985, 1386))//Arcos
    //console.log(await setsRequest(1276193, 1386))//A9 
    // console.log(await setsRequest(3694907, 1386))//Sentinel 
    // console.log(await setsRequest(2636165, 1386))//Kazii 
    // console.log(await setsRequest(2785740, 1386))//Pago NJ
    // console.log(await setsRequest(47475, 1386))//Jukain
    // console.log(await setsRequest(3501232, 1386))//Angle 
    // console.log(await setsRequest(1261294, 1386))//GabeOG 
    // console.log(await setsRequest(1597032, 1386))//Hague 
    // console.log(await setsRequest(1871594, 1386))//Venera
    // console.log(await setsRequest(1412639, 1386))//Xavier
    // console.log(await setsRequest(182850, 1386))//Steezy
    // console.log(await setsRequest(147588, 1386))//Lemontea 
    // console.log(await setsRequest(3268179, 1386))//PotatoBagel 
    // console.log(await setsRequest(358391, 1386))//Vince
    // console.log(await setsRequest(1274182, 1386))//PK Freeze
    // console.log(await setsRequest(1472136, 1386))//Kasawi
    // console.log(await setsRequest(3622068, 1386))//RDOT 
     // console.log(await setsRequest(10212, 1386))//Aryeh 
}
catch (e) {
    console.log(e);
}

try {
    //await addPlayers("68dc57b3006359ec4e5d53c4", "q3_2025", [370802, 414731, 160103, 1331707, 1005189, 1650136, 1480033, 1972274, 1852344, 185802, 3321192, 152534, 2516567, 1157788, 2519248, 680006, 415862, 181830, 1825040, 241491])
} catch (e) {
    console.log(e)
}

try {
    await addPlayers("67744c9e04e6435db0ca2c18", "q2_2026", [
        2058734,
        1290320,
        1467525,
        1189720,
        2220603,
        1797847,
        1769202,
        1463554,
        616232,
        6301,
        1276193,
        15768,
        1138799,
        1760115,
        540839,
        2010954,
        942751,
        1700217,
        1931564,
        1605499,
        3304742,
        1216463,
        231113,
        1064188
   ])
} catch (e) {
   console.log(e)
}

// let tweek
// try {
//     tweek = await createPlayer(15768)
//     console.log(tweek);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     smashUlt = await createGameForPlayer(15768, 1386)
//     console.log(smashUlt);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(15768, 1386))
// }
// catch (e){
//     console.log(e);
// }
// await new Promise(r => setTimeout(r, 30000));
// let marvin
// try {
//     marvin = await createPlayer(1189720)
//     console.log(marvin);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     smashUlt = await createGameForPlayer(1189720, 1386)
//     console.log(smashUlt);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(1189720, 1386))
// }
// catch (e){
//     console.log(e);
// }

// let h2h
// try{
//     h2h = await do_h2h('666d0683e52f0853c03cdbb6', 'q2_2024')
//     console.log(h2h)
// }catch(e){
//     console.log(e)
// }
// let finished_h2h
// try{
//     finished_h2h = await finish_h2h(h2h)
//     console.log(finished_h2h)
// }catch(e){
//     console.log(e)
// }

// let nj
// try{
//     nj = await getRegion('666f1ddf2c269822c2f0b19b')
//     console.log(nj)
// }catch(e){
//     console.log(e)
// }
// let syrup
// try{
//     syrup = await seasonFilter(nj._id.toString(), 'q2_2024', 1216463)
//     console.log(syrup.games[0].tournaments)
// }catch (e) {
//     console.log(e);
// }
// try{
//     console.log(await playerEligible(nj, 'q2_2024', 1216463))
// }catch (e) {
//     console.log(e);
// }

// try{
//     console.log(await playerFilter(nj._id.toString(), 'q2_2024'))
// }catch (e) {
//     console.log(e);
// }
// try{
//     console.log(await searchForPlayer("Jo"))
// }catch (e) {
//     console.log(e);
// }
// let filtered
// try{
//     filtered = await tournamentFilter(1216463, 1386, [948374, 1133759])
//     console.log(filtered.games[0].tournaments)
// }catch (e) {
//     console.log(e);
// }
// let sorted
// try{
//     sorted = await sortTournaments(syrup, 1386, "lowestPlacement")
//     console.log(sorted.games[0].tournaments)
// }catch (e) {
//     console.log(e);
// }
// let sorted2
// try{
//     sorted2 = await sortOpponents(syrup, 1386, "highestWinrate")
//     console.log(sorted2.games[0].opponents)
// }catch (e) {
//     console.log(e);
// }
// try{
//     syrup = await getPlayer(parseInt(syrup._id))
// }catch(e){
//     console.log(e)
// }
// let filtered2 
// try{
//     filtered2 = await filters(syrup, 1386, "dateRange", 100, 0, 2024, 4, 1, 2024, 7, 1)
//     console.log(filtered2.games[0].tournaments)
// }catch (e) {
//     console.log(e);
// }
// let goml
// try{
//     goml = await getEventResultsByRegion(nj._id, "q2_2024", 570293, 948374)
//     console.log(goml[0].matches)
// }catch (e) {
//     console.log(e);
// }

// let nyc
// try {
//     nyc = await createRegion("NYC", 1386, false, 16, user._id.toString());
//     console.log(nyc);
// } catch (e) {
//     console.log(e);
// }
// let nyc
// let q2_2024
// try {
//     nyc = await getRegion('6669f141d8ca0f96719a3f34')
//     console.log(nyc);
// } catch (e) {
//     console.log(e);
// }
// let zomba 
// try {
//     zomba = await createPlayer('6669f141d8ca0f96719a3f34', 370802)
//     console.log(zomba);
// }
// catch (e){
//     console.log(e);
// }
// let q2_2024
// try {
//     q2_2024 = await createSeason('6669f141d8ca0f96719a3f34', 370802, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest('6669f141d8ca0f96719a3f34', 370802, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let mrE
// try {
//     mrE = await createPlayer(nyc._id.toString(), 15889)
//     console.log(mrE);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 15889, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 15889, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let guyguy
// try {
//     guyguy = await createPlayer(nyc._id.toString(), 1810739)
//     console.log(guyguy);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1810739, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1810739, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let pkChris
// try {
//     pkChris = await createPlayer(nyc._id.toString(), 414731)
//     console.log(pkChris);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 414731, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 414731, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Burst
// try {
//     Burst = await createPlayer(nyc._id.toString(), 266003)
//     console.log(Burst);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 266003, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 266003, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Cody
// try {
//     Cody = await createPlayer(nyc._id.toString(), 1972274)
//     console.log(Cody);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1972274, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1972274, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Quidd
// try {
//     Quidd = await createPlayer(nyc._id.toString(), 1005189)
//     console.log(Quidd);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1005189, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1005189, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let justin
// try {
//     justin = await createPlayer(nyc._id.toString(), 1296894)
//     console.log(justin);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1296894, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1296894, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Bobo
// try {
//     Bobo = await createPlayer(nyc._id.toString(), 583155)
//     console.log(Bobo);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 583155, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 583155, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Karflo
// try {
//     Karflo = await createPlayer(nyc._id.toString(), 1852344)
//     console.log(Karflo);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1852344, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1852344, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Wheezer
// try {
//     Wheezer = await createPlayer(nyc._id.toString(), 680006)
//     console.log(Wheezer);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 680006, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 680006, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Smurf
// try {
//     Smurf = await createPlayer(nyc._id.toString(), 2520770)
//     console.log(Smurf);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 2520770, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 2520770, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let DTP
// try {
//     DTP = await createPlayer(nyc._id.toString(), 1087860)
//     console.log(DTP);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 1087860, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 1087860, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let LRA
// try {
//     LRA = await createPlayer(nyc._id.toString(), 228477)
//     console.log(LRA);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 228477, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 228477, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Fawn
// try {
//     Fawn = await createPlayer(nyc._id.toString(), 467656)
//     console.log(Fawn);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 467656, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 467656, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Amaryllis
// try {
//     Amaryllis = await createPlayer(nyc._id.toString(), 261992)
//     console.log(Amaryllis);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 261992, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 261992, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Gen
// try {
//     Gen = await createPlayer(nyc._id.toString(), 160103)
//     console.log(Gen);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 160103, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 160103, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Shon
// try {
//     Shon = await createPlayer(nyc._id.toString(), 3743679)
//     console.log(Shon);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 3743679, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 3743679, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Myles
// try {
//     Myles = await createPlayer(nyc._id.toString(), 241491)
//     console.log(Myles);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 241491, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 241491, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Cajun_Lady
// try {
//     Cajun_Lady = await createPlayer(nyc._id.toString(), 2202094)
//     console.log(Cajun_Lady);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 2202094, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 2202094, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Meli
// try {
//     Meli = await createPlayer(nyc._id.toString(), 496339)
//     console.log(Meli);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 496339, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 496339, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let Vivi
// try {
//     Vivi = await createPlayer(nyc._id.toString(), 181830)
//     console.log(Vivi);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     q2_2024 = await createSeason(nyc._id.toString(), 181830, "q2_2024", 2024, 4, 1, 2024, 7, 1)
//     console.log(q2_2024);
// }
// catch (e){
//     console.log(e);
// }
// try {
//     console.log(await setsRequest(nyc._id.toString(), 181830, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
// let h2h
// try{
//     h2h = await do_h2h('66677c563c35f1ab6709898b', "q2_2024")
//     console.log(h2h)
// }
// catch (e){
//     console.log(e);
// }
// try{
//     h2h = await finish_h2h(h2h)
//     console.log(h2h)
// }
// catch (e){
//     console.log(e);
// }
await closeConnection();
console.log('Done!');