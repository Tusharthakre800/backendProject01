const mongoose = require("mongoose")

const connection =async(URL)=>{
       try{
       await mongoose.connect(URL);
       console.log("db connected");
       }catch(error){
         console.log("db connection error :",error)
       }
}

module.exports = connection