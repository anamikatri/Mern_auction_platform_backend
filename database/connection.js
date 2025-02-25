import mongoose from "mongoose";
export const connection =()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName: "MERN_AUCTION_PLATFORM"
    }).then(()=>{
        console.log("connected to database");
    }).catch(err=>{
        console.log(`Some error occured while connecting to dtabase :${err}`)
    })
}
