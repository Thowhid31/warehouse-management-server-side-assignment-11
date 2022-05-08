const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { request } = require('express');
const res = require('express/lib/response');
const ObjectId = require('mongodb').ObjectId;


//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(404).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
    })
    next();
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wcunk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('expertHand').collection('product');

        //AUTH
        app.post('/login', (req, res) => {

            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '5d'
            })
            res.send({ accessToken })
        })


        app.get('/product', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size)
            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if(page || size){

                products = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                products = await cursor.toArray();
            }
            res.send(products)
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
                ;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product)
        })

        //POST API
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        });

        //DELETE API
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })


        // collection api
        app.get('/products', verifyJWT, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req?.query?.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const myProducts = await cursor.toArray();
                res.send(myProducts);
            }
            else{
                res.status(403).send({message: 'Forbidden Access'})
            }
        });

        



        //delivered products
        app.put('/delivered/:id', async (req, res) => {
            const id = req.params.id;
            const currentQuantity = req.body;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.quantity - 1
                }
            };
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)

            res.send(newQuantity)
        });



        //add to stock
        app.put('/addtostock/:id', async (req, res) => {
            const id = req.params.id;
            const currentQuantity = req.body;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.newQuantity
                }
            }
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)
            res.send(newQuantity)
        });


        //productCount
        app.get('/productCount', async(req, res)=>{
            const query = {};
            const cursor = productCollection.find(query);
            const count = await cursor.count();
            res.send({count});
        })

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