const express = require( 'express');
const cors = require( 'cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get('/categories',async(req,res) =>{
            const query={};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })
      
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