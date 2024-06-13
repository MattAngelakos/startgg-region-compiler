import { ObjectId } from "mongodb";
import { players, users } from "../config/mongoCollections.js";
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import { atLeast, emailCheck, idCheck, passwordCheck, stringCheck, verifyPassword } from "../helpers.js";
import { getAllRegions, getRegion, removeRegion } from "./regions.js";

const getAllUsers = async () => {
    const userCollection = await users();
    const allUsers = await userCollection.find().toArray();
    if(allUsers.length === 0){
        throw "Users Collection is Empty";
    }
    return allUsers;
}

const getUser = async (id) => {
    id = idCheck(id, "accountId")
    const userCollection = await users();
    const findUser = await userCollection.findOne({_id: new ObjectId(id)})
    if (findUser === null) throw 'No user with that id'
    return findUser
}

const createUser = async (name, password, email, accountType) => {
    name = stringCheck(name, "name")
    atLeast(name, 1, "name")
    email = stringCheck(email, "email")
    email = emailCheck(email)
    const userCollection = await users();
    const duplicateName = await userCollection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (duplicateName) {
        throw `an account with ${name} already exists`;
    }
    const duplicateEmail = await userCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (duplicateEmail) {
        throw `an account with ${email} already exists`;
    }
    password = passwordCheck(password)
    const hashedPassword = await bcryptjs.hash(password, 12);
    accountType = stringCheck(accountType, "accountType")
    atLeast(accountType, 1, "accountType")
    if (accountType !== "Admin" && accountType !== "Default") {
        throw 'invalid account type'
    }
    // themeType = valid.stringValidate(themeType)
    // if (themeType !== "dark" && themeType !== "light") {
    //     throw 'invalid theme type'
    // }
    const newUser = {
        name: name,
        password: hashedPassword,
        email: email,
        bio: "",
        accountType: accountType,
        //themeType: themeType,
        bookmarks: [],
        ownedRegions: []
    }
    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
      throw 'Could not add product';
    const newId = insertInfo.insertedId.toString();
    const user = await getUser(newId);
    return user;
}

const likeRegion = async (userId, regionId) => {
    userId = idCheck(userId)
    regionId = idCheck(regionId)
    const user = await getUser(userId)
    const region = await getRegion(regionId)
    user.bookmarks.push(regionId)
    region.numOfLikes += 1
    const userCollection = await users();
    const updatedUser = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(user._id)},
        {$set: user},
        {returnDocument: 'after'}
    );
    if (!updatedUser) {
      throw 'could not update user successfully';
    }
    const regionCollection = await players();
    const updatedRegion = await regionCollection.findOneAndUpdate(
        {_id: new ObjectId(region._id)},
        {$set: region},
        {returnDocument: 'after'}
    );
    if (!updatedRegion) {
      throw 'could not update region successfully';
    }
    return updatedUser
}

const unlikeRegion = async (userId, regionId) => {
    userId = idCheck(userId)
    regionId = idCheck(regionId)
    const user = await getUser(userId)
    const region = await getRegion(regionId)
    const index = user.bookmarks.indexOf(regionId);
    let updatedUser = user
    if (index !== -1) {
        user.bookmarks.splice(index, 1);
        region.numOfLikes -= 1
        const userCollection = await users();
        updatedUser = await userCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: user},
            {returnDocument: 'after'}
        );
        if (!updatedUser) {
          throw 'could not update user successfully';
        }
        const regionCollection = await players();
        const updatedRegion = await regionCollection.findOneAndUpdate(
            {_id: new ObjectId(region._id)},
            {$set: region},
            {returnDocument: 'after'}
        );
        if (!updatedRegion) {
          throw 'could not update region successfully';
        }
    }
    return updatedUser
}

const updateUser = async (userId, updateObject) => {
    const user = await getUser(userId)
    const userCollection = await users()
    if(updateObject.name){
        updateObject.name = stringCheck(updateObject.name, "name")
        atLeast(updateObject.name, 1, "name")
        const duplicateName = await userCollection.findOne({ name: { $regex: new RegExp(`^${updateObject.name}$`, 'i') } });
        if (duplicateName) {
            throw `an account with ${updateObject.name} already exists`;
        }
        user.name = updateObject.name
    }
    if(updateObject.oldPassword){
        updateObject.oldPassword = passwordCheck(updateObject.oldPassword)
        const isRightPassword = await verifyPassword(updateObject.oldPassword, user.password)
        if(!isRightPassword){
            throw "passwords don't match"
        }
    }
    if(updateObject.password){
        updateObject.password = passwordCheck(updateObject.password)
        const hashedPassword = await bcryptjs.hash(updateObject.password, 12);
        user.password = hashedPassword
    }
    if(updateObject.email){
        if(updateObject.email !== user.email){
            updateObject.email = stringCheck(updateObject.email, "email")
            atLeast(updateObject.email, 1, "email")
            updateObject.email = emailCheck(updateObject.email)
            const duplicateEmail = await userCollection.findOne({ email: { $regex: new RegExp(`^${updateObject.email}$`, 'i') } });
            if (duplicateEmail) {
                throw `an account with ${email} already exists`;
            }
            user.email = updateObject.email
        }
    }
    if(updateObject.bio){
        if(user.bio !== updateObject.bio){
            updateObject.bio = stringCheck(updateObject.bio, "bio")
            atLeast(updateObject.bio, 1, "bio")
            user.bio = updateObject.bio
        }
    }
    if(updateObject.accountType){
        updateObject.accountType = stringCheck(updateObject.accountType, "accountType")
        atLeast(updateObject.accountType, 1, "accountType")
        if (updateObject.accountType !== "Admin" && updateObject.accountType !== "Default") {
            throw 'invalid account type'
        }
        user.accountType = updateObject.accountType
    }
    // if(updateObject.themeType){
    //     updateObject.themeType = valid.stringValidate(updateObject.themeType)
    //     user.themeType = updateObject.themeType
    // }
    const updatedInfo = await userCollection.findOneAndUpdate(
      {_id: new ObjectId(userId)},
      {$set: user},
      {returnDocument: 'after'}
    )
    if (!updatedInfo) {
      throw 'could not update user successfully';
    }
    return updatedInfo
}

const removeUser = async (userId, password) => {
    userId = idCheck(userId)
    password = passwordCheck(password)
    const user = await getUser(userId)
    const isRightPassword = await verifyPassword(password, user.password)
    if(!isRightPassword){
        throw "incorrect password"
    }
    const userCollection = await users();
    const regionList = await getAllRegions();
    for(let region of regionList){
        if(region.ownerId === userId){
            await removeRegion(region._id.toString())
        }
    }
    const deletionInfo = await userCollection.findOneAndDelete({
        _id: new ObjectId(userId)
    });
    if(!deletionInfo){
      throw 'could not delete'
    }
    return deletionInfo
}

const loginUser = async (emailOrUsername, password) => {
    const userCollection = await users();
    emailOrUsername = stringCheck(emailOrUsername, "emailOrUsername")
    atLeast(emailOrUsername, 1, "emailOrUsername")
    emailOrUsername = emailOrUsername.toLowerCase()
    password = stringCheck(password, "password")
    atLeast(password, 1, "password")
    let user
    if(validator.isEmail(emailOrUsername)) {
        user = await userCollection.findOne({ email: { $regex: new RegExp(`^${emailOrUsername}$`, 'i') } });
        if (!user) {
            throw `Incorrect email or password`;
        }
    } else {
        user = await userCollection.findOne({ name: { $regex: new RegExp(`^${emailOrUsername}$`, 'i') } });
        if (!user) {
            throw `Incorrect email or password`;
        }
    }
    const isRightPassword = await verifyPassword(password, user.password)
    if (!isRightPassword) {
        throw `Incorrect email or password`;
    }
    return user;
};

export {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    removeUser,
    loginUser,
    likeRegion,
    unlikeRegion
}