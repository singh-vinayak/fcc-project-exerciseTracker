require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
var mongo = require("mongodb");
app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));

const mySecret = process.env['MONGO_URI']

const mongoose = require('mongoose');

mongoose.connect(mySecret);

let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: []
})

let Exercise = mongoose.model('Session', exerciseSchema)
let User = mongoose.model('User', userSchema)

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) =>{
  const { username } = req.body;
  User.findOne({username: username}, (err, existingUser) => {
    if(err)
    {
      res.json({"error":"error occured"});
      return ;
    }
    // else if(existingUser!=null)
    // {
    //   res.json({error:"User already exists"});
    //   return ;
    // }
    });
    let user = new User({username: username});
    user.save((error, savedUser) => {
      if(!error){
        let responseObject = {}
        responseObject['username'] = savedUser.username
        responseObject['_id'] = savedUser.id
        res.json(responseObject)
      }
    })
});

app.get('/api/users', (request, response) => {
  
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      response.json(arrayOfUsers)
    }
    else
      response.json({'error':error});
  });
});

// app.post('/api/users/:_id/exercises', (request, response) =>{
//   //console.log(request.body);
//   const id = request.body[':_id'];
//   const { description, duration, date} = request.body;

//   let newExercise = new Exercise({
//     description: description,
//     duration: parseInt(duration),
//     date: date
//   })
  
//   if(newExercise.date === ''){
//     newExercise.date = new Date().toISOString().substring(0, 10)
//   }

//   //console.log(newExercise);
//   User.findByIdAndUpdate(
//     id,
//     {$push : {log: newExercise}},
//     {new: true},
//     (error, updatedUser)=> {
//       if(!error){
//         let responseObject = {}
//         responseObject['_id'] = updatedUser.id
//         responseObject['username'] = updatedUser.username
//         responseObject['date'] = new Date(newExercise.date).toDateString()
//         responseObject['description'] = newExercise.description
//         responseObject['duration'] = newExercise.duration
//         response.json(responseObject)
//       }
//       else
//         response.json({"error":`User with id: ${id} does not exist`});
//     }
//   )
// })
function addExercise(req, res) {
  const userId = req.params.userId || req.body.userId; // userId come from URL or  body
  const exObj = { 
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date? new Date(req.body.date).toDateString(): new Date().toDateString()
  }; 
  User.findById(
    userId,
    function (err, user) {
      if(err) {
        return console.log('update error:',err);
      }
      user.log=[...user.log, exObj];
      user.save((err, updatedUser)=>{
        if(err) return console.error(err);
        //done(null , updatedPerson);
        let returnObj = {
        _id: user.id,
        username: updatedUser.username,
        description: exObj.description,
        duration: exObj.duration,
        date: exObj.date
      };
      res.json(returnObj);
      });
    }
  );
}

app.post("/api/users/:userId/exercises", addExercise);


app.get('/api/users/:userId/logs', (req, res) => {

  const { userId } = req.params;

  User.findById( userId , function (err, user) {
    if (err) {
      return console.log('getLog() error:', err);
    }
    let resObj = user
      
      if(req.query.from || req.query.to){
      
        let fromDate = new Date(0);
        let toDate = new Date();

        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }
        if (req.query.to) {
          toDate = new Date(req.query.to);
        }
        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        resObj.log = resObj.log.filter(session => {
          let sessionDate = new Date(session.date).getTime();

          return sessionDate >= fromDate && sessionDate <= toDate;
        });
      }
      
      if (req.query.limit) {
        resObj.log = resObj.log.slice(0, req.query.limit);
      }
      // resObj.log.forEach((session) => {
      //   session.date=new Date(session.date).toDateString();
      // })
      resObj = resObj.toJSON()
      resObj.count=user.log.length
      res.json(resObj)
    //console.log(user);
  });
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
