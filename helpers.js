import { ObjectId } from "mongodb";
import dotenv from 'dotenv'
import validator from 'validator';
dotenv.config();
let options = {
    minLength: 8,
    minUppercase: 1,
    minNumber: 1,
    minSymbols: 1
};
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
const emailCheck = (val) => {
    if (!validator.isEmail(val.trim())) {
        throw "not valid email"
    }
    return val.trim()
}
const verifyPassword = async (password, hash) => {
    const right = await bcryptjs.compare(password, hash);
    return right
}
const passwordCheck = (val) => {
    val = stringCheck(val, 'password')
    atLeast(val, 1, 'password')
    if (/\s/.test(val)) {
        throw "password cannot have spaces"
    }
    if (!validator.isStrongPassword(val, options)) {
        throw "Password must be 8 characters long and contain: 1 Uppercase 1 Number 1 Symbol"
    }
    return val
}
const sortLev = (inputs, search) => {
    const searchLower = search.toLowerCase();
    function calculateLevenshtein(input, search, x, y) {
        input = input.toLowerCase();
        if (input.includes(search)) return 0;
        if (x === 0) return y;
        if (y === 0) return x;
        const dp = Array(x + 1).fill(null).map(() => Array(y + 1).fill(null));
        for (let i = 0; i <= x; i++) { dp[i][0] = i }
        for (let j = 0; j <= y; j++) { dp[0][j] = j; }
        for (let i = 1; i <= x; i++) {
            for (let j = 1; j <= y; j++) {
                const substitutionCost = input[i - 1] === search[j - 1] ? 0 : 1;
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1] + substitutionCost
                );
            }
        }
        return dp[x][y];
    }
    for (let i = 1; i < inputs.length; i++) {
        let current = inputs[i];
        let currentLev = calculateLevenshtein(current.name, searchLower, current.name.length, searchLower.length);
        let j = i - 1;

        while (j >= 0 && (
            calculateLevenshtein(inputs[j].name, searchLower, inputs[j].name.length, searchLower.length) > currentLev ||
            (calculateLevenshtein(inputs[j].name, searchLower, inputs[j].name.length, searchLower.length) === currentLev && inputs[j].likes < current.likes)
        )) {
            inputs[j + 1] = inputs[j];
            j--;
        }
        inputs[j + 1] = current;
    }
    return inputs;
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
    booleanCheck,
    emailCheck,
    passwordCheck,
    verifyPassword,
    sortLev
};