import { ObjectId } from "mongodb";
import { games } from "../config/mongoCollections.js";
import { doRequest, intCheck } from "../helpers.js";;

const getAllGames = async () => {
    const gameCollection = await games();
    const AllGames = await gameCollection.find().toArray();
    if(AllGames.length === 0){
        throw "Games Collection is Empty";
    }
    return AllGames;
}

const getGame = async (id) => {
    intCheck(id, "gameId")
    const gameCollection = await games();
    const findGame = await gameCollection.findOne({_id: id})
    if (findGame === null) throw `No region with that id: ${id}`
    findGame._id = findGame._id.toString();
    return findGame
}

const createGame = async (id) => {
    intCheck(id, "gameId")
    const query = `
    query vid($id: ID!) {
        videogame(id: $id) {
        name
        images{
          type
          url
        }
        characters{
          id
          name
          images{
            type
            url
          }
        }
      }
    }
    `
    const data = await doRequest(query, id, 0, 0, 0, 0)
    const newGame = {
        _id: id,
        game: data.data.videogame
    }
    const gameCollection = await games()
    const insertInfo = await gameCollection.insertOne(newGame)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add region'
    const newId = insertInfo.insertedId
    const game = await getGame(newId)
    return game;
}

const removeGame = async (id) => {
    intCheck(id, 'gameId')
    const deletionInfo = await userCollection.findOneAndDelete({
        _id: new ObjectId(userId)
    });
    if(!deletionInfo){
      throw 'could not delete'
    }
    return deletionInfo
}

export {
    getAllGames,
    getGame,
    removeGame,
    createGame
}