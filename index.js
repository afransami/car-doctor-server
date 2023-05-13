const express = require('express');
const cors = require ('cors');
const jwt =require ('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors())
app.use(express.json())


app.get('/', (req, res)=>{
    res.send('doctor is running')    
})

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tcuzcs8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT =(req, res, next)=>{
console.log('hitting verify jwt');
console.log(req.headers.authorization);
const authorization = req.headers.authorization;
if(!authorization){
  return res.status(401).send({error: true, message: 'unauthorized access'})
}
const token = authorization.split(' ')[1];
console.log('inside verify jwt', token);
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
  if(error){
    return res.status(401).send({error:true, message: 'unauthorized'})
  }
  req.decoded= decoded;
  next();
})
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carsDoctor').collection('services')
    const bookingCollection = client.db('carsDoctor').collection('booking')

    // JWT
    app.post ('/jwt', (req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'4h'})      
      res.send({token});
      console.log(token);

    })

// .env
// DB_USER=afransami007
// DB_PASS=VI6dxSk2dwRx82Hb
// ACCESS_TOKEN_SECRET=cd2236063a917db8ba0f047a78a3d3d1c66addf4666ed4932c2a60eb56be5c1902b68cdb136a22df038f39f71b1fcc5992efbec83a9d0aa43a9e06fcde3f6a57



    // Services
    app.get('/services', async(req, res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send (result)      
    })
    
    app.get ('/services/:id', async(req, res)=>{
      const id = (req.params.id)      
      const query = {_id: new ObjectId(id)}

      const options = {        
        // Include only the `title` and `imdb` fields in each returned document
        projection: { title: 1, price: 1, services_id: 1, img:1 },
      };


      const result = await serviceCollection.findOne(query, options)
      res.send (result)
    })

    // booking
    app.get ('/checkout', verifyJWT, async(req, res)=>{
      const decoded = req.decoded;
      console.log('came back after verify', decoded);

      if (decoded.email !== req.query.email){
        return res.status(403).send({error:1, message: 'forbidden'})
      }

      // console.log(req.query.email);
      // console.log(req.headers.authorization)
      let query = {};
      if (req.query?.email){
        query= {email:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray()
      res.send (result)
    })


    app.post ('/checkout', async(req, res)=>{
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking)
      res.send (result)
    })

    app.patch('/checkout/:id', async(req, res)=>{
      const id= req.params.id;       
      const query= {_id: new ObjectId(id)};    
      const updateCheckout = req.body;
      console.log(updateCheckout);
      const updateDoc ={
        $set:{
          status: updateCheckout.status
        },
      };
      const result = await bookingCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.delete('/checkout/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.listen(port, ()=>{
    console.log(`car doctor server is running on port ${port}`)
})
