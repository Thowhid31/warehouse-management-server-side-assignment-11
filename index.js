const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion} = require('mongodb');
const { request } = require('express');
const ObjectId = require('mongodb').ObjectId;


//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wcunk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('expertHand').collection('product');

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        })
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
                ;
            const query = {_id: ObjectId(id)};
            const product = await productCollection.findOne(query);
            res.send(product)
        })

        //POST API
        app.post('/product', async(req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        });

        //DELETE API
        app.delete('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })


        // collection api
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = {email};
            const cursor = productCollection.find(query);
            const myProducts = await cursor.toArray();
            res.send(myProducts)
        });

    }
    finally {

    }
}
run().catch(console.dir)

//
app.get('/', (req, res) => {
    res.send('Running My Hardware Shop.')
})

app.listen(port, () => {
    console.log('Listening to Port,', port);
})