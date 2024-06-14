// import { atLeast, intCheck, numCheck, stringCheck } from '../helpers.js'
// import { editRegion } from './regions.js'
// import { getPlayerTourney, getSeason, getSeasonInfo } from './seasons.js'

// const createPlayerCharacter = async (regionId, playerId, seasonName, character) => {
//     character = stringCheck(character, "tourneyId")
//     atLeast(character, 1, "tourneyId")
//     let result = await getSeasonInfo(regionId, playerId, seasonName)
//     const seasonIndex = await getSeason(regionId, playerId, seasonName)
//     const newCharacter = {
//         characterName: character,
//         numOfPlays: 1 
//     }
//     const characterIndex = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(characters => characters.characterName === character)
//     if(characterIndex !== -1){
//         throw `character ${character} already exists`
//     } 
//     (result.region).players[result.index].seasons[seasonIndex].characters.push(newCharacter)
//     await editRegion(regionId, (result.region))
//     return newCharacter
// }

// const getPlayerCharacter = async (regionId, playerId, seasonName, characterName) => {
//     characterName = stringCheck(characterName)
//     atLeast(characterName, 1, "characterName")
//     let result = await getSeasonInfo(regionId, playerId, seasonName)
//     const seasonIndex = await getSeason(regionId, playerId, seasonName)
//     const characterIndex = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(character => character.characterName === characterName)
//     if(characterIndex === -1){
//         throw `character with name ${characterName} doesn't exist`
//     }   
//     return characterIndex
// }

// const removePlayerCharacter = async (regionId, playerId, seasonName, characterName) => {
//     let result = await getSeasonInfo(regionId, playerId, seasonName)
//     const seasonIndex = await getSeason(regionId, playerId, seasonName)
//     const characterIndex = await getPlayerTourney(regionId, playerId, seasonName, characterName)  
//     (result.region).players[result.index].seasons[seasonIndex].characters.splice(characterIndex, 1)   
//     await editRegion(regionId, (result.region))
//     return (result.region).players[result.index].seasons[seasonIndex].characters
// }

// const editPlayerCharacter = async (regionId, playerId, seasonName, characterName, editObject) => {
//     let result = await getSeasonInfo(regionId, playerId, seasonName)
//     const seasonIndex = await getSeason(regionId, playerId, seasonName)
//     const characterIndex = await getPlayerCharacter(regionId, playerId, seasonName, characterName)
//     if("characterName" in editObject){
//         editObject.characterName = stringCheck(editObject.characterName)
//         atLeast(editObject.characterName, 1, "characterName")
//         const characterIndexDup = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(character => character.characterName === editObject.characterName)
//         if(characterIndexDup !== -1){
//             throw `character with name ${characterName} doesn't exist`
//         } 
//         (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].characterName = editObject.characterName
//     }
//     if("numOfPlays" in editObject){
//         numCheck(editObject.numOfPlays)
//         intCheck(editObject.numOfPlays)
//         if(editObject.numOfPlays <= 0) {
//             throw 'invalid plays'
//         }
//         (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].numOfPlays = editObject.numOfPlays
//     }
//     await editRegion(regionId, (result.region));
//     return (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex];
// }

// const addPlay = async (regionId, playerId, seasonName, characterName) => {
//     let result = await getSeasonInfo(regionId, playerId, seasonName)
//     const seasonIndex = await getSeason(regionId, playerId, seasonName)
//     const characterIndex = await getPlayerCharacter(regionId, playerId, seasonName, characterName)
//     const newChar = {
//         numOfPlays: (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].numOfPlays + 1
//     }
//     await editPlayerCharacter(regionId, playerId, seasonName, (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].characterName, newChar)
// }
// export{
//     createPlayerCharacter,
//     getPlayerCharacter,
//     removePlayerCharacter,
//     editPlayerCharacter,
//     addPlay
// }