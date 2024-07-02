import {dbConnection, closeConnection} from './config/mongoConnection.js';
import { createGameForPlayer, createPlayer, filterPlayers, getPlayer } from './data/players.js';
import { createRegion, getRegion, removeRegion } from './data/regions.js';
import { addPlayers, createSeason } from './data/seasons.js';
import { createUser } from './data/accounts.js';
import { do_h2h, filters, finish_h2h, getEventResultsByRegion, playerEligible, playerFilter, searchForPlayer, seasonFilter, setsRequest, sortOpponents, sortTournaments, tournamentFilter } from './data/playerData.js';
import { getMainTournament } from './data/tournaments.js';
import { createGame } from './data/games.js';
const db = await dbConnection();
await db.dropDatabase();
let user
try{
    user = await createUser("Tabby", "Password1!", "mangelak@stevens.edu", "Admin");
}catch (e) {
    console.log(e);
}
let nj
try {
    nj = await createRegion("NJ", 1386, false, 16, 4, 3, "NJ", 1, user._id.toString());
    console.log(nj);
} catch (e) {
    console.log(e);
}

let q2_2024
try {
    q2_2024 = await createSeason(nj._id.toString(), "q2_2024", 2024, 4, 1, 2024, 7, 1)
    console.log(q2_2024);
}
catch (e){
    console.log(e);
}

let syrup 
try {
    syrup = await createPlayer(1216463)
    console.log(syrup);
}
catch (e){
    console.log(e);
}
let smashUlt
try {
    smashUlt = await createGameForPlayer(1216463, 1386)
    console.log(smashUlt);
}
catch (e){
    console.log(e);
}
try {
    console.log(await setsRequest(1216463, 1386))
}
catch (e){
    console.log(e);
}

// let tweek
// try {
//     tweek = await createPlayer(15768)
//     console.log(tweek);
// }
// catch (e){
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
// let game
// try{
//     game = await createGame(1386)
//     console.log(game)
// }
// catch (e) {
//     console.log(e);
// }

try{
    await addPlayers(nj._id.toString(), "q2_2024", [1216463, 15768, 1189720])
}catch(e){
    console.log(e)
}

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
let game
try{
    game = await createGame(1386)
    console.log(game)
}
catch (e) {
    console.log(e);
}

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