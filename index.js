const express = require( 'express');
const cors = require( 'cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();


//middle wares
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fwyrt73.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
  
    const token = authHeader.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
  
  }


async function run(){
    try{


        const categoriesCollection = client.db('microTech').collection('categories');
        const productsCollection = client.db('microTech').collection('products');
        const bookingsCollection = client.db('microTech').collection('bookings');
        const usersCollection = client.db('microTech').collection('users');
        const paymentsCollection = client.db('microTech').collection('payments');


        
      const verifyAdmin = async (req, res, next) =>{
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'admin') {
            return res.status(403).send({ message: 'forbidden access' })
        }
        next();
    }
      
       
        app.get('/categories',async(req,res) =>{
            const query={};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })
      
        app.get('/categories/:id',async(req,res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await categoriesCollection.findOne(query);
            res.send(result);
        });
        app.get('/products',async(req,res) =>{
           
            let query = {};
           if(req.query.categoryName)
           {
               query = {
                  categoryName: req.query.categoryName
                  
                 
               }
           }
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/products/seller',async(req,res) =>{
           
            let query = {};
           if(req.query.email)
           {
               query = {
                  email: req.query.email
                  
                 
               }
           }
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.delete('/products/seller/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })
        app.post('/products', async (req,res) =>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);

        
        });
        app.get('/products/:id',async(req,res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        });
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })
        app.get('/bookings',verifyJWT, async (req, res) => {
            const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
            return res.status(403).send({ message: 'forbidden access' });
        }
         
            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await  bookingsCollection.insertOne(booking);
            res.send(result);
        });
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const price = booking.resalePrice;
            const amount = price * 100;
    
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
    
        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })
        app
        app.post('/jwt', (req,res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,{expiresIn: '30d'})
            res.send({token})
            
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
          })
        


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/admin/:id',verifyJWT,verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.delete('/users/admin/:id',verifyJWT,verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });
     
        
      
    }
    finally{

    }

}
run().catch(error => console.log(error));    


app.get('/',(req,res) =>{
    res.send('Project Running');
})

app.listen(port,() =>{
    console.log(`${port}`);
})