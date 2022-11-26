const express = require( 'express');
const cors = require( 'cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//middle wares
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fwyrt73.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{


        const categoriesCollection = client.db('microTech').collection('categories');
        const productsCollection = client.db('microTech').collection('products');
        const bookingsCollection = client.db('microTech').collection('bookings');
       
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
            console.log(req.query.categoryName);
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
        app.get('/products/:id',async(req,res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        });
        app.get('/bookings', async (req, res) => {
            const email = req.query.email; 
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