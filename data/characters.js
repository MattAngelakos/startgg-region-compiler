import { atLeast, intCheck, numCheck, stringCheck } from "../helpers.js"
import { editPlayer, getGameFromPlayer, getPlayer } from "./players.js"

const createPlayerCharacter = async (playerId, videogameId, character) => {
    character = stringCheck(character, "tourneyId")
    atLeast(character, 1, "tourneyId")
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const newCharacter = {
        characterName: character,
        numOfPlays: 1 
    }
    const characterIndex = player.games[gameIndex].characters.findIndex(characters => characters.characterName === character)
    if(characterIndex !== -1){
        throw `character ${character} already exists`
    } 
    player.games[gameIndex].characters.push(newCharacter)
    await editPlayer(playerId, player)
    return newCharacter
}

const getPlayerCharacter = async (playerId, videogameId, characterName) => {
    characterName = stringCheck(characterName)
    atLeast(characterName, 1, "characterName")
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const characterIndex = player.games[gameIndex].characters.findIndex(characters => characters.characterName === characterName)
    if(characterIndex === -1){
        throw `character with name ${characterName} doesn't exist`
    }   
    return characterIndex
}

const removePlayerCharacter = async (playerId, videogameId, characterName) => {
    characterName = stringCheck(characterName)
    atLeast(characterName, 1, "characterName")
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const characterIndex = await getPlayerCharacter(playerId, videogameId, characterName)  
    player.games[gameIndex].characters.splice(characterIndex, 1)   
    await editPlayer(playerId, player)
    return player.games[gameIndex].characters
}

const editPlayerCharacter = async (playerId, videogameId, characterName, editObject) => {
    characterName = stringCheck(characterName)
    atLeast(characterName, 1, "characterName")
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const characterIndex = await getPlayerCharacter(playerId, videogameId, characterName)  
    if("characterName" in editObject){
        editObject.characterName = stringCheck(editObject.characterName)
        atLeast(editObject.characterName, 1, "characterName")
        const characterIndexDup = player.games[gameIndex].characters.findIndex(character => character.characterName === editObject.characterName)
        if(characterIndexDup !== -1){
            throw `character with name ${characterName} doesn't exist`
        } 
        player.games[gameIndex].characters[characterIndex].characterName = editObject.characterName
    }
    if("numOfPlays" in editObject){
        numCheck(editObject.numOfPlays)
        intCheck(editObject.numOfPlays)
        if(editObject.numOfPlays <= 0) {
            throw 'invalid plays'
        }
        player.games[gameIndex].characters[characterIndex].numOfPlays = editObject.numOfPlays
    }
    await editPlayer(playerId, player);
    return player.games[gameIndex].characters[characterIndex];
}

const addPlay = async (playerId, videogameId, characterName) => {
    characterName = stringCheck(characterName)
    atLeast(characterName, 1, "characterName")
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const characterIndex = await getPlayerCharacter(playerId, videogameId, characterName)  
    const newChar = {
        numOfPlays: player.games[gameIndex].characters[characterIndex].numOfPlays + 1
    }
    await editPlayerCharacter(playerId, videogameId, player.games[gameIndex].characters[characterIndex].characterName, newChar)
}
export{
    createPlayerCharacter,
    getPlayerCharacter,
    removePlayerCharacter,
    editPlayerCharacter,
    addPlay
}