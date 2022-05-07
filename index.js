const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion} = require('mongodb');
const { request } = require('express');
const res = require('express/lib/response');
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
        
        //AUTH
        app.post('/login', (req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send(accessToken)
        })
        
        // const itemCollection = client.db('expertHand').collection('item');

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
            const query = {email: email};
            const cursor = productCollection.find(query);
            const myProducts = await cursor.toArray();
            res.send(myProducts)
        });


        //delivered products
        app.put('/delivered/:id', async(req, res) => {
            const id = req.params.id;
            const currentQuantity = req.body;
            const filter = {_id: ObjectId(id)}
            const option = {upsert: true};
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.quantity - 1
                }
            };
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)
            
            res.send(newQuantity)
        });

        //add to stock
        app.put('/addtostock/:id', async(req, res) => {
            const id = req.params.id;
            const currentQuantity = req.body;
            const filter = {_id: ObjectId(id)}
            const option = {upsert: true};
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.newQuantity
                }
            }
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)
            res.send(newQuantity)
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