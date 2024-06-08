// const smashUltId = 1386
// await doRequest(query, 1852344, smashUltId, 10, 4, 1, 2024)
// await doRequest(query2, 1852344, smashUltId, 5, 4, 1, 2024)
// console.log(Math.floor(new Date().getTime() / 1000))

import {dbConnection, closeConnection} from './config/mongoConnection.js';
import { do_h2h, setsRequest, tournamentRequest } from './data/playerData.js';
import { createPlayer } from './data/players.js';
import { createRegion } from './data/regions.js';
import { createSeason } from './data/seasons.js';
const db = await dbConnection();
await db.dropDatabase();
let nj
try {
    nj = await createRegion("NJ", 1386, false, 16);
    console.log(nj);
} catch (e) {
    console.log(e);
}
let syrup 
try {
    syrup = await createPlayer(nj._id.toString(), 1216463)
    console.log(syrup);
}
catch (e){
    console.log(e);
}
let q2_2024
try {
    q2_2024 = await createSeason(nj._id.toString(), 1216463, "q2_2024", 2024, 4, 1, 2024, 7, 1)
    console.log(q2_2024);
}
catch (e){
    console.log(e);
}
/*try {
    console.log(await tournamentRequest(nj._id.toString(), 1216463, "q2_2024"))
}
catch (e){
    console.log(e);
}*/
try {
    console.log(await setsRequest(nj._id.toString(), 1216463, "q2_2024"))
}
catch (e){
    console.log(e);
}
let tweek 
try {
    tweek = await createPlayer(nj._id.toString(), 15768)
    console.log(tweek);
}
catch (e){
    console.log(e);
}
try {
    q2_2024 = await createSeason(nj._id.toString(), 15768, "q2_2024", 2024, 4, 1, 2024, 7, 1)
    console.log(q2_2024);
}
catch (e){
    console.log(e);
}
// try {
//     console.log(await tournamentRequest(nj._id.toString(), 15768, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
try {
    console.log(await setsRequest(nj._id.toString(), 15768, "q2_2024"))
}
catch (e){
    console.log(e);
}
let pharaoh 
try {
    pharaoh = await createPlayer(nj._id.toString(), 1071129)
    console.log(pharaoh);
}
catch (e){
    console.log(e);
}
try {
    q2_2024 = await createSeason(nj._id.toString(), 1071129, "q2_2024", 2024, 4, 1, 2024, 7, 1)
    console.log(q2_2024);
}
catch (e){
    console.log(e);
}
// try {
//     console.log(await tournamentRequest(nj._id.toString(), 1071129, "q2_2024"))
// }
// catch (e){
//     console.log(e);
// }
try {
    console.log(await setsRequest(nj._id.toString(), 1071129, "q2_2024"))
}
catch (e){
    console.log(e);
}
let h2h
try{
    h2h = await do_h2h(nj._id.toString(), "q2_2024")
    console.log(h2h)
}
catch (e){
    console.log(e);
}
await closeConnection();
console.log('Done!');