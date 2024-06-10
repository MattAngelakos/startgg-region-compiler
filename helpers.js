import { ObjectId } from "mongodb";
import dotenv from 'dotenv'
dotenv.config();
const atLeast = (val, checkVal, name) => {
    if(val.length < checkVal){
        throw (`${name} has less than 2 elements`);
    }
};
const stringCheck = (val, name) => {
    val = val.trim()
    if (typeof(val) !== 'string'){
        throw (`${name} is not a string`);
    }
    return val
}
const numCheck = (val, name) => {
    if (typeof(val) !== 'number'){
        throw (`${name} is not a number`);
    }
    if(isNaN(val)){
        throw (`${name} is not a number`);
    }
};
const intCheck = (val, name) => {
    if(!Number.isInteger(val)){
        throw (`${name} is not an integer`);
    }
};
const idCheck = (val, name) => {
    val = stringCheck(val, name)
    atLeast(val, 1, name)
    if (!ObjectId.isValid(val)) throw `${name} invalid object ID`
    return val
}; 
const objectCheck = (val, name) => {
    if (typeof(val) !== 'object'){
        throw (`${name} is not a object`);
    }
};
const arrayCheck = (val, name) => {
    if(!Array.isArray(val)){
        throw (`${name} is not an array`);
    }
};
const booleanCheck = (val, name) => {
    if (typeof(val) !== 'boolean'){
        throw (`${name} is not a string`);
    }
}
function createDate(month, day, year) {
    numCheck(month, "month")
    numCheck(day, "day")
    numCheck(year, "year")
    intCheck(month, "month")
    intCheck(day, "day")
    intCheck(year, "year")
    const date = new Date(year, month - 1, day, 6, 0, 0, 0);
    const Timestamp = Math.floor(date.getTime() / 1000)
    return Timestamp;
}
const doRequest = async (query, id, videogameId, limit, updatedAfter, page) => {
    numCheck(id, "id")
    intCheck(id, "id")
    numCheck(videogameId, "videogameId")
    intCheck(videogameId, "videogameId")
    numCheck(limit, "limit")
    intCheck(limit, "limit")
    numCheck(updatedAfter, "updatedAfter")
    intCheck(updatedAfter, "updatedAfter")
    //const updatedAfter = createDate(month, day, year)
    const key = process.env.STARTGG_KEY
    const input = "Bearer "+key.toString()
    query = stringCheck(query, "query")
    atLeast(query, 1, "query")
    const variables = {
        id: id,
        videogameId: videogameId,
        limit: limit,
        updatedAfter: updatedAfter,
        page: page
    };
    const requestBody = JSON.stringify({
        query: query,
        variables: variables
    });
    const requestOptions = (body) => ({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': input
        },
        body: body
      });
    try {
        const response = await fetch('https://api.start.gg/gql/alpha', requestOptions(requestBody));
        const data = await response.json();
        console.log('Query Response:', data);
        return data;
    } catch (error) {
        console.error('Error in Query:', error);
        throw error;
    }
}
export{
    atLeast,
    stringCheck,
    numCheck,
    intCheck,
    createDate,
    doRequest,
    idCheck,
    objectCheck,
    arrayCheck,
    booleanCheck
};