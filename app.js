const express = require("express")
const app = express()
const postmodel =require ("./model/post")
const usermodel =require ("./model/user")

const cookieparser= require("cookie-parser")
const bcrypt= require("bcrypt")
const jwt =require("jsonwebtoken")
const crypto = require("crypto")
const path = require("path")
const multer = require("multer")
const post = require("./model/post")
const upload = require("./config/multer")
const { log } = require("console")

const env = require("dotenv")
require('dotenv').config({ path: 'ENV_FILENAME' });


app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieparser())




app.get("/",(req,res)=>{
res.render("index")
})
app.get("/profile/upload",(req,res)=>{
res.render("profileupload")
})
app.post("/upload",isloggedin,upload.single("image"),async (req,res)=>{
       const user  = await usermodel.findOne({email:req.user.email})
       user.profilepic = req.file.filename;
       await user.save()
        console.log(req.file);
       res.redirect("/profile")
    
    })


app.get("/login" , (req,res)=>{
res.render("login")
})
app.get("/profile", isloggedin, async(req,res)=>{
   const user =  await usermodel.findOne({email:req.user.email}).populate("post")
  
//    console.log(user);

    res.render("profil",{user})
})
app.get("/like/:id", isloggedin, async(req,res)=>{
   const post =  await postmodel.findOne({_id: req.params.id}).populate("user")
//    console.log(user);
   if(post.likes.indexOf(req.user.userid) === -1){
       post.likes.push(req.user.userid)
   }
   else{
    post.likes.splice(post.likes.indexOf(req.user.userid), 1)
   }
    await post.save();
    res.redirect("/profile");
})
app.get("/edit/:id", isloggedin, async(req,res)=>{
   const post =  await postmodel.findOne({_id: req.params.id}).populate("user")

   res.render("edit",{post})
  
})
app.post("/update/:id", isloggedin, async(req,res)=>{
   const post =  await postmodel.findOneAndUpdate({_id: req.params.id},{content : req.body.content})

   res.redirect("/profile")
  
})
app.post("/post", isloggedin, async(req,res)=>{
   const user =  await usermodel.findOne({email:req.user.email})
   const{content}=req.body
   const post =await postmodel.create({
    user:user._id,
    content
   })
   user.post.push(post._id);
   await user.save();
   res.redirect("/profile")
})
app.post("/register",async (req,res)=>{
    const{email,username,name,password,age}=req.body
    const user =  await usermodel.findOne({email})
    if(user) return res.status(500).send("user already resiteger");
    
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
               const user = await usermodel.create({
                    username,
                    name,
                    email,
                    password:hash,
                    age
                })
                const token = jwt.sign({email:email,userid:user._id},"tushar")
                res.cookie("token", token);
                res.redirect("/login")
        })
        
    })
})
app.post("/login",async (req,res)=>{
    const{email,password}=req.body
    const user =  await usermodel.findOne({email})
    if(!user) return res.status(500).send("something went wrong");
    
    bcrypt.compare(password,user.password,(err,result)=>{
            if(result){
                const token = jwt.sign({email:email,userid:user._id},"tushar")
                res.cookie("token",token)    
                res.status(200).redirect("/profile")
            }
                else res.redirect("/login")
    })
        
    
})


app.get("/logout",(req,res)=>{
    res.cookie("token","")
    res.redirect("/login")

    })


    function isloggedin (req,res,next){
        if(req.cookies.token==="") res.redirect("login")
        else{
    const data = jwt.verify(req.cookies.token,"tushar")
    req.user =  data
    next()
}
    }

console.log(process.env.myname);

const PORT =  process.env.PORT || 5000



app.listen(PORT,()=>{
    console.log(`bhai server start ho gya hai port ${PORT}`);
    
})

